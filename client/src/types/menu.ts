export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  lowStockThreshold?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: Pick<Ingredient, "id" | "name" | "unit">;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  categoryId: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name">;
  ingredients: RecipeIngredient[];
}

export interface CategoryInput {
  name: string;
  description?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable?: boolean;
}

export type MenuItemUpdateInput = Partial<MenuItemInput>;

export interface IngredientInput {
  name: string;
  unit: string;
  currentStock?: number;
  lowStockThreshold?: number | null;
}

export type IngredientUpdateInput = Partial<IngredientInput>;

export interface RecipeInput {
  ingredientId: string;
  quantity: number;
}

export interface ListMenuItemsParams {
  search?: string;
  categoryId?: string;
  available?: boolean;
}
