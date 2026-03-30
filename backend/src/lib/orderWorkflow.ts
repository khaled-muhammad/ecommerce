/** Aligns with orders.status in schema (order.ts). */
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TERMINAL: ReadonlySet<OrderStatus> = new Set(["cancelled", "refunded"]);

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["cancelled"],
  paid: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (TERMINAL.has(from)) return false;
  return TRANSITIONS[from].includes(to);
}

/** Restock when cancelling after payment captured (inventory was decremented on paid). */
export function shouldRestockOnCancel(from: OrderStatus): boolean {
  return from === "paid" || from === "processing" || from === "shipped";
}

/** Restock on refund only if goods were never marked shipped/delivered. */
export function shouldRestockOnRefund(from: OrderStatus): boolean {
  return from === "paid" || from === "processing";
}

export function allowedNextStatuses(from: OrderStatus): OrderStatus[] {
  if (TERMINAL.has(from)) return [];
  return [...TRANSITIONS[from]];
}
