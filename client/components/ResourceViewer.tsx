import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Resource {
    _id: string;
    title: string;
    link: string;
    type: string;
    embedType?: string;
    embedUrl?: string; // If we pre-calculated it
}

interface ResourceViewerProps {
    resource: Resource;
    children: React.ReactNode;
}

export function ResourceViewer({ resource, children }: ResourceViewerProps) {

    const renderContent = () => {
        const { link, type } = resource;

        let viewerUrl = link;
        if (viewerUrl.includes("drive.google.com")) {
            viewerUrl = viewerUrl.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
            if (!viewerUrl.includes("/preview") && viewerUrl.includes("/file/d/")) {
                viewerUrl = viewerUrl.split("?")[0].replace(/\/$/, "") + "/preview";
            }
        }

        if (type === "PDF" || link.endsWith(".pdf") || (link.includes("drive.google.com") && !type)) {
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-[80vh] rounded-md border"
                    title={resource.title}
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
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            className="w-full aspect-video rounded-md"
                            allowFullScreen
                            title={resource.title}
                        />
                    );
                }
            }

            // Google Drive Video or Generic
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-[80vh] rounded-md border"
                    title={resource.title}
                />
            );
        }

        if (type === "AUDIO") {
            return (
                <div className="flex flex-col items-center justify-center p-10 space-y-4">
                    <audio controls className="w-full">
                        <source src={link} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }

        // Default / Link / Drive
        if (link.includes("drive.google.com")) {
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-[80vh] rounded-md border"
                    title={resource.title}
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <p>Preview not available for this resource type ({type}).</p>
                <Button asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        Open in New Tab <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
                <DialogHeader>
                    <DialogTitle>{resource.title}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
