/** Client-side role checks; owner bypasses most gates (see backend). */

const STORE_OWNER = "owner";

function mayStaff(role, allowedSet) {
  return typeof role === "string" && (role === STORE_OWNER || allowedSet.has(role));
}

const ADMIN_ONLY = new Set(["admin"]);
const CUSTOMER_LOOKUP = new Set(["admin", "manager", "support"]);
const PROMOTIONS = new Set(["admin", "manager"]);
const ANALYTICS = new Set(["admin", "manager", "analyst"]);

const CATALOG_ADMIN = new Set(["admin"]);

const STORE_SETTINGS = new Set(["admin", "manager"]);

const ORDER_VIEW = new Set(["admin", "manager", "fulfillment", "support", "analyst"]);
const ORDER_FULFILL = new Set(["admin", "manager", "fulfillment", "support"]);
const ORDER_REFUND = new Set(["admin", "manager", "support"]);

const STAFF_PORTAL_ROLES = new Set(["fulfillment", "content_editor"]);
const DASHBOARD_ROLES = new Set([STORE_OWNER, ...ADMIN_ONLY, ...CUSTOMER_LOOKUP, ...ANALYTICS, ...STAFF_PORTAL_ROLES]);

export function hasStaffDashboardAccess(role) {
  return typeof role === "string" && DASHBOARD_ROLES.has(role);
}

export function canStaffAdmin(role) {
  return mayStaff(role, ADMIN_ONLY);
}

export function canLookupCustomers(role) {
  return mayStaff(role, CUSTOMER_LOOKUP);
}

export function canManagePromotions(role) {
  return mayStaff(role, PROMOTIONS);
}

export function canViewAnalytics(role) {
  return mayStaff(role, ANALYTICS);
}

export function canManageCatalog(role) {
  return mayStaff(role, CATALOG_ADMIN);
}

export function canManageStoreSettings(role) {
  return mayStaff(role, STORE_SETTINGS);
}

export function canViewOrders(role) {
  return mayStaff(role, ORDER_VIEW);
}

export function canManageOrderFulfillment(role) {
  return mayStaff(role, ORDER_FULFILL);
}

export function canRefundOrders(role) {
  return mayStaff(role, ORDER_REFUND);
}

export function getAdminTabsForRole(role) {
  const tabs = [];
  if (canStaffAdmin(role)) tabs.push({ id: "staff", label: "Staff" });
  if (canManageCatalog(role)) tabs.push({ id: "catalog", label: "Catalog" });
  if (canManageStoreSettings(role)) tabs.push({ id: "store", label: "Store" });
  if (canLookupCustomers(role)) tabs.push({ id: "customers", label: "Customers" });
  if (canViewOrders(role)) tabs.push({ id: "orders", label: "Orders" });
  if (canManagePromotions(role)) tabs.push({ id: "promotions", label: "Promotions" });
  if (canViewAnalytics(role)) tabs.push({ id: "analytics", label: "Analytics" });
  if (tabs.length === 0 && hasStaffDashboardAccess(role)) {
    tabs.push({ id: "workspace", label: "Overview" });
  }
  return tabs;
}
