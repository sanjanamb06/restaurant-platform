import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import OrderEntryPage from "../customer/pages/OrderEntryPage";
import ChangePassword from "../pages/ChangePassword";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import RegisterRestaurant from "../pages/RegisterRestaurant";
import RegistrationSuccess from "../pages/RegistrationSuccess";
import CashierDashboardPage from "../pages/billing/CashierDashboardPage";
import EmployeeList from "../pages/employees/EmployeeList";
import InventoryDashboardPage from "../pages/inventory/InventoryDashboardPage";
import AnalyticsDashboardPage from "../pages/analytics/AnalyticsDashboardPage";
import IngredientsPage from "../pages/menu/IngredientsPage";
import MenuPage from "../pages/menu/MenuPage";
import OrdersPage from "../pages/orders/OrdersPage";
import AdminRoute from "./AdminRoute";
import CashierRoute from "./CashierRoute";
import ManagerRoute from "./ManagerRoute";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterRestaurant />} />
      <Route path="/registration-success" element={<RegistrationSuccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/order/:restaurantId" element={<OrderEntryPage />} />

      <Route element={<ProtectedRoute passwordChangePage />}>
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route element={<CashierRoute />}>
            <Route path="/billing" element={<CashierDashboardPage />} />
          </Route>
          <Route element={<ManagerRoute />}>
            <Route path="/inventory" element={<InventoryDashboardPage />} />
            <Route path="/analytics" element={<AnalyticsDashboardPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/employees" element={<EmployeeList />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

