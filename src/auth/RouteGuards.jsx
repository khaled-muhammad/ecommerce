import { Navigate, useLocation } from "react-router-dom";
import { hasStaffDashboardAccess } from "../lib/staffCapabilities.js";
import { useAuth } from "./useAuth.js";

/** Redirect signed-in users away (e.g. sign-in / register). */
export function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
}

/** Require a signed-in user; optional `redirectTo` for post-login return. */
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }
  return children;
}

/**
 * Staff hub: must be signed in and not a plain customer (mirrors hasStaffDashboardAccess).
 */
export function RequireStaffDashboard({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }
  if (!hasStaffDashboardAccess(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
