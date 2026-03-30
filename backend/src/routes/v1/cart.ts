import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { cartItems, products } from "../../db/schema/catalog.js";
import { requireAuth, optionalAuth } from "../../middleware/auth.js";

const router = Router();

// ── Helpers ──

function getCartSessionId(req: { headers: Record<string, unknown>; cookies: Record<string, string> }): string {
  const fromHeader = req.headers["x-cart-session"];
  if (typeof fromHeader === "string" && fromHeader) return fromHeader;
  const fromCookie = req.cookies?.cart_session;
  if (typeof fromCookie === "string" && fromCookie) return fromCookie;
  // Generate one if not present — caller should persist it
  return randomUUID();
}

// ── List cart ──

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const sessionId = getCartSessionId(req);
    const userId = req.user?.id ? String(req.user.id) : null;

    const conditions = userId
      ? [eq(cartItems.userId, userId)]
      : [eq(cartItems.sessionId, sessionId)];

    const items = await db
      .select()
      .from(cartItems)
      .where(and(...conditions))
      .innerJoin(products, eq(cartItems.productId, products.id));

    const lines = items.map((row) => ({
      id: row.cart_items.id,
      productId: row.products.id,
      slug: row.products.slug,
      name: row.products.name,
      brand: row.products.brandId, // will be joined in future
      priceCents: row.products.priceCents,
      image: row.products.image,
      quantity: row.cart_items.quantity,
      stock: row.products.stock,
      lineTotalCents: row.products.priceCents * row.cart_items.quantity,
    }));

    const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

    res.json({ items: lines, subtotalCents, sessionId });
  } catch (err) {
    next(err);
  }
});

// ── Add to cart ──

const addLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).optional().default(1),
});

router.post("/add", optionalAuth, async (req, res, next) => {
  try {
    const body = addLineSchema.parse(req.body);
    const sessionId = getCartSessionId(req);
    const userId = req.user?.id ? String(req.user.id) : null;

    // Verify product exists and is active
    const [product] = await db.select({ id: products.id, stock: products.stock, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, body.productId))
      .limit(1);

    if (!product || !product.isActive) {
      (res as { status: (c: number) => void }).status(404);
      (res as { json: (d: unknown) => void }).json({ error: "NOT_FOUND", message: "Product not found" });
      return;
    }
    if (product.stock < 1) {
      (res as { status: (c: number) => void }).status(422);
      (res as { json: (d: unknown) => void }).json({ error: "OUT_OF_STOCK", message: "Product is out of stock" });
      return;
    }

    // Check for existing line
    const existingConditions = userId
      ? [eq(cartItems.userId, userId), eq(cartItems.productId, body.productId)]
      : [eq(cartItems.sessionId, sessionId), eq(cartItems.productId, body.productId)];

    const [existing] = await db.select().from(cartItems).where(and(...existingConditions)).limit(1);

    if (existing) {
      const newQty = Math.min(existing.quantity + body.quantity, product.stock);
      await db.update(cartItems)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id));
    } else {
      const qty = Math.min(body.quantity, product.stock);
      await db.insert(cartItems).values({
        sessionId,
        userId,
        productId: body.productId,
        quantity: qty,
      });
    }

    res.json({ message: "Added to cart", sessionId });
  } catch (err) {
    next(err);
  }
});

// ── Update quantity ──

const updateLineSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

router.patch("/:lineId", optionalAuth, async (req, res, next) => {
  try {
    const lineId = Array.isArray(req.params.lineId) ? req.params.lineId[0] : req.params.lineId;
    const body = updateLineSchema.parse(req.body);
    const sessionId = getCartSessionId(req);
    const userId = req.user?.id ? String(req.user.id) : null;

    const conditions = userId
      ? [eq(cartItems.id, lineId), eq(cartItems.userId, userId)]
      : [eq(cartItems.id, lineId), eq(cartItems.sessionId, sessionId)];

    const [existing] = await db.select().from(cartItems).where(and(...conditions)).limit(1);
    if (!existing) {
      (res as { status: (c: number) => void }).status(404);
      (res as { json: (d: unknown) => void }).json({ error: "NOT_FOUND" });
      return;
    }

    if (body.quantity === 0) {
      await db.delete(cartItems).where(eq(cartItems.id, lineId));
      res.json({ message: "Removed from cart" });
      return;
    }

    // Clamp to stock
    const [product] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, existing.productId)).limit(1);
    const qty = Math.min(body.quantity, product?.stock ?? body.quantity);

    await db.update(cartItems).set({ quantity: qty, updatedAt: new Date() }).where(eq(cartItems.id, lineId));
    res.json({ message: "Updated", quantity: qty });
  } catch (err) {
    next(err);
  }
});

// ── Remove line ──

router.delete("/:lineId", optionalAuth, async (req, res, next) => {
  try {
    const lineId = Array.isArray(req.params.lineId) ? req.params.lineId[0] : req.params.lineId;
    const sessionId = getCartSessionId(req);
    const userId = req.user?.id ? String(req.user.id) : null;

    const conditions = userId
      ? [eq(cartItems.id, lineId), eq(cartItems.userId, userId)]
      : [eq(cartItems.id, lineId), eq(cartItems.sessionId, sessionId)];

    await db.delete(cartItems).where(and(...conditions));
    res.json({ message: "Removed" });
  } catch (err) {
    next(err);
  }
});

// ── Merge guest cart into user cart (called on login) ──

router.post("/merge", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      (res as { status: (c: number) => void }).status(401);
      (res as { json: (d: unknown) => void }).json({ error: "UNAUTHORIZED" });
      return;
    }
    const sessionId = getCartSessionId(req);

    // Find guest cart items
    const guestItems = await db.select().from(cartItems)
      .where(eq(cartItems.sessionId, sessionId));

    if (guestItems.length === 0) {
      res.json({ message: "Nothing to merge", merged: 0 });
      return;
    }

    let merged = 0;
    for (const guest of guestItems) {
      // Check for existing user line for same product
      const [existing] = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, req.user.id), eq(cartItems.productId, guest.productId)))
        .limit(1);

      if (existing) {
        const [product] = await db.select({ stock: products.stock }).from(products)
          .where(eq(products.id, guest.productId)).limit(1);
        const newQty = Math.min(existing.quantity + guest.quantity, product?.stock ?? existing.quantity + guest.quantity);
        await db.update(cartItems).set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(cartItems.id, existing.id));
      } else {
        await db.insert(cartItems).values({
          sessionId: "", // clear session association
          userId: req.user.id,
          productId: guest.productId,
          quantity: guest.quantity,
        });
      }
      merged++;
    }

    // Delete old guest session items
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));

    res.json({ message: "Cart merged", merged });
  } catch (err) {
    next(err);
  }
});

export default router;
