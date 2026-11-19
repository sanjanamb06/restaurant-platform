import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatCustomerPrice } from "./CustomerFoodCard";

interface CartDrawerProps {
  open: boolean;
  mode: "create" | "join";
  error?: string;
  onClose: () => void;
  onSubmit: (input: { specialInstructions?: string; idempotencyKey: string }) => Promise<void>;
}

export default function CartDrawer({ open, mode, error, onClose, onSubmit }: CartDrawerProps) {
  const { items, totalItems, total, removeItem } = useCart();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const key = idempotencyKey || crypto.randomUUID();
    setIdempotencyKey(key);
    setIsSubmitting(true);
    try {
      await onSubmit({
        specialInstructions: specialInstructions.trim() || undefined,
        idempotencyKey: key,
      });
      setSpecialInstructions("");
      setIdempotencyKey("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    if (isSubmitting) return;
    setIdempotencyKey("");
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={close}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          px: 2,
          pt: 1,
          pb: 2,
          maxHeight: "88vh",
        },
      }}
    >
      <Box sx={{ width: 44, height: 5, borderRadius: 99, bgcolor: "divider", mx: "auto", mb: 2 }} />
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5">
            {mode === "join" ? "Add these to the order" : "Your cart"}
          </Typography>
          <Typography color="text.secondary">
            {totalItems} item{totalItems === 1 ? "" : "s"} · {formatCustomerPrice(total)}
          </Typography>
        </Box>

        <Stack spacing={1.25} sx={{ overflowY: "auto" }}>
          {items.map((entry) => (
            <Stack
              key={entry.item.id}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box minWidth={0}>
                <Typography fontWeight={800} noWrap>
                  {entry.quantity} x {entry.item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCustomerPrice(entry.quantity * entry.item.price)}
                </Typography>
              </Box>
              <IconButton color="error" onClick={() => removeItem(entry.item.id)}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>

        {mode === "create" && (
          <TextField
            label="Anything the kitchen should know?"
            value={specialInstructions}
            onChange={(event) => setSpecialInstructions(event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
        )}

        {error && (
          <Typography color="error.main" variant="body2">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          disabled={items.length === 0 || isSubmitting}
          onClick={() => void submit()}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? "Sending..." : mode === "join" ? "Add to order" : "Place order"}
        </Button>
      </Stack>
    </Drawer>
  );
}
