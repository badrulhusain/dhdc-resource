import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
    Folder,
    FileText,
    Plus,
    ArrowLeft,
    MoreVertical,
    Music,
    Video,
    Link as LinkIcon,
    HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { ResourceViewer } from "@/components/ResourceViewer";

export default function FolderView() {
    const { folderId } = useParams();
   
    const parentId = folderId; // for clarity
    const { user, token } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderClass, setNewFolderClass] = useState("ALL");

    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [newResource, setNewResource] = useState({
        title: "",
        link: "",
        type: "PDF",
        embedType: "external",
        category: "General",
        class: "ALL"
    });

    const isAdmin = user?.role === "admin";

    // Fetch Folders
    const { data: folders, isLoading: foldersLoading } = useQuery({
        queryKey: ["folders", parentId],
        queryFn: async () => {
            const res = await fetch(`/api/folders?parentId=${parentId || ""}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch folders");
            return res.json();
        },
    });

    // Fetch Resources (only matching this folder)
    const { data: resources, isLoading: resourcesLoading } = useQuery({
        queryKey: ["resources", parentId],
        queryFn: async () => {
            // If retrieving root, maybe we don't show resources unless specifically meant to be in "root" folder?
            // But current prompt implies resources are strictly inside folders.
            // If parentId is null, we might fetch resources with folderId=null (if we support that) or none.
            // Let's assume root resources exist if desired.
            const url = parentId
                ? `/api/resources?folderId=${parentId}`
                : `/api/resources?folderId=`; // fetch root resources? or just nothing?

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch resources");
            return res.json();
        },
        enabled: !!parentId // Only fetch resources if in a folder? Or allow root? Let's allow root if API handles it.
    });

    // Create Folder Mutation
    const createFolderMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/folders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create folder");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["folders"] });
            setIsCreateFolderOpen(false);
            setNewFolderName("");
            toast({ title: "Folder created successfully" });
        },
        onError: (error) => {
            toast({ title: "Error creating folder", description: error.message, variant: "destructive" });
        },
    });

    // Add Resource Mutation
    const addResourceMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/resources", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to add resource");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            setIsAddResourceOpen(false);
            setNewResource({
                title: "",
                link: "",
                type: "PDF",
                embedType: "external",
                category: "General",
                class: "ALL"
            });
            toast({ title: "Resource added successfully" });
        },
        onError: (error) => {
            toast({ title: "Error adding resource", description: error.message, variant: "destructive" });
        },
    });

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        createFolderMutation.mutate({
            name: newFolderName,
            class: newFolderClass,
            parentId,
        });
    };

    const handleAddResource = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Adding resource with parentId:", parentId); // DEBUG
        console.log("New Resource State:", newResource); // DEBUG
        addResourceMutation.mutate({
            ...newResource,
            folderId: parentId,
            class: newFolderClass, // Inherit from folder or manual? Let's stick to manual or consistent.
            // Actually, if we are in a folder, the resource should probably inherit the folder's class logic?
            // But we store class on resource too.
            // For now, let's use the state or defaults.
        });
    };

    // Resource Icon Helper
    const getResourceIcon = (type: string) => {
        switch (type) {
            case "AUDIO": return <Music className="h-10 w-10 text-pink-500" />;
            case "VIDEO": return <Video className="h-10 w-10 text-red-500" />;
            case "LINK": return <LinkIcon className="h-10 w-10 text-blue-500" />;
            default: return <FileText className="h-10 w-10 text-orange-500" />;
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {parentId && (
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h1 className="text-2xl font-bold">
                        {parentId ? "Folder Contents" : "Administrative Folders & Resources"}
                    </h1>
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> New Folder
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Folder</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateFolder} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Folder Name</Label>
                                        <Input
                                            required
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Class Visibility</Label>
                                        <Select value={newFolderClass} onValueChange={setNewFolderClass}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Classes</SelectItem>
                                                <SelectItem value="10">Class 10</SelectItem>
                                                <SelectItem value="9">Class 9</SelectItem>
                                                <SelectItem value="8">Class 8</SelectItem>
                                                {/* Add others as needed */}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" disabled={createFolderMutation.isPending}>
                                        {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" disabled={!parentId}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Resource
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Resource</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddResource} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            required
                                            value={newResource.title}
                                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select
                                            value={newResource.type}
                                            onValueChange={(val) => setNewResource({ ...newResource, type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PDF">PDF Document</SelectItem>
                                                <SelectItem value="AUDIO">Audio File</SelectItem>
                                                <SelectItem value="VIDEO">Video / YouTube</SelectItem>
                                                <SelectItem value="LINK">External Link / Drive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>File URL / Link</Label>
                                        <Input
                                            required
                                            value={newResource.link}
                                            onChange={(e) => setNewResource({ ...newResource, link: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {newResource.type === "VIDEO" && (
                                        <div className="space-y-2">
                                            <Label>Video Source</Label>
                                            <Select
                                                value={newResource.embedType}
                                                onValueChange={(val) => setNewResource({ ...newResource, embedType: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="youtube">YouTube</SelectItem>
                                                    <SelectItem value="external">Direct Link</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <Button type="submit" disabled={addResourceMutation.isPending}>
                                        {addResourceMutation.isPending ? "Adding..." : "Add Resource"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {foldersLoading ? (
                <div>Loading folders...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {folders?.map((folder: any) => (
                        <Link to={`/${user?.role === 'admin' ? 'admin' : 'student'}/folders/${folder._id}`} key={folder._id}>
                            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                                    <Folder className="h-12 w-12 text-blue-500 fill-blue-100" />
                                    <span className="font-medium truncate w-full" title={folder.name}>
                                        {folder.name}
                                    </span>
                                    {isAdmin && (
                                        <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                                            Class: {folder.class}
                                        </span>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {folders?.length === 0 && !resources?.length && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No folders or resources found.
                        </div>
                    )}
                </div>
            )}

            {resources && resources.length > 0 && (
                <div className="space-y-4 pt-8">
                    <h2 className="text-xl font-semibold">Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map((resource: any) => (
                            <ResourceViewer key={resource._id} resource={resource}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <CardContent className="p-4 flex items-start gap-4">
                                        {getResourceIcon(resource.type)}
                                        <div className="space-y-1 overflow-hidden">
                                            <h3 className="font-medium truncate" title={resource.title}>
                                                {resource.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {resource.type.toLowerCase()} • {new Date(resource.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </ResourceViewer>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
