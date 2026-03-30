import { pgTable, text, integer, boolean, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./user.js";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"), // pending, paid, processing, shipped, delivered, cancelled, refunded
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    address1: text("address_1").notNull(),
    address2: text("address_2"),
    city: text("city").notNull(),
    postal: text("postal").notNull(),
    country: text("country").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    couponId: uuid("coupon_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_orders_user").on(table.userId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_number").on(table.orderNumber),
    index("idx_orders_created").on(table.createdAt),
  ],
);

export const orderLines = pgTable(
  "order_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    productName: text("product_name").notNull(), // snapshot
    productBrand: text("product_brand"),
    priceCents: integer("price_cents").notNull(), // snapshot
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [index("idx_ol_order").on(table.orderId)],
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    type: text("type").notNull(), // percentage, fixed
    value: integer("value").notNull(), // percentage points or cents
    minOrderCents: integer("min_order_cents").default(0),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    freeShipping: boolean("free_shipping").notNull().default(false),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_coupons_code").on(table.code)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(), // order.created, page.view, product.view
    data: jsonb("data").$type<Record<string, unknown>>(),
    userId: uuid("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_analytics_type").on(table.type),
    index("idx_analytics_created").on(table.createdAt),
  ],
);
