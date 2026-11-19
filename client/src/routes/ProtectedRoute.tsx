import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  passwordChangePage?: boolean;
}

export default function ProtectedRoute({ passwordChangePage = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  if (user?.mustChangePassword && !passwordChangePage) {
    return <Navigate to="/change-password" replace />;
  }

  if (!user?.mustChangePassword && passwordChangePage) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
