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
    embedUrl?: string;
}

interface ResourceViewerProps {
    resource: Resource;
    children: React.ReactNode;
}

export function ResourceViewer({ resource, children }: ResourceViewerProps) {

    const renderContent = () => {
        const { link, type } = resource;

        // ── Google Drive: normalise to /preview ──────────────────────────────
        let viewerUrl = link;
        if (viewerUrl.includes("drive.google.com")) {
            viewerUrl = viewerUrl.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
            if (!viewerUrl.includes("/preview") && viewerUrl.includes("/file/d/")) {
                viewerUrl = viewerUrl.split("?")[0].replace(/\/$/, "") + "/preview";
            }
        }

        // ── Spotify ──────────────────────────────────────────────────────────
        // Handles tracks, albums, playlists, podcasts, episodes
        if (link.includes("spotify.com")) {
            // open.spotify.com/track/xxx  →  open.spotify.com/embed/track/xxx
            // open.spotify.com/playlist/xxx  →  open.spotify.com/embed/playlist/xxx
            const spotifyEmbed = link
                .replace("open.spotify.com/", "open.spotify.com/embed/")
                .split("?")[0]; // strip query string
            return (
                <div className="flex flex-col items-center gap-4">
                    <iframe
                        src={spotifyEmbed}
                        className="w-full rounded-xl border-0"
                        style={{ minHeight: "380px" }}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title={resource.title}
                    />
                    <Button asChild variant="outline" size="sm">
                        <a href={link} target="_blank" rel="noopener noreferrer">
                            Open in Spotify <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            );
        }

        // ── YouTube ───────────────────────────────────────────────────────────
        if (
            type === "VIDEO" &&
            (link.includes("youtube.com") || link.includes("youtu.be"))
        ) {
            let videoId = "";
            if (link.includes("v=")) {
                // Standard: youtube.com/watch?v=ID
                videoId = link.split("v=")[1]?.split("&")[0];
            } else if (link.includes("youtu.be/")) {
                // Short: youtu.be/ID
                videoId = link.split("youtu.be/")[1]?.split("?")[0];
            } else if (link.includes("/embed/")) {
                // Already embedded: youtube.com/embed/ID
                videoId = link.split("/embed/")[1]?.split("?")[0];
            } else if (link.includes("/shorts/")) {
                // Shorts: youtube.com/shorts/ID
                videoId = link.split("/shorts/")[1]?.split("?")[0];
            }

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

        // ── PDF ───────────────────────────────────────────────────────────────
        if (type === "PDF" || link.endsWith(".pdf") || (link.includes("drive.google.com") && !type)) {
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-[85vh] rounded-md border-0"
                    title={resource.title}
                    allowFullScreen
                />
            );
        }

        // ── Video (generic — Drive video or direct file link) ─────────────────
        if (type === "VIDEO") {
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-[80vh] rounded-md border"
                    title={resource.title}
                    allowFullScreen
                />
            );
        }

        // ── Audio ─────────────────────────────────────────────────────────────
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

        // ── Generic Google Drive file ─────────────────────────────────────────
        if (link.includes("drive.google.com")) {
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-[85vh] rounded-md border-0"
                    title={resource.title}
                    allowFullScreen
                />
            );
        }

        // ── LINK / OTHERS / anything else ─────────────────────────────────────
        // Attempt to embed; provide "Open in New Tab" as an escape hatch.
        return (
            <div className="flex flex-col items-center gap-4">
                <iframe
                    src={link}
                    className="w-full h-[75vh] rounded-md border"
                    title={resource.title}
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
                <Button asChild variant="outline" size="sm">
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
