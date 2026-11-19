import { NextFunction, Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await categoryService.listCategories(req.user!.restaurantId);
    sendSuccess(res, 200, { categories });
  } catch (error) {
    next(error);
  }
}

export async function getCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = categoryIdParamSchema.parse(req.params);
    const category = await categoryService.getCategory(id, req.user!.restaurantId);
    sendSuccess(res, 200, { category });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.createCategory(
      req.user!.restaurantId,
      createCategorySchema.parse(req.body),
    );
    sendSuccess(res, 201, { category }, "Category created successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = categoryIdParamSchema.parse(req.params);
    const category = await categoryService.updateCategory(
      id,
      req.user!.restaurantId,
      updateCategorySchema.parse(req.body),
    );
    sendSuccess(res, 200, { category }, "Category updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = categoryIdParamSchema.parse(req.params);
    await categoryService.deleteCategory(id, req.user!.restaurantId);
    sendSuccess(res, 200, undefined, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
}
