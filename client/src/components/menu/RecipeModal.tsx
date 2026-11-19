import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getIngredients } from "../../api/ingredient.api";
import {
  addRecipeIngredient,
  getRecipeIngredients,
  removeRecipeIngredient,
} from "../../api/recipe.api";
import { useToast } from "../../context/ToastContext";
import { Ingredient, MenuItem as MenuItemType, RecipeIngredient } from "../../types/menu";
import { getApiError } from "../../utils/apiError";

interface RecipeModalProps {
  open: boolean;
  menuItem: MenuItemType | null;
  canManage: boolean;
  onClose: () => void;
}

export default function RecipeModal({ open, menuItem, canManage, onClose }: RecipeModalProps) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<RecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadRecipe = useCallback(async () => {
    if (!menuItem) return;
    setIsLoading(true);
    try {
      const [recipe, ingredients] = await Promise.all([
        getRecipeIngredients(menuItem.id),
        getIngredients(),
      ]);
      setEntries(recipe);
      setAllIngredients(ingredients);
    } catch (requestError) {
      showToast(getApiError(requestError, "We couldn't load this recipe."), "error");
    } finally {
      setIsLoading(false);
    }
  }, [menuItem, showToast]);

  useEffect(() => {
    if (!open || !menuItem) return;
    setSelectedIngredientId("");
    setQuantity("");
    void loadRecipe();
  }, [loadRecipe, menuItem, open]);

  const availableIngredients = useMemo(() => {
    const usedIds = new Set(entries.map((entry) => entry.ingredientId));
    return allIngredients.filter((ingredient) => !usedIds.has(ingredient.id));
  }, [allIngredients, entries]);

  const addIngredient = async (event: FormEvent) => {
    event.preventDefault();
    if (!menuItem || !selectedIngredientId || quantity === "" || quantity <= 0) return;

    setIsSubmitting(true);
    try {
      const created = await addRecipeIngredient(menuItem.id, {
        ingredientId: selectedIngredientId,
        quantity: Number(quantity),
      });
      setEntries((current) => [...current, created]);
      setSelectedIngredientId("");
      setQuantity("");
      showToast("Ingredient added to recipe");
    } catch (requestError) {
      showToast(getApiError(requestError, "We couldn't add that ingredient."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeEntry = async (entry: RecipeIngredient) => {
    if (!menuItem) return;
    setRemovingId(entry.id);
    try {
      await removeRecipeIngredient(menuItem.id, entry.ingredientId);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      showToast(`${entry.ingredient.name} removed from recipe`);
    } catch (requestError) {
      showToast(getApiError(requestError, "We couldn't remove that ingredient."), "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        {menuItem ? `${menuItem.name}'s recipe` : "Recipe"}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        ) : entries.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No recipe set up yet for this dish
              {canManage ? " — add some ingredients below." : "."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {entries.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: "rgba(198,93,59,.06)",
                }}
              >
                <Typography fontWeight={700}>
                  {entry.ingredient.name} — {entry.quantity} {entry.unit}
                </Typography>
                {canManage && (
                  <IconButton
                    size="small"
                    color="error"
                    disabled={removingId === entry.id}
                    onClick={() => void removeEntry(entry)}
                  >
                    {removingId === entry.id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                )}
              </Stack>
            ))}
          </Stack>
        )}

        {canManage && !isLoading && (
          <Box component="form" onSubmit={addIngredient} mt={3}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="recipe-ingredient-label">Ingredient</InputLabel>
                <Select
                  labelId="recipe-ingredient-label"
                  label="Ingredient"
                  value={selectedIngredientId}
                  onChange={(event) => setSelectedIngredientId(event.target.value)}
                >
                  {availableIngredients.length === 0 ? (
                    <MenuItem disabled value="">
                      All ingredients are already in this recipe
                    </MenuItem>
                  ) : (
                    availableIngredients.map((ingredient) => (
                      <MenuItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <TextField
                label="Quantity"
                type="number"
                inputProps={{ min: 0, step: "any" }}
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value === "" ? "" : Number(event.target.value))
                }
                fullWidth
              />
              <Button
                type="submit"
                variant="outlined"
                startIcon={isSubmitting ? undefined : <AddRoundedIcon />}
                disabled={
                  isSubmitting ||
                  !selectedIngredientId ||
                  quantity === "" ||
                  quantity <= 0 ||
                  availableIngredients.length === 0
                }
              >
                {isSubmitting ? "Adding..." : "Add to recipe"}
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
