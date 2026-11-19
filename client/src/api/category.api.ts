import { ApiResponse } from "../types";
import { Category, CategoryInput, CategoryUpdateInput } from "../types/menu";
import api from "./axiosInstance";

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<{ categories: Category[] }>>("/categories");
  return response.data.data.categories;
}

export async function getCategory(id: string): Promise<Category> {
  const response = await api.get<ApiResponse<{ category: Category }>>(`/categories/${id}`);
  return response.data.data.category;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const response = await api.post<ApiResponse<{ category: Category }>>("/categories", input);
  return response.data.data.category;
}

export async function updateCategory(id: string, input: CategoryUpdateInput): Promise<Category> {
  const response = await api.patch<ApiResponse<{ category: Category }>>(`/categories/${id}`, input);
  return response.data.data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
