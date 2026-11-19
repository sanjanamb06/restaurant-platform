import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import * as aiService from "../services/ai.service";

export async function getForecast(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurantId = req.user!.restaurantId;
    const horizon = req.query.horizon ? parseInt(req.query.horizon as string) : 7;
    const data = await aiService.getDemandForecast(restaurantId, horizon);
    sendSuccess(res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function trainModels(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurantId = req.user!.restaurantId;
    const data = await aiService.triggerTraining(restaurantId);
    sendSuccess(res, 200, data, "Training triggered successfully.");
  } catch (error) {
    next(error);
  }
}
