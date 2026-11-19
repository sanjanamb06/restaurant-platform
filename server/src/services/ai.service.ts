import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const AI_BASE = `${env.AI_SERVICE_URL}/api/v1`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function aiFetch<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  params?: Record<string, string | number>,
): Promise<T> {
  let url = `${AI_BASE}${path}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    url = `${url}?${qs}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: AbortSignal.timeout(30_000), // 30 s timeout
    });
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ECONNREFUSED" || e.name === "TimeoutError" || e.message?.includes("fetch")) {
      throw new AppError(
        503,
        "AI microservice is unavailable. Run: cd ai-service && python main.py",
      );
    }
    throw new AppError(500, "Failed to reach AI service.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string };
    throw new AppError(response.status, body.detail ?? "AI service error");
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Fetch Demand Forecast
// ---------------------------------------------------------------------------

export async function getDemandForecast(
  restaurantId: string,
  horizon = 7,
): Promise<object> {
  return aiFetch("/forecast", "GET", { restaurantId, horizon });
}

// ---------------------------------------------------------------------------
// Trigger Model Training
// ---------------------------------------------------------------------------

export async function triggerTraining(restaurantId: string): Promise<object> {
  return aiFetch("/forecast/train", "POST", { restaurantId });
}
