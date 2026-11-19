import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { LowStockAlert } from "../../types/inventory";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LowStockAlertsTabProps {
  alerts: LowStockAlert[];
  isLoading: boolean;
  error: string | null;
  onAdjustStock: (ingredientId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LowStockAlertsTab({
  alerts,
  isLoading,
  error,
  onAdjustStock,
}: LowStockAlertsTabProps) {
  if (isLoading) {
    return (
      <Grid container spacing={2.5}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box sx={{ height: 4, bgcolor: "action.hover" }} />
              <CardContent>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rounded" height={36} sx={{ mt: 2, borderRadius: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (alerts.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 10,
          gap: 1.5,
          color: "success.main",
        }}
      >
        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 64, opacity: 0.5 }} />
        <Typography variant="h6" fontWeight={700}>
          All Clear
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No ingredients are currently below their low-stock threshold.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {alerts.map((alert) => {
        const outOfStock = alert.currentStock === 0;
        const colorMain = outOfStock ? "error.main" : "warning.main";
        const colorBg = outOfStock ? "error.lighter" : "warning.lighter";
        const Icon = outOfStock ? ErrorOutlineRoundedIcon : WarningRoundedIcon;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={alert.ingredientId}>
            <Card
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid",
                borderColor: outOfStock ? "error.light" : "warning.light",
                boxShadow: "none",
                transition: "transform 150ms ease",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box sx={{ height: 4, bgcolor: colorMain }} />
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
                  <Box sx={{ color: colorMain, mt: 0.25 }}>
                    <Icon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                      {alert.name}
                    </Typography>
                    <Typography variant="caption" color={colorMain} fontWeight={700}>
                      {outOfStock ? "OUT OF STOCK" : "LOW STOCK"}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ p: 1.5, bgcolor: colorBg, borderRadius: 2, mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Current:</Typography>
                    <Typography variant="body2" fontWeight={800} color={colorMain}>
                      {alert.currentStock.toFixed(2)} {alert.unit}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Minimum:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {alert.lowStockThreshold.toFixed(2)} {alert.unit}
                    </Typography>
                  </Stack>
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  color={outOfStock ? "error" : "warning"}
                  startIcon={<EditRoundedIcon />}
                  onClick={() => onAdjustStock(alert.ingredientId)}
                  sx={{ borderRadius: 2 }}
                >
                  Restock
                </Button>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
