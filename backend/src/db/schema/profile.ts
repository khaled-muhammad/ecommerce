import { pgTable, text, integer, boolean, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./user.js";
import { products } from "./catalog.js";

export const userAddresses = pgTable(
  "user_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Home"),
    fullName: text("full_name").notNull(),
    line1: text("line_1").notNull(),
    line2: text("line_2"),
    city: text("city").notNull(),
    postal: text("postal").notNull(),
    country: text("country").notNull().default("US"),
    phone: text("phone"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_addresses_user").on(table.userId),
  ],
);

/** Demo saved cards - display only; not tokenized with Stripe in this flow */
export const userPaymentMethods = pgTable(
  "user_payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Card"),
    brand: text("brand").notNull(),
    last4: text("last4").notNull(),
    expMonth: integer("exp_month").notNull(),
    expYear: integer("exp_year").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_payment_methods_user").on(table.userId),
  ],
);

export const userFavorites = pgTable(
  "user_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_favorites_user").on(table.userId),
    uniqueIndex("user_favorites_user_product_uidx").on(table.userId, table.productId),
  ],
);
