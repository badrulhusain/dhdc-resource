import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, X } from "lucide-react";

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
const TYPES = ["PDF", "AUDIO", "VIDEO"];

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: "", class: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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
    fetchResources();
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/resources");
      if (response.ok) {
        const data = await response.json();
        setResources(data);
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
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.category || !formData.type || !selectedFolder) {
      setError("Please fill in all required fields and select a folder");
      return;
    }

    if (!editingId && !uploadFile) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsLoading(true);
      const url = editingId ? `/api/resources/${editingId}` : "/api/resources/upload";
      const method = editingId ? "PUT" : "POST";

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("type", formData.type);
      submitData.append("folderId", selectedFolder);
      if (uploadFile) {
        submitData.append("file", uploadFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (response.ok) {
        setSuccess(editingId ? "Resource updated successfully" : "Resource uploaded successfully");
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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolder.name || !newFolder.class) return;

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newFolder)
      });

      if (response.ok) {
        setShowFolderModal(false);
        setNewFolder({ name: "", class: "" });
        fetchFolders();
        setSuccess("Folder created successfully");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Create folder error:", error);
      setError("Failed to create folder");
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
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Resource Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage learning resources
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowFolderModal(true)} variant="outline" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
            <Button onClick={() => handleOpenModal()} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
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

        {/* Resources Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No resources yet</p>
              <Button onClick={() => handleOpenModal()}>
                Add your first resource
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
                  {resources.map((resource) => (
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
                <label className="block text-sm font-medium mb-1">Folder *</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Folder</option>
                  {folders.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} (Class {f.class})
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Type *
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

                <div>
                  <label className="block text-sm font-medium mb-1">
                    File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    accept={formData.type === "PDF" ? ".pdf" : formData.type === "AUDIO" ? "audio/*" : "video/*"}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Uploading..." : editingId ? "Update" : "Upload & Create"}
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

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Folder</h2>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  value={newFolder.class}
                  onChange={(e) => setNewFolder({ ...newFolder, class: e.target.value })}
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
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowFolderModal(false)}
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
