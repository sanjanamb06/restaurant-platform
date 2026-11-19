import { Box, CircularProgress, Fade, Typography } from "@mui/material";

interface LoadingScreenProps {
  message?: string;
  compact?: boolean;
}

export default function LoadingScreen({
  message = "Cooking up your dashboard...",
  compact = false,
}: LoadingScreenProps) {
  return (
    <Fade in timeout={350}>
      <Box
        role="status"
        sx={{
          minHeight: compact ? 220 : "100vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          px: 3,
        }}
      >
        <Box>
          <CircularProgress size={42} thickness={4.5} color="primary" />
          <Typography color="text.secondary" sx={{ mt: 2, fontWeight: 650 }}>
            {message}
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
}
