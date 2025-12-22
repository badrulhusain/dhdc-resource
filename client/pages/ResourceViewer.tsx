import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink, ShieldAlert, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Resource {
    _id: string;
    title: string;
    description?: string;
    link: string; // The Cloudinary URL
    class: string;
    category: string;
    type: string;
    mimeType?: string;
}

export default function ResourceViewer() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);

    // Disable right click on the entire page
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };
        document.addEventListener("contextmenu", handleContextMenu);
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    const { data: resource, isLoading, isError } = useQuery({
        queryKey: ["resource", id],
        queryFn: async (): Promise<Resource> => {
            // Check if resource data was passed via router state (for ephemeral Drive items)
            if (location.state?.resource) {
                return location.state.resource;
            }

            if (!id) throw new Error("No ID provided");

            // Prevent fetching for ephemeral drive resources if state is missing
            if (id.startsWith("gdrive-")) {
                throw new Error("This Google Drive resource link has expired. Please return to the dashboard to reopen it.");
            }

            const res = await fetch(`/api/resources/${id}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Resource not found");
                throw new Error("Failed to fetch resource");
            }
            return res.json();
        },
        retry: (failureCount, error) => {
            // Don't retry for our custom error about expired drive links
            if (error.message.includes("Google Drive resource link has expired")) return false;
            return failureCount < 1;
        },
        initialData: location.state?.resource
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-lg font-medium">Loading Resource...</span>
            </div>
        );
    }

    if (isError || error || !resource) {
        return (
            <div className="flex h-[80vh] w-full flex-col items-center justify-center text-destructive">
                <ShieldAlert className="h-16 w-16 mb-4" />
                <h2 className="text-2xl font-bold">Unable to load resource</h2>
                <p className="mt-2 text-muted-foreground max-w-md text-center">
                    {(error as string) || (isError ? "Resource not found or access denied." : "")}
                </p>
                <div className="flex gap-4 mt-6">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Determine URL to display
    let viewerUrl = resource.link;

    // Handle Google Drive links: replace /view with /preview for embedding
    if (viewerUrl.includes("drive.google.com")) {
        viewerUrl = viewerUrl.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
        if (!viewerUrl.includes("/preview") && viewerUrl.includes("/file/d/")) {
            viewerUrl = viewerUrl.split("?")[0].replace(/\/$/, "") + "/preview";
        }
    }

    const renderContent = () => {
        const { link, type } = resource;

        if (type === "PDF" || link.endsWith(".pdf") || (link.includes("drive.google.com") && !type)) {
            // For Cloudinary/direct PDFs, append PDF.js flags
            let finalUrl = viewerUrl;
            if (type === "PDF" && !finalUrl.includes("drive.google.com") && !finalUrl.includes("#")) {
                finalUrl += "#toolbar=0&navpanes=0&scrollbar=0&view=FitH";
            }

            return (
                <iframe
                    src={finalUrl}
                    className="w-full h-full flex-grow border-none"
                    title="Resource Viewer"
                    onContextMenu={(e) => e.preventDefault()}
                />
            );
        }

        if (type === "VIDEO") {
            if (link.includes("youtube.com") || link.includes("youtu.be")) {
                let videoId = "";
                if (link.includes("v=")) videoId = link.split("v=")[1]?.split("&")[0];
                else if (link.includes("youtu.be/")) videoId = link.split("youtu.be/")[1]?.split("?")[0];

                if (videoId) {
                    return (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                className="w-full aspect-video max-h-full"
                                allowFullScreen
                                title={resource.title}
                            />
                        </div>
                    );
                }
            }

            // Generic video or GDrive video
            if (link.includes("drive.google.com")) {
                return (
                    <iframe
                        src={viewerUrl}
                        className="w-full h-full border-none"
                        title="Video Viewer"
                    />
                );
            }

            return (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <video controls className="max-w-full max-h-full">
                        <source src={link} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (type === "AUDIO") {
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-8 p-12">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                    <audio controls className="w-full max-w-md">
                        <source src={link} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }

        // Default fallback for GDrive or other links
        if (link.includes("drive.google.com")) {
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-full border-none"
                    title="Google Drive Viewer"
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-12 h-full">
                <p className="text-xl mb-4">Preview not available for this resource type ({type}).</p>
                <Button asChild>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open Externally
                    </a>
                </Button>
            </div>
        );
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col p-4 bg-background">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => window.history.back()} className="mb-2 pl-0 hover:pl-2 transition-all">
                        &larr; Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold truncate max-w-[80vw]">{resource.title}</h1>
                </div>
            </div>

            <Card className="flex-1 w-full flex flex-col overflow-hidden border shadow-lg relative bg-card">
                <CardContent className="p-0 flex-1 relative flex flex-col w-full h-full">
                    {renderContent()}
                </CardContent>
            </Card>

            <div className="mt-2 text-center text-xs text-muted-foreground">
                <p>Protected Content. distribution prohibited.</p>
            </div>
        </div>
    );
}
