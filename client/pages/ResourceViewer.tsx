import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, ExternalLink, ShieldAlert, ArrowLeft, 
  Maximize2, Minimize2, Info, ChevronRight,
  Share2, Bookmark, Download, Lock, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface Resource {
    _id: string;
    title: string;
    description?: string;
    link: string;
    class: string;
    category: string;
    type: string;
    mimeType?: string;
    createdBy: { name: string; email: string };
    createdAt: string;
}

export default function ResourceViewer() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCinemaMode, setIsCinemaMode] = useState(false);

    // Disable right click and keyboard shortcuts for protection
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s" || e.key === "u")) {
                e.preventDefault();
            }
        };
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const { data: resource, isLoading, isError } = useQuery({
        queryKey: ["resource", id],
        queryFn: async (): Promise<Resource> => {
            if (location.state?.resource) return location.state.resource;
            if (!id) throw new Error("No ID provided");
            if (id.startsWith("gdrive-")) throw new Error("Link expired. Please reopen from dashboard.");
            const res = await fetch(`/api/resources/${id}`);
            if (!res.ok) throw new Error("Resource not found");
            return res.json();
        },
        initialData: location.state?.resource
    });

    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary mb-4"
                />
                <p className="text-lg font-outfit font-bold tracking-tight animate-pulse">Initializing Secure Reader...</p>
            </div>
        );
    }

    if (isError || !resource) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-outfit font-extrabold mb-2">Access Denied or Link Expired</h2>
                <p className="text-muted-foreground max-w-sm mb-8">
                    This resource is protected or the temporary access link has expired.
                </p>
                <Button onClick={() => navigate("/student/dashboard")} variant="outline" className="rounded-full px-8">
                    Return to Library
                </Button>
            </div>
        );
    }

    let viewerUrl = resource.link;
    if (viewerUrl.includes("drive.google.com")) {
        viewerUrl = viewerUrl.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview");
    }

    const renderContent = () => {
        const { link, type } = resource;
        const isPdf = type === "PDF" || link.endsWith(".pdf") || (link.includes("drive.google.com") && !type);

        if (isPdf) {
            let finalUrl = viewerUrl;
            if (type === "PDF" && !finalUrl.includes("drive.google.com") && !finalUrl.includes("#")) {
                finalUrl += "#toolbar=0&navpanes=0&scrollbar=0&view=FitH";
            }
            return (
                <iframe src={finalUrl} className="w-full h-full border-none" title="Secure PDF Viewer" />
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
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            className="w-full h-full aspect-video"
                            allowFullScreen
                            title={resource.title}
                        />
                    );
                }
            }
            return (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <video controls controlsList="nodownload" className="max-w-full max-h-full">
                        <source src={link} />
                    </video>
                </div>
            );
        }

        if (type === "AUDIO") {
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-8 bg-muted/20 p-12">
                     <div className="w-48 h-48 rounded-[2rem] glass-card flex items-center justify-center bg-primary/5 border-primary/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <Loader2 className="w-20 h-20 text-primary opacity-20" />
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <div className="flex gap-1 items-end h-8">
                                {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] }}
                                        transition={{ duration: 0.5 + i*0.1, repeat: Infinity }}
                                        className="w-1.5 bg-primary rounded-full"
                                    />
                                ))}
                             </div>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-outfit font-bold">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Audiobook Player</p>
                    </div>
                    <audio controls controlsList="nodownload" className="w-full max-w-md h-12 rounded-full">
                        <source src={link} />
                    </audio>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-12 h-full text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <ExternalLink className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">External Content</h3>
                    <p className="text-muted-foreground max-w-xs">This resource cannot be viewed directly within the secure reader.</p>
                </div>
                <Button asChild className="rounded-full px-8">
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        Open in New Tab
                    </a>
                </Button>
            </div>
        );
    };

    return (
        <div className={cn(
            "fixed inset-0 z-[100] bg-background flex flex-col transition-colors duration-500",
            isCinemaMode ? "bg-[#0A0A0B]" : "bg-background"
        )}>
            {/* Header */}
            <header className={cn(
                "h-16 px-4 flex items-center justify-between border-b transition-all duration-500 z-10",
                isCinemaMode ? "bg-black/60 border-white/5 text-white backdrop-blur-md" : "bg-white border-border"
            )}>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate("/student/dashboard")}
                        className={isCinemaMode ? "hover:bg-white/10" : ""}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-6 bg-border/20 hidden sm:block" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-outfit font-bold truncate max-w-[200px] sm:max-w-md">
                            {resource.title}
                        </h1>
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                            {resource.type || "Resource"} • Class {resource.class}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsCinemaMode(!isCinemaMode)}
                        title={isCinemaMode ? "Exit Cinema Mode" : "Cinema Mode"}
                        className={isCinemaMode ? "text-primary hover:bg-white/10" : ""}
                    >
                        {isCinemaMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={isSidebarOpen ? "text-primary hover:bg-white/10" : ""}
                    >
                        <Info className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Viewer Area */}
                <main className={cn(
                    "flex-1 relative transition-all duration-500 ease-in-out overflow-hidden",
                    !isCinemaMode && "p-4 sm:p-6"
                )}>
                    <motion.div 
                        layout
                        className={cn(
                            "w-full h-full overflow-hidden transition-all duration-500",
                            !isCinemaMode ? "rounded-2xl border bg-card shadow-2xl shadow-primary/5" : "bg-black"
                        )}
                    >
                        {renderContent()}
                        
                        {/* Protection Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-[-45deg] select-none text-center">
                            <p className="text-6xl font-black uppercase tracking-[1em] mb-4">CONFIDENTIAL</p>
                            <p className="text-4xl font-bold uppercase">{user?.name} ({user?.adNo})</p>
                        </div>
                    </motion.div>
                </main>

                {/* Info Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className={cn(
                                "w-80 border-l p-6 hidden lg:block overflow-y-auto transition-colors duration-500",
                                isCinemaMode ? "bg-[#0A0A0B] border-white/5 text-white" : "bg-card border-border"
                            )}
                        >
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                                        <Info className="w-5 h-5 text-primary" />
                                        Resource Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/10">
                                            <p className="text-sm font-medium leading-relaxed opacity-80">
                                                {resource.description || "No description provided for this item."}
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-xl bg-muted/20 border border-border/10 text-center">
                                                <p className="text-[10px] font-bold opacity-40 uppercase mb-1">Class</p>
                                                <p className="text-sm font-bold">{resource.class}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-muted/20 border border-border/10 text-center">
                                                <p className="text-[10px] font-bold opacity-40 uppercase mb-1">Format</p>
                                                <p className="text-sm font-bold">{resource.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-border/10">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Security & Protection</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-xs font-semibold opacity-80">
                                            <Lock className="w-4 h-4 text-green-500" />
                                            End-to-end encrypted
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-semibold opacity-80">
                                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                                            Screen capture protection
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-8 pb-12">
                                    <Button className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 h-10">
                                        <Bookmark className="w-4 h-4 mr-2" /> SAVE TO FAVORITES
                                    </Button>
                                    <Button variant="outline" className="w-full rounded-xl font-bold border-2 h-10">
                                        <Share2 className="w-4 h-4 mr-2" /> SHARE LINK
                                    </Button>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Status Bar */}
            {!isCinemaMode && (
                <footer className="h-8 border-t bg-muted/30 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ADDED ON {new Date(resource.createdAt).toLocaleDateString()}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            By {resource.createdBy.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-muted-foreground">SECURE CONNECTION</span>
                    </div>
                </footer>
            )}
        </div>
    );
}

