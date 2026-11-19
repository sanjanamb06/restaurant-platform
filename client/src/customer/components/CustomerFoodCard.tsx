import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { Box, Button, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { PublicMenuItem } from "../api/publicOrder.api";

interface CustomerFoodCardProps {
  item: PublicMenuItem;
  quantity: number;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}

function formatCustomerPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function CustomerFoodCard({
  item,
  quantity,
  onAdd,
  onChangeQuantity,
}: CustomerFoodCardProps) {
  return (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          height: 118,
          bgcolor: item.imageUrl ? "grey.200" : "rgba(198,93,59,.10)",
          backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "grid",
          placeItems: "center",
          color: "primary.main",
        }}
      >
        {!item.imageUrl && <RestaurantRoundedIcon sx={{ fontSize: 44, opacity: 0.55 }} />}
      </Box>
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="h6">{item.name}</Typography>
              <Typography fontWeight={800} color="primary.dark" whiteSpace="nowrap">
                {formatCustomerPrice(item.price)}
              </Typography>
            </Stack>
            {item.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.75,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.description}
              </Typography>
            )}
          </Box>

          {quantity > 0 ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onChangeQuantity(quantity - 1)}
              >
                <RemoveRoundedIcon fontSize="small" />
              </IconButton>
              <Typography fontWeight={800}>{quantity}</Typography>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onChangeQuantity(quantity + 1)}
              >
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onAdd}>
              Add to cart
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export { formatCustomerPrice };
