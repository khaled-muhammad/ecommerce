import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../services/auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/user.js";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        sessionId: string;
      };
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function extractRefreshToken(req: Request): string | null {
  // Prefer cookie, fall back to body
  const fromCookie = req.cookies?.refresh_token;
  if (fromCookie) return fromCookie;
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === "string" && fromBody) return fromBody;
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Missing access token" });
      return;
    }

    const payload: JwtPayload = verifyToken(token);
    if (payload.type !== "access") {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid token type" });
      return;
    }

    const [user] = await db.select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.isActive) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "User not found or disabled" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Token expired" });
      return;
    }
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid token" });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      next();
      return;
    }
    const payload: JwtPayload = verifyToken(token);
    if (payload.type !== "access") {
      next();
      return;
    }
    const [user] = await db.select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (user?.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role, sessionId: payload.sessionId };
    }
  } catch {
    // ignore — treat as unauthenticated
  }
  next();
}

export function extractRefreshTokenFromReq(req: Request): string | null {
  return extractRefreshToken(req);
}
