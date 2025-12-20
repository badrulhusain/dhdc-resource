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
  if (resource.type === "VIDEO") return "youtube";
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
    if (type === "pdf" || url.endsWith(".pdf")) return;

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
    return (
      <iframe
        src={url}
        className="w-full h-[600px] rounded-lg border border-border mb-4 bg-white"
        title={title}
      />
    );
  }

  if (type === "audio") {
    return (
      <div className="mb-4 bg-muted/30 p-8 rounded-lg flex flex-col items-center justify-center border border-border">
        <Headphones className="w-16 h-16 text-primary mb-4 animate-pulse" />
        <audio controls className="w-full max-w-md">
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
        <p className="mt-4 text-sm font-medium">{title}</p>
      </div>
    );
  }

  if (type === "youtube" && url.includes("cloudinary")) {
    return (
      <div className="mb-4 aspect-video bg-black rounded-lg overflow-hidden border border-border">
        <video controls className="w-full h-full">
          <source src={url} />
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  if (isLoading) {
    return <div className="w-full h-48 bg-muted animate-pulse rounded-lg mb-4" />;
  }

  if (!data?.html) {
    return (
      <div className="mb-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open Resource
        </a>
      </div>
    );
  }

  return (
    <div
      className="mb-4 w-full rounded-lg overflow-hidden [&_iframe]:w-full max-h-80 overflow-auto"
      dangerouslySetInnerHTML={{ __html: data.html }}
    />
  );
};

export default function StudentDashboard() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({
    class: "",
    category: "",
    type: "",
    search: "",
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
    fetchResources();
    fetchFolders();
  }, [currentFolderId]);

  useEffect(() => {
    applyFilters();
  }, [resources, filters]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/resources", window.location.origin);
      if (currentFolderId) url.searchParams.append("folderId", currentFolderId);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const url = new URL("/api/folders", window.location.origin);
      if (currentFolderId) url.searchParams.append("parentId", currentFolderId);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data);

        // Find current folder's parent for back navigation
        if (currentFolderId) {
          // This is a bit tricky since we don't have the current folder object here easily
          // But if we're at top level, parent is null.
          // If we're inside, we should have probably stored it.
        }
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const applyFilters = () => {
    let filtered = resources;

    if (filters.class) {
      filtered = filtered.filter((r) => r.class === filters.class);
    }

    if (filters.category) {
      filtered = filtered.filter((r) => r.category === filters.category);
    }

    if (filters.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.title.toLowerCase().includes(searchLower),
      );
    }

    setFilteredResources(filtered);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

            {/* Class */}
            <select
              value={filters.class}
              onChange={(e) => handleFilterChange("class", e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Classes</option>
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>

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
            {currentFolderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentFolderId(null);
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {folders.length} folder{folders.length !== 1 ? "s" : ""} and {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {folders.map((folder) => (
            <div
              key={folder._id}
              onClick={() => setCurrentFolderId(folder._id)}
              className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all flex items-center gap-4 group"
            >
              <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{folder.name}</h4>
                <p className="text-xs text-muted-foreground">Class {folder.class}</p>
              </div>
            </div>
          ))}
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

                <a className="mt-auto" href={resource.link} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" size="sm">
                    {getFormat(resource) === "pdf" ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        View PDF
                      </>
                    ) : getFormat(resource) === "audio" ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Listen Audio
                      </>
                    ) : getFormat(resource) === "web" ? (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
