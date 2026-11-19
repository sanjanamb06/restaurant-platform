import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useEffect, useState } from "react";
import { getBillPreview, processPayment } from "../../api/billing.api";
import type { BillPreview, PaymentMethod } from "../../types/billing";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillPreviewDialogProps {
  orderId: string | null;
  orderNumber: string;
  onClose: () => void;
  onPaymentSuccess: (receiptNumber: string) => void;
}

// ---------------------------------------------------------------------------
// Payment method config
// ---------------------------------------------------------------------------

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "CASH", label: "Cash", icon: <CurrencyRupeeRoundedIcon fontSize="small" /> },
  { value: "UPI", label: "UPI", icon: <PhoneAndroidRoundedIcon fontSize="small" /> },
  { value: "CARD", label: "Card", icon: <CreditCardRoundedIcon fontSize="small" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BillPreviewDialog({
  orderId,
  orderNumber,
  onClose,
  onPaymentSuccess,
}: BillPreviewDialogProps) {
  const [bill, setBill] = useState<BillPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  const open = Boolean(orderId);

  // Fetch bill preview whenever the dialog opens for a new order
  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    setBill(null);

    getBillPreview(orderId)
      .then((data) => { if (active) setBill(data); })
      .catch((err) => {
        if (active) {
          const msg = err?.response?.data?.error ?? "Failed to load bill details.";
          setError(msg);
        }
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [orderId]);

  const handlePay = async () => {
    if (!orderId || !bill) return;
    setIsPaying(true);
    setError(null);
    try {
      const payment = await processPayment(orderId, method);
      onPaymentSuccess(payment.receiptNumber);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Payment failed. Please try again.";
      setError(msg);
    } finally {
      setIsPaying(false);
    }
  };

  const handleClose = () => {
    if (!isPaying) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      {/* Header */}
      <Box sx={{ height: 6, bgcolor: "primary.main" }} />
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <ReceiptRoundedIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
            Generate Bill
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Order #{orderNumber}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isPaying} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        {/* Loading state */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <Box
            sx={{
              p: 2,
              bgcolor: "error.lighter",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "error.light",
              mb: 2,
            }}
          >
            <Typography color="error.dark" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {/* Bill content */}
        {!isLoading && bill && (
          <>
            {/* Customer info */}
            <Stack direction="row" spacing={2} mb={2.5} mt={0.5}>
              <Chip
                label={`Table ${bill.tableNumber}`}
                size="small"
                sx={{ bgcolor: "rgba(198,93,59,.1)", color: "primary.dark", fontWeight: 700 }}
              />
              <Chip
                label={bill.customerName}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>

            {/* Items table */}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                mb: 2.5,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Item</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                      Qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                      Rate (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                      Total (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bill.items.map((item) => (
                    <TableRow key={item.menuItemId} hover>
                      <TableCell sx={{ fontSize: "0.83rem" }}>{item.name}</TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.83rem" }}>
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.83rem" }}>
                        ₹{item.priceAtOrder.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.83rem", fontWeight: 600 }}>
                        ₹{item.lineTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Totals */}
            <Box
              sx={{
                bgcolor: "rgba(0,0,0,0.025)",
                borderRadius: 2,
                p: 2,
                mb: 3,
              }}
            >
              <Stack spacing={0.75}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{bill.subtotal.toFixed(2)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    GST ({(bill.gstRate * 100).toFixed(0)}%)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{bill.gstAmount.toFixed(2)}
                  </Typography>
                </Stack>
                <Divider sx={{ my: 0.5 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={800}>
                    Grand Total
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: "1.1rem" }}
                  >
                    ₹{bill.grandTotal.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Payment method selector */}
            <Typography variant="body2" fontWeight={700} mb={1.5} color="text.secondary">
              SELECT PAYMENT METHOD
            </Typography>
            <ToggleButtonGroup
              value={method}
              exclusive
              onChange={(_e, val) => { if (val) setMethod(val as PaymentMethod); }}
              fullWidth
              sx={{ mb: 3 }}
            >
              {PAYMENT_METHODS.map((pm) => (
                <ToggleButton
                  key={pm.value}
                  value={pm.value}
                  sx={{
                    py: 1.25,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    gap: 0.75,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                  }}
                >
                  {pm.icon}
                  {pm.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {/* Actions */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isPaying}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handlePay}
                disabled={isPaying}
                startIcon={
                  isPaying ? <CircularProgress size={16} color="inherit" /> : null
                }
                sx={{ flex: 2 }}
              >
                {isPaying ? "Processing..." : `Confirm ${method} Payment`}
              </Button>
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
