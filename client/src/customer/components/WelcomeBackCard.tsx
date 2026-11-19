import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";

interface WelcomeBackCardProps {
  customerName: string;
  tableNumber: number;
  onContinue: () => void;
  onStartNew: () => void;
  isLoading?: boolean;
}

export default function WelcomeBackCard({
  customerName,
  tableNumber,
  onContinue,
  onStartNew,
  isLoading = false,
}: WelcomeBackCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4">Welcome back, {customerName}!</Typography>
            <Typography color="text.secondary" mt={0.75}>
              We found your session for Table {tableNumber}.
            </Typography>
          </Box>
          <Stack spacing={1.25}>
            <Button variant="contained" onClick={onContinue} disabled={isLoading}>
              {isLoading ? "Checking..." : "Continue session"}
            </Button>
            <Button color="inherit" onClick={onStartNew} disabled={isLoading}>
              Start new session
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
