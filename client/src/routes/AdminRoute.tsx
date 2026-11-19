import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export default function AdminRoute() {
  const { user } = useAuth();
  return user?.role === Role.ADMIN ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
