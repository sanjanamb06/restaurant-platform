import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import TableRestaurantRoundedIcon from "@mui/icons-material/TableRestaurantRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { PendingBill } from "../../types/billing";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PendingBillsTabProps {
  bills: PendingBill[];
  isLoading: boolean;
  error: string | null;
  onGenerateBill: (orderId: string, orderNumber: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ---------------------------------------------------------------------------
// Skeleton card while loading
// ---------------------------------------------------------------------------

function BillCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ height: 5, bgcolor: "action.hover" }} />
      <CardContent sx={{ p: 2.5 }}>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="40%" sx={{ mt: 0.5 }} />
        <Skeleton variant="text" width="80%" sx={{ mt: 1.5 }} />
        <Skeleton variant="rounded" height={38} sx={{ mt: 2, borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Individual bill card
// ---------------------------------------------------------------------------

interface BillCardProps {
  bill: PendingBill;
  onGenerateBill: (orderId: string, orderNumber: string) => void;
}

function BillCard({ bill, onGenerateBill }: BillCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 20px 50px rgba(72,47,35,.14)",
        },
      }}
    >
      {/* Status stripe */}
      <Box sx={{ height: 5, bgcolor: "success.main" }} />

      <CardContent sx={{ p: 2.5 }}>
        {/* Order header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
              Order #{bill.orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {bill.customerName}
            </Typography>
          </Box>
          <Chip
            label="READY"
            size="small"
            sx={{
              bgcolor: "rgba(86,122,90,.12)",
              color: "success.dark",
              fontWeight: 800,
              fontSize: "0.7rem",
            }}
          />
        </Stack>

        {/* Meta row */}
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" useFlexGap>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <TableRestaurantRoundedIcon
              sx={{ fontSize: 15, color: "text.disabled" }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Table {bill.tableNumber}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ReceiptLongRoundedIcon sx={{ fontSize: 15, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {bill.itemCount} {bill.itemCount === 1 ? "item" : "items"}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {timeAgo(bill.createdAt)}
            </Typography>
          </Stack>
        </Stack>

        {/* Amount preview */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: "rgba(0,0,0,0.03)",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Subtotal + GST ({(bill.gstRate * 100).toFixed(0)}%)
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              ₹{bill.subtotal.toFixed(2)} + ₹{bill.gstAmount.toFixed(2)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography variant="body2" fontWeight={800}>
              Grand Total
            </Typography>
            <Typography variant="body2" fontWeight={800} color="primary.main">
              ₹{bill.grandTotal.toFixed(2)}
            </Typography>
          </Stack>
        </Box>

        {/* CTA */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<PointOfSaleRoundedIcon />}
          onClick={() => onGenerateBill(bill.orderId, bill.orderNumber)}
          sx={{ borderRadius: 2 }}
        >
          Generate Bill
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------

export default function PendingBillsTab({
  bills,
  isLoading,
  error,
  onGenerateBill,
}: PendingBillsTabProps) {
  if (isLoading) {
    return (
      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <BillCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (bills.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 10,
          gap: 1.5,
          color: "text.disabled",
        }}
      >
        <PointOfSaleRoundedIcon sx={{ fontSize: 64, opacity: 0.35 }} />
        <Typography variant="h6" fontWeight={700} color="text.secondary">
          No pending bills
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={320}>
          Orders will appear here once the kitchen marks them as Ready.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2.5} sx={{ mt: 0 }}>
      {bills.map((bill) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={bill.orderId}>
          <BillCard bill={bill} onGenerateBill={onGenerateBill} />
        </Grid>
      ))}
    </Grid>
  );
}
