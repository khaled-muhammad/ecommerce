import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, and, or, ilike, desc, sql, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders, orderLines } from "../../db/schema/order.js";
import { products } from "../../db/schema/catalog.js";
import { auditLogs } from "../../db/schema/auditLog.js";
import { requireAuth } from "../../middleware/auth.js";
import { mayAccessStaffCapability } from "../../lib/storeOwnerAccess.js";
import {
  allowedNextStatuses,
  canTransition,
  isOrderStatus,
  shouldRestockOnCancel,
  shouldRestockOnRefund,
  type OrderStatus,
} from "../../lib/orderWorkflow.js";
import { getStripeOrNull } from "../../lib/stripeAdmin.js";

const router = Router();

const ORDER_VIEW = new Set(["admin", "manager", "fulfillment", "support", "analyst"]);
/** Status updates (prepare, ship, deliver, cancel): ops + support for CS-driven updates */
const ORDER_FULFILL = new Set(["admin", "manager", "fulfillment", "support"]);
const ORDER_REFUND = new Set(["admin", "manager", "support"]);

function requireOrderView(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, ORDER_VIEW)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Order access required" });
    return;
  }
  next();
}

function requireOrderRefund(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, ORDER_REFUND)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Refund access required" });
    return;
  }
  next();
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function findOrderByRef(orderRef: string) {
  const isUuid = uuidRegex.test(orderRef);
  const [row] = await db
    .select()
    .from(orders)
    .where(isUuid ? eq(orders.id, orderRef) : eq(orders.orderNumber, orderRef))
    .limit(1);
  return row ?? null;
}

router.get("/orders", requireAuth, requireOrderView, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const conditions = [];
    if (statusParam) {
      const parts = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      const valid = parts.filter(isOrderStatus) as OrderStatus[];
      if (valid.length) conditions.push(inArray(orders.status, valid));
    }
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(or(ilike(orders.orderNumber, pattern), ilike(orders.email, pattern), ilike(orders.fullName, pattern)));
    }

    const whereClause = conditions.length ? (conditions.length === 1 ? conditions[0]! : and(...conditions)) : undefined;

    const [rows, countRow] = await Promise.all([
      db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(whereClause),
    ]);

    const total = Number(countRow[0]?.count ?? 0);

    res.json({
      orders: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/orders/:orderRef", requireAuth, requireOrderView, async (req, res, next) => {
  try {
    const orderRef = Array.isArray(req.params.orderRef) ? req.params.orderRef[0]! : req.params.orderRef;
    const order = await findOrderByRef(orderRef);
    if (!order) {
      res.status(404).json({ error: "NOT_FOUND", message: "Order not found" });
      return;
    }
    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id));
    const from = order.status as OrderStatus;
    const nextStatuses = isOrderStatus(from) ? allowedNextStatuses(from) : [];
    const refundEligible =
      ["paid", "processing", "shipped", "delivered"].includes(order.status) &&
      Boolean(order.stripePaymentIntentId);
    res.json({ order, lines, allowedNextStatuses: nextStatuses, refundEligible });
  } catch (err) {
    next(err);
  }
});

const patchSchema = z
  .object({
    status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
    notes: z.string().max(4000).optional(),
  })
  .refine((b) => b.status !== undefined || b.notes !== undefined, { message: "Provide status and/or notes" });

router.patch("/orders/:orderRef", requireAuth, requireOrderView, async (req, res, next) => {
  try {
    const orderRef = Array.isArray(req.params.orderRef) ? req.params.orderRef[0]! : req.params.orderRef;
    const body = patchSchema.parse(req.body);

    const statusChange = body.status !== undefined;
    const notesChange = body.notes !== undefined;

    if (statusChange && !mayAccessStaffCapability(req.user!.role, ORDER_FULFILL)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Fulfillment role required to change status" });
      return;
    }

    const existing = await findOrderByRef(orderRef);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND", message: "Order not found" });
      return;
    }

    if (body.status === "refunded") {
      res.status(400).json({
        error: "INVALID_STATUS",
        message: "Use POST /staff/orders/:ref/refund to mark an order refunded after Stripe refund",
      });
      return;
    }

    const from = existing.status as OrderStatus;
    const to = body.status;
    if (to !== undefined) {
      if (!isOrderStatus(from)) {
        res.status(400).json({ error: "INVALID_STATE", message: "Order has unknown status" });
        return;
      }
      if (!canTransition(from, to)) {
        res.status(409).json({ error: "INVALID_TRANSITION", message: `Cannot move from ${from} to ${to}` });
        return;
      }
    }

    const nextNotes = body.notes !== undefined ? body.notes : existing.notes;
    const nextStatus = body.status !== undefined ? body.status : existing.status;

    await db.transaction(async (tx) => {
      if (to === "cancelled" && shouldRestockOnCancel(from)) {
        const lines = await tx.select().from(orderLines).where(eq(orderLines.orderId, existing.id));
        for (const line of lines) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${line.quantity}`, updatedAt: new Date() })
            .where(eq(products.id, line.productId));
        }
      }

      await tx
        .update(orders)
        .set({
          status: nextStatus,
          notes: nextNotes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existing.id));

      if (to !== undefined || notesChange) {
        await tx.insert(auditLogs).values({
          actorId: req.user!.id,
          action: "order.update",
          entityType: "order",
          entityId: existing.id,
          before: { status: existing.status, notes: existing.notes },
          after: { status: nextStatus, notes: nextNotes },
          ip: req.ip,
          userAgent: req.get("user-agent") ?? null,
        });
      }
    });

    const [updated] = await db.select().from(orders).where(eq(orders.id, existing.id)).limit(1);
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

const refundSchema = z.object({
  amountCents: z.number().int().positive().optional(),
});

router.post("/orders/:orderRef/refund", requireAuth, requireOrderRefund, async (req, res, next) => {
  try {
    const orderRef = Array.isArray(req.params.orderRef) ? req.params.orderRef[0]! : req.params.orderRef;
    const body = refundSchema.parse(req.body ?? {});

    const existing = await findOrderByRef(orderRef);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND", message: "Order not found" });
      return;
    }

    const from = existing.status as OrderStatus;
    const refundable = new Set<OrderStatus>(["paid", "processing", "shipped", "delivered"]);
    if (!refundable.has(from)) {
      res.status(409).json({ error: "NOT_REFUNDABLE", message: `Order status ${existing.status} cannot be refunded here` });
      return;
    }

    if (!existing.stripePaymentIntentId) {
      res.status(422).json({
        error: "NO_PAYMENT_INTENT",
        message: "Order has no Stripe payment on file; refund in Stripe or adjust status manually after handling payment outside Stripe",
      });
      return;
    }

    const stripe = getStripeOrNull();
    if (!stripe) {
      res.status(503).json({ error: "STRIPE_NOT_CONFIGURED", message: "STRIPE_SECRET_KEY is not set" });
      return;
    }

    if (body.amountCents != null && body.amountCents !== existing.totalCents) {
      res.status(400).json({
        error: "PARTIAL_NOT_SUPPORTED",
        message: "Only full-order refunds are supported in this API; omit amountCents to refund the full total",
      });
      return;
    }

    let refundId: string;
    try {
      const refund = await stripe.refunds.create({
        payment_intent: existing.stripePaymentIntentId,
      });
      refundId = refund.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe refund failed";
      res.status(502).json({ error: "STRIPE_REFUND_FAILED", message: msg });
      return;
    }

    await db.transaction(async (tx) => {
      if (shouldRestockOnRefund(from)) {
        const lines = await tx.select().from(orderLines).where(eq(orderLines.orderId, existing.id));
        for (const line of lines) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${line.quantity}`, updatedAt: new Date() })
            .where(eq(products.id, line.productId));
        }
      }

      await tx
        .update(orders)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(orders.id, existing.id));

      await tx.insert(auditLogs).values({
        actorId: req.user!.id,
        action: "order.refund",
        entityType: "order",
        entityId: existing.id,
        before: { status: existing.status },
        after: { status: "refunded", stripeRefundId: refundId },
        ip: req.ip,
        userAgent: req.get("user-agent") ?? null,
      });
    });

    const [updated] = await db.select().from(orders).where(eq(orders.id, existing.id)).limit(1);
    res.json({ order: updated, stripeRefundId: refundId });
  } catch (err) {
    next(err);
  }
});

export default router;
