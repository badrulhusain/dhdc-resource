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

        // Basic detection
        // Note: In a real app we'd use embedUrl from backend if robustly generated.
        // Here we do simple clientside logic or trust the link.

        if (type === "PDF" || link.endsWith(".pdf")) {
            // Drive links might not work in generic iframe without preview suffix
            // Cloudinary/S3 PDF:
            return (
                <iframe
                    src={link}
                    className="w-full h-[80vh] rounded-md border"
                    title={resource.title}
                />
            );
        }

        if (type === "VIDEO") {
            if (resource.embedType === "youtube" || link.includes("youtube") || link.includes("youtu.be")) {
                // Extract ID simply (naive)
                let videoId = "";
                if (link.includes("v=")) videoId = link.split("v=")[1]?.split("&")[0];
                else if (link.includes("youtu.be/")) videoId = link.split("youtu.be/")[1];

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
            // Fallback or other video
            return (
                <div className="flex flex-col items-center justify-center p-10 space-y-4">
                    <p>Video playback not directly supported for this link type.</p>
                    <Button asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                            Open Video <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            );
        }

        if (type === "AUDIO") {
            return (
                <div className="flex flex-col items-center justify-center p-10 space-y-4">
                    <audio controls className="w-full">
                        <source src={link} />
                        Your browser does not support audio element.
                    </audio>
                </div>
            );
        }

        // Default / Link / Drive
        // Drive preview link logic: replace /view with /preview
        if (link.includes("drive.google.com")) {
            const previewLink = link.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
            return (
                <iframe
                    src={previewLink}
                    className="w-full h-[80vh] rounded-md border"
                    title={resource.title}
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <p>Preview not available for this resource type.</p>
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
