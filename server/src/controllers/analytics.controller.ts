import { NextFunction, Request, Response } from "express";
import * as analyticsService from "../services/analytics.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  analyticsQuerySchema,
  popularItemsQuerySchema,
} from "../validators/analytics.validator";

export async function getRevenueData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { days } = analyticsQuerySchema.parse(req.query);
    const data = await analyticsService.getRevenueData(
      req.user!.restaurantId,
      days,
    );
    sendSuccess(res, 200, { data });
  } catch (error) {
    next(error);
  }
}

export async function getOrderVolumeData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { days } = analyticsQuerySchema.parse(req.query);
    const data = await analyticsService.getOrderVolumeData(
      req.user!.restaurantId,
      days,
    );
    sendSuccess(res, 200, { data });
  } catch (error) {
    next(error);
  }
}

export async function getPopularItems(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit } = popularItemsQuerySchema.parse(req.query);
    const data = await analyticsService.getPopularItems(
      req.user!.restaurantId,
      limit,
    );
    sendSuccess(res, 200, { data });
  } catch (error) {
    next(error);
  }
}

export async function getIngredientUsageData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { days } = analyticsQuerySchema.parse(req.query);
    const data = await analyticsService.getIngredientUsageData(
      req.user!.restaurantId,
      days,
    );
    sendSuccess(res, 200, { data });
  } catch (error) {
    next(error);
  }
}
