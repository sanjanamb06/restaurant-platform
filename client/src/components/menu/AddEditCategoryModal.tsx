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
import { createCategory, updateCategory } from "../../api/category.api";
import { Category, CategoryInput } from "../../types/menu";
import { getApiError } from "../../utils/apiError";

interface AddEditCategoryModalProps {
  open: boolean;
  category?: Category | null;
  onClose: () => void;
  onSuccess: (category: Category, isNew: boolean) => void | Promise<void>;
}

const emptyForm: CategoryInput = {
  name: "",
  description: "",
};

export default function AddEditCategoryModal({
  open,
  category,
  onClose,
  onSuccess,
}: AddEditCategoryModalProps) {
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(category);

  useEffect(() => {
    if (!open) return;
    setForm(
      category
        ? { name: category.name, description: category.description ?? "" }
        : emptyForm,
    );
    setError("");
  }, [category, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Category name needs at least 2 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CategoryInput = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
      };

      if (category) {
        const updated = await updateCategory(category.id, payload);
        await onSuccess(updated, false);
      } else {
        const created = await createCategory(payload);
        await onSuccess(created, true);
      }
      onClose();
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't save that category."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Edit category" : "Add category"}</DialogTitle>
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
              minRows={2}
              placeholder="Optional — e.g. Hearty mains for lunch and dinner"
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
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add category"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
