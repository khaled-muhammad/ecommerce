import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, sessions, oauthAccounts } from "../../db/schema/user.js";
import { cartItems } from "../../db/schema/catalog.js";
import { orders } from "../../db/schema/order.js";
import { userAddresses, userPaymentMethods } from "../../db/schema/profile.js";
import { requireAuth } from "../../middleware/auth.js";
import { hashPassword, verifyPassword } from "../../services/auth.js";

const router = Router();

const patchProfileSchema = z.object({
  name: z.string().min(0).max(200).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const deleteAccountSchema = z.object({
  currentPassword: z.string().optional(),
  confirmEmail: z.string().email().optional(),
});

const addressSchema = z.object({
  label: z.string().min(1).max(80).optional().default("Home"),
  fullName: z.string().min(1).max(200),
  line1: z.string().min(1).max(300),
  line2: z.string().max(300).optional(),
  city: z.string().min(1).max(120),
  postal: z.string().min(1).max(32),
  country: z.string().min(1).max(80).default("US"),
  phone: z.string().max(40).optional(),
  isDefault: z.boolean().optional().default(false),
});

const paymentMethodSchema = z.object({
  label: z.string().min(1).max(80).optional().default("Card"),
  brand: z.string().min(1).max(40),
  last4: z.string().regex(/^\d{4}$/),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000).max(2100),
  isDefault: z.boolean().optional().default(false),
});

// ── Profile (name) ──

router.patch("/", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const body = patchProfileSchema.parse(req.body);
    if (body.name === undefined) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
      return;
    }

    await db.update(users)
      .set({ name: body.name, updatedAt: new Date() })
      .where(eq(users.id, req.user.id));

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

// ── Password ──

router.post("/password", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const body = passwordSchema.parse(req.body);

    const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!row?.passwordHash) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Password sign-in is not enabled for this account" });
      return;
    }

    const ok = await verifyPassword(row.passwordHash, body.currentPassword);
    if (!ok) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Current password is incorrect" });
      return;
    }

    const passwordHash = await hashPassword(body.newPassword);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, req.user.id));

    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
});

// ── Addresses ──

router.get("/addresses", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const rows = await db.select().from(userAddresses).where(eq(userAddresses.userId, req.user.id));
    res.json({ addresses: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/addresses", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const body = addressSchema.parse(req.body);

    if (body.isDefault) {
      await db.update(userAddresses).set({ isDefault: false, updatedAt: new Date() }).where(eq(userAddresses.userId, req.user.id));
    }

    const [created] = await db.insert(userAddresses).values({
      userId: req.user.id,
      label: body.label,
      fullName: body.fullName,
      line1: body.line1,
      line2: body.line2 ?? null,
      city: body.city,
      postal: body.postal,
      country: body.country,
      phone: body.phone ?? null,
      isDefault: body.isDefault,
    }).returning();

    res.status(201).json({ address: created });
  } catch (err) {
    next(err);
  }
});

router.patch("/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const id = req.params.id;
    if (typeof id !== "string" || !id) {
      res.status(400).json({ error: "BAD_REQUEST" });
      return;
    }

    const partial = addressSchema.partial().parse(req.body);
    if (Object.keys(partial).length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
      return;
    }

    const [existing] = await db.select().from(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, req.user.id)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }

    if (partial.isDefault === true) {
      await db.update(userAddresses).set({ isDefault: false, updatedAt: new Date() }).where(eq(userAddresses.userId, req.user.id));
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (partial.label !== undefined) update.label = partial.label;
    if (partial.fullName !== undefined) update.fullName = partial.fullName;
    if (partial.line1 !== undefined) update.line1 = partial.line1;
    if (partial.line2 !== undefined) update.line2 = partial.line2 ?? null;
    if (partial.city !== undefined) update.city = partial.city;
    if (partial.postal !== undefined) update.postal = partial.postal;
    if (partial.country !== undefined) update.country = partial.country;
    if (partial.phone !== undefined) update.phone = partial.phone ?? null;
    if (partial.isDefault !== undefined) update.isDefault = partial.isDefault;

    const [updated] = await db.update(userAddresses).set(update as typeof userAddresses.$inferInsert)
      .where(eq(userAddresses.id, id))
      .returning();

    res.json({ address: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const id = req.params.id;
    if (typeof id !== "string" || !id) {
      res.status(400).json({ error: "BAD_REQUEST" });
      return;
    }

    const deleted = await db.delete(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, req.user.id)))
      .returning({ id: userAddresses.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

// ── Payment methods (demo / display-only) ──

router.get("/payment-methods", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const rows = await db.select().from(userPaymentMethods).where(eq(userPaymentMethods.userId, req.user.id));
    res.json({ paymentMethods: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/payment-methods", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const body = paymentMethodSchema.parse(req.body);

    if (body.isDefault) {
      await db.update(userPaymentMethods).set({ isDefault: false, updatedAt: new Date() }).where(eq(userPaymentMethods.userId, req.user.id));
    }

    const [created] = await db.insert(userPaymentMethods).values({
      userId: req.user.id,
      label: body.label,
      brand: body.brand,
      last4: body.last4,
      expMonth: body.expMonth,
      expYear: body.expYear,
      isDefault: body.isDefault,
    }).returning();

    res.status(201).json({ paymentMethod: created });
  } catch (err) {
    next(err);
  }
});

router.delete("/payment-methods/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const id = req.params.id;
    if (typeof id !== "string" || !id) {
      res.status(400).json({ error: "BAD_REQUEST" });
      return;
    }

    const deleted = await db.delete(userPaymentMethods)
      .where(and(eq(userPaymentMethods.id, id), eq(userPaymentMethods.userId, req.user.id)))
      .returning({ id: userPaymentMethods.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

// ── Delete account ──

router.delete("/account", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const [row] = await db.select({ email: users.email, passwordHash: users.passwordHash }).from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }

    const body = deleteAccountSchema.parse(req.body ?? {});

    if (row.passwordHash) {
      if (!body.currentPassword) {
        res.status(400).json({ error: "BAD_REQUEST", message: "currentPassword is required" });
        return;
      }
      const ok = await verifyPassword(row.passwordHash, body.currentPassword);
      if (!ok) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Password is incorrect" });
        return;
      }
    } else {
      if (!body.confirmEmail || body.confirmEmail.toLowerCase() !== row.email.toLowerCase()) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Type your email in confirmEmail to delete this OAuth-only account" });
        return;
      }
    }

    const uid = req.user.id;

    await db.transaction(async (tx) => {
      await tx.update(orders).set({ userId: null }).where(eq(orders.userId, uid));
      await tx.delete(sessions).where(eq(sessions.userId, uid));
      await tx.delete(oauthAccounts).where(eq(oauthAccounts.userId, uid));
      await tx.delete(cartItems).where(eq(cartItems.userId, uid));
      await tx.delete(userAddresses).where(eq(userAddresses.userId, uid));
      await tx.delete(userPaymentMethods).where(eq(userPaymentMethods.userId, uid));
      await tx.delete(users).where(eq(users.id, uid));
    });

    res.clearCookie("refresh_token", { path: "/api/v1/auth" });
    res.json({ message: "Account deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
