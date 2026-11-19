import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { PublicMenu, PublicMenuCategory } from "../api/publicOrder.api";
import { useCart } from "../context/CartContext";
import CustomerFoodCard, { formatCustomerPrice } from "./CustomerFoodCard";

interface CustomerMenuProps {
  menu: PublicMenu;
  onOpenCart: () => void;
}

function flattenItems(categories: PublicMenuCategory[]) {
  return categories.flatMap((category) => category.items);
}

export default function CustomerMenu({ menu, onOpenCart }: CustomerMenuProps) {
  const { addItem, setQuantity, getQuantity, totalItems, total } = useCart();
  const [selectedCategoryId, setSelectedCategoryId] = useState(menu.categories[0]?.id ?? "");
  const visibleCategories = menu.categories.filter((category) => category.items.length > 0);
  const visibleItems = useMemo(() => {
    if (!selectedCategoryId) return flattenItems(visibleCategories);
    return visibleCategories.find((category) => category.id === selectedCategoryId)?.items ?? [];
  }, [selectedCategoryId, visibleCategories]);

  if (visibleCategories.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h5">This restaurant's menu isn't ready yet</Typography>
          <Typography color="text.secondary" mt={1}>
            Please ask a staff member and they'll help you out.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box pb={totalItems > 0 ? 11 : 3}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4">{menu.restaurantName}</Typography>
            <Typography color="text.secondary" mt={0.5}>
              Pick what sounds good. We'll send it straight to the kitchen.
            </Typography>
          </Box>

          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              bgcolor: "background.default",
              py: 1,
              mx: -1,
              px: 1,
              overflowX: "auto",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ minWidth: "max-content" }}>
              {visibleCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  clickable
                  color={selectedCategoryId === category.id ? "primary" : "default"}
                  variant={selectedCategoryId === category.id ? "filled" : "outlined"}
                  onClick={() => setSelectedCategoryId(category.id)}
                />
              ))}
            </Stack>
          </Box>

          <Grid container spacing={2}>
            {visibleItems.map((item) => (
              <Grid item xs={12} sm={6} key={item.id}>
                <CustomerFoodCard
                  item={item}
                  quantity={getQuantity(item.id)}
                  onAdd={() => addItem(item)}
                  onChangeQuantity={(quantity) => setQuantity(item, quantity)}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {totalItems > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 20,
            p: 1,
            borderRadius: 4,
          }}
        >
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCartRoundedIcon />}
            onClick={onOpenCart}
            sx={{ justifyContent: "space-between", minHeight: 52 }}
          >
            <span>View cart ({totalItems} item{totalItems === 1 ? "" : "s"})</span>
            <span>{formatCustomerPrice(total)}</span>
          </Button>
        </Paper>
      )}
    </Box>
  );
}
