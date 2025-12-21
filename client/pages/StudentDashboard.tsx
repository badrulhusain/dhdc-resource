import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getEmbedData, type EmbedData } from "@/lib/embed";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, FileText, Headphones, Globe, Eye, Play, Folder, ArrowLeft } from "lucide-react";

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
  createdBy: { name: string; email: string };
  createdAt: string;
}

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"];
const CATEGORIES = ["Fiction", "Non-Fiction", "Academic", "Reference", "Other"];
const TYPES = ["PDF", "AUDIO", "VIDEO"];

const getFormat = (resource: Resource) => {
  if (resource.type === "PDF") return "pdf";
  if (resource.type === "AUDIO") return "audio";
  if (resource.type === "VIDEO") return "video";
  if (resource.type === "GDRIVE_FILE") {
    if (resource.mimeType?.includes("pdf")) return "pdf";
    if (resource.mimeType?.includes("video")) return "video";
    if (resource.mimeType?.includes("audio")) return "audio";
    return "pdf"; // Default to pdf viewer for drive usually
  }
  if (resource.embedType && resource.embedType !== "external") return resource.embedType;
  // Legacy support below
  if (resource.type === "Audiobook") return "audio";
  if (resource.type === "E-Book") return "pdf";
  if (resource.type === "E-Library") return "web";
  return "other";
};

const GenerateEmbed = ({ url, title, type }: { url: string; title: string; type?: string }) => {
  const [data, setData] = useState<EmbedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip iframely for clear types
    if (type === "pdf" || url.endsWith(".pdf") || url.includes("drive.google.com")) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadEmbed = async () => {
      try {
        setIsLoading(true);
        const embedData = await getEmbedData(url);
        if (mounted) {
          setData(embedData);
        }
      } catch (error) {
        console.error("Failed to load embed:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadEmbed();

    return () => {
      mounted = false;
    };
  }, [url]);

  if (type === "pdf" || url.endsWith(".pdf")) {
    const finalUrl = url.includes("drive.google.com")
      ? url.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview")
      : url;

    return (
      <iframe
        src={finalUrl}
        className="w-full h-48 rounded-lg border border-border mb-4 bg-white"
        title={title}
      />
    );
  }

  if (type === "video") {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
      else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];

      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full aspect-video rounded-lg mb-4"
            allowFullScreen
            title={title}
          />
        );
      }
    }

    if (url.includes("drive.google.com")) {
      const previewUrl = url.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
      return (
        <iframe
          src={previewUrl}
          className="w-full aspect-video rounded-lg mb-4"
          allowFullScreen
          title={title}
        />
      );
    }

    return (
      <video controls className="w-full rounded-lg mb-4 bg-black max-h-48">
        <source src={url} />
      </video>
    );
  }

  if (type === "audio") {
    return (
      <div className="mb-4 bg-muted/30 p-4 rounded-lg flex flex-col items-center justify-center border border-border">
        <Headphones className="w-8 h-8 text-primary mb-2" />
        <audio controls className="w-full">
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (isLoading) {
    return <div className="w-full h-48 bg-muted animate-pulse rounded-lg mb-4" />;
  }

  if (!data?.html) {
    if (url.includes("drive.google.com")) {
      const previewUrl = url.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
      return (
        <iframe
          src={previewUrl}
          className="w-full h-48 rounded-lg mb-4 border border-border"
          title={title}
        />
      );
    }

    return null; // Don't show anything if no embed and not a special type
  }

  return (
    <div
      className="mb-4 w-full rounded-lg overflow-hidden [&_iframe]:w-full max-h-48 overflow-hidden"
      dangerouslySetInnerHTML={{ __html: data.html }}
    />
  );
};

export default function StudentDashboard() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    if (user && user.role !== "student") {
      navigate("/admin/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (token) {
      fetchResources();
    }
  }, [token, filters, pagination.currentPage]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/resources", window.location.origin);

      // Add pagination params
      url.searchParams.append("page", pagination.currentPage.toString());
      url.searchParams.append("limit", pagination.limit.toString());

      // Add filter params
      if (filters.class) url.searchParams.append("class", filters.class);
      if (filters.category) url.searchParams.append("category", filters.category);
      if (filters.type) url.searchParams.append("type", filters.type);
      if (filters.search) url.searchParams.append("search", filters.search);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
        setFilteredResources(data.resources);
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

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({ class: "", category: "", type: "", search: "" });
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        {/* Header */}
        <div className="mb-10 space-y-6">
          {user && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 shadow-lg text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
                  <div className="flex items-center gap-3 text-blue-100">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                      Student
                    </span>
                    {user.adNo && (
                      <span className="font-mono text-sm opacity-90">ID: {user.adNo}</span>
                    )}
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-lg font-medium text-blue-50">Ready to start learning?</p>
                  <p className="text-sm text-blue-200">New resources added recently</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <h2 className="text-3xl font-bold text-foreground">
              Learning Resources
            </h2>
            <p className="text-lg text-muted-foreground mt-2">
              Browse through our collection of e-books, audiobooks, and study materials.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Resources</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>



            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Type */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Types</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {(filters.class ||
            filters.category ||
            filters.type ||
            filters.search) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>


        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No resources found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource._id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getFormat(resource) === "pdf" && <FileText className="w-5 h-5 text-blue-500 mt-1" />}
                    {getFormat(resource) === "audio" && <Headphones className="w-5 h-5 text-purple-500 mt-1" />}
                    {getFormat(resource) === "video" && <Play className="w-5 h-5 text-red-500 mt-1" />}
                    {getFormat(resource) === "web" && <Globe className="w-5 h-5 text-green-500 mt-1" />}
                    {getFormat(resource) === "other" && <ExternalLink className="w-5 h-5 text-orange-500 mt-1" />}
                    <h3 className="text-lg font-semibold line-clamp-2">
                      {resource.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {resource.description || "No description"}
                </p>

                {/* Embedded Content */}
                <GenerateEmbed
                  url={resource.embedUrl || resource.link}
                  title={resource.title}
                  type={getFormat(resource)}
                />

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                    Class {resource.class}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary">
                    {resource.category}
                  </span>
                  {getFormat(resource) === "pdf" && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                      PDF
                    </span>
                  )}
                  {getFormat(resource) === "audio" && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-500">
                      AUDIO
                    </span>
                  )}
                  {getFormat(resource) === "video" && (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500">
                      VIDEO
                    </span>
                  )}
                  {getFormat(resource) === "web" && (
                    <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> EXTERNAL
                    </span>
                  )}
                </div>

                <div className="mb-4 text-xs text-muted-foreground">
                  <p>Added by {resource.createdBy.name}</p>
                  <p>{new Date(resource.createdAt).toLocaleDateString()}</p>
                </div>

                {(getFormat(resource) === "pdf" || getFormat(resource) === "video" || getFormat(resource) === "audio") ? (
                  <Button
                    className="mt-auto w-full"
                    size="sm"
                    onClick={() => navigate(`/resource/${resource._id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View {getFormat(resource).toUpperCase()}
                  </Button>
                ) : (
                  <a className="mt-auto" href={resource.link} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" size="sm">
                      {getFormat(resource) === "web" ? (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Library
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Resource
                        </>
                      )}
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {filteredResources.length > 0 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-medium text-foreground">{Math.min(pagination.currentPage * pagination.limit, pagination.totalResources)}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.totalResources}</span> resources
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                    className="w-9 h-9 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
