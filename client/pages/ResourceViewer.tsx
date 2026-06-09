import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, ExternalLink, ShieldAlert, ArrowLeft,
  Maximize2, Minimize2, Info, X,
  FileText, Headphones, Play, Lock, Clock, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Prevent right-click and common keyboard shortcuts for basic content protection
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "u"].includes(e.key)) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const { data: resource, isLoading, isError } = useQuery<Resource>({
    queryKey: ["resource", id],
    queryFn: async () => {
      if (location.state?.resource) return location.state.resource as Resource;
      if (!id) throw new Error("No ID");
      if (id.startsWith("gdrive-")) throw new Error("Link expired. Please reopen from the library.");
      const token = localStorage.getItem("dhdc_auth_token");
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/resources/${id}`, { headers });
      if (!res.ok) throw new Error("Resource not found");
      return res.json();
    },
    initialData: location.state?.resource as Resource | undefined,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <p className="text-sm font-bold text-muted-foreground tracking-wide animate-pulse">Loading resource…</p>
      </div>
    );
  }

  if (isError || !resource) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-center p-6 bg-background">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Resource Not Found</h2>
        <p className="text-muted-foreground text-sm max-w-sm mb-8">
          This link may have expired or the resource no longer exists.
        </p>
        <Button onClick={() => navigate("/")} className="rounded-full px-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
      </div>
    );
  }

  const viewerUrl = resource.link.includes("drive.google.com")
    ? resource.link.replace(/\/view.*/, "/preview").replace(/\/edit.*/, "/preview")
    : resource.link;

  const renderContent = () => {
    const { link, type } = resource;

    // Spotify
    if (link.includes("spotify.com")) {
      const embed = link.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0];
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
          <iframe
            src={embed}
            className="w-full max-w-xl rounded-2xl border-0 shadow-2xl"
            style={{ minHeight: "380px" }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={resource.title}
          />
          <Button asChild variant="outline" className="rounded-full px-8">
            <a href={link} target="_blank" rel="noopener noreferrer">
              Open in Spotify <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </div>
      );
    }

    // PDF / Google Drive PDF
    const isPdf = type === "PDF" || link.endsWith(".pdf") || link.includes("drive.google.com");
    if (isPdf) {
      let src = viewerUrl;
      if (type === "PDF" && !src.includes("drive.google.com") && !src.includes("#")) {
        src += "#toolbar=0&navpanes=0&scrollbar=0&view=FitH";
      }
      return <iframe src={src} className="w-full h-full border-none" title={resource.title} />;
    }

    // YouTube / Video
    if (type === "VIDEO" || link.includes("youtube.com") || link.includes("youtu.be")) {
      let videoId = "";
      if (link.includes("v=")) videoId = link.split("v=")[1]?.split("&")[0] || "";
      else if (link.includes("youtu.be/")) videoId = link.split("youtu.be/")[1]?.split("?")[0] || "";
      else if (link.includes("/shorts/")) videoId = link.split("/shorts/")[1]?.split("?")[0] || "";
      else if (link.includes("/embed/")) videoId = link.split("/embed/")[1]?.split("?")[0] || "";

      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`}
            className="w-full h-full"
            allowFullScreen
            title={resource.title}
          />
        );
      }
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <video controls controlsList="nodownload" className="max-w-full max-h-full">
            <source src={link} />
          </video>
        </div>
      );
    }

    // Audio
    if (type === "AUDIO") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-8 p-12 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="w-48 h-48 rounded-[2.5rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
            <Headphones className="w-20 h-20 text-purple-500 opacity-40" />
            <div className="absolute bottom-6 flex gap-1 items-end h-8">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [`${h * 32}px`, `${(1 - h) * 32}px`, `${h * 32}px`] }}
                  transition={{ duration: 0.6 + i * 0.1, repeat: Infinity }}
                  className="w-1.5 bg-purple-500 rounded-full"
                />
              ))}
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold">{resource.title}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Audio Player</p>
          </div>
          <audio controls controlsList="nodownload" className="w-full max-w-md rounded-full" style={{ colorScheme: "auto" }}>
            <source src={link} />
          </audio>
        </div>
      );
    }

    // Google Drive file (non-PDF)
    if (link.includes("drive.google.com")) {
      return <iframe src={viewerUrl} className="w-full h-full border-none" title={resource.title} allowFullScreen />;
    }

    // Generic external link
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-bold mb-1">{resource.title}</h3>
          <p className="text-sm text-muted-foreground">This resource opens in an external website.</p>
        </div>
        <Button asChild className="rounded-full px-8 gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer">
            Open Resource <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    );
  };

  const typeIcon = resource.type === "PDF" ? FileText
    : resource.type === "AUDIO" ? Headphones
    : resource.type === "VIDEO" ? Play
    : BookOpen;
  const TypeIcon = typeIcon;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col transition-colors duration-500",
      isCinemaMode ? "bg-[#08090a]" : "bg-background"
    )}>
      {/* Header */}
      <header className={cn(
        "h-14 px-3 sm:px-5 flex items-center justify-between border-b shrink-0 transition-all duration-300",
        isCinemaMode
          ? "bg-black/70 border-white/5 text-white backdrop-blur-md"
          : "bg-white dark:bg-card border-border"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className={cn("shrink-0 rounded-xl", isCinemaMode && "hover:bg-white/10 text-white")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-px h-5 bg-border/30 hidden sm:block shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              resource.type === "PDF" ? "bg-blue-500/10 text-blue-500"
              : resource.type === "AUDIO" ? "bg-purple-500/10 text-purple-500"
              : resource.type === "VIDEO" ? "bg-red-500/10 text-red-500"
              : "bg-muted text-muted-foreground"
            )}>
              <TypeIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h1 className={cn(
                "text-sm font-bold truncate max-w-[180px] sm:max-w-sm md:max-w-lg",
                isCinemaMode && "text-white"
              )}>
                {resource.title}
              </h1>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", isCinemaMode ? "text-white/40" : "text-muted-foreground")}>
                {resource.type} · {resource.class === "GENERAL" ? "General" : `Class ${resource.class}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            className={cn("rounded-xl", isCinemaMode && "text-white hover:bg-white/10")}
            title={isCinemaMode ? "Exit focus mode" : "Focus mode"}
          >
            {isCinemaMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn("rounded-xl hidden lg:flex", isSidebarOpen && "bg-primary/10 text-primary", isCinemaMode && "text-white hover:bg-white/10")}
            title="Resource details"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer */}
        <main className={cn(
          "flex-1 overflow-hidden transition-all duration-300",
          !isCinemaMode && "p-3 sm:p-5"
        )}>
          <div className={cn(
            "w-full h-full overflow-hidden transition-all duration-300 relative",
            !isCinemaMode && "rounded-2xl border border-border/50 bg-card shadow-xl shadow-primary/5"
          )}>
            {renderContent()}
            {/* Subtle watermark */}
            <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.015] rotate-[-30deg]">
              <p className="text-7xl font-black uppercase tracking-[2em] whitespace-nowrap text-foreground">DHDC</p>
            </div>
          </div>
        </main>

        {/* Details sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={cn(
                "border-l overflow-hidden shrink-0 transition-colors duration-300",
                isCinemaMode ? "bg-[#0d0e10] border-white/5" : "bg-card border-border"
              )}
            >
              <div className="w-[300px] h-full overflow-y-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={cn("font-bold text-sm", isCinemaMode && "text-white")}>Resource Details</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn("rounded-lg p-1 hover:bg-muted", isCinemaMode && "text-white hover:bg-white/10")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {resource.description && (
                  <div className={cn("p-3 rounded-xl bg-muted/40 text-sm leading-relaxed", isCinemaMode && "bg-white/5 text-white/70")}>
                    {resource.description}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Class", value: resource.class === "GENERAL" ? "General" : `Class ${resource.class}` },
                    { label: "Category", value: resource.category },
                    { label: "Format", value: resource.type },
                    { label: "Added", value: new Date(resource.createdAt).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label} className={cn("p-3 rounded-xl text-center", isCinemaMode ? "bg-white/5" : "bg-muted/30 border border-border/30")}>
                      <p className={cn("text-[9px] font-bold uppercase tracking-wider mb-1", isCinemaMode ? "text-white/30" : "text-muted-foreground/60")}>{label}</p>
                      <p className={cn("text-xs font-bold truncate", isCinemaMode && "text-white")}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className={cn("pt-4 border-t space-y-2.5", isCinemaMode ? "border-white/5" : "border-border/50")}>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", isCinemaMode ? "text-white/25" : "text-muted-foreground/50")}>
                    Content Protection
                  </p>
                  <div className={cn("flex items-center gap-2 text-xs font-medium", isCinemaMode ? "text-white/60" : "text-muted-foreground")}>
                    <Lock className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    Restricted access content
                  </div>
                  <div className={cn("flex items-center gap-2 text-xs font-medium", isCinemaMode ? "text-white/60" : "text-muted-foreground")}>
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Added {new Date(resource.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      {!isCinemaMode && (
        <div className="h-8 border-t border-border/30 bg-muted/20 px-5 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            DHDC Digital Library
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground">SECURE</span>
          </div>
        </div>
      )}
    </div>
  );
}
