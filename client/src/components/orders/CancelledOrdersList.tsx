import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { Order } from "../../types/order";

interface CancelledOrdersListProps {
  orders: Order[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function CancelledOrdersList({ orders }: CancelledOrdersListProps) {
  if (orders.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 12, opacity: 0.55 }}>
        <BlockRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography variant="body1" color="text.secondary">
          No cancelled orders
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ maxWidth: 640, mx: "auto", px: { xs: 2, md: 0 }, pb: 4 }}>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} letterSpacing="0.06em" mb={0.5}>
        CANCELLED ORDERS — {orders.length} total
      </Typography>
      {orders.map((order) => (
        <Card
          key={order.id}
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "rgba(52,43,39,.10)",
            borderLeft: "4px solid #9CA3AF",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack spacing={1}>
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="subtitle2" fontWeight={900}>
                    #{order.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customerName}
                  </Typography>
                </Stack>
                <Chip
                  label="CANCELLED"
                  size="small"
                  sx={{
                    bgcolor: "#F3F4F6",
                    color: "#6B7280",
                    border: "1px solid #9CA3AF",
                    fontWeight: 800,
                    fontSize: "0.65rem",
                  }}
                />
              </Stack>

              {/* Meta */}
              <Stack direction="row" spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  Table {order.tableNumber}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </Typography>
              </Stack>

              <Divider />

              {/* Items */}
              <Stack spacing={0.25}>
                {order.items.map((item) => (
                  <Typography key={item.id} variant="body2" color="text.secondary">
                    <Box component="span" fontWeight={700}>
                      {item.quantity}×
                    </Box>{" "}
                    {item.name}
                  </Typography>
                ))}
              </Stack>

              {order.specialInstructions && (
                <Typography variant="caption" fontStyle="italic" color="text.disabled">
                  Note: {order.specialInstructions}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
