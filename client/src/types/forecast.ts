export interface DayPrediction {
  date: string;
  predictedQuantity: number;
  confidence: number;
}

export interface ItemForecast {
  menuItemId: string;
  menuItemName: string | null;
  predictions: DayPrediction[];
}

export interface ForecastResponse {
  restaurantId: string;
  horizon: number;
  forecasts: ItemForecast[];
}

export interface TrainResponse {
  restaurantId: string;
  trained: number;
  skipped: number;
  errors: number;
  message: string;
}
