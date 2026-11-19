import { alpha, createTheme } from "@mui/material/styles";

const terracotta = "#C65D3B";
const deepTerracotta = "#93452F";
const sage = "#567A5A";
const ink = "#342B27";
const cream = "#FFF9F2";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: terracotta,
      dark: deepTerracotta,
      light: "#E99A7B",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: sage,
      dark: "#3F5D43",
      light: "#90AD91",
      contrastText: "#FFFFFF",
    },
    background: {
      default: cream,
      paper: "#FFFFFF",
    },
    text: {
      primary: ink,
      secondary: "#74645D",
    },
    warning: { main: "#D89426" },
    info: { main: "#4E7A91" },
    success: { main: sage },
    error: { main: "#B8433F" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Nunito Sans", "Segoe UI", system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.035em" },
    h2: { fontWeight: 800, letterSpacing: "-0.025em" },
    h3: { fontWeight: 750, letterSpacing: "-0.02em" },
    h4: { fontWeight: 750, letterSpacing: "-0.015em" },
    h5: { fontWeight: 750 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none", letterSpacing: "0.01em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at 8% 5%, rgba(232, 166, 126, .18), transparent 28%), radial-gradient(circle at 92% 90%, rgba(86, 122, 90, .12), transparent 30%)",
          backgroundAttachment: "fixed",
        },
        "::selection": { background: alpha(terracotta, 0.24) },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 20,
          minHeight: 44,
          transition: "transform 160ms ease, box-shadow 160ms ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: `0 8px 20px ${alpha(terracotta, 0.2)}`,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: alpha("#FFFFFF", 0.8),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: "0 18px 55px rgba(72, 47, 35, 0.10)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: "0 24px 70px rgba(72, 47, 35, 0.18)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9, fontWeight: 700 },
      },
    },
  },
});
