import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { createIngredient, updateIngredient } from "../../api/ingredient.api";
import { Ingredient, IngredientInput, IngredientUpdateInput } from "../../types/menu";
import { getApiError } from "../../utils/apiError";

interface AddEditIngredientModalProps {
  open: boolean;
  ingredient?: Ingredient | null;
  unitLocked?: boolean;
  onClose: () => void;
  onSuccess: (ingredient: Ingredient, isNew: boolean) => void | Promise<void>;
}

const emptyForm: IngredientInput = {
  name: "",
  unit: "",
  currentStock: 0,
  lowStockThreshold: undefined,
};

export default function AddEditIngredientModal({
  open,
  ingredient,
  unitLocked = false,
  onClose,
  onSuccess,
}: AddEditIngredientModalProps) {
  const [form, setForm] = useState<IngredientInput>(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(ingredient);

  useEffect(() => {
    if (!open) return;
    setForm(
      ingredient
        ? {
            name: ingredient.name,
            unit: ingredient.unit,
            currentStock: ingredient.currentStock,
            lowStockThreshold: ingredient.lowStockThreshold ?? undefined,
          }
        : emptyForm,
    );
    setError("");
  }, [ingredient, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Ingredient name needs at least 2 characters.");
      return;
    }
    if (!form.unit.trim()) {
      setError("Add a unit — like g, ml, or pcs.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (ingredient) {
        const payload: IngredientUpdateInput = {
          name: form.name.trim(),
          currentStock: form.currentStock,
          lowStockThreshold: form.lowStockThreshold ?? null,
        };
        if (!unitLocked) payload.unit = form.unit.trim();
        const updated = await updateIngredient(ingredient.id, payload);
        await onSuccess(updated, false);
      } else {
        const created = await createIngredient({
          name: form.name.trim(),
          unit: form.unit.trim(),
          currentStock: form.currentStock ?? 0,
          lowStockThreshold: form.lowStockThreshold ?? null,
        });
        await onSuccess(created, true);
      }
      onClose();
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't save that ingredient."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Edit ingredient" : "Add ingredient"}</DialogTitle>
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
              label="Unit"
              value={form.unit}
              onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
              placeholder="g, ml, pcs"
              fullWidth
              disabled={unitLocked}
              helperText={
                unitLocked
                  ? "This ingredient is used in recipes — its unit can't be changed."
                  : "How you measure this ingredient in recipes"
              }
            />
            <TextField
              label="Starting stock"
              type="number"
              inputProps={{ min: 0, step: "any" }}
              value={form.currentStock ?? 0}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentStock: event.target.value === "" ? 0 : Number(event.target.value),
                }))
              }
              fullWidth
            />
            <TextField
              label="Low stock threshold"
              type="number"
              inputProps={{ min: 0, step: "any" }}
              value={form.lowStockThreshold ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lowStockThreshold:
                    event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
              placeholder="Optional"
              fullWidth
            />
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
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={17} color="inherit" /> : undefined}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add ingredient"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
