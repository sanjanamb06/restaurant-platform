import api from "./axiosInstance";
import { ApiResponse } from "../types";
import type { ForecastResponse, TrainResponse } from "../types/forecast";

export async function getDemandForecast(horizon = 7): Promise<ForecastResponse> {
  const response = await api.get<ApiResponse<ForecastResponse>>(
    "/ai/forecast",
    { params: { horizon } },
  );
  return response.data.data;
}

export async function triggerTraining(): Promise<TrainResponse> {
  const response = await api.post<ApiResponse<TrainResponse>>("/ai/train");
  return response.data.data;
}
