import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { deleteCategory } from "../../api/category.api";
import AddEditCategoryModal from "../../components/menu/AddEditCategoryModal";
import { useToast } from "../../context/ToastContext";
import { Category } from "../../types/menu";
import { getApiError } from "../../utils/apiError";

interface CategoriesPageProps {
  open: boolean;
  categories: Category[];
  itemCounts: Record<string, number>;
  onClose: () => void;
  onCategoriesChange: () => void | Promise<void>;
}

export default function CategoriesPage({
  open,
  categories,
  itemCounts,
  onClose,
  onCategoriesChange,
}: CategoriesPageProps) {
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const handleSaved = async (category: Category, isNew: boolean) => {
    await onCategoriesChange();
    showToast(isNew ? `${category.name} category created` : `${category.name} updated`);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteCategory(deletingCategory.id);
      await onCategoriesChange();
      showToast(`${deletingCategory.name} removed`);
      setDeletingCategory(null);
    } catch (requestError) {
      setDeleteError(getApiError(requestError, "We couldn't remove that category."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 420 }, p: 0 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" px={2.5} py={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Manage categories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Group your dishes into easy-to-browse sections.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close categories">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box px={2.5} pb={2}>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            fullWidth
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            Add category
          </Button>
        </Box>

        <List sx={{ px: 1.5, pb: 3 }}>
          {sortedCategories.length === 0 ? (
            <Box textAlign="center" py={6} px={3}>
              <Typography color="text.secondary">
                No categories yet — add one to start organising your menu.
              </Typography>
            </Box>
          ) : (
            sortedCategories.map((category) => (
              <ListItem
                key={category.id}
                secondaryAction={
                  <Stack direction="row">
                    <IconButton
                      edge="end"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => {
                        setEditingCategory(category);
                        setFormOpen(true);
                      }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label={`Delete ${category.name}`}
                      color="error"
                      onClick={() => {
                        setDeleteError("");
                        setDeletingCategory(category);
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
                sx={{
                  borderRadius: 3,
                  mb: 0.75,
                  bgcolor: "rgba(255,255,255,.72)",
                  boxShadow: "0 8px 24px rgba(72,47,35,.06)",
                }}
              >
                <ListItemText
                  primary={category.name}
                  secondary={
                    category.description ||
                    `${itemCounts[category.id] ?? 0} dish${itemCounts[category.id] === 1 ? "" : "es"}`
                  }
                  primaryTypographyProps={{ fontWeight: 750 }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Drawer>

      <AddEditCategoryModal
        open={formOpen}
        category={editingCategory}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSaved}
      />

      <Dialog
        open={Boolean(deletingCategory)}
        onClose={() => !isDeleting && setDeletingCategory(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove {deletingCategory?.name}?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Dishes in this category will need to be moved or removed first.
            </Typography>
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setDeletingCategory(null)} disabled={isDeleting}>
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
    </>
  );
}
