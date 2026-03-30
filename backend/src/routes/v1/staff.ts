import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, and, asc, ilike } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, roles } from "../../db/schema/user.js";
import { orders } from "../../db/schema/order.js";
import { auditLogs } from "../../db/schema/auditLog.js";
import { requireAuth } from "../../middleware/auth.js";
import { mayAccessStaffCapability } from "../../lib/storeOwnerAccess.js";
import staffOrdersRouter from "./staffOrders.js";

const router = Router();

/** Staff management: delegated admins (store owner always allowed) */
const ADMIN_ONLY = new Set(["admin"]);
const STAFF_CUSTOMERS = new Set(["admin", "manager", "support"]);

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, ADMIN_ONLY)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Admin access required" });
    return;
  }
  next();
}

function requireCustomerLookup(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, STAFF_CUSTOMERS)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Staff access required" });
    return;
  }
  next();
}

router.get("/roles", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const allRoles = await db.select().from(roles).orderBy(asc(roles.name));
    res.json({ roles: allRoles });
  } catch (err) {
    next(err);
  }
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z
    .enum(["customer", "support", "fulfillment", "content_editor", "analyst", "manager", "admin", "owner"])
    .optional()
    .default("manager"),
});

router.post("/invite", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = inviteSchema.parse(req.body);

    const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND", message: "User must register first" });
      return;
    }

    const before = { role: existing.role };
    await db.update(users).set({ role: body.role, updatedAt: new Date() }).where(eq(users.id, existing.id));

    await db.insert(auditLogs).values({
      actorId: req.user!.id,
      action: "staff.role_update",
      entityType: "user",
      entityId: existing.id,
      before,
      after: { role: body.role },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null,
    });

    res.json({ message: "Role updated", email: existing.email, role: body.role });
  } catch (err) {
    next(err);
  }
});

const revokeSchema = z.object({
  email: z.string().email(),
});

router.post("/revoke", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = revokeSchema.parse(req.body);

    const [userRow] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!userRow) {
      res.status(404).json({ error: "NOT_FOUND", message: "User not found" });
      return;
    }

    await db.update(users).set({ role: "customer", updatedAt: new Date() }).where(eq(users.id, userRow.id));

    await db.insert(auditLogs).values({
      actorId: req.user!.id,
      action: "staff.revoke",
      entityType: "user",
      entityId: userRow.id,
      before: { role: userRow.role },
      after: { role: "customer" },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null,
    });

    res.json({ message: "Revoked to customer", email: body.email });
  } catch (err) {
    next(err);
  }
});

router.get("/customers", requireAuth, requireCustomerLookup, async (req, res, next) => {
  try {
    const q = typeof req.query.email === "string" ? req.query.email.trim() : "";
    if (!q) {
      res.json({ users: [] });
      return;
    }

    const pattern = `%${q}%`;
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(eq(users.isActive, true), ilike(users.email, pattern)))
      .orderBy(asc(users.createdAt))
      .limit(20);

    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/customers/:userId", requireAuth, requireCustomerLookup, async (req, res, next) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    const [userRow] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRow) {
      res.status(404).json({ error: "NOT_FOUND", message: "Customer not found" });
      return;
    }

    const userOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(asc(orders.createdAt))
      .limit(50);

    res.json({ user: userRow, orders: userOrders });
  } catch (err) {
    next(err);
  }
});

router.use(staffOrdersRouter);

export default router;
