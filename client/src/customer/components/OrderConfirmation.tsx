import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Fade,
  Stack,
  Typography,
  Zoom,
  alpha,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { getPublicOrder, PublicOrder } from "../api/publicOrder.api";
import { formatCustomerPrice } from "./CustomerFoodCard";

interface OrderConfirmationProps {
  order: PublicOrder;
  restaurantId: string;
  onAddMore: () => void;
  /** Called when the order reaches a terminal status (READY or CANCELLED). Use to clear the guest session. */
  onSessionEnd?: () => void;
}

type OrderStatus = "PENDING" | "PREPARING" | "READY" | "CANCELLED";

const TERMINAL_STATUSES: OrderStatus[] = ["READY", "CANCELLED"];

const STATUS_COPY: Record<OrderStatus, { emoji: string; text: string; color: string }> = {
  PENDING: {
    emoji: "🟡",
    text: "Order Received — your order is in the queue",
    color: "#D97706",
  },
  PREPARING: {
    emoji: "👨‍🍳",
    text: "Being prepared — the kitchen's on it!",
    color: "#2563EB",
  },
  READY: {
    emoji: "✅",
    text: "Your order is ready — enjoy!",
    color: "#059669",
  },
  CANCELLED: {
    emoji: "❌",
    text: "Order Cancelled — please speak to a staff member",
    color: "#DC2626",
  },
};

function isKnownStatus(s: string): s is OrderStatus {
  return ["PENDING", "PREPARING", "READY", "CANCELLED"].includes(s);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default function OrderConfirmation({
  order: initialOrder,
  restaurantId,
  onAddMore,
  onSessionEnd,
}: OrderConfirmationProps) {
  const [order, setOrder] = useState<PublicOrder>(initialOrder);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status = isKnownStatus(order.status) ? order.status : "PENDING";
  const statusInfo = STATUS_COPY[status];
  const isTerminal = TERMINAL_STATUSES.includes(status);

  useEffect(() => {
    if (isTerminal) return; // don't start polling if already done

    const poll = async () => {
      try {
        const result = await getPublicOrder(restaurantId, order.id);
        setOrder(result.order);
        setLastUpdated(new Date());
        if (isKnownStatus(result.order.status) && TERMINAL_STATUSES.includes(result.order.status as OrderStatus)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Bug 2 fix: session ends when the order is terminal — notify the parent
          // so it can clear localStorage for the next QR scan.
          onSessionEnd?.();
        }
      } catch {
        // silently ignore transient poll errors
      }
    };

    intervalRef.current = setInterval(() => void poll(), 10_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, order.id, isTerminal]);

  const total = order.items.reduce((sum, item) => sum + item.quantity * item.priceAtOrder, 0);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Zoom in>
            <CheckCircleRoundedIcon color="success" sx={{ fontSize: 72 }} />
          </Zoom>

          <Box>
            <Typography variant="h4">Your order's on its way to the kitchen! 🍽️</Typography>
            <Typography color="text.secondary" mt={0.75}>
              Sit tight, we'll have this ready soon.
            </Typography>
          </Box>

          {/* Live status banner */}
          <Fade in key={status}>
            <Box
              sx={{
                width: "100%",
                borderRadius: 3,
                px: 2,
                py: 1.5,
                bgcolor: (t) => alpha(statusInfo.color, 0.08),
                border: "1px solid",
                borderColor: (t) => alpha(statusInfo.color, 0.25),
              }}
            >
              <Typography variant="body1" fontWeight={800} color={statusInfo.color}>
                {statusInfo.emoji} {statusInfo.text}
              </Typography>
              <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                Last updated: {formatTime(lastUpdated)}
                {isTerminal && " · tracking stopped"}
              </Typography>
            </Box>
          </Fade>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
            <Chip label={`Order #${order.orderNumber}`} color="primary" />
            <Chip label={`Table ${order.tableNumber}`} variant="outlined" />
          </Stack>

          <Divider sx={{ width: "100%" }} />

          <Stack spacing={1} width="100%">
            {order.items.map((item) => (
              <Stack
                key={`${item.menuItemId}-${item.name}`}
                direction="row"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography textAlign="left">
                  {item.quantity} x {item.name}
                </Typography>
                <Typography fontWeight={800}>
                  {formatCustomerPrice(item.quantity * item.priceAtOrder)}
                </Typography>
              </Stack>
            ))}
            <Stack direction="row" justifyContent="space-between" pt={1}>
              <Typography fontWeight={900}>Total</Typography>
              <Typography fontWeight={900}>{formatCustomerPrice(total)}</Typography>
            </Stack>
          </Stack>

          {status === "CANCELLED" && (
            <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
              This order has been cancelled. Please speak to a staff member if you need help.
            </Alert>
          )}

          {status !== "CANCELLED" && (
            <Button variant="contained" onClick={onAddMore}>
              Add more items
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

