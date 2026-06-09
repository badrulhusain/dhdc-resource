import { useEffect, useState, useCallback, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Search, FileText, Headphones, Globe,
  Play, LayoutGrid, Library as LibraryIcon, Clock,
  Filter, ChevronRight, ChevronLeft, X, Shield,
  BookOpen, AlertTriangle, Sparkles, GraduationCap
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

const CLASS_OPTIONS = ["ALL", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"];

const TYPE_FILTERS = [
  { id: "", label: "All", icon: LayoutGrid, color: "text-foreground" },
  { id: "PDF", label: "PDF / E-Book", icon: FileText, color: "text-blue-500" },
  { id: "AUDIO", label: "Audio", icon: Headphones, color: "text-purple-500" },
  { id: "VIDEO", label: "Video", icon: Play, color: "text-red-500" },
];

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0] || null;
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split("?")[0] || null;
  if (url.includes("/shorts/")) return url.split("/shorts/")[1]?.split("?")[0] || null;
  if (url.includes("/embed/")) return url.split("/embed/")[1]?.split("?")[0] || null;
  return null;
}

function getResourceFormat(resource: Resource) {
  if (resource.type === "PDF") return "pdf";
  if (resource.type === "AUDIO") return "audio";
  if (resource.type === "VIDEO") return "video";
  if (resource.type === "GDRIVE_FILE") {
    if (resource.mimeType?.includes("pdf")) return "pdf";
    if (resource.mimeType?.includes("video")) return "video";
    if (resource.mimeType?.includes("audio")) return "audio";
    return "pdf";
  }
  if (resource.link?.includes("youtube.com") || resource.link?.includes("youtu.be")) return "video";
  if (resource.link?.includes("spotify.com")) return "audio";
  return "other";
}

function resolveThumbnail(resource: Resource): string | null {
  if (resource.thumbnailLink) return resource.thumbnailLink;
  if (resource.link?.includes("youtube.com") || resource.link?.includes("youtu.be")) {
    const id = getYouTubeId(resource.link);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
}

const FORMAT_STYLES: Record<string, { bg: string; icon: string; label: string }> = {
  pdf: { bg: "from-blue-500/20 to-blue-600/10", icon: "text-blue-500", label: "PDF" },
  audio: { bg: "from-purple-500/20 to-purple-600/10", icon: "text-purple-500", label: "AUDIO" },
  video: { bg: "from-red-500/20 to-red-600/10", icon: "text-red-500", label: "VIDEO" },
  other: { bg: "from-orange-500/20 to-orange-600/10", icon: "text-orange-500", label: "LINK" },
};

const ResourceCard = forwardRef<HTMLDivElement, { resource: Resource; onClick: () => void }>(
  ({ resource, onClick }, ref) => {
    const format = getResourceFormat(resource);
    const thumbnail = resolveThumbnail(resource);
    const style = FORMAT_STYLES[format] || FORMAT_STYLES.other;

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        onClick={onClick}
        className="group relative bg-white dark:bg-card rounded-2xl overflow-hidden flex flex-col cursor-pointer border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
      >
        {/* Cover / Thumbnail */}
        <div className={cn("relative h-44 overflow-hidden bg-gradient-to-br", style.bg)}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={resource.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {format === "pdf" && <FileText className={cn("w-16 h-16 opacity-25", style.icon)} />}
              {format === "audio" && <Headphones className={cn("w-16 h-16 opacity-25", style.icon)} />}
              {format === "video" && <Play className={cn("w-16 h-16 opacity-25", style.icon)} />}
              {format === "other" && <Globe className={cn("w-16 h-16 opacity-25", style.icon)} />}
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="bg-white text-black font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl">
              <BookOpen className="w-3.5 h-3.5" />
              READ NOW
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm border",
              "bg-black/40 text-white border-white/20"
            )}>
              {style.label}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm border border-white/20">
              {resource.class === "GENERAL" ? "GENERAL" : `CLASS ${resource.class}`}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{resource.category}</p>
          <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
              {resource.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(resource.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>
    );
  }
);
ResourceCard.displayName = "ResourceCard";

export default function Library() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [driveErrors, setDriveErrors] = useState<{ title: string; driveFolderId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState({ class: "", type: "", search: "" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalResources: 0, limit: 12 });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/resources", window.location.origin);
      url.searchParams.set("page", pagination.currentPage.toString());
      url.searchParams.set("limit", pagination.limit.toString());
      if (filters.class && filters.class !== "ALL") url.searchParams.set("class", filters.class);
      if (filters.type) url.searchParams.set("type", filters.type);
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);

      const headers: HeadersInit = {};
      const token = localStorage.getItem("dhdc_auth_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResources(data.resources || []);
      setDriveErrors(data.errors || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages,
        totalResources: data.totalResources,
      }));
    } catch {
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters.class, filters.type, debouncedSearch, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({ class: "", type: "", search: "" });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = filters.class || filters.type || filters.search;

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-card/90 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-md shadow-primary/30">
              D
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-base tracking-tighter leading-none">DHDC</span>
              <span className="text-[9px] font-bold tracking-[0.25em] text-muted-foreground leading-none uppercase">Digital Library</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search books, topics, authors..."
              value={filters.search}
              onChange={e => setFilter("search", e.target.value)}
              className="w-full h-10 bg-muted/60 hover:bg-muted transition-colors rounded-full pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white dark:focus:bg-card"
            />
            {filters.search && (
              <button
                onClick={() => setFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn("rounded-xl gap-2 font-semibold hidden sm:flex", isFilterOpen && "bg-primary/10 text-primary")}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
            </Button>

            {user?.role === "admin" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  className="rounded-xl gap-2 font-bold border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="rounded-xl text-muted-foreground font-semibold"
              >
                <Shield className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4">
                {/* Type filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Type:</span>
                  {TYPE_FILTERS.map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setFilter("type", tf.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        filters.type === tf.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-transparent"
                      )}
                    >
                      <tf.icon className="w-3 h-3" />
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-border hidden sm:block" />

                {/* Class filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Class:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CLASS_OPTIONS.map(cls => (
                      <button
                        key={cls}
                        onClick={() => setFilter("class", cls === "ALL" ? "" : cls)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                          (filters.class === cls || (cls === "ALL" && !filters.class))
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-transparent"
                        )}
                      >
                        {cls === "ALL" ? "ALL" : cls === "GENERAL" ? "GEN" : cls}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive ml-auto rounded-xl text-xs font-bold">
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero / Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">DHDC E-Library</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {filters.search
                ? `Results for "${filters.search}"`
                : filters.class
                ? `Class ${filters.class} Resources`
                : "All Resources"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLoading ? "Loading..." : `${pagination.totalResources} resource${pagination.totalResources !== 1 ? "s" : ""} available`}
            </p>
          </div>

          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn("sm:hidden rounded-xl gap-2 font-semibold w-full", hasActiveFilters && "border-primary text-primary")}
          >
            <Filter className="w-4 h-4" />
            Filter & Search
            {hasActiveFilters && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.type && (
              <span className="flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                {TYPE_FILTERS.find(t => t.id === filters.type)?.label}
                <button onClick={() => setFilter("type", "")}><X className="w-3 h-3 ml-1" /></button>
              </span>
            )}
            {filters.class && (
              <span className="flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                Class {filters.class}
                <button onClick={() => setFilter("class", "")}><X className="w-3 h-3 ml-1" /></button>
              </span>
            )}
          </div>
        )}

        {/* Drive access errors */}
        <AnimatePresence>
          {driveErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4"
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-bold">Some folders are temporarily unavailable</p>
                <button onClick={() => setDriveErrors([])} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="pl-6 space-y-1">
                {driveErrors.map(err => (
                  <li key={err.driveFolderId} className="text-xs text-amber-600 dark:text-amber-300">
                    <strong>{err.title}</strong> — folder not shared with service account
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/50">
                <div className="h-44 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-2 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <GraduationCap className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">No resources found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {hasActiveFilters
                ? "No resources match your current filters. Try adjusting them."
                : "No resources have been uploaded yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                Clear all filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {resources.map(resource => (
                  <ResourceCard
                    key={resource._id}
                    resource={resource}
                    onClick={() => navigate(`/resource/${resource._id}`, { state: { resource } })}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                  className="rounded-xl gap-2 font-bold"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <span className="text-sm font-bold text-muted-foreground px-4">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                  className="rounded-xl gap-2 font-bold"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LibraryIcon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} DHDC Digital Library</span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-xs text-muted-foreground hover:text-primary font-semibold transition-colors flex items-center gap-1"
          >
            <Shield className="w-3 h-3" /> Admin Portal
          </button>
        </div>
      </footer>
    </div>
  );
}
