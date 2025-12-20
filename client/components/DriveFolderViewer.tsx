import { useState, useEffect } from "react";
import { Folder, FileText, ChevronRight, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    children?: DriveItem[];
}

const PDF_MIME = "application/pdf";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export function DriveFolderViewer({ folderId, title }: { folderId?: string; title?: string }) {
    const [driveLink, setDriveLink] = useState("");
    const [rootData, setRootData] = useState<DriveItem | null>(null);
    const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<DriveItem[]>([]);
    const [previewFile, setPreviewFile] = useState<DriveItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { toast } = useToast();

    // Auto-load if folderId is provided
    useEffect(() => {
        if (folderId) {
            loadFolder(`https://drive.google.com/drive/folders/${folderId}`);
        }
    }, [folderId]);

    const loadFolder = async (link: string) => {
        setIsLoading(true);
        setRootData(null);
        setCurrentFolder(null);
        setBreadcrumbs([]);
        setPreviewFile(null);

        try {
            const res = await fetch("/api/drive/folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderLink: link }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to load folder");
            }

            const data = await res.json();
            setRootData(data);
            setCurrentFolder(data);
            setBreadcrumbs([data]);
        } catch (error: any) {
            toast({
                title: "Error loading Drive folder",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualLoad = (e: React.FormEvent) => {
        e.preventDefault();
        if (!driveLink) return;
        loadFolder(driveLink);
    };

    const enterFolder = (folder: DriveItem) => {
        setCurrentFolder(folder);
        setBreadcrumbs((prev) => [...prev, folder]);
    };

    const navigateToBreadcrumb = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1]);
        setPreviewFile(null);
    };

    const handleGoBack = () => {
        if (breadcrumbs.length > 1) {
            navigateToBreadcrumb(breadcrumbs.length - 2);
        }
    };

    // Filter content for display
    const visibleChildren = currentFolder?.children?.filter(
        child => child.mimeType === FOLDER_MIME || child.mimeType === PDF_MIME
    ) || [];

    // Main Content Renderer based on state
    const renderContent = () => {
        if (isLoading) {
            return <div className="p-8 text-center text-muted-foreground">Loading folder contents...</div>;
        }

        if (previewFile) {
            return (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <span className="font-semibold truncate">{previewFile.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border">
                        <iframe
                            src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                            className="w-full h-full min-h-[500px]"
                            title={previewFile.name}
                            allow="autoplay"
                        />
                    </div>
                </div>
            );
        }

        if (!currentFolder) {
            return !isLoading && !folderId ? (
                <div className="p-8 text-center text-muted-foreground">Enter a link to view folder</div>
            ) : null;
        }

        if (visibleChildren.length === 0) {
            return <div className="p-8 text-center text-muted-foreground">This folder is empty.</div>;
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {visibleChildren.map((item) => {
                    const isFolder = item.mimeType === FOLDER_MIME;
                    return (
                        <div
                            key={item.id}
                            className={`
                                group relative p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-white
                                flex flex-col items-center text-center gap-3
                                ${isFolder ? 'hover:border-blue-400 hover:bg-blue-50/10' : 'hover:border-red-400 hover:bg-red-50/10'}
                            `}
                            onClick={() => isFolder ? enterFolder(item) : setPreviewFile(item)}
                        >
                            <div className={`p-3 rounded-full ${isFolder ? 'bg-blue-100/50 text-blue-600' : 'bg-red-100/50 text-red-600'}`}>
                                {isFolder ? (
                                    <Folder className="h-8 w-8" />
                                ) : (
                                    <FileText className="h-8 w-8" />
                                )}
                            </div>
                            <span className="text-sm font-medium w-full truncate px-1" title={item.name}>
                                {item.name}
                            </span>
                            {/* Optional: Show item type or count for folders if needed */}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header: Title or Input */}
            {!folderId && !rootData && (
                <div className="border p-4 rounded-lg bg-white shadow-sm mb-4">
                    <div className="flex flex-col space-y-2 mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Folder className="h-5 w-5 text-green-600" />
                            External Google Drive Viewer
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Enter a Google Drive folder link to view its contents (PDFs only).
                        </p>
                    </div>
                    <form onSubmit={handleManualLoad} className="flex gap-2">
                        <Input
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Loading..." : "Load Folder"}
                        </Button>
                    </form>
                </div>
            )}

            {/* Breadcrumbs & Navigation */}
            {rootData && !previewFile && (
                <div className="flex items-center gap-2 pb-2 border-b overflow-x-auto whitespace-nowrap">
                    {breadcrumbs.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-1 shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center">
                            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                            <span
                                className={`
                                    text-sm cursor-pointer hover:underline px-1 rounded
                                    ${index === breadcrumbs.length - 1 ? 'font-bold' : 'text-muted-foreground'}
                                `}
                                onClick={() => navigateToBreadcrumb(index)}
                            >
                                {crumb.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Viewer Body */}
            <div className="flex-1 overflow-auto min-h-[300px]">
                {renderContent()}
            </div>
        </div>
    );
}
