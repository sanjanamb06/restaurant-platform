import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getCategories } from "../../api/category.api";
import { deleteMenuItem, getMenuItems } from "../../api/menuItem.api";
import AddEditFoodModal from "../../components/menu/AddEditFoodModal";
import CategoryFilterChips from "../../components/menu/CategoryFilterChips";
import EmptyMenuState from "../../components/menu/EmptyMenuState";
import FoodCard, { FoodCardSkeleton } from "../../components/menu/FoodCard";
import RecipeModal from "../../components/menu/RecipeModal";
import SearchBar from "../../components/menu/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import CategoriesPage from "./CategoriesPage";
import { Category, ListMenuItemsParams, MenuItem } from "../../types/menu";
import { getApiError } from "../../utils/apiError";
import { canManageMenu } from "../../utils/permissions";

function buildMenuListParams(search: string, categoryId: string | null): ListMenuItemsParams {
  const params: ListMenuItemsParams = {};
  const trimmedSearch = search.trim();
  if (trimmedSearch) params.search = trimmedSearch;
  if (categoryId) params.categoryId = categoryId;
  return params;
}

export default function MenuPage() {
  const { user } = useAuth();
  const canManage = canManageMenu(user?.role);
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [foodFormOpen, setFoodFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);
  const menuListParams = useMemo(
    () => buildMenuListParams(debouncedSearch, selectedCategoryId),
    [debouncedSearch, selectedCategoryId],
  );
  const menuListParamsRef = useRef<ListMenuItemsParams>(menuListParams);
  const categoriesRequestIdRef = useRef(0);
  const menuItemsRequestIdRef = useRef(0);

  useEffect(() => {
    menuListParamsRef.current = menuListParams;
  }, [menuListParams]);

  const loadCategories = useCallback(async () => {
    const requestId = categoriesRequestIdRef.current + 1;
    categoriesRequestIdRef.current = requestId;

    try {
      const nextCategories = await getCategories();
      if (requestId === categoriesRequestIdRef.current) {
        setCategories(nextCategories);
      }
      return nextCategories;
    } catch (requestError) {
      if (requestId === categoriesRequestIdRef.current) {
        showToast(getApiError(requestError, "We couldn't load categories."), "error");
      }
      return [];
    }
  }, [showToast]);

  const loadMenuItems = useCallback(async (params = menuListParamsRef.current) => {
    const requestId = menuItemsRequestIdRef.current + 1;
    menuItemsRequestIdRef.current = requestId;
    setIsLoading(true);
    setError("");
    try {
      const [filteredItems, fullMenu] = await Promise.all([
        getMenuItems(params),
        getMenuItems(),
      ]);
      if (requestId === menuItemsRequestIdRef.current) {
        setMenuItems(filteredItems);
        setAllMenuItems(fullMenu);
      }
    } catch (requestError) {
      if (requestId === menuItemsRequestIdRef.current) {
        setError(getApiError(requestError, "We couldn't load your menu."));
      }
    } finally {
      if (requestId === menuItemsRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadMenuItems(menuListParams);
  }, [loadMenuItems, menuListParams]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allMenuItems.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [allMenuItems]);

  const hasFilters = Boolean(menuListParams.search || menuListParams.categoryId);
  const showEmptyState = !isLoading && !error && menuItems.length === 0;

  const handleFoodSuccess = useCallback(async (item: MenuItem, isNew: boolean) => {
    await loadMenuItems();
    showToast(
      isNew ? `${item.name} added to your menu! 🎉` : "Updated!",
    );
  }, [loadMenuItems, showToast]);

  const refreshAfterCategoryChange = useCallback(async () => {
    const nextCategories = await loadCategories();
    const selectedCategoryStillExists = nextCategories.some(
      (category) => category.id === selectedCategoryId,
    );

    if (selectedCategoryId && !selectedCategoryStillExists) {
      setSelectedCategoryId(null);
      const paramsWithoutDeletedCategory = { ...menuListParamsRef.current };
      delete paramsWithoutDeletedCategory.categoryId;
      await loadMenuItems(paramsWithoutDeletedCategory);
      return;
    }

    await loadMenuItems();
  }, [loadCategories, loadMenuItems, selectedCategoryId]);

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteMenuItem(deletingItem.id);
      await loadMenuItems();
      showToast(`${deletingItem.name} removed from the menu`);
      setDeletingItem(null);
    } catch (requestError) {
      showToast(getApiError(requestError, "We couldn't remove that dish."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.6rem" } }}>
            Your menu
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {canManage
              ? "Build and organise the dishes your team serves every day."
              : "Browse what's on offer — recipes and details at a glance."}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/ingredients"
            variant={canManage ? "outlined" : "text"}
            startIcon={<Inventory2RoundedIcon />}
          >
            Ingredients
          </Button>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                setEditingItem(null);
                setFoodFormOpen(true);
              }}
            >
              Add food item
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={2.5} mb={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SearchBar value={search} onChange={setSearch} />
          </Box>
          {canManage && (
            <Button
              variant="text"
              startIcon={<CategoryRoundedIcon />}
              onClick={() => setCategoriesOpen(true)}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, whiteSpace: "nowrap" }}
            >
              Manage categories
            </Button>
          )}
        </Stack>
        <CategoryFilterChips
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      </Stack>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              startIcon={<ReplayRoundedIcon />}
              onClick={() => void loadMenuItems()}
            >
              Try again
            </Button>
          }
        >
          <AlertTitle>The menu board stayed blank</AlertTitle>
          {error}
        </Alert>
      ) : isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item key={index} xs={12} sm={6} lg={4} xl={3}>
              <FoodCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : showEmptyState ? (
        <EmptyMenuState
          variant={hasFilters ? "no-results" : "empty"}
          canManage={canManage}
          onAdd={() => {
            setEditingItem(null);
            setFoodFormOpen(true);
          }}
        />
      ) : (
        <Grid container spacing={3}>
          {menuItems.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} lg={4} xl={3}>
              <FoodCard
                item={item}
                canManage={canManage}
                onEdit={(entry) => {
                  setEditingItem(entry);
                  setFoodFormOpen(true);
                }}
                onDelete={setDeletingItem}
                onRecipe={setRecipeItem}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {canManage && (
        <>
          <AddEditFoodModal
            open={foodFormOpen}
            item={editingItem}
            categories={categories}
            onClose={() => setFoodFormOpen(false)}
            onSuccess={handleFoodSuccess}
          />

          <CategoriesPage
            open={categoriesOpen}
            categories={categories}
            itemCounts={itemCounts}
            onClose={() => setCategoriesOpen(false)}
            onCategoriesChange={refreshAfterCategoryChange}
          />
        </>
      )}

      <RecipeModal
        open={Boolean(recipeItem)}
        menuItem={recipeItem}
        canManage={canManage}
        onClose={() => setRecipeItem(null)}
      />

      <Dialog
        open={Boolean(deletingItem)}
        onClose={() => !isDeleting && setDeletingItem(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove {deletingItem?.name} from the menu?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            You can&apos;t undo this, but past orders won&apos;t be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setDeletingItem(null)} disabled={isDeleting}>
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
