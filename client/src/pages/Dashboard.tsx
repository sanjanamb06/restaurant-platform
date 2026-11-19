import { useState } from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { Box, Button, Card, CardContent, Chip, Container, Fade, Stack, Typography, useTheme } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

const roleColors: Record<Role, { bg: string; color: string }> = {
  [Role.ADMIN]: { bg: "#F5D8CC", color: "#873D29" },
  [Role.MANAGER]: { bg: "#DCE9DC", color: "#3F6845" },
  [Role.CHEF]: { bg: "#F9E8BE", color: "#815B13" },
  [Role.CASHIER]: { bg: "#D9E7EE", color: "#365F73" },
};

export default function Dashboard() {
  const { user, restaurant } = useAuth();
  const roleStyle = roleColors[user?.role ?? Role.CASHIER];
  const theme = useTheme();

  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const orderUrl = `http://localhost:5173/order/${restaurant?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Fade in timeout={450}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2.15rem", md: "3rem" } }}>
            Hey {user?.name} 👋
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} mt={1.5}>
            <Typography color="text.secondary">Good to have you here.</Typography>
            <Chip label={user?.role.toLowerCase()} sx={{ bgcolor: roleStyle.bg, color: roleStyle.color, textTransform: "capitalize" }} />
          </Stack>
          <Card sx={{ mt: 5, maxWidth: 720, overflow: "hidden" }}>
            <Box sx={{ height: 7, bgcolor: "primary.main" }} />
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}>
                <Box sx={{ width: 70, height: 70, display: "grid", placeItems: "center", borderRadius: 4, bgcolor: "rgba(198,93,59,.12)", color: "primary.main" }}>
                  <RestaurantRoundedIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h5">{restaurant?.name}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    This is your new home base. More restaurant tools will settle in here soon.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {user?.role !== Role.CHEF && (
            <Card sx={{ mt: 3, maxWidth: 720, overflow: "hidden" }}>
              <Box sx={{ height: 7, bgcolor: "primary.main" }} />
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <QrCode2Icon color="primary" />
                  <Typography variant="h6">QR Ordering</Typography>
                </Stack>
                <Typography color="text.secondary" mb={2}>
                  Share this link with your customers so they can scan and order from their phones.
                </Typography>
                <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.04)", borderRadius: 2, mb: 3 }}>
                  <Typography sx={{ wordBreak: "break-all", fontFamily: "monospace", color: "text.primary" }}>
                    {orderUrl}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} mb={showQR ? 3 : 0}>
                  <Button variant="contained" onClick={handleCopyLink} disableElevation>
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button variant="outlined" onClick={() => setShowQR(!showQR)}>
                    {showQR ? "Hide QR Code" : "Show QR Code"}
                  </Button>
                </Stack>
                {showQR && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <QRCodeSVG value={orderUrl} size={180} fgColor={theme.palette.primary.main} />
                  </Box>
                )}
                <Typography variant="caption" color="text.disabled" display="block" mt={3}>
                  This link is for your customers. Do not share your staff login credentials through this.
                </Typography>
              </CardContent>
            </Card>
          )}

          <Stack direction="row" alignItems="center" spacing={1} mt={3} color="text.secondary">
            <AccessTimeRoundedIcon fontSize="small" />
            <Typography variant="body2">Everything is up to date.</Typography>
          </Stack>
        </Box>
      </Fade>
    </Container>
  );
}
