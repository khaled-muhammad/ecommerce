import { Router } from "express";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, sessions, oauthAccounts } from "../../db/schema/user.js";
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyToken, generateSessionToken, hashSessionToken } from "../../services/auth.js";
import { requireAuth, extractRefreshTokenFromReq } from "../../middleware/auth.js";
import { env } from "../../config/env.js";

function spaAbsoluteUrl(pathFromState: string): string {
  const base = env.FRONTEND_URL.replace(/\/$/, "");
  const path = pathFromState.startsWith("/") ? pathFromState : `/${pathFromState}`;
  return `${base}${path}`;
}

function buildSpaOAuthRedirect(
  pathFromState: string,
  accessToken: string,
  flags: { newGoogleAccount?: boolean; adminBootstrap?: boolean },
): string {
  const u = new URL(spaAbsoluteUrl(pathFromState));
  u.searchParams.set("access_token", accessToken);
  if (flags.newGoogleAccount) u.searchParams.set("google_welcome", "1");
  if (flags.adminBootstrap) u.searchParams.set("admin_setup", "1");
  return u.toString();
}

/** True when the store has no owner/admin yet - next new account becomes bootstrap owner. */
async function hasOwnerOrAdmin(): Promise<boolean> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(inArray(users.role, ["owner", "admin"]));
  return Number(row?.n ?? 0) > 0;
}

const router = Router();

// ── Validation schemas ──

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional().default(""),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1),
});

// ── Register ──

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "CONFLICT", message: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(body.password);
    const bootstrapAsOwner = !(await hasOwnerOrAdmin());
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        passwordHash,
        ...(bootstrapAsOwner ? { role: "owner" } : {}),
      })
      .returning();

    const sessionToken = generateSessionToken();
    const tokenHash = await hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt,
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role, sessionId: user.id });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, sessionId: user.id });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth",
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        imageUrl: user.imageUrl,
        emailVerified: user.emailVerified,
        hasPassword: true,
      },
      accessToken,
      ...(bootstrapAsOwner ? { adminBootstrap: true } : {}),
    });
  } catch (err) {
    next(err);
  }
});

// ── Login ──

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "FORBIDDEN", message: "Account disabled" });
      return;
    }

    const valid = await verifyPassword(user.passwordHash, body.password);
    if (!valid) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid email or password" });
      return;
    }

    const sessionToken = generateSessionToken();
    const tokenHash = await hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt,
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role, sessionId: user.id });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, sessionId: user.id });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth",
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        imageUrl: user.imageUrl,
        emailVerified: user.emailVerified,
        hasPassword: true,
      },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

// ── Logout ──

router.post("/logout", async (req, res, next) => {
  try {
    res.clearCookie("refresh_token", { path: "/api/v1/auth" });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

// ── Refresh ──

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = extractRefreshTokenFromReq(req);
    if (!refreshToken) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Missing refresh token" });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (payload.type !== "refresh") {
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

    const accessToken = signAccessToken({ sub: user.id, role: user.role, sessionId: user.id });

    res.json({ accessToken });
  } catch (err) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Refresh token expired" });
      return;
    }
    next(err);
  }
});

// ── Me ──

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const [row] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
    })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }

    const { passwordHash: _ph, ...user } = row;
    res.json({ user: { ...user, hasPassword: _ph != null && _ph.length > 0 } });
  } catch (err) {
    next(err);
  }
});

// ── Google OAuth ──

const googleAuthQuerySchema = z.object({
  redirect: z.string().optional().default("/"),
  /** sign-in vs sign-up - same OAuth flow (find or create); used for analytics/state. */
  mode: z.enum(["sign-in", "sign-up"]).optional().default("sign-in"),
});

router.get("/google", (req, res, next) => {
  try {
    const { redirect, mode } = googleAuthQuerySchema.parse(req.query);

    if (!env.GOOGLE_CLIENT_ID) {
      res.status(503).json({ error: "SERVICE_UNAVAILABLE", message: "Google OAuth not configured" });
      return;
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      state: Buffer.from(JSON.stringify({ redirect, mode })).toString("base64url"),
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    next(err);
  }
});

const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const { code, state } = googleCallbackSchema.parse(req.query);

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      res.status(503).json({ error: "SERVICE_UNAVAILABLE", message: "Google OAuth not configured" });
      return;
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      res.status(502).json({ error: "UPSTREAM_ERROR", message: "Failed to exchange Google code" });
      return;
    }

    const tokens = await tokenRes.json();

    // Fetch user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      res.status(502).json({ error: "UPSTREAM_ERROR", message: "Failed to fetch Google user info" });
      return;
    }

    const googleUser = await userRes.json();

    // Find or create user (same handler for “sign in” and “sign up” - OAuth is account linking + creation)
    let [user] = await db.select().from(oauthAccounts)
      .innerJoin(users, eq(oauthAccounts.userId, users.id))
      .where(eq(oauthAccounts.providerAccountId, String(googleUser.sub)))
      .limit(1);

    let userId = user?.users?.id;
    let createdNewGoogleUser = false;
    let oauthAdminBootstrap = false;

    if (!userId) {
      // Check if email already has an account (link)
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
      if (existingByEmail) {
        userId = existingByEmail.id;
        await db.insert(oauthAccounts).values({
          userId,
          provider: "google",
          providerAccountId: String(googleUser.sub),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        });
      } else {
        const bootstrapAsOwner = !(await hasOwnerOrAdmin());
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            name: googleUser.name ?? "",
            imageUrl: googleUser.picture,
            emailVerified: googleUser.email_verified ?? false,
            ...(bootstrapAsOwner ? { role: "owner" } : {}),
          })
          .returning();
        userId = newUser.id;
        createdNewGoogleUser = true;
        oauthAdminBootstrap = bootstrapAsOwner;
        await db.insert(oauthAccounts).values({
          userId,
          provider: "google",
          providerAccountId: String(googleUser.sub),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        });
      }
    }

    // Load user for response
    const [fullUser] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
    if (!fullUser) {
      res.status(500).json({ error: "INTERNAL" });
      return;
    }

    // Create session
    const sessionToken = generateSessionToken();
    const tokenHash = await hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: fullUser.id,
      tokenHash,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt,
    });

    const accessToken = signAccessToken({ sub: fullUser.id, role: fullUser.role, sessionId: fullUser.id });
    const refreshToken = signRefreshToken({ sub: fullUser.id, role: fullUser.role, sessionId: fullUser.id });

    // Decode state (redirect path + sign-in vs sign-up intent)
    let redirectUrl = "/";
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString()) as { redirect?: string; mode?: string };
      redirectUrl = stateData.redirect || "/";
    } catch {
      // fallback to /
    }

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth",
    });

    const redirectUri = buildSpaOAuthRedirect(redirectUrl, accessToken, {
      newGoogleAccount: createdNewGoogleUser,
      adminBootstrap: oauthAdminBootstrap,
    });
    res.redirect(redirectUri);
  } catch (err) {
    next(err);
  }
});

export default router;
