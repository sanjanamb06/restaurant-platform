import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getOrders, updateOrderStatus } from "../../api/orders.api";
import CancelledOrdersList from "../../components/orders/CancelledOrdersList";
import KanbanColumn from "../../components/orders/KanbanColumn";
import OrderFilterBar, { FilterStatus } from "../../components/orders/OrderFilterBar";
import { useAuth } from "../../context/AuthContext";
import socket from "../../socket/socket";
import { Order, OrderStatus, OrderStatusUpdatedEvent } from "../../types/order";

const KANBAN_STATUSES: Exclude<OrderStatus, "CANCELLED">[] = ["PENDING", "PREPARING", "READY"];

function matchesSearch(order: Order, q: string) {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    order.orderNumber.toLowerCase().includes(lower) ||
    order.customerName.toLowerCase().includes(lower) ||
    String(order.tableNumber).includes(lower)
  );
}

export default function OrdersPage() {
  const { user, restaurant } = useAuth();
  const role = user!.role;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const newOrderTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch {
      setFetchError("Failed to load orders. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?.id) return;

    socket.connect();
    socket.emit("join", { restaurantId: restaurant.id });

    const handleNewOrder = ({ order }: { order: Order }) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });

      // Highlight the new card for 3 seconds
      setNewOrderIds((prev) => new Set(prev).add(order.id));
      const timer = setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
        newOrderTimers.current.delete(order.id);
      }, 3000);
      newOrderTimers.current.set(order.id, timer);
    };

    const handleStatusUpdated = ({ orderId, status }: OrderStatusUpdatedEvent) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:statusUpdated", handleStatusUpdated);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:statusUpdated", handleStatusUpdated);
      socket.disconnect();
      // Clear all highlight timers
      newOrderTimers.current.forEach((t) => clearTimeout(t));
      newOrderTimers.current.clear();
    };
  }, [restaurant?.id]);

  // ── Status update handler ─────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (orderId: string, status: OrderStatus) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      // Revert on failure by re-fetching
      void fetchOrders();
    }
  }, [fetchOrders]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = activeFilter === "ALL" || o.status === activeFilter;
      const searchOk = matchesSearch(o, search);
      return statusOk && searchOk;
    });
  }, [orders, activeFilter, search]);

  const ordersByStatus = useMemo(() => {
    const map: Record<string, Order[]> = {
      PENDING: [],
      PREPARING: [],
      READY: [],
      CANCELLED: [],
    };
    filteredOrders.forEach((o) => map[o.status]?.push(o));
    // Sort each column newest-first
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    );
    return map;
  }, [filteredOrders]);

  // Which Kanban columns are visible given the current tab
  const visibleKanbanCols = useMemo<Exclude<OrderStatus, "CANCELLED">[]>(() => {
    if (activeFilter === "ALL") return KANBAN_STATUSES;
    if (activeFilter === "CANCELLED") return [];
    return [activeFilter as Exclude<OrderStatus, "CANCELLED">];
  }, [activeFilter]);

  // ── Error state ───────────────────────────────────────────────────────────
  if (fetchError && !isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={fetchOrders}>
              Retry
            </Button>
          }
        >
          {fetchError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // dvh accounts for mobile browser chrome and zoom correctly;
        // subtract the AppBar height that DashboardLayout adds as pt: 8 (64px)
        height: "calc(100dvh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Page title bar */}
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 1.5, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={900}>
              Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time order board
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchOrders}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filter bar */}
      <OrderFilterBar
        activeFilter={activeFilter}
        search={search}
        role={role}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearch}
      />

      {/* Board area */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          p: { xs: 1.5, md: 2.5 },
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {activeFilter === "CANCELLED" ? (
          /* Flat cancelled list */
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <CancelledOrdersList orders={ordersByStatus["CANCELLED"]} />
          </Box>
        ) : (
          /* Kanban board */
          <Stack
            direction="row"
            spacing={2}
            sx={{ flex: 1, minHeight: 0, alignItems: "stretch" }}
          >
            {visibleKanbanCols.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={ordersByStatus[status]}
                newOrderIds={newOrderIds}
                role={role}
                isLoading={isLoading}
                onStatusChange={handleStatusChange}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
