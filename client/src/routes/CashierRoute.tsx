import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

/** Grants access to CASHIER, MANAGER, and ADMIN roles. */
const ALLOWED_ROLES = [Role.CASHIER, Role.MANAGER, Role.ADMIN];

export default function CashierRoute() {
  const { user } = useAuth();
  return user && ALLOWED_ROLES.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
