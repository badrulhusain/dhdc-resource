import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "student" | "admin";
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export function generateToken(payload: JWTPayload, expiresIn: string | number = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  (req as any).user = payload;
  next();
};

export const adminMiddleware: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

/** Attaches user to req if a valid token is present, but never blocks the request. */
export const optionalAuthMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (token) {
    const payload = verifyToken(token);
    if (payload) (req as any).user = payload;
  }
  next();
};
