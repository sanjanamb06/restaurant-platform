import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

/** Grants access to MANAGER and ADMIN roles only. */
const ALLOWED_ROLES = [Role.MANAGER, Role.ADMIN];

export default function ManagerRoute() {
  const { user } = useAuth();
  return user && ALLOWED_ROLES.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
