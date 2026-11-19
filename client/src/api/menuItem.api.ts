import { ApiResponse } from "../types";
import { ListMenuItemsParams, MenuItem, MenuItemInput, MenuItemUpdateInput } from "../types/menu";
import api from "./axiosInstance";

export async function getMenuItems(params: ListMenuItemsParams = {}): Promise<MenuItem[]> {
  const response = await api.get<ApiResponse<{ menuItems: MenuItem[] }>>("/menu", { params });
  return response.data.data.menuItems;
}

export async function getMenuItem(id: string): Promise<MenuItem> {
  const response = await api.get<ApiResponse<{ menuItem: MenuItem }>>(`/menu/${id}`);
  return response.data.data.menuItem;
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const response = await api.post<ApiResponse<{ menuItem: MenuItem }>>("/menu", input);
  return response.data.data.menuItem;
}

export async function updateMenuItem(id: string, input: MenuItemUpdateInput): Promise<MenuItem> {
  const response = await api.patch<ApiResponse<{ menuItem: MenuItem }>>(`/menu/${id}`, input);
  return response.data.data.menuItem;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await api.delete(`/menu/${id}`);
}
