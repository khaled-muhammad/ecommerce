import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { storeSettings, contactInquiries } from "../../db/schema/site.js";
import { requireAuth } from "../../middleware/auth.js";
import { mayAccessStaffCapability } from "../../lib/storeOwnerAccess.js";

const router = Router();

const SETTINGS_ROLES = new Set(["admin", "manager"]);

function requireStoreSettings(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, SETTINGS_ROLES)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Store settings access required" });
    return;
  }
  next();
}

const urlField = z.union([z.literal(""), z.string().trim().url().max(2048)]);

const socialPatchSchema = z.object({
  twitter: urlField.optional(),
  instagram: urlField.optional(),
  facebook: urlField.optional(),
  youtube: urlField.optional(),
  github: urlField.optional(),
  discord: urlField.optional(),
  tiktok: urlField.optional(),
  linkedin: urlField.optional(),
});

const contactPostSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(1).max(8000),
});

function compactSocial(r: Record<string, string | undefined>): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) {
    if (v != null && v !== "") o[k] = v;
  }
  return o;
}

async function ensureSettingsRow(): Promise<Record<string, string>> {
  const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (row) return compactSocial({ ...(row.social ?? {}) });
  await db.insert(storeSettings).values({ id: 1, social: {} });
  return {};
}

/** Public: social links for footer */
router.get("/config", async (_req, res, next) => {
  try {
    const social = await ensureSettingsRow();
    res.json({ social });
  } catch (err) {
    next(err);
  }
});

/** Public: contact form */
router.post("/contact", async (req, res, next) => {
  try {
    const body = contactPostSchema.parse(req.body);
    await db.insert(contactInquiries).values({
      name: body.name,
      email: body.email,
      message: body.message,
    });
    res.status(201).json({ ok: true, message: "Message received" });
  } catch (err) {
    next(err);
  }
});

/** Staff: update social links (owner, admin, manager) */
router.patch("/config", requireAuth, requireStoreSettings, async (req, res, next) => {
  try {
    const patch = socialPatchSchema.parse(req.body);
    const current = await ensureSettingsRow();
    const merged: Record<string, string | undefined> = { ...current };
    for (const [k, v] of Object.entries(patch) as [string, string | undefined][]) {
      if (v === undefined) continue;
      if (v === "") delete merged[k];
      else merged[k] = v;
    }
    const nextSocial = compactSocial(merged);
    const [existing] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    if (!existing) {
      await db.insert(storeSettings).values({ id: 1, social: nextSocial, updatedAt: new Date() });
    } else {
      await db
        .update(storeSettings)
        .set({ social: nextSocial, updatedAt: new Date() })
        .where(eq(storeSettings.id, 1));
    }
    res.json({ social: nextSocial });
  } catch (err) {
    next(err);
  }
});

/** Staff: recent contact messages */
router.get("/contact-inquiries", requireAuth, requireStoreSettings, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(50);
    res.json({ inquiries: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
