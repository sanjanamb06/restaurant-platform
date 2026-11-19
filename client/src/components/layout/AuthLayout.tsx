import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import { Box, Card, CardContent, Container, Fade, Stack, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  wide?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  icon,
  wide = false,
  children,
}: AuthLayoutProps) {
  return (
    <Container maxWidth={wide ? "md" : "sm"} sx={{ py: { xs: 4, md: 8 } }}>
      <Fade in timeout={450}>
        <Box>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={4}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: 3,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <RestaurantMenuRoundedIcon />
            </Box>
            <Typography variant="h5">Gather</Typography>
          </Stack>
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Box textAlign="center" mb={4}>
                <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}>
                  {icon} {title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 580, mx: "auto" }}>
                  {subtitle}
                </Typography>
              </Box>
              {children}
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Container>
  );
}
