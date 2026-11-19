import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { Role } from "../../types";
import { Order, OrderStatus } from "../../types/order";
import OrderCard from "./OrderCard";

interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  newOrderIds: Set<string>;
  role: Role;
  isLoading: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
}

const COLUMN_CONFIG: Record<
  Exclude<OrderStatus, "CANCELLED">,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: { label: "PENDING", color: "#F59E0B", bgColor: "#FFFBEB" },
  PREPARING: { label: "PREPARING", color: "#3B82F6", bgColor: "#EFF6FF" },
  READY: { label: "READY", color: "#10B981", bgColor: "#ECFDF5" },
};

export default function KanbanColumn({
  status,
  orders,
  newOrderIds,
  role,
  isLoading,
  onStatusChange,
}: KanbanColumnProps) {
  const config = COLUMN_CONFIG[status as Exclude<OrderStatus, "CANCELLED">];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        bgcolor: config.bgColor,
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha(config.color, 0.25),
        overflow: "hidden",
      }}
    >
      {/* Column header — never shrinks */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: alpha(config.color, 0.2),
          bgcolor: alpha(config.color, 0.08),
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: config.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="subtitle2" fontWeight={900} letterSpacing="0.06em" color="text.primary">
            {config.label}
          </Typography>
          <Chip
            label={isLoading ? "—" : orders.length}
            size="small"
            sx={{
              bgcolor: config.color,
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.7rem",
              height: 20,
              ml: "auto",
            }}
          />
        </Stack>
      </Box>

      {/* Scrollable cards */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          minHeight: 0,
          // Custom scrollbar
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(52, 43, 39, 0.12)",
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(52, 43, 39, 0.24)",
          },
        }}
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : orders.length === 0 ? (
          <EmptyColumn status={status} />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              role={role}
              isNew={newOrderIds.has(order.id)}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

function SkeletonCard() {
  return (
    <Card elevation={0} sx={{ border: "1px solid rgba(52,43,39,.08)", borderRadius: 3 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={18} />
          <Skeleton variant="rectangular" height={1} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="65%" />
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyColumn({ status }: { status: OrderStatus }) {
  const messages: Record<string, string> = {
    PENDING: "No pending orders right now",
    PREPARING: "Nothing in preparation",
    READY: "No orders ready yet",
  };
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 6, opacity: 0.55 }}>
      <InboxRoundedIcon sx={{ fontSize: 38, color: "text.disabled" }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {messages[status] ?? `No ${status.toLowerCase()} orders`}
      </Typography>
    </Stack>
  );
}
