import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders, orderLines, analyticsEvents } from "../../db/schema/order.js";
import { requireAuth } from "../../middleware/auth.js";
import { mayAccessStaffCapability } from "../../lib/storeOwnerAccess.js";

const router = Router();

const ANALYTICS_ROLES = new Set(["admin", "manager", "analyst"]);

function requireAnalytics(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, ANALYTICS_ROLES)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Analytics access required" });
    return;
  }
  next();
}

const ingestSchema = z.object({
  type: z.enum(["order.created", "page.view", "product.view"]),
  data: z.record(z.unknown()).optional(),
});

router.post("/events", requireAuth, requireAnalytics, async (req, res, next) => {
  try {
    const body = ingestSchema.parse(req.body);
    await db.insert(analyticsEvents).values({
      type: body.type,
      data: body.data ?? null,
      userId: req.user!.id,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/summary", requireAuth, requireAnalytics, async (_req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [paidAgg] = await db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      })
      .from(orders)
      .where(and(eq(orders.status, "paid"), gte(orders.createdAt, since)));

    const topLines = await db
      .select({
        productId: orderLines.productId,
        productName: orderLines.productName,
        units: sql<number>`sum(${orderLines.quantity})::int`,
        revenueCents: sql<number>`sum(${orderLines.lineTotalCents})::int`,
      })
      .from(orderLines)
      .innerJoin(orders, eq(orderLines.orderId, orders.id))
      .where(and(eq(orders.status, "paid"), gte(orders.createdAt, since)))
      .groupBy(orderLines.productId, orderLines.productName)
      .orderBy(desc(sql<number>`sum(${orderLines.lineTotalCents})`))
      .limit(10);

    res.json({
      periodDays: 30,
      paidOrders: Number(paidAgg?.orderCount ?? 0),
      revenueCents: Number(paidAgg?.revenueCents ?? 0),
      topProducts: topLines.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        units: Number(r.units),
        revenueCents: Number(r.revenueCents),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
