import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo.js";
import { handleRegister, handleLogin, handleMe, handleStudentLogin, handleGetAdmins } from "./routes/auth.js";
import {
  handleGetResources,
  handleGetResourceById,
  handleCreateResource,
  handleUpdateResource,
  handleDeleteResource,
  handleDeleteAllResources,
} from "./routes/resources.js";
import { authMiddleware, adminMiddleware } from "./lib/auth.js";
import { handleEmbedUrl } from "./routes/embed.js";
import { handleGetFolders, handleCreateFolder } from "./routes/folders.js";
import { handleGetDriveFolder } from "./routes/drive.js";

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
      ? (process.env.FRONTEND_URL || false) 
      : true, // Allow all origins in development
    credentials: true,
    optionsSuccessStatus: 200,
  };

  // Middleware
  app.use(compression());
  app.use(cors(corsOptions as any));

  // Body parsing with size limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "connect-src": ["'self'", "ws:", "wss:"],
        "frame-src": [
          "'self'",
          "https://drive.google.com",
          "https://docs.google.com",
          "https://*.youtube.com",
          "https://*.youtube-nocookie.com"
        ],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://*.google.com",
          "https://*.googleusercontent.com",
          "https://*.gstatic.com"
        ],
      },
    },
  }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/auth/register", authMiddleware, adminMiddleware, handleRegister);
  app.get("/api/auth/admins", authMiddleware, adminMiddleware, handleGetAdmins);
  app.post("/api/auth/login", loginLimiter, handleLogin);
  app.post("/api/auth/student-login", loginLimiter, handleStudentLogin);
  app.get("/api/auth/me", authMiddleware, handleMe);

  // Folder routes
  app.get("/api/folders", authMiddleware, handleGetFolders);
  app.post("/api/folders", authMiddleware, adminMiddleware, handleCreateFolder);

  // Drive route
  app.post("/api/drive/folder", authMiddleware, handleGetDriveFolder);

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
