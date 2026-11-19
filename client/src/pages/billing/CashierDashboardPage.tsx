import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
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
import { getCompletedBills, getPendingBills } from "../../api/billing.api";
import { useAuth } from "../../context/AuthContext";
import socket from "../../socket/socket";
import type { CompletedBill, PendingBill } from "../../types/billing";
import type { OrderStatusUpdatedEvent } from "../../types/order";
import BillPreviewDialog from "./BillPreviewDialog";
import CompletedBillsTab from "./CompletedBillsTab";
import InvoiceDialog from "./InvoiceDialog";
import PendingBillsTab from "./PendingBillsTab";

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

export default function CashierDashboardPage() {
  const { restaurant } = useAuth();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [completedBills, setCompletedBills] = useState<CompletedBill[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [isCompletedLoading, setIsCompletedLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [completedError, setCompletedError] = useState<string | null>(null);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [previewOrderNumber, setPreviewOrderNumber] = useState("");
  const [invoiceBill, setInvoiceBill] = useState<CompletedBill | null>(null);

  // ── Toast state ────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ open: boolean; message: string; type: "success" | "error" }>({
    open: false,
    message: "",
    type: "success",
  });

  // ── Fetching ───────────────────────────────────────────────────────────────

  const fetchPending = useCallback(async () => {
    setIsPendingLoading(true);
    setPendingError(null);
    try {
      const data = await getPendingBills();
      setPendingBills(data);
    } catch {
      setPendingError("Failed to load pending bills.");
    } finally {
      setIsPendingLoading(false);
    }
  }, []);

  const fetchCompleted = useCallback(async () => {
    setIsCompletedLoading(true);
    setCompletedError(null);
    try {
      const data = await getCompletedBills();
      setCompletedBills(data);
    } catch {
      setCompletedError("Failed to load completed bills.");
    } finally {
      setIsCompletedLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPending();
    void fetchCompleted();
  }, [fetchPending, fetchCompleted]);

  // ── Socket.IO — subscribe to order:statusUpdated to pick up READY orders ──

  const fetchPendingRef = useRef(fetchPending);
  fetchPendingRef.current = fetchPending;

  useEffect(() => {
    if (!restaurant?.id) return;

    socket.connect();
    socket.emit("join", { restaurantId: restaurant.id });

    /**
     * When a kitchen order is marked READY, refresh the pending bills list so the
     * new bill card surfaces instantly without a manual page reload.
     */
    const handleStatusUpdated = ({ status }: OrderStatusUpdatedEvent) => {
      if (status === "READY") {
        void fetchPendingRef.current();
      }
    };

    socket.on("order:statusUpdated", handleStatusUpdated);

    return () => {
      socket.off("order:statusUpdated", handleStatusUpdated);
      socket.disconnect();
    };
  }, [restaurant?.id]);

  // ── Dialog handlers ────────────────────────────────────────────────────────

  const handleOpenPreview = (orderId: string, orderNumber: string) => {
    setPreviewOrderId(orderId);
    setPreviewOrderNumber(orderNumber);
  };

  const handleClosePreview = () => {
    setPreviewOrderId(null);
    setPreviewOrderNumber("");
  };

  const handlePaymentSuccess = (receiptNumber: string) => {
    setToast({
      open: true,
      message: `Payment recorded! Receipt: ${receiptNumber}`,
      type: "success",
    });
    // Refresh both lists after payment
    void fetchPending();
    void fetchCompleted();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    void fetchPending();
    void fetchCompleted();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Page header */}
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 1, flexShrink: 0 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.25} mb={0.5}>
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 3,
                  bgcolor: "rgba(198,93,59,.1)",
                  color: "primary.main",
                }}
              >
                <PointOfSaleRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900} lineHeight={1.2}>
                  Cashier Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage bills &amp; payments
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={handleRefresh}
            sx={{ borderRadius: 2, mt: 0.5 }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val as number)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            id="tab-pending"
            aria-controls="tabpanel-pending"
            icon={
              <Badge
                badgeContent={pendingBills.length}
                color="error"
                max={99}
                sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", height: 16, minWidth: 16 } }}
              >
                <PendingActionsRoundedIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Pending Bills"
            sx={{ fontWeight: 700, minHeight: 52, gap: 0.5 }}
          />
          <Tab
            id="tab-completed"
            aria-controls="tabpanel-completed"
            icon={
              <Badge
                badgeContent={completedBills.length}
                color="default"
                max={999}
                sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", height: 16, minWidth: 16 } }}
              >
                <HistoryRoundedIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Completed Bills"
            sx={{ fontWeight: 700, minHeight: 52, gap: 0.5 }}
          />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          px: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TabPanel value={activeTab} index={0}>
          <Fade in={activeTab === 0}>
            <Box>
              <PendingBillsTab
                bills={pendingBills}
                isLoading={isPendingLoading}
                error={pendingError}
                onGenerateBill={handleOpenPreview}
              />
            </Box>
          </Fade>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Fade in={activeTab === 1}>
            <Box>
              <CompletedBillsTab
                bills={completedBills}
                isLoading={isCompletedLoading}
                error={completedError}
                onViewInvoice={(bill) => setInvoiceBill(bill)}
              />
            </Box>
          </Fade>
        </TabPanel>
      </Box>

      {/* Bill preview / payment dialog */}
      <BillPreviewDialog
        orderId={previewOrderId}
        orderNumber={previewOrderNumber}
        onClose={handleClosePreview}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Invoice view dialog */}
      <InvoiceDialog
        bill={invoiceBill}
        onClose={() => setInvoiceBill(null)}
      />

      {/* Payment success toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          icon={<CheckCircleRoundedIcon />}
          sx={{ borderRadius: 3, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
