import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import LunchDiningRoundedIcon from "@mui/icons-material/LunchDiningRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { ReactNode } from "react";
import { Role } from "../types";

export interface DashboardNavItem {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
}

const STAFF_ROLES = [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER];
const BILLING_ROLES = [Role.ADMIN, Role.MANAGER, Role.CASHIER];

export function getDashboardNavItems(role?: Role): DashboardNavItem[] {
  return [
    { label: "Home", to: "/dashboard", icon: <DashboardRoundedIcon />, end: true },
    { label: "Menu", to: "/menu", icon: <LunchDiningRoundedIcon /> },
    ...(role && STAFF_ROLES.includes(role)
      ? [{ label: "Orders", to: "/orders", icon: <ReceiptLongRoundedIcon /> }]
      : []),
    ...(role && BILLING_ROLES.includes(role)
      ? [{ label: "Billing", to: "/billing", icon: <PointOfSaleRoundedIcon /> }]
      : []),
    ...(role === Role.ADMIN || role === Role.MANAGER
      ? [
          { label: "Inventory", to: "/inventory", icon: <InventoryRoundedIcon /> },
          { label: "Analytics", to: "/analytics", icon: <BarChartRoundedIcon /> },
        ]
      : []),
    ...(role === Role.ADMIN
      ? [{ label: "Employees", to: "/employees", icon: <PeopleAltRoundedIcon /> }]
      : []),
  ];
}
