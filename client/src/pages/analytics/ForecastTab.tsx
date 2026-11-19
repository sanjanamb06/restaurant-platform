import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDemandForecast, triggerTraining } from "../../api/forecast.api";
import type { ForecastResponse, ItemForecast } from "../../types/forecast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

const CHART_COLORS = ["#D89426", "#567A5A", "#4E7A91", "#C65D3B", "#7F7F7F", "#9C59D1"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForecastTab() {
  const [horizon, setHorizon] = useState(7);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  const loadForecast = useCallback(async (h: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDemandForecast(h);
      setForecast(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        "Failed to load forecast.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadForecast(horizon);
  }, [loadForecast, horizon]);

  const handleTrain = async () => {
    setIsTraining(true);
    try {
      const result = await triggerTraining();
      setToast({
        open: true,
        message: result.message,
        severity: "success",
      });
      // Reload forecast after training
      await loadForecast(horizon);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Training failed.";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setIsTraining(false);
    }
  };

  // Flatten all forecasts to a unified chart dataset: [{date, itemName: qty, ...}]
  const buildChartData = (items: ItemForecast[]) => {
    const dateMap = new Map<string, Record<string, number>>();
    for (const item of items) {
      for (const pred of item.predictions) {
        if (!dateMap.has(pred.date)) dateMap.set(pred.date, { date: pred.date as unknown as number });
        dateMap.get(pred.date)![item.menuItemName ?? item.menuItemId] = pred.predictedQuantity;
      }
    }
    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  };

  const chartData = forecast?.forecasts ? buildChartData(forecast.forecasts) : [];
  const itemNames = forecast?.forecasts.map((f) => f.menuItemName ?? f.menuItemId) ?? [];

  return (
    <Box>
      {/* Header row */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(156,89,209,.12)", color: "#9C59D1" }}>
            <PsychologyRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>AI Demand Forecast</Typography>
            <Typography variant="caption" color="text.secondary">
              XGBoost predictions — estimated daily orders per menu item
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              <MenuItem value={3}>3 Days</MenuItem>
              <MenuItem value={7}>7 Days</MenuItem>
              <MenuItem value={14}>14 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Re-train models with latest order data">
            <Button
              variant="outlined"
              startIcon={isTraining ? <CircularProgress size={16} /> : <AutorenewRoundedIcon />}
              onClick={handleTrain}
              disabled={isTraining}
              sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
            >
              {isTraining ? "Training…" : "Retrain AI"}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Error state — usually means ai-service is not running */}
      {error && !isLoading && (
        <Alert
          severity="warning"
          icon={<WarningAmberRoundedIcon />}
          sx={{ borderRadius: 3, mb: 3 }}
          action={
            <Button size="small" onClick={() => void loadForecast(horizon)}>Retry</Button>
          }
        >
          <strong>AI service unavailable.</strong> {error}
          <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
            Start the AI service: <code>cd ai-service &amp;&amp; python main.py</code>
          </Typography>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty state — service is up but no models trained yet */}
      {!isLoading && !error && forecast?.forecasts.length === 0 && (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <PsychologyRoundedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            No Forecast Available
          </Typography>
          <Typography variant="body2" color="text.disabled" mb={3} maxWidth={400} mx="auto">
            The AI model needs more order history to make predictions. Process a few orders, then click <strong>Retrain AI</strong>.
          </Typography>
          <Button variant="contained" startIcon={<AutorenewRoundedIcon />} onClick={handleTrain} disabled={isTraining}>
            {isTraining ? "Training…" : "Train Now"}
          </Button>
        </Box>
      )}

      {/* Charts */}
      {!isLoading && !error && forecast && forecast.forecasts.length > 0 && (
        <Grid container spacing={3}>
          {/* Main combined line chart */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <TrendingUpRoundedIcon sx={{ color: "#9C59D1" }} />
                  <Typography variant="h6" fontWeight={800}>Predicted Daily Demand</Typography>
                  <Chip label={`${horizon}-day horizon`} size="small" sx={{ bgcolor: "rgba(156,89,209,.1)", color: "#9C59D1", fontWeight: 700 }} />
                </Stack>
                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        labelFormatter={formatDateLabel}
                        contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                        formatter={(val: number, name: string) => [`${val.toFixed(1)} units`, name]}
                      />
                      <Legend />
                      {itemNames.map((name, idx) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Plain-English legend below the chart */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: "rgba(156,89,209,.05)", borderRadius: 3, border: "1px solid rgba(156,89,209,.15)" }}>
              <Typography variant="body2" fontWeight={700} color="#9C59D1" mb={0.75}>
                How to read this chart
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                Each line represents one menu item. The Y-axis shows the number of plates the AI expects to be ordered on that day.
                A steep rise towards the weekend means the system expects higher demand — plan your ingredient stock and kitchen prep accordingly.
              </Typography>
            </Box>
          </Grid>
          {forecast.forecasts.map((item, idx) => {
            const totalPredicted = item.predictions.reduce((s, p) => s + p.predictedQuantity, 0);
            const avgConfidence = item.predictions.reduce((s, p) => s + p.confidence, 0) / item.predictions.length;
            const peakDay = item.predictions.reduce((a, b) => a.predictedQuantity > b.predictedQuantity ? a : b);

            const confidenceLabel =
              avgConfidence >= 0.85
                ? "Very reliable"
                : avgConfidence >= 0.65
                ? "Fairly reliable"
                : "Use as a rough guide";

            const confidenceColor =
              avgConfidence >= 0.85
                ? "success.main"
                : avgConfidence >= 0.65
                ? "warning.main"
                : "error.main";

            return (
              <Grid item xs={12} sm={6} lg={4} key={item.menuItemId}>
                <Card sx={{ borderRadius: 3, boxShadow: "none", border: "1px solid", borderColor: "divider", height: "100%" }}>
                  <Box sx={{ height: 4, bgcolor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={0.5} noWrap>
                      {item.menuItemName ?? item.menuItemId}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={2}>
                      Over the next {horizon} day{horizon > 1 ? "s" : ""}
                    </Typography>
                    <Grid container spacing={1.5}>

                      {/* Total Forecast */}
                      <Grid item xs={6}>
                        <Tooltip
                          title="The total number of plates the AI expects to be ordered over the full forecast period. Use this to decide how much stock to buy before the period begins."
                          placement="top"
                          arrow
                        >
                          <Box sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2, cursor: "help" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                              PLATES TO PREPARE
                            </Typography>
                            <Typography variant="h6" fontWeight={900}>
                              {totalPredicted.toFixed(0)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              estimated orders
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>

                      {/* Confidence */}
                      <Grid item xs={6}>
                        <Tooltip
                          title={
                            avgConfidence >= 0.85
                              ? "The AI is very confident. This item sells consistently, so the prediction should be close to actual demand."
                              : avgConfidence >= 0.65
                              ? "The AI is reasonably confident. Sales vary a bit day to day, so treat this as a good estimate rather than an exact number."
                              : "Sales of this item have been quite unpredictable. Use this as a rough guide and keep a small safety buffer in stock."
                          }
                          placement="top"
                          arrow
                        >
                          <Box sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2, cursor: "help" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                              HOW SURE IS THE AI
                            </Typography>
                            <Typography variant="h6" fontWeight={900} color={confidenceColor}>
                              {(avgConfidence * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="caption" color={confidenceColor} fontWeight={600}>
                              {confidenceLabel}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>

                      {/* Busiest Day */}
                      <Grid item xs={12}>
                        <Box sx={{ p: 1.5, bgcolor: "rgba(156,89,209,.07)", borderRadius: 2 }}>
                          <Typography variant="caption" color="#9C59D1" fontWeight={700} display="block">
                            STOCK UP BEFORE
                          </Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {formatDateLabel(peakDay.date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Expected {peakDay.predictedQuantity.toFixed(0)} orders on this day — your busiest ahead
                          </Typography>
                        </Box>
                      </Grid>

                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 3, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
