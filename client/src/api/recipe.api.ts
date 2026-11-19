import { ApiResponse } from "../types";
import { RecipeIngredient, RecipeInput } from "../types/menu";
import api from "./axiosInstance";

export async function getRecipeIngredients(menuItemId: string): Promise<RecipeIngredient[]> {
  const response = await api.get<ApiResponse<{ ingredients: RecipeIngredient[] }>>(
    `/menu/${menuItemId}/ingredients`,
  );
  return response.data.data.ingredients;
}

export async function addRecipeIngredient(
  menuItemId: string,
  input: RecipeInput,
): Promise<RecipeIngredient> {
  const response = await api.post<ApiResponse<{ ingredient: RecipeIngredient }>>(
    `/menu/${menuItemId}/ingredients`,
    input,
  );
  return response.data.data.ingredient;
}

export async function updateRecipeIngredient(
  menuItemId: string,
  ingredientId: string,
  quantity: number,
): Promise<RecipeIngredient> {
  const response = await api.patch<ApiResponse<{ ingredient: RecipeIngredient }>>(
    `/menu/${menuItemId}/ingredients/${ingredientId}`,
    { quantity },
  );
  return response.data.data.ingredient;
}

export async function removeRecipeIngredient(
  menuItemId: string,
  ingredientId: string,
): Promise<void> {
  await api.delete(`/menu/${menuItemId}/ingredients/${ingredientId}`);
}
