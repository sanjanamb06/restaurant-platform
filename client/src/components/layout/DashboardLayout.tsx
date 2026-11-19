import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardNavItems } from "../../navigation/dashboardNav";

const drawerWidth = 244;

export default function DashboardLayout() {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = getDashboardNavItems(user?.role);

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} px={1} py={1.5}>
        <Box
          sx={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 3, bgcolor: "primary.main", color: "white" }}
        >
          <RestaurantMenuRoundedIcon />
        </Box>
        <Typography variant="h6">Gather</Typography>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end ?? item.to === "/dashboard"}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 3,
              mb: 0.75,
              "&.active": { bgcolor: "rgba(198,93,59,.12)", color: "primary.dark" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid rgba(52,43,39,.08)",
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "rgba(255,255,255,.88)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography fontWeight={800} noWrap>{restaurant?.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Your restaurant workspace
            </Typography>
          </Box>
          <Button
            color="inherit"
            startIcon={isLoggingOut ? <CircularProgress size={17} color="inherit" /> : <LogoutRoundedIcon />}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {isLoggingOut ? "Signing out..." : "Log out"}
            </Box>
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            border: 0,
            boxShadow: "8px 0 35px rgba(72,47,35,.06)",
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, pt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
