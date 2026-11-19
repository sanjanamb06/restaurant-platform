import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { StockItem } from "../../types/inventory";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StockOverviewTabProps {
  stock: StockItem[];
  isLoading: boolean;
  onAdjustStock: (item: StockItem) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StockOverviewTab({
  stock,
  isLoading,
  onAdjustStock,
}: StockOverviewTabProps) {
  const [search, setSearch] = useState("");

  const filteredStock = useMemo(() => {
    if (!search.trim()) return stock;
    const lower = search.toLowerCase();
    return stock.filter((item) => item.name.toLowerCase().includes(lower));
  }, [stock, search]);

  if (!isLoading && stock.length === 0) {
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
        <KitchenRoundedIcon sx={{ fontSize: 64, opacity: 0.35 }} />
        <Typography variant="h6" fontWeight={700} color="text.secondary">
          No ingredients found
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={320}>
          Add ingredients in the Menu section to start tracking inventory.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Ingredient</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Current Stock</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.5 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={200} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell align="right"><Skeleton width={80} sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              : filteredStock.map((item) => {
                  const outOfStock = item.currentStock === 0;
                  const threshold = item.lowStockThreshold ?? 0;
                  const maxVisual = Math.max(item.currentStock, threshold * 2, 10);
                  const progressValue = (item.currentStock / maxVisual) * 100;

                  return (
                    <TableRow key={item.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: "40%" }}>
                        <Stack spacing={1} sx={{ maxWidth: 300 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                            <Typography variant="body2" fontWeight={800} color={outOfStock ? "error.main" : item.isLowStock ? "warning.main" : "text.primary"}>
                              {item.currentStock.toFixed(2)} {item.unit}
                            </Typography>
                            {item.lowStockThreshold !== null && (
                              <Typography variant="caption" color="text.secondary">
                                Min: {item.lowStockThreshold.toFixed(2)} {item.unit}
                              </Typography>
                            )}
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={progressValue}
                            color={outOfStock ? "error" : item.isLowStock ? "warning" : "success"}
                            sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.05)" }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {outOfStock ? (
                          <Chip label="Out of Stock" color="error" size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                        ) : item.isLowStock ? (
                          <Chip label="Low Stock" color="warning" size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                        ) : (
                          <Chip label="Healthy" color="success" size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22, bgcolor: "rgba(86,122,90,.12)", color: "#3F6845" }} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditRoundedIcon />}
                          onClick={() => onAdjustStock(item)}
                          sx={{ borderRadius: 2 }}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            {!isLoading && filteredStock.length === 0 && search.trim() !== "" && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No ingredients match "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
