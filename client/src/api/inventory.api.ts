import api from "./axiosInstance";
import { ApiResponse } from "../types";
import type {
  AdjustStockInput,
  InventorySummary,
  LowStockAlert,
  StockHistoryPage,
  StockItem,
} from "../types/inventory";

// ---------------------------------------------------------------------------
// GET /api/inventory/stock
// ---------------------------------------------------------------------------

export async function getCurrentStock(): Promise<StockItem[]> {
  const response = await api.get<ApiResponse<{ stock: StockItem[] }>>(
    "/inventory/stock",
  );
  return response.data.data.stock;
}

// ---------------------------------------------------------------------------
// GET /api/inventory/summary
// ---------------------------------------------------------------------------

export async function getInventorySummary(): Promise<InventorySummary> {
  const response = await api.get<ApiResponse<{ summary: InventorySummary }>>(
    "/inventory/summary",
  );
  return response.data.data.summary;
}

// ---------------------------------------------------------------------------
// GET /api/inventory/alerts
// ---------------------------------------------------------------------------

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const response = await api.get<ApiResponse<{ alerts: LowStockAlert[] }>>(
    "/inventory/alerts",
  );
  return response.data.data.alerts;
}

// ---------------------------------------------------------------------------
// GET /api/inventory/history
// ---------------------------------------------------------------------------

export async function getStockHistory(params?: {
  page?: number;
  limit?: number;
  ingredientId?: string;
}): Promise<StockHistoryPage> {
  const response = await api.get<ApiResponse<{ history: StockHistoryPage }>>(
    "/inventory/history",
    { params },
  );
  return response.data.data.history;
}

// ---------------------------------------------------------------------------
// POST /api/inventory/:ingredientId/adjust
// ---------------------------------------------------------------------------

export async function adjustStock(
  ingredientId: string,
  input: AdjustStockInput,
): Promise<StockItem> {
  const response = await api.post<ApiResponse<{ ingredient: StockItem }>>(
    `/inventory/${ingredientId}/adjust`,
    input,
  );
  return response.data.data.ingredient;
}
