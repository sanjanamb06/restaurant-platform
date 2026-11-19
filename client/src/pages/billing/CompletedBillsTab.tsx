import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { CompletedBill } from "../../types/billing";

// ---------------------------------------------------------------------------
// Payment method colour config
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  CASH: { bg: "rgba(86,122,90,.12)", color: "#3F6845" },
  UPI: { bg: "rgba(78,122,145,.12)", color: "#365F73" },
  CARD: { bg: "rgba(198,93,59,.12)", color: "#873D29" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompletedBillsTabProps {
  bills: CompletedBill[];
  isLoading: boolean;
  error: string | null;
  onViewInvoice: (bill: CompletedBill) => void;
}

// ---------------------------------------------------------------------------
// Skeleton rows while loading
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <TableRow>
      {[...Array(7)].map((_, i) => (
        <TableCell key={i}>
          <Skeleton variant="text" width={i === 0 ? 100 : 70} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompletedBillsTab({
  bills,
  isLoading,
  error,
  onViewInvoice,
}: CompletedBillsTabProps) {
  if (error) {
    return <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>;
  }

  if (!isLoading && bills.length === 0) {
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
        <HistoryRoundedIcon sx={{ fontSize: 64, opacity: 0.35 }} />
        <Typography variant="h6" fontWeight={700} color="text.secondary">
          No completed bills yet
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={320}>
          Bills will appear here once a payment is processed.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        mt: 0.5,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
            {[
              "Receipt #",
              "Order #",
              "Customer",
              "Table",
              "Method",
              "Total (₹)",
              "Time",
              "",
            ].map((header) => (
              <TableCell
                key={header}
                sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            : bills.map((bill) => {
                const methodStyle =
                  METHOD_COLORS[bill.method] ?? METHOD_COLORS["CASH"];
                return (
                  <TableRow
                    key={bill.paymentId}
                    hover
                    sx={{
                      "&:last-child td": { border: 0 },
                      transition: "background 150ms",
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        fontFamily="monospace"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {bill.receiptNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        #{bill.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{bill.customerName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{bill.tableNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={bill.method}
                        size="small"
                        sx={{
                          bgcolor: methodStyle.bg,
                          color: methodStyle.color,
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="secondary.dark">
                        ₹{bill.grandTotal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(bill.paidAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {new Date(bill.paidAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Invoice">
                        <IconButton
                          size="small"
                          onClick={() => onViewInvoice(bill)}
                          sx={{ color: "text.secondary" }}
                        >
                          <OpenInNewRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
