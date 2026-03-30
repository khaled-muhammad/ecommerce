export const STORE_OWNER_ROLE = "owner" as const;

export function isStoreOwner(role: string | undefined): boolean {
  return role === STORE_OWNER_ROLE;
}

/**
 * Store owner may use any staff-facing capability in this API.
 * Other users must appear in `allowedRoles`.
 */
export function mayAccessStaffCapability(role: string | undefined, allowedRoles: ReadonlySet<string>): boolean {
  if (typeof role !== "string") return false;
  if (isStoreOwner(role)) return true;
  return allowedRoles.has(role);
}
