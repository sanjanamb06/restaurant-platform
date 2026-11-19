import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import {
  Alert,
  Badge,
  Box,
  Button,
  Fade,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCurrentStock,
  getInventorySummary,
  getLowStockAlerts,
  getStockHistory,
} from "../../api/inventory.api";
import { useAuth } from "../../context/AuthContext";
import socket from "../../socket/socket";
import type {
  InventoryLowStockEvent,
  InventorySummary,
  LowStockAlert,
  StockHistoryPage,
  StockItem,
} from "../../types/inventory";
import AdjustStockDialog from "./AdjustStockDialog";
import LowStockAlertsTab from "./LowStockAlertsTab";
import StockHistoryTab from "./StockHistoryTab";
import StockOverviewTab from "./StockOverviewTab";

// ---------------------------------------------------------------------------
// Tab panel helper
// ---------------------------------------------------------------------------

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

function TabPanel({ value, index, children }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function InventoryDashboardPage() {
  const { restaurant } = useAuth();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [historyPage, setHistoryPage] = useState<StockHistoryPage | null>(null);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // ── Dialog / Toast state ───────────────────────────────────────────────────
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; type: "success" | "warning" }>({
    open: false,
    message: "",
    type: "success",
  });

  // ── Fetching ───────────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getInventorySummary();
      setSummary(data);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    setIsLoadingStock(true);
    try {
      const data = await getCurrentStock();
      setStock(data);
    } finally {
      setIsLoadingStock(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
    try {
      const data = await getLowStockAlerts();
      setAlerts(data);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setIsLoadingHistory(true);
    try {
      const data = await getStockHistory({ page, limit: 15 });
      setHistoryPage(data);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const fetchAll = useCallback(() => {
    void fetchSummary();
    void fetchStock();
    void fetchAlerts();
    void fetchHistory(historyPage?.page ?? 1);
  }, [fetchSummary, fetchStock, fetchAlerts, fetchHistory, historyPage?.page]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Socket.IO Subscription ──────────────────────────────────────────────────

  const fetchAllRef = useRef(fetchAll);
  fetchAllRef.current = fetchAll;

  useEffect(() => {
    if (!restaurant?.id) return;

    socket.connect();
    socket.emit("join", { restaurantId: restaurant.id });

    const handleLowStock = (event: InventoryLowStockEvent) => {
      // Show toast for the worst alert
      if (event.alerts.length > 0) {
        const worst = event.alerts[0];
        setToast({
          open: true,
          message: `${worst.name} is running low (${worst.currentStock.toFixed(2)} ${worst.unit})!`,
          type: worst.currentStock === 0 ? "warning" : "success",
        });
      }
      // Refresh all tabs silently
      void fetchAllRef.current();
    };

    socket.on("inventory:lowStock", handleLowStock);

    return () => {
      socket.off("inventory:lowStock", handleLowStock);
      socket.disconnect();
    };
  }, [restaurant?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAdjustClickFromAlert = (ingredientId: string) => {
    // Find the full StockItem to open the dialog
    const item = stock.find((s) => s.id === ingredientId);
    if (item) setAdjustItem(item);
  };

  const handleAdjustSuccess = (updated: StockItem) => {
    setToast({
      open: true,
      message: `${updated.name} stock updated successfully.`,
      type: "success",
    });
    // Refresh to update summary, lists, and history
    fetchAll();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 2, flexShrink: 0 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: 3,
                bgcolor: "rgba(78,122,145,.1)",
                color: "info.main",
              }}
            >
              <InventoryRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} lineHeight={1.2}>
                Inventory Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track stock and monitor automatic deductions
              </Typography>
            </Box>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchAll}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Stack>

        {/* KPIs */}
        {!isLoadingSummary && summary && (
          <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 0.5 }}>
            <Box sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2, minWidth: 140 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL ITEMS</Typography>
              <Typography variant="h6" fontWeight={800}>{summary.totalIngredients}</Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: "warning.lighter", borderRadius: 2, minWidth: 140 }}>
              <Typography variant="caption" color="warning.dark" fontWeight={700}>LOW STOCK</Typography>
              <Typography variant="h6" fontWeight={800} color="warning.dark">{summary.lowStockCount}</Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: "error.lighter", borderRadius: 2, minWidth: 140 }}>
              <Typography variant="caption" color="error.dark" fontWeight={700}>OUT OF STOCK</Typography>
              <Typography variant="h6" fontWeight={800} color="error.dark">{summary.outOfStockCount}</Typography>
            </Box>
            {summary.lastDeductionAt && (
              <Box sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2, minWidth: 160 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>LAST DEDUCTION</Typography>
                <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                  {new Date(summary.lastDeductionAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ px: { xs: 2, md: 3 }, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={(_e, val) => setActiveTab(val as number)} textColor="primary" indicatorColor="primary">
          <Tab
            icon={<InventoryRoundedIcon fontSize="small" />} iconPosition="start"
            label="Stock Overview" sx={{ fontWeight: 700, minHeight: 52, gap: 0.5 }}
          />
          <Tab
            icon={
              <Badge badgeContent={alerts.length} color="error" max={99} sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", height: 16, minWidth: 16 } }}>
                <WarningRoundedIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Alerts" sx={{ fontWeight: 700, minHeight: 52, gap: 0.5 }}
          />
          <Tab
            icon={<HistoryRoundedIcon fontSize="small" />} iconPosition="start"
            label="History" sx={{ fontWeight: 700, minHeight: 52, gap: 0.5 }}
          />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, minHeight: 0, px: { xs: 2, md: 3 }, display: "flex", flexDirection: "column" }}>
        <TabPanel value={activeTab} index={0}>
          <Fade in={activeTab === 0}>
            <Box>
              <StockOverviewTab stock={stock} isLoading={isLoadingStock} onAdjustStock={setAdjustItem} />
            </Box>
          </Fade>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <Fade in={activeTab === 1}>
            <Box>
              <LowStockAlertsTab alerts={alerts} isLoading={isLoadingAlerts} error={null} onAdjustStock={handleAdjustClickFromAlert} />
            </Box>
          </Fade>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <Fade in={activeTab === 2}>
            <Box>
              <StockHistoryTab historyPage={historyPage} isLoading={isLoadingHistory} onPageChange={fetchHistory} />
            </Box>
          </Fade>
        </TabPanel>
      </Box>

      {/* Adjust Dialog */}
      <AdjustStockDialog
        ingredient={adjustItem}
        onClose={() => setAdjustItem(null)}
        onSuccess={handleAdjustSuccess}
      />

      {/* Toasts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.type === "warning" ? "error" : "success"}
          icon={toast.type === "warning" ? <ErrorOutlineRoundedIcon /> : <CheckCircleRoundedIcon />}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 3, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
