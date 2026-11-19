import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { createMenuItem, updateMenuItem } from "../../api/menuItem.api";
import { Category, MenuItem as MenuItemType, MenuItemInput } from "../../types/menu";
import { getApiError } from "../../utils/apiError";

interface AddEditFoodModalProps {
  open: boolean;
  item?: MenuItemType | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: (item: MenuItemType, isNew: boolean) => void | Promise<void>;
}

const emptyForm: MenuItemInput = {
  name: "",
  description: "",
  price: 0,
  categoryId: "",
  isAvailable: true,
};

export default function AddEditFoodModal({
  open,
  item,
  categories,
  onClose,
  onSuccess,
}: AddEditFoodModalProps) {
  const [form, setForm] = useState<MenuItemInput>(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? {
            name: item.name,
            description: item.description ?? "",
            price: item.price,
            categoryId: item.categoryId,
            isAvailable: item.isAvailable,
          }
        : {
            ...emptyForm,
            categoryId: categories[0]?.id ?? "",
          },
    );
    setError("");
  }, [categories, item, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Dish name needs at least 2 characters.");
      return;
    }
    if (!form.categoryId) {
      setError("Pick a category first.");
      return;
    }
    if (!form.price || form.price <= 0) {
      setError("Price must be greater than zero.");
      return;
    }
    if (Math.round(form.price * 100) / 100 !== form.price) {
      setError("Price can have at most 2 decimal places.");
      return;
    }

    const payload: MenuItemInput = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      price: form.price,
      categoryId: form.categoryId,
      isAvailable: form.isAvailable ?? true,
    };

    setIsSubmitting(true);
    try {
      if (item) {
        const updated = await updateMenuItem(item.id, payload);
        await onSuccess(updated, false);
      } else {
        const created = await createMenuItem(payload);
        await onSuccess(created, true);
      }
      onClose();
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't save that dish."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Edit dish" : "Add dish"}</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <Stack spacing={2.5}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              autoFocus
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              multiline
              minRows={3}
              placeholder="Optional — what makes this dish special?"
              fullWidth
            />
            <TextField
              label="Price"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.price || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value === "" ? 0 : Number(event.target.value),
                }))
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="food-category-label">Category</InputLabel>
              <Select
                labelId="food-category-label"
                label="Category"
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isAvailable ?? true}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isAvailable: event.target.checked }))
                  }
                />
              }
              label={form.isAvailable ?? true ? "Available to order" : "Temporarily unavailable"}
            />
            {categories.length === 0 && (
              <Stack component="p" color="warning.main" fontSize={14} m={0}>
                Add a category first before creating dishes.
              </Stack>
            )}
            {error && (
              <Stack component="p" color="error.main" fontSize={14} m={0}>
                {error}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || categories.length === 0}
            startIcon={isSubmitting ? <CircularProgress size={17} color="inherit" /> : undefined}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add dish"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
