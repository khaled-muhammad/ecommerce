import { pgTable, integer, jsonb, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** Singleton row id = 1 */
export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  social: jsonb("social")
    .$type<Record<string, string | undefined>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  codEnabled: boolean("cod_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactInquiries = pgTable("contact_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
