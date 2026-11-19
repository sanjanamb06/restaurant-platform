import { NextFunction, Request, Response } from "express";
import * as menuItemService from "../services/menuItem.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  createMenuItemSchema,
  listMenuItemsQuerySchema,
  menuItemIdParamSchema,
  updateMenuItemSchema,
} from "../validators/menuItem.validator";

export async function listMenuItems(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const menuItems = await menuItemService.listMenuItems(
      req.user!.restaurantId,
      listMenuItemsQuerySchema.parse(req.query),
    );
    sendSuccess(res, 200, { menuItems });
  } catch (error) {
    next(error);
  }
}

export async function getMenuItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = menuItemIdParamSchema.parse(req.params);
    const menuItem = await menuItemService.getMenuItem(id, req.user!.restaurantId);
    sendSuccess(res, 200, { menuItem });
  } catch (error) {
    next(error);
  }
}

export async function createMenuItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const menuItem = await menuItemService.createMenuItem(
      req.user!.restaurantId,
      createMenuItemSchema.parse(req.body),
    );
    sendSuccess(res, 201, { menuItem }, "Menu item created successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateMenuItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = menuItemIdParamSchema.parse(req.params);
    const menuItem = await menuItemService.updateMenuItem(
      id,
      req.user!.restaurantId,
      updateMenuItemSchema.parse(req.body),
    );
    sendSuccess(res, 200, { menuItem }, "Menu item updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = menuItemIdParamSchema.parse(req.params);
    await menuItemService.deleteMenuItem(id, req.user!.restaurantId);
    sendSuccess(res, 200, undefined, "Menu item deleted successfully");
  } catch (error) {
    next(error);
  }
}
