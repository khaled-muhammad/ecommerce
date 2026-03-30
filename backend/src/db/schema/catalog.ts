import { pgTable, text, integer, boolean, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./user.js";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    image: text("image"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_categories_slug").on(table.slug)],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    website: text("website"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_brands_slug").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    brandId: uuid("brand_id")
      .references(() => brands.id),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    specs: jsonb("specs").$type<Record<string, string>>(),
    stock: integer("stock").notNull().default(0),
    image: text("image"),
    images: jsonb("images").$type<string[]>().default([]),
    badge: text("badge"),
    featuredRank: integer("featured_rank").default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_products_slug").on(table.slug),
    index("idx_products_category").on(table.categoryId),
    index("idx_products_brand").on(table.brandId),
    index("idx_products_featured").on(table.featuredRank),
    index("idx_products_active").on(table.isActive),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull(), // guest session or user session
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_cart_session").on(table.sessionId),
    index("idx_cart_user").on(table.userId),
  ],
);
