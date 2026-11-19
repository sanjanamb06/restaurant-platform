import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import TableRestaurantRoundedIcon from "@mui/icons-material/TableRestaurantRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
  alpha,
  keyframes,
} from "@mui/material";
import { useState } from "react";
import { Role } from "../../types";
import { Order, OrderStatus } from "../../types/order";

interface OrderCardProps {
  order: Order;
  role: Role;
  isNew?: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
}

const pulseAnim = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(198, 93, 59, 0.45); }
  70%  { box-shadow: 0 0 0 10px rgba(198, 93, 59, 0); }
  100% { box-shadow: 0 0 0 0 rgba(198, 93, 59, 0); }
`;

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  PREPARING: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
  READY: { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
  CANCELLED: { bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF" },
};

function StatusChip({ status }: { status: OrderStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontWeight: 800,
        fontSize: "0.65rem",
        letterSpacing: "0.05em",
      }}
    />
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function OrderCard({ order, role, isNew = false, onStatusChange }: OrderCardProps) {
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleAction = async (status: OrderStatus) => {
    setBusy(true);
    try {
      await onStatusChange(order.id, status);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelClick = () => {
    if (confirmCancel) {
      void handleAction("CANCELLED");
    } else {
      setConfirmCancel(true);
      setTimeout(() => setConfirmCancel(false), 3000);
    }
  };

  const statusColor = STATUS_COLORS[order.status];

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: isNew ? "primary.main" : "rgba(52,43,39,.10)",
        borderLeft: `4px solid ${statusColor.border}`,
        borderRadius: 3,
        // Cards must never be compressed by the flex-column scroll container
        flexShrink: 0,
        transition: "border-color 400ms ease, box-shadow 400ms ease",
        animation: isNew ? `${pulseAnim} 2s ease-out` : undefined,
        "&:hover": {
          boxShadow: "0 8px 28px rgba(52,43,39,.10)",
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header row */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="subtitle1" fontWeight={900} lineHeight={1.2}>
                #{order.orderNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {order.customerName}
              </Typography>
            </Box>
            <StatusChip status={order.status} />
          </Stack>

          {/* Meta row */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="Table number">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <TableRestaurantRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Table {order.tableNumber}
                </Typography>
              </Stack>
            </Tooltip>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary">
                {formatTime(order.createdAt)}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          {/* Items list */}
          <Stack spacing={0.25}>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.25}>
              <RestaurantRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
              <Typography variant="caption" color="text.disabled" fontWeight={700} letterSpacing="0.04em">
                ITEMS
              </Typography>
            </Stack>
            <Box
              sx={{
                maxHeight: 130,
                overflowY: "auto",
                pr: 0.5,
                // Sleek premium scrollbar
                "&::-webkit-scrollbar": {
                  width: 4,
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: (theme) => theme.palette.divider,
                  borderRadius: 2,
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: (theme) => theme.palette.text.disabled,
                },
              }}
            >
              {order.items.map((item) => (
                <Typography key={item.id} variant="body2" color="text.primary">
                  <Box component="span" fontWeight={800}>
                    {item.quantity}×
                  </Box>{" "}
                  {item.name}
                </Typography>
              ))}
            </Box>
          </Stack>

          {/* Special instructions */}
          {order.specialInstructions && (
            <Box
              sx={{
                bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
                border: "1px solid",
                borderColor: (t) => alpha(t.palette.warning.main, 0.22),
                borderRadius: 2,
                px: 1.25,
                py: 0.75,
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="flex-start">
                <NoteAltRoundedIcon sx={{ fontSize: 14, color: "warning.main", mt: "2px", flexShrink: 0 }} />
                <Typography variant="caption" fontStyle="italic" color="text.secondary">
                  {order.specialInstructions}
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Action buttons */}
          <ActionButtons
            status={order.status}
            role={role}
            busy={busy}
            confirmCancel={confirmCancel}
            onAction={handleAction}
            onCancelClick={handleCancelClick}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function ActionButtons({
  status,
  role,
  busy,
  confirmCancel,
  onAction,
  onCancelClick,
}: {
  status: OrderStatus;
  role: Role;
  busy: boolean;
  confirmCancel: boolean;
  onAction: (s: OrderStatus) => void;
  onCancelClick: () => void;
}) {
  if (status === "CANCELLED") return null;

  if (role === Role.CHEF) {
    if (status === "PENDING")
      return (
        <Button
          variant="contained"
          size="small"
          disabled={busy}
          onClick={() => onAction("PREPARING")}
          startIcon={<span>▶</span>}
        >
          Start Preparing
        </Button>
      );
    if (status === "PREPARING")
      return (
        <Button
          variant="contained"
          size="small"
          color="success"
          disabled={busy}
          onClick={() => onAction("READY")}
          startIcon={<span>✓</span>}
        >
          Mark Ready
        </Button>
      );
    return null;
  }

  if (role === Role.MANAGER) {
    if (status === "PENDING")
      return (
        <Button
          variant="outlined"
          size="small"
          color="error"
          disabled={busy}
          onClick={onCancelClick}
          sx={{
            borderColor: confirmCancel ? "error.main" : undefined,
            bgcolor: confirmCancel ? (t) => alpha(t.palette.error.main, 0.08) : undefined,
          }}
        >
          {confirmCancel ? "Confirm Cancel?" : "✕ Cancel Order"}
        </Button>
      );
    return null;
  }

  if (role === Role.ADMIN) {
    if (status === "PENDING")
      return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            size="small"
            disabled={busy}
            onClick={() => onAction("PREPARING")}
            startIcon={<span>▶</span>}
          >
            Start Preparing
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            disabled={busy}
            onClick={onCancelClick}
            sx={{
              borderColor: confirmCancel ? "error.main" : undefined,
              bgcolor: confirmCancel ? (t) => alpha(t.palette.error.main, 0.08) : undefined,
            }}
          >
            {confirmCancel ? "Confirm Cancel?" : "✕ Cancel"}
          </Button>
        </Stack>
      );
    if (status === "PREPARING")
      return (
        <Button
          variant="contained"
          size="small"
          color="success"
          disabled={busy}
          onClick={() => onAction("READY")}
          startIcon={<span>✓</span>}
        >
          Mark Ready
        </Button>
      );
    return null;
  }

  // CASHIER — read-only
  return null;
}
