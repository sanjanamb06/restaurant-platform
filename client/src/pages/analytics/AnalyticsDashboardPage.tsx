import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getIngredientUsageData,
  getOrderVolumeData,
  getPopularItems,
  getRevenueData,
} from "../../api/analytics.api";
import type {
  IngredientUsage,
  OrderVolumeData,
  PopularItem,
  RevenueData,
} from "../../types/analytics";
import ForecastTab from "./ForecastTab";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLORS = ["#D89426", "#567A5A", "#4E7A91", "#C65D3B", "#7F7F7F"];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsDashboardPage() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [orders, setOrders] = useState<OrderVolumeData[]>([]);
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [ingredientUsage, setIngredientUsage] = useState<IngredientUsage[]>([]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [revRes, ordRes, popRes, ingRes] = await Promise.all([
          getRevenueData(days),
          getOrderVolumeData(days),
          getPopularItems(5),
          getIngredientUsageData(days),
        ]);
        setRevenue(revRes);
        setOrders(ordRes);
        setPopular(popRes);
        setIngredientUsage(ingRes);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, [days]);

  // Derived metrics
  const totalRevenue = revenue.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = orders.reduce((sum, item) => sum + item.orders, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: "calc(100dvh - 64px)", overflowY: "auto", bgcolor: "background.default" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              borderRadius: 3,
              bgcolor: "rgba(86,122,90,.1)",
              color: "success.dark",
            }}
          >
            <BarChartRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} lineHeight={1.2}>
              Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High-level overview of restaurant performance
            </Typography>
          </Box>
        </Stack>

        {activeTab === 0 && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              <MenuItem value={7}>Last 7 Days</MenuItem>
              <MenuItem value={30}>Last 30 Days</MenuItem>
              <MenuItem value={90}>Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Tab switcher */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v as number)} textColor="primary" indicatorColor="primary">
          <Tab icon={<BarChartRoundedIcon fontSize="small" />} iconPosition="start" label="Performance" sx={{ fontWeight: 700, minHeight: 48 }} />
          <Tab icon={<PsychologyRoundedIcon fontSize="small" />} iconPosition="start" label="AI Forecast" sx={{ fontWeight: 700, minHeight: 48 }} />
        </Tabs>
      </Box>

      {isLoading && activeTab === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : activeTab === 1 ? (
        <ForecastTab />
      ) : (
        <Grid container spacing={3}>
          {/* KPIs */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL REVENUE
                </Typography>
                <Typography variant="h4" fontWeight={900} color="secondary.dark" mt={0.5}>
                  {formatCurrency(totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL ORDERS
                </Typography>
                <Typography variant="h4" fontWeight={900} color="primary.main" mt={0.5}>
                  {totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  AVERAGE ORDER VALUE
                </Typography>
                <Typography variant="h4" fontWeight={900} mt={0.5}>
                  {formatCurrency(averageOrderValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Area Chart */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider", height: 400 }}>
              <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <TrendingUpRoundedIcon color="secondary" />
                  <Typography variant="h6" fontWeight={800}>Revenue Trend</Typography>
                </Stack>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenue}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#567A5A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#567A5A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(val) => `₹${val}`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        labelFormatter={(label) => formatDateLabel(label as string)}
                        formatter={(val: number) => [formatCurrency(val), "Revenue"]}
                        contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#567A5A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Popular Items Pie Chart */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider", height: 400 }}>
              <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <RestaurantMenuRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>Top Menu Items</Typography>
                </Stack>
                {popular.length === 0 ? (
                  <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
                    <Typography color="text.secondary">No sales data yet.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={popular}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="totalSold"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                        >
                          {popular.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [`${val} orders`, "Sold"]}
                          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Order Volume Bar Chart */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider", height: 360 }}>
              <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <BarChartRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>Order Volume</Typography>
                </Stack>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orders}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        labelFormatter={(label) => formatDateLabel(label as string)}
                        contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                      />
                      <Bar dataKey="orders" fill="#D89426" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Ingredient Burn Rate */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid", borderColor: "divider", height: 360 }}>
              <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <KitchenRoundedIcon sx={{ color: "#4E7A91" }} />
                  <Typography variant="h6" fontWeight={800}>Ingredient Usage (Top 10)</Typography>
                </Stack>
                {ingredientUsage.length === 0 ? (
                  <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
                    <Typography color="text.secondary">No deduction data yet.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ingredientUsage} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={false} width={100} />
                        <Tooltip
                          formatter={(val: number, _name: string, props: any) => [`${val} ${props.payload.unit}`, "Consumed"]}
                          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                        />
                        <Bar dataKey="totalUsed" fill="#4E7A91" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
