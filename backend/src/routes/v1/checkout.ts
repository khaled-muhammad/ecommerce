import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { cartItems, products } from "../../db/schema/catalog.js";
import { orders, orderLines } from "../../db/schema/order.js";
import { requireAuth } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const router = Router();

function stripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

async function createStripeCheckoutSession(params: {
  orderNumber: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  metadata: Record<string, string>;
}) {
  const stripe = stripeClient();
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: params.lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: params.metadata,
  });
}

// ── Order number generator ──

function generateOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RX-${t}-${r}`;
}

// ── Create checkout ──

const checkoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  postal: z.string().min(1),
  country: z.string().min(1),
  couponCode: z.string().optional(),
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const body = checkoutSchema.parse(req.body);

    // Fetch cart
    const items = await db.select()
      .from(cartItems)
      .where(eq(cartItems.userId, req.user.id))
      .innerJoin(products, eq(cartItems.productId, products.id));

    if (items.length === 0) {
      res.status(422).json({ error: "EMPTY_CART", message: "Cart is empty" });
      return;
    }

    // Verify all items are in stock
    for (const item of items) {
      if (!item.products.isActive || item.products.stock < item.cart_items.quantity) {
        res.status(422).json({
          error: "STOCK_ERROR",
          message: `"${item.products.name}" is out of stock or has insufficient quantity`,
        });
        return;
      }
    }

    // Calculate totals
    const subtotalCents = items.reduce(
      (sum, item) => sum + item.products.priceCents * item.cart_items.quantity,
      0,
    );
    const shippingCents = subtotalCents > 50000 ? 0 : 999; // free shipping over $500
    const taxCents = Math.round(subtotalCents * 0.08); // demo 8% flat tax
    const totalCents = subtotalCents + shippingCents + taxCents;

    // Create order
    const orderNumber = generateOrderNumber();
    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: req.user.id,
      email: body.email,
      fullName: body.fullName,
      address1: body.address1,
      address2: body.address2 ?? null,
      city: body.city,
      postal: body.postal,
      country: body.country,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      status: "pending",
    }).returning();

    // Create order lines (snapshot product data)
    for (const item of items) {
      await db.insert(orderLines).values({
        orderId: order.id,
        productId: item.products.id,
        productName: item.products.name,
        productBrand: null,
        priceCents: item.products.priceCents,
        quantity: item.cart_items.quantity,
        lineTotalCents: item.products.priceCents * item.cart_items.quantity,
      });
    }

    // Create Stripe checkout session
    let stripeSession: Stripe.Response<Stripe.Checkout.Session>;
    try {
      const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.products.name },
          unit_amount: item.products.priceCents,
        },
        quantity: item.cart_items.quantity,
      }));

      stripeSession = await createStripeCheckoutSession({
        orderNumber,
        lineItems: stripeLineItems,
        successUrl: `${env.FRONTEND_URL}/checkout/complete?order=${encodeURIComponent(orderNumber)}`,
        cancelUrl: `${env.FRONTEND_URL}/cart`,
        customerEmail: body.email,
        metadata: { orderId: String(order.id), orderNumber },
      });
    } catch (stripeErr) {
      logger.error({ err: stripeErr, orderId: order.id }, "Stripe checkout session creation failed");
      res.status(502).json({ error: "PAYMENT_ERROR", message: "Could not create payment session" });
      return;
    }

    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
      },
      checkoutUrl: stripeSession.url,
    });
  } catch (err) {
    next(err);
  }
});

// ── Stripe webhook (mounted in app.ts with express.raw body) ──

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers["stripe-signature"];
    if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Missing signature or webhook secret" });
      return;
    }

    if (!Buffer.isBuffer(req.body)) {
      logger.error("Stripe webhook received non-raw body; ensure express.raw is mounted on this path");
      res.status(500).json({ error: "SERVER_MISCONFIG" });
      return;
    }

    if (!env.STRIPE_SECRET_KEY) {
      res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });
      return;
    }

    const stripe = stripeClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "INVALID_SIGNATURE" });
      return;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const orderNumber = session.metadata?.orderNumber;

        if (!orderId) {
          logger.warn({ event: event.type }, "Webhook missing orderId metadata");
          break;
        }

        await db.update(orders)
          .set({
            status: "paid",
            stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Decrement stock
        const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId));
        for (const line of lines) {
          await db.update(products)
            .set({ stock: sql`${products.stock} - ${line.quantity}`, updatedAt: new Date() })
            .where(eq(products.id, line.productId));
        }

        // Clear user's cart
        const [orderRow] = await db.select({ userId: orders.userId }).from(orders).where(eq(orders.id, orderId)).limit(1);
        if (orderRow?.userId) {
          await db.delete(cartItems).where(eq(cartItems.userId, orderRow.userId));
        }

        logger.info({ orderId, orderNumber, event: event.type }, "Order paid");
        break;
      }
      default:
        logger.info({ event: event.type }, "Unhandled Stripe event");
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

// ── Order history (buyer) ──

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [userOrders, countResult] = await Promise.all([
      db.select().from(orders)
        .where(eq(orders.userId, req.user.id))
        .orderBy(sql`${orders.createdAt} desc`)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, req.user.id)),
    ]);

    res.json({
      orders: userOrders,
      pagination: {
        page,
        limit,
        total: Number(countResult[0].count),
        totalPages: Math.ceil(Number(countResult[0].count) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Single order detail ──

router.get("/:orderNumber", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const orderNumber = Array.isArray(req.params.orderNumber) ? req.params.orderNumber[0] : req.params.orderNumber;

    const [order] = await db.select().from(orders)
      .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, req.user.id)))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "NOT_FOUND", message: "Order not found" });
      return;
    }

    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id));

    res.json({ order, lines });
  } catch (err) {
    next(err);
  }
});

export default router;
