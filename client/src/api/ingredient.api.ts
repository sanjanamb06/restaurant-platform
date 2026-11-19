import { ApiResponse } from "../types";
import { Ingredient, IngredientInput, IngredientUpdateInput } from "../types/menu";
import api from "./axiosInstance";

export async function getIngredients(): Promise<Ingredient[]> {
  const response = await api.get<ApiResponse<{ ingredients: Ingredient[] }>>("/ingredients");
  return response.data.data.ingredients;
}

export async function getIngredient(id: string): Promise<Ingredient> {
  const response = await api.get<ApiResponse<{ ingredient: Ingredient }>>(`/ingredients/${id}`);
  return response.data.data.ingredient;
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  const response = await api.post<ApiResponse<{ ingredient: Ingredient }>>("/ingredients", input);
  return response.data.data.ingredient;
}

export async function updateIngredient(
  id: string,
  input: IngredientUpdateInput,
): Promise<Ingredient> {
  const response = await api.patch<ApiResponse<{ ingredient: Ingredient }>>(
    `/ingredients/${id}`,
    input,
  );
  return response.data.data.ingredient;
}

export async function deleteIngredient(id: string): Promise<void> {
  await api.delete(`/ingredients/${id}`);
}
