import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  alpha,
} from "@mui/material";
import { Role } from "../../types";
import { OrderStatus } from "../../types/order";

export type FilterStatus = OrderStatus | "ALL";

interface OrderFilterBarProps {
  activeFilter: FilterStatus;
  search: string;
  role: Role;
  onFilterChange: (filter: FilterStatus) => void;
  onSearchChange: (value: string) => void;
}

const ALL_TABS: { label: string; value: FilterStatus; roles: Role[] }[] = [
  { label: "All", value: "ALL", roles: [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER] },
  { label: "Pending", value: "PENDING", roles: [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER] },
  { label: "Preparing", value: "PREPARING", roles: [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER] },
  { label: "Ready", value: "READY", roles: [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER] },
  { label: "Cancelled", value: "CANCELLED", roles: [Role.ADMIN, Role.MANAGER] },
];

export default function OrderFilterBar({
  activeFilter,
  search,
  role,
  onFilterChange,
  onSearchChange,
}: OrderFilterBarProps) {
  const visibleTabs = ALL_TABS.filter((t) => t.roles.includes(role));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { sm: "center" },
        gap: 1.5,
        px: { xs: 2, md: 3 },
        py: 1.25,
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "rgba(52,43,39,.08)",
        flexShrink: 0,
      }}
    >
      <Tabs
        value={visibleTabs.some((t) => t.value === activeFilter) ? activeFilter : "ALL"}
        onChange={(_, val) => onFilterChange(val as FilterStatus)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 40,
          flex: 1,
          "& .MuiTab-root": {
            minHeight: 40,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "text.secondary",
          },
          "& .Mui-selected": { color: "primary.main" },
          "& .MuiTabs-indicator": {
            bgcolor: "primary.main",
            height: 3,
            borderRadius: 2,
          },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} disableRipple />
        ))}
      </Tabs>

      <TextField
        size="small"
        placeholder="Search order, customer, table…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </InputAdornment>
          ),
        }}
        sx={{
          width: { xs: "100%", sm: 240 },
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: (t) => alpha(t.palette.background.default, 0.8),
          },
        }}
      />
    </Box>
  );
}
