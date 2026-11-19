import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import {
  Box,
  Button,
  Chip,
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
  Typography,
} from "@mui/material";
import type { CompletedBill } from "../../types/billing";

// ---------------------------------------------------------------------------
// Payment method display config
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  CASH: { bg: "rgba(86,122,90,.12)", color: "#3F6845" },
  UPI: { bg: "rgba(78,122,145,.12)", color: "#365F73" },
  CARD: { bg: "rgba(198,93,59,.12)", color: "#873D29" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InvoiceDialogProps {
  bill: CompletedBill | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvoiceDialog({ bill, onClose }: InvoiceDialogProps) {
  const methodStyle = bill ? (METHOD_COLORS[bill.method] ?? METHOD_COLORS["CASH"]) : METHOD_COLORS["CASH"];
  const paidDate = bill ? new Date(bill.paidAt) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={Boolean(bill)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      <Box sx={{ height: 6, bgcolor: "secondary.main" }} />
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
        <ReceiptRoundedIcon color="secondary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
            Invoice
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {bill?.receiptNumber}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        {bill && (
          <>
            {/* Receipt header meta */}
            <Box
              sx={{
                p: 2,
                bgcolor: "rgba(0,0,0,0.025)",
                borderRadius: 2,
                mb: 2.5,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase">
                    Order
                  </Typography>
                  <Typography fontWeight={800}>#{bill.orderNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase">
                    Customer
                  </Typography>
                  <Typography fontWeight={700}>{bill.customerName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase">
                    Table
                  </Typography>
                  <Typography fontWeight={700}>{bill.tableNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase">
                    Date
                  </Typography>
                  <Typography fontWeight={700}>
                    {paidDate?.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Box>

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
                      Rate
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bill.items.map((item, idx) => (
                    <TableRow key={idx} hover>
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

            {/* Totals section */}
            <Box sx={{ bgcolor: "rgba(0,0,0,0.025)", borderRadius: 2, p: 2, mb: 3 }}>
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
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={800}>
                    Total Paid
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color="secondary.main"
                    sx={{ fontSize: "1.1rem" }}
                  >
                    ₹{bill.grandTotal.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Payment method badge */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="body2" color="text.secondary">
                Payment via
              </Typography>
              <Chip
                label={bill.method}
                sx={{
                  bgcolor: methodStyle.bg,
                  color: methodStyle.color,
                  fontWeight: 800,
                  fontSize: "0.8rem",
                }}
              />
            </Stack>

            {/* Footer actions */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{ flex: 1 }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DownloadRoundedIcon />}
                onClick={handlePrint}
                sx={{ flex: 1 }}
              >
                Print / Save
              </Button>
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
