import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { coupons } from "../../db/schema/order.js";
import { requireAuth } from "../../middleware/auth.js";
import { mayAccessStaffCapability } from "../../lib/storeOwnerAccess.js";

const router = Router();

const PROMOTION_ROLES = new Set(["admin", "manager"]);

function requireStaff(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, PROMOTION_ROLES)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Staff access required" });
    return;
  }
  next();
}

const createCouponSchema = z.object({
  code: z.string().min(2).max(36).transform((s) => s.toUpperCase()),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().positive(),
  minOrderCents: z.number().int().min(0).optional().default(0),
  maxUses: z.number().int().min(1).optional().nullable(),
  freeShipping: z.boolean().optional().default(false),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

router.post("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const body = createCouponSchema.parse(req.body);

    const [dup] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, body.code)).limit(1);
    if (dup) {
      res.status(409).json({ error: "CONFLICT", message: "Coupon code already exists" });
      return;
    }

    await db.insert(coupons).values({
      code: body.code,
      type: body.type,
      value: body.value,
      minOrderCents: body.minOrderCents,
      maxUses: body.maxUses ?? null,
      freeShipping: body.freeShipping,
      startsAt: body.startsAt ?? null,
      expiresAt: body.expiresAt ?? null,
      isActive: body.isActive,
    });

    res.status(201).json({ coupon: { code: body.code } });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    res.json({ coupons: rows });
  } catch (err) {
    next(err);
  }
});

/** Public: validate coupon for checkout UI */
router.get("/validate/:code", async (req, res, next) => {
  try {
    const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code)?.toUpperCase() ?? "";
    if (!code) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Missing code" });
      return;
    }

    const [row] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!row || !row.isActive) {
      res.json({ valid: false });
      return;
    }

    const now = new Date();
    if (row.startsAt && row.startsAt > now) {
      res.json({ valid: false, reason: "not_started" });
      return;
    }
    if (row.expiresAt && row.expiresAt < now) {
      res.json({ valid: false, reason: "expired" });
      return;
    }
    if (row.maxUses != null && row.usedCount >= row.maxUses) {
      res.json({ valid: false, reason: "max_uses" });
      return;
    }

    res.json({
      valid: true,
      type: row.type,
      value: row.value,
      minOrderCents: row.minOrderCents,
      freeShipping: row.freeShipping,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
