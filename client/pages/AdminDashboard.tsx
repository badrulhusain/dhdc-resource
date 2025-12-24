import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, X, Search, FileText, Video, Music, Monitor, Folder } from "lucide-react";

interface Resource {
  _id: string;
  title: string;
  description?: string;
  link: string;
  class: string;
  category: string;
  type: string;
  embedType?: "youtube" | "audio" | "iframe" | "external";
  embedUrl?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
}

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"];
const CATEGORIES = ["Fiction", "Non-Fiction", "Academic", "Reference", "Other"];
const TYPES = ["PDF", "AUDIO", "VIDEO", "E-Book", "Audiobook", "E-Library", "GDRIVE_FILE", "Other Resources"];

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [addMode, setAddMode] = useState<"direct" | "folder">("direct");


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    class: "",
    category: "",
    type: "",
    driveFolderId: "",
    embedType: "external",
    embedUrl: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user && user.role !== "admin") {
      navigate("/student/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (token) {
      fetchResources();
    }
  }, [token, currentPage, searchQuery]);

  useEffect(() => {
    setFilteredResources(resources);
  }, [resources]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/resources", window.location.origin);
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("limit", limit.toString());
      if (searchQuery) {
        url.searchParams.append("search", searchQuery);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      setError("Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      link: "",
      class: "",
      category: "",
      type: "",
      driveFolderId: "",
      embedType: "external",
      embedUrl: "",
    });
    setEditingId(null);
    setError("");
  };

  const handleOpenModal = (resource?: Resource) => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description || "",
        link: resource.link,
        class: resource.class,
        category: resource.category,
        type: resource.type,
        driveFolderId: (resource as any).driveFolderId || "",
        embedType: resource.embedType || "external",
        embedUrl: resource.embedUrl || "",
      });
      setEditingId(resource._id);
      setAddMode(resource.type === "GDRIVE_FOLDER" ? "folder" : "direct");
    } else {
      resetForm();
      setAddMode("direct");
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "PDF": return <FileText className="w-5 h-5 text-red-500" />;
      case "VIDEO": return <Video className="w-5 h-5 text-blue-500" />;
      case "AUDIO": return <Music className="w-5 h-5 text-purple-500" />;
      case "GDRIVE_FOLDER": return <Folder className="w-5 h-5 text-yellow-500" />;
      default: return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const detectFileType = (url: string) => {
    if (!url) return "";
    const lowerUrl = url.toLowerCase();

    // Check for common video platforms
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be") || lowerUrl.includes("vimeo.com")) {
      return "VIDEO";
    }

    // Check extensions
    if (lowerUrl.endsWith(".pdf")) return "PDF";
    if (lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mkv") || lowerUrl.endsWith(".webm") || lowerUrl.endsWith(".mov")) return "VIDEO";
    if (lowerUrl.endsWith(".mp3") || lowerUrl.endsWith(".wav") || lowerUrl.endsWith(".m4a") || lowerUrl.endsWith(".ogg")) return "AUDIO";

    return "Other Resources";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const submissionData = { ...formData };

    if (addMode === "folder") {
      submissionData.type = "GDRIVE_FOLDER";
    } else {
      // If adding/editing direct resource, we use the type from formData
      // but we can auto-detect if it's empty
      if (!submissionData.type) {
        submissionData.type = detectFileType(formData.link);
      }
    }

    if (!submissionData.title || !submissionData.category || !submissionData.type || !submissionData.link || !submissionData.class) {
      setError("Please fill in all required fields. " + (!submissionData.type ? "Type could not be detected automatically." : ""));
      return;
    }

    try {
      setIsLoading(true);
      const url = editingId ? `/api/resources/${editingId}` : "/api/resources";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setSuccess(editingId ? "Resource updated successfully" : "Resource created successfully");
        setShowModal(false);
        resetForm();
        fetchResources();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save resource");
      }
    } catch (error) {
      console.error("Save error:", error);
      setError("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      setSuccess("Resource deleted successfully");
      fetchResources();

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to delete resource");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("CRITICAL: Are you sure you want to delete ALL resources? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/resources", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete all resources");
      }

      const data = await response.json();
      setSuccess(data.message || "All resources deleted successfully");
      fetchResources();
    } catch (error) {
      console.error("Delete all error:", error);
      setError("Failed to delete all resources");
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Resource Management
            </h1>
            <p className="text-muted-foreground">
              Add, edit, and manage learning resources
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleDeleteAll()} variant="destructive" size="default" className="flex-1 sm:flex-none">
                <Trash2 className="w-4 h-4 md:mr-2" />
                <span className="md:inline">Delete All</span>
              </Button>
              <Button onClick={() => handleOpenModal()} size="default" className="flex-1 sm:flex-none shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="md:inline">Add Resource</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg text-secondary">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Resources Cards (Mobile) */}
        <div className="grid grid-cols-1 gap-4 md:hidden mb-6">
          {filteredResources.map((resource) => (
            <div key={resource._id} className="bg-card p-4 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold line-clamp-1">{resource.title}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(resource.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleOpenModal(resource)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(resource._id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {resource.description || "No description provided."}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground rounded-md font-medium">
                  Class {resource.class}
                </span>
                <span className="px-2 py-1 bg-accent/10 text-accent-foreground rounded-md font-medium">
                  {resource.category}
                </span>
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md">
                  {resource.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Resources Table (Desktop) */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No resources yet</p>
              <Button onClick={() => handleOpenModal()}>
                Add your first resource
              </Button>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">No results found for "{searchQuery}"</p>
              <Button variant="ghost" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResources.map((resource) => (
                    <tr
                      key={resource._id}
                      className="hover:bg-muted/30 transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium line-clamp-1">
                            {resource.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {resource.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        Class {resource.class}
                      </td>
                      <td className="px-6 py-4 text-sm">{resource.category}</td>
                      <td className="px-6 py-4 text-sm">{resource.type}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleOpenModal(resource)}
                            variant="outline"
                            size="sm"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(resource._id)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {resources.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Resource" : "Add Resource"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingId && (
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setAddMode("direct")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${addMode === "direct"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Direct Resource
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("folder")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${addMode === "folder"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Drive Folder
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Resource title"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Class *
                </label>
                <select
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Class</option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {addMode === "folder" ? "Google Drive Folder Link *" : "Resource Link *"}
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => {
                      const newLink = e.target.value;
                      const detected = detectFileType(newLink);
                      setFormData({
                        ...formData,
                        link: newLink,
                        type: addMode === "direct" && detected ? detected : formData.type
                      });
                    }}
                    placeholder={addMode === "folder" ? "https://drive.google.com/drive/folders/..." : "https://example.com/file.pdf"}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  {addMode === "direct" && formData.link && (
                    <p className="mt-1 text-xs text-muted-foreground italic">
                      Detected type: <span className="font-semibold text-primary">{detectFileType(formData.link)}</span>
                    </p>
                  )}
                </div>
              </div>

              {addMode === "direct" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Select Type</option>
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingId ? "Update" : "Create Resource"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
