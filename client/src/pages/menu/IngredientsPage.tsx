import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getMenuItems } from "../../api/menuItem.api";
import { deleteIngredient, getIngredients } from "../../api/ingredient.api";
import AddEditIngredientModal from "../../components/menu/AddEditIngredientModal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Ingredient } from "../../types/menu";
import { getApiError } from "../../utils/apiError";
import { canManageMenu } from "../../utils/permissions";

export default function IngredientsPage() {
  const { user } = useAuth();
  const canManage = canManageMenu(user?.role);
  const { showToast } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [usedIngredientIds, setUsedIngredientIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dataRequestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = dataRequestIdRef.current + 1;
    dataRequestIdRef.current = requestId;
    setIsLoading(true);
    setError("");
    try {
      const [ingredientList, menuItems] = await Promise.all([getIngredients(), getMenuItems()]);
      const used = new Set<string>();
      menuItems.forEach((item) => {
        item.ingredients.forEach((entry) => used.add(entry.ingredientId));
      });
      if (requestId === dataRequestIdRef.current) {
        setIngredients(ingredientList);
        setUsedIngredientIds(used);
      }
    } catch (requestError) {
      if (requestId === dataRequestIdRef.current) {
        setError(getApiError(requestError, "We couldn't load your ingredients."));
      }
    } finally {
      if (requestId === dataRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedIngredients = useMemo(
    () => [...ingredients].sort((a, b) => a.name.localeCompare(b.name)),
    [ingredients],
  );

  const handleSuccess = async (ingredient: Ingredient, isNew: boolean) => {
    await loadData();
    showToast(isNew ? `${ingredient.name} added to your pantry` : `${ingredient.name} updated`);
  };

  const confirmDelete = async () => {
    if (!deletingIngredient) return;
    setIsDeleting(true);
    try {
      await deleteIngredient(deletingIngredient.id);
      await loadData();
      showToast(`${deletingIngredient.name} removed`);
      setDeletingIngredient(null);
    } catch (requestError) {
      showToast(getApiError(requestError, "We couldn't remove that ingredient."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.6rem" } }}>
            Ingredients
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Your pantry staples — used in recipes across the menu.
          </Typography>
          <Button component={RouterLink} to="/menu" color="inherit" sx={{ mt: 1.5, px: 0 }}>
            ← Back to menu
          </Button>
        </Box>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditingIngredient(null);
              setFormOpen(true);
            }}
          >
            Add ingredient
          </Button>
        )}
      </Stack>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" startIcon={<ReplayRoundedIcon />} onClick={loadData}>
              Try again
            </Button>
          }
        >
          <AlertTitle>The pantry door stuck</AlertTitle>
          {error}
        </Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table sx={{ minWidth: 680 }} aria-label="Restaurant ingredients">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(198,93,59,.06)" }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Current stock</TableCell>
                  <TableCell>Low stock threshold</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: canManage ? 5 : 4 }).map((__, cell) => (
                          <TableCell key={cell}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : sortedIngredients.map((ingredient) => (
                      <TableRow key={ingredient.id} hover>
                        <TableCell>
                          <Typography fontWeight={750}>{ingredient.name}</Typography>
                        </TableCell>
                        <TableCell>{ingredient.unit}</TableCell>
                        <TableCell>{ingredient.currentStock}</TableCell>
                        <TableCell>
                          {ingredient.lowStockThreshold ?? (
                            <Typography color="text.secondary" variant="body2">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        {canManage && (
                          <TableCell align="right">
                            <Stack direction="row" justifyContent="flex-end">
                              <Tooltip title="Edit">
                                <IconButton
                                  onClick={() => {
                                    setEditingIngredient(ingredient);
                                    setFormOpen(true);
                                  }}
                                >
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <IconButton
                                  color="error"
                                  onClick={() => setDeletingIngredient(ingredient)}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!isLoading && sortedIngredients.length === 0 && (
            <Box textAlign="center" py={8} px={3}>
              <Typography variant="h6">Nothing in the pantry yet</Typography>
              <Typography color="text.secondary" mt={1}>
                {canManage
                  ? "Add ingredients here before building recipes on your dishes."
                  : "Ingredients will show up here once your team adds them."}
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {canManage && (
        <AddEditIngredientModal
          open={formOpen}
          ingredient={editingIngredient}
          unitLocked={Boolean(editingIngredient && usedIngredientIds.has(editingIngredient.id))}
          onClose={() => setFormOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      <Dialog
        open={Boolean(deletingIngredient)}
        onClose={() => !isDeleting && setDeletingIngredient(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove {deletingIngredient?.name}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This removes it from your ingredient list. Recipes using it will need to be updated
            first.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setDeletingIngredient(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={17} color="inherit" /> : undefined}
          >
            {isDeleting ? "Removing..." : "Yes, remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
