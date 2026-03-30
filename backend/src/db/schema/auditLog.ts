import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(), // product.update, order.refund, etc.
    entityType: text("entity_type").notNull(), // product, order, user
    entityId: uuid("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_actor").on(table.actorId),
    index("idx_audit_entity").on(table.entityType, table.entityId),
    index("idx_audit_created").on(table.createdAt),
  ],
);
