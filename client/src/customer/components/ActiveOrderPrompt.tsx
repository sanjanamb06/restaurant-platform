import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { PublicOrder } from "../api/publicOrder.api";

interface ActiveOrderPromptProps {
  tableNumber: number;
  order: PublicOrder;
  onJoin: () => void;
  onCreateSeparate: () => void;
}

export default function ActiveOrderPrompt({
  tableNumber,
  order,
  onJoin,
  onCreateSeparate,
}: ActiveOrderPromptProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="h4">Table {tableNumber} already has an order</Typography>
            <Typography color="text.secondary" mt={0.75}>
              Order #{order.orderNumber} is currently {order.status.toLowerCase()}.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Order #${order.orderNumber}`} color="primary" />
            <Chip label={order.status} variant="outlined" />
          </Stack>

          {order.items.length > 0 && (
            <Stack spacing={0.75}>
              {order.items.slice(0, 3).map((item) => (
                <Typography key={`${item.menuItemId}-${item.name}`} variant="body2">
                  {item.quantity} x {item.name}
                </Typography>
              ))}
              {order.items.length > 3 && (
                <Typography variant="body2" color="text.secondary">
                  Plus {order.items.length - 3} more item{order.items.length - 3 === 1 ? "" : "s"}
                </Typography>
              )}
            </Stack>
          )}

          <Stack spacing={1.25}>
            <Button variant="contained" onClick={onJoin}>
              Join existing order
            </Button>
            <Button color="inherit" onClick={onCreateSeparate}>
              Create separate order
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
