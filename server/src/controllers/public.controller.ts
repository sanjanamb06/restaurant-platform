import { NextFunction, Request, Response } from "express";
import * as publicService from "../services/public.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  checkTableSchema,
  createPublicOrderSchema,
  joinPublicOrderSchema,
  publicOrderParamSchema,
  publicRestaurantParamSchema,
} from "../validators/public.validator";

export async function getMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId } = publicRestaurantParamSchema.parse(req.params);
    const data = await publicService.getPublicMenu(restaurantId);
    sendSuccess(res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function listTables(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId } = publicRestaurantParamSchema.parse(req.params);
    const data = await publicService.listPublicTables(restaurantId);
    sendSuccess(res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function checkTable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId } = publicRestaurantParamSchema.parse(req.params);
    const data = await publicService.checkPublicTable(
      restaurantId,
      checkTableSchema.parse(req.body),
    );
    sendSuccess(res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId } = publicRestaurantParamSchema.parse(req.params);
    const data = await publicService.createPublicOrder(
      restaurantId,
      createPublicOrderSchema.parse(req.body),
    );
    sendSuccess(res, 201, data, "Order placed successfully");
  } catch (error) {
    next(error);
  }
}

export async function joinOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId, orderId } = publicOrderParamSchema.parse(req.params);
    const data = await publicService.joinPublicOrder(
      restaurantId,
      orderId,
      joinPublicOrderSchema.parse(req.body),
    );
    sendSuccess(res, 200, data, "Order updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId, orderId } = publicOrderParamSchema.parse(req.params);
    const data = await publicService.getPublicOrder(restaurantId, orderId);
    sendSuccess(res, 200, data);
  } catch (error) {
    next(error);
  }
}
