import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import { handleDemo } from "./routes/demo";
import { handleRegister, handleLogin, handleMe, handleStudentLogin } from "./routes/auth";
import {
  handleGetResources,
  handleGetResourceById,
  handleCreateResource,
  handleUpdateResource,
  handleDeleteResource,
  handleDeleteAllResources,
} from "./routes/resources";
import { authMiddleware, adminMiddleware } from "./lib/auth";
import { handleEmbedUrl } from "./routes/embed";
import { handleGetFolders, handleCreateFolder } from "./routes/folders";
import { handleGetDriveFolder } from "./routes/drive";

export function createServer() {
  console.log('[Server] Starting createServer()...');
  console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
  console.log('[Server] JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('[Server] MONGODB_URI exists:', !!process.env.MONGODB_URI);

  const app = express();
  console.log('[Server] Express app initialized');

  // Security: Trust proxy for production deployments (Netlify, Heroku, etc.)
  app.set("trust proxy", 1);

  // CORS Configuration
  const corsOptions = {
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || true // Set FRONTEND_URL in production
      : true, // Allow all origins in development
    credentials: true,
    optionsSuccessStatus: 200,
  };

  // Middleware
  app.use(compression());
  app.use(cors(corsOptions));

  // Body parsing with size limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Security Headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Enable XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/student-login", handleStudentLogin);
  app.get("/api/auth/me", authMiddleware, handleMe);

  // Folder routes
  app.get("/api/folders", authMiddleware, handleGetFolders);
  app.post("/api/folders", authMiddleware, adminMiddleware, handleCreateFolder);

  // Drive route
  app.post("/api/drive/folder", handleGetDriveFolder);

  // Resource routes
  app.get("/api/resources", authMiddleware, handleGetResources);
  app.delete("/api/resources", authMiddleware, adminMiddleware, handleDeleteAllResources);
  app.get("/api/resources/:id", authMiddleware, handleGetResourceById);
  // app.post("/api/resources/upload", ...) was removed because Cloudinary is no longer used.
  app.post(
    "/api/resources",
    authMiddleware,
    adminMiddleware,
    handleCreateResource,
  );
  app.put(
    "/api/resources/:id",
    authMiddleware,
    adminMiddleware,
    handleUpdateResource,
  );
  app.delete(
    "/api/resources/:id",
    authMiddleware,
    adminMiddleware,
    handleDeleteResource,
  );


  // Embed route
  app.get("/api/embed", handleEmbedUrl);

  // 404 Handler - must be after all routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.path} not found`
      });
    } else {
      next();
    }
  });

  // Global Error Handler - must be last
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server error:", err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== "production";

    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      ...(isDevelopment && { stack: err.stack }),
    });
  });

  console.log('[Server] All routes and middleware configured successfully');
  return app;
}
