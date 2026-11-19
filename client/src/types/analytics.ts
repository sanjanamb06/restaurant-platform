export interface RevenueData {
  date: string;
  revenue: number;
}

export interface OrderVolumeData {
  date: string;
  orders: number;
}

export interface PopularItem {
  menuItemId: string;
  name: string;
  totalSold: number;
}

export interface IngredientUsage {
  ingredientId: string;
  name: string;
  unit: string;
  totalUsed: number;
}
