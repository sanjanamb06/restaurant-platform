import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Box,
  Chip,
  IconButton,
  Pagination,
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
import { Link as RouterLink } from "react-router-dom";
import type { StockHistoryPage } from "../../types/inventory";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StockHistoryTabProps {
  historyPage: StockHistoryPage | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StockHistoryTab({
  historyPage,
  isLoading,
  onPageChange,
}: StockHistoryTabProps) {
  if (!isLoading && (!historyPage || historyPage.entries.length === 0)) {
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
          No history yet
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={320}>
          Stock deductions from orders and manual adjustments will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Ingredient</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Change</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Reason</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>
                Ref
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && !historyPage
              ? [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={140} /></TableCell>
                    <TableCell align="right"><Skeleton width={30} sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              : historyPage?.entries.map((entry) => {
                  const isDeduction = entry.changeAmount < 0;
                  return (
                    <TableRow key={entry.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          {new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.ingredientName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color={isDeduction ? "warning.main" : "success.main"}
                        >
                          {isDeduction ? "" : "+"}
                          {entry.changeAmount.toFixed(2)} {entry.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {entry.reason === "ORDER_DEDUCTION" ? (
                          <Chip
                            icon={<RestaurantMenuRoundedIcon fontSize="small" />}
                            label="Order Deduction"
                            size="small"
                            sx={{
                              bgcolor: "rgba(198,93,59,.1)",
                              color: "primary.main",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              "& .MuiChip-icon": { color: "primary.main" },
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<TuneRoundedIcon fontSize="small" />}
                            label="Manual Adjustment"
                            size="small"
                            sx={{
                              bgcolor: "rgba(78,122,145,.1)",
                              color: "info.main",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              "& .MuiChip-icon": { color: "info.main" },
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {entry.referenceId && entry.reason === "ORDER_DEDUCTION" ? (
                          <Tooltip title={`View Order: ${entry.referenceId}`}>
                            <IconButton
                              size="small"
                              component={RouterLink}
                              to="/orders"
                              sx={{ color: "text.disabled" }}
                            >
                              <OpenInNewRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>

      {historyPage && historyPage.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={historyPage.totalPages}
            page={historyPage.page}
            onChange={(_e, val) => onPageChange(val)}
            color="primary"
            size="small"
            disabled={isLoading}
          />
        </Box>
      )}
    </Box>
  );
}
