// ---------------------------------------------------------------------------
// Inventory stock item (from GET /api/inventory/stock)
// ---------------------------------------------------------------------------

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Low-stock alert
// ---------------------------------------------------------------------------

export interface LowStockAlert {
  ingredientId: string;
  name: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number;
  shortfall: number;
}

// ---------------------------------------------------------------------------
// Stock history entry (from GET /api/inventory/history)
// ---------------------------------------------------------------------------

export type StockChangeReason = "ORDER_DEDUCTION" | "MANUAL_ADJUSTMENT";

export interface StockHistoryEntry {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  changeAmount: number;
  reason: StockChangeReason;
  referenceId: string | null;
  createdAt: string;
}

export interface StockHistoryPage {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  entries: StockHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Inventory summary KPIs
// ---------------------------------------------------------------------------

export interface InventorySummary {
  totalIngredients: number;
  lowStockCount: number;
  outOfStockCount: number;
  lastDeductionAt: string | null;
}

// ---------------------------------------------------------------------------
// Manual stock adjustment input
// ---------------------------------------------------------------------------

export interface AdjustStockInput {
  changeAmount: number;
  note?: string;
}

// ---------------------------------------------------------------------------
// Socket.IO event payload
// ---------------------------------------------------------------------------

export interface InventoryLowStockEvent {
  alerts: LowStockAlert[];
}
