import { useEffect, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getEmbedData, type EmbedData } from "@/lib/embed";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, Search, FileText, Headphones, Globe, 
  Eye, Play, Folder, ArrowLeft, LayoutGrid, 
  Library, Clock, BookMarked, Filter, ChevronRight,
  Menu, X, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Resource {
  _id: string;
  title: string;
  description?: string;
  link: string;
  class: string;
  category: string;
  type: string;
  mimeType?: string;
  embedType?: "youtube" | "audio" | "iframe" | "external";
  embedUrl?: string;
  thumbnailLink?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
}

const CLASSES = ["ALL", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"];
const CATEGORIES = ["Fiction", "Non-Fiction", "Academic", "Reference", "Other"];
const TYPES = ["PDF", "AUDIO", "VIDEO", "Other Resources"];

const getFormat = (resource: Resource): "pdf" | "audio" | "video" | "web" | "youtube" | "iframe" | "other" => {
  if (resource.type === "PDF") return "pdf";
  if (resource.type === "AUDIO") return "audio";
  if (resource.type === "VIDEO") return "video";
  if (resource.type === "GDRIVE_FILE") {
    if (resource.mimeType?.includes("pdf")) return "pdf";
    if (resource.mimeType?.includes("video")) return "video";
    if (resource.mimeType?.includes("audio")) return "audio";
    return "pdf";
  }
  if (resource.embedType && resource.embedType !== "external") return resource.embedType as any;
  if (resource.type === "E-Library" || resource.category === "Reference") return "web";
  return "other";
};

const ResourceCard = forwardRef<HTMLDivElement, { resource: Resource; navigate: any }>(
  ({ resource, navigate }, ref) => {
  const format = getFormat(resource);
  
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group relative glass-card rounded-2xl overflow-hidden flex flex-col h-full border-none ring-1 ring-border shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Card Header / Thumbnail Style */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted/20">
        <div className="absolute inset-0 flex items-center justify-center">
            {resource.thumbnailLink ? (
                <img src={resource.thumbnailLink} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : format === "pdf" ? (
                <FileText className="w-16 h-16 text-blue-500/20 group-hover:scale-110 transition-transform" />
            ) : format === "audio" ? (
                <Headphones className="w-16 h-16 text-purple-500/20 group-hover:scale-110 transition-transform" />
            ) : format === "video" ? (
                <Play className="w-16 h-16 text-red-500/20 group-hover:scale-110 transition-transform" />
            ) : format === "web" ? (
                <Globe className="w-16 h-16 text-green-500/20 group-hover:scale-110 transition-transform" />
            ) : (
                <ExternalLink className="w-16 h-16 text-orange-500/20 group-hover:scale-110 transition-transform" />
            )}
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
           <Button 
            size="sm" 
            className="bg-primary text-primary-foreground font-bold rounded-full px-6"
            onClick={() => navigate(`/resource/${resource._id}`, { state: { resource } })}
           >
             EXPLORE
           </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-md">
            CLASS {resource.class}
          </span>
        </div>
        
        <div className="absolute top-3 right-3">
          <div className={cn(
            "p-2 rounded-full backdrop-blur-md",
            format === "pdf" && "bg-blue-500/20 text-blue-500",
            format === "audio" && "bg-purple-500/20 text-purple-500",
            format === "video" && "bg-red-500/20 text-red-500",
            format === "web" && "bg-green-500/20 text-green-500",
            format === "other" && "bg-orange-500/20 text-orange-500"
          )}>
            {format === "pdf" && <FileText className="w-4 h-4" />}
            {format === "audio" && <Headphones className="w-4 h-4" />}
            {format === "video" && <Play className="w-4 h-4" />}
            {format === "web" && <Globe className="w-4 h-4" />}
            {format === "other" && <ExternalLink className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{resource.category}</p>
          <h3 className="text-lg font-outfit font-bold line-clamp-1 group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {resource.description || "No description provided for this library resource."}
        </p>

        <div className="pt-4 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                {resource.createdBy.name.charAt(0)}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{resource.createdBy.name}</span>
           </div>
           <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
             <Clock className="w-3 h-3" />
             {new Date(resource.createdAt).toLocaleDateString()}
           </span>
        </div>
      </div>
    </motion.div>
  );
});

export default function StudentDashboard() {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [filters, setFilters] = useState({
    class: "",
    category: "",
    type: "",
    search: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResources: 0,
    limit: 12,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (token) {
      fetchResources();
    }
  }, [token, filters.class, filters.category, filters.type, debouncedSearch, pagination.currentPage]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/resources", window.location.origin);
      url.searchParams.append("page", pagination.currentPage.toString());
      url.searchParams.append("limit", pagination.limit.toString());
      if (filters.class && filters.class !== "ALL") url.searchParams.append("class", filters.class);
      if (filters.category) url.searchParams.append("category", filters.category);
      if (filters.type) url.searchParams.append("type", filters.type);
      if (debouncedSearch) url.searchParams.append("search", debouncedSearch);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages,
          totalResources: data.totalResources,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white dark:bg-card border-r border-border z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 overflow-y-auto",
          !isSidebarOpen && "-translate-x-full"
        )}>
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">D</div>
                <span className="font-outfit font-bold text-xl tracking-tight">LIBRARY</span>
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Category Nav */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 mb-4">Content Type</p>
                {[
                  { id: "", label: "All Resources", icon: LayoutGrid },
                  { id: "PDF", label: "E-Books (PDF)", icon: FileText },
                  { id: "AUDIO", label: "Audiobooks", icon: Headphones },
                  { id: "VIDEO", label: "Video Lectures", icon: Play },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter("type", item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                      filters.type === item.id 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", filters.type === item.id ? "text-primary" : "text-muted-foreground")} />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Browse By Class */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 mb-4">Grade / Class</p>
                <div className="grid grid-cols-2 gap-2">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setFilter("class", cls === "ALL" ? "" : cls)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                        (filters.class === cls || (cls === "ALL" && !filters.class))
                          ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "bg-transparent border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      {cls === "ALL" ? "ANY CLASS" : `CLASS ${cls}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 mb-4">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter("category", filters.category === cat ? "" : cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                        filters.category === cat
                          ? "bg-secondary border-secondary text-secondary-foreground"
                          : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <header className="glass-nav h-16 px-4 lg:px-8 flex items-center justify-between lg:justify-end gap-4 shadow-sm">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 max-w-md relative hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input 
                type="text" 
                placeholder="Search collection..." 
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className="w-full bg-muted/50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
               />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0)}
              </div>
              <Button 
                onClick={() => { logout(); navigate("/login"); }} 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-10">
            {/* Page Header */}
            <div className="space-y-2">
              <h1 className="text-4xl font-outfit font-extrabold tracking-tight">Explore Library</h1>
              <p className="text-muted-foreground font-medium">Discover resources tailored for your learning journey.</p>
            </div>

            {/* Mobile Search */}
            <div className="relative sm:hidden">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input 
                type="text" 
                placeholder="Search collection..." 
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className="w-full bg-white dark:bg-card border-none rounded-2xl pl-10 pr-4 py-3 text-sm shadow-sm ring-1 ring-border"
               />
            </div>

            {/* Content Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold font-outfit">Featured Collection</h2>
                  <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {pagination.totalResources} ITEMS
                  </span>
                </div>
                
                {(filters.class || filters.category || filters.type || filters.search) && (
                  <Button variant="ghost" size="sm" className="text-primary font-bold text-[10px]" onClick={() => setFilters({ class: "", category: "", type: "", search: "" })}>
                    RESET FILTERS
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <Library className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">No results found</p>
                    <p className="text-sm text-muted-foreground max-w-xs">We couldn't find any resources matching your current filters. Try adjusting them.</p>
                  </div>
                  <Button variant="outline" onClick={() => setFilters({ class: "", category: "", type: "", search: "" })}>Clear all filters</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                      {resources.map((resource) => (
                        <ResourceCard key={resource._id} resource={resource} navigate={navigate} />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-muted-foreground font-bold">
                      PAGE {pagination.currentPage} OF {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                        className="rounded-xl border-2 font-bold"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> PREVIOUS
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                        className="rounded-xl border-2 font-bold"
                      >
                        NEXT <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

