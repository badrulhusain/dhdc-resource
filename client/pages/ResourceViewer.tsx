import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink, ShieldAlert } from "lucide-react";
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
            if (!id) throw new Error("No ID provided");
            const res = await fetch(`/api/resources/${id}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Resource not found");
                throw new Error("Failed to fetch resource");
            }
            return res.json();
        },
        retry: 1,
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
                <p className="mt-2 text-muted-foreground">{error || "Resource not found or access denied."}</p>
                <Button className="mt-6" variant="outline" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    // Determine URL to display
    let viewerUrl = resource.link;

    // Cloudinary PDF optimization and security flags
    if (resource.type === "PDF" || resource.link.endsWith(".pdf") || resource.mimeType === "application/pdf") {

        // For Cloudinary URLs, ensure it ends with .pdf to force inline display instead of Octet-Stream/Download
        // BUT only if it's an 'image' resource type (standard for PDFs). 'raw' resources (no extension) will 404 if modified.
        // Append browser-level flags
        if (!viewerUrl.includes("#")) {
            viewerUrl += "#toolbar=0&navpanes=0&scrollbar=0&view=FitH";
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl min-h-screen flex flex-col">
            <div className="mb-4">
                <Button variant="ghost" onClick={() => window.history.back()} className="mb-2">
                    &larr; Back
                </Button>
                <h1 className="text-3xl font-bold">{resource.title}</h1>
                {resource.description && (
                    <p className="text-muted-foreground mt-1">{resource.description}</p>
                )}
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg relative min-h-[800px]">
                <CardContent className="p-0 flex-1 relative bg-slate-100 dark:bg-slate-900 flex flex-col">

                    {/* Overlay to block direct interaction like right-click drag, though iframe handles internal right click */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                            // Allow scrolling but prevent dragging/context menu
                        }}
                    />

                    {resource.type === "PDF" || resource.link.endsWith(".pdf") ? (
                        <iframe
                            src={viewerUrl}
                            className="w-full h-full flex-grow border-none"
                            title="PDF Viewer"
                            // Security attributes
                            // sandbox="allow-scripts allow-same-origin allow-forms" // Removed slightly strict sandbox for pdf.js compat if needed, but safe to keep usually.
                            // keeping context menu block
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12">
                            <p className="text-xl mb-4">This resource type ({resource.type}) is not supported in the PDF viewer.</p>
                            <Button asChild>
                                <a href={resource.link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" /> Open Externally
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>Protected Content. distribution prohibited.</p>
            </div>
        </div>
    );
}
