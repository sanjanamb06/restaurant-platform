import { NextFunction, Request, Response } from "express";
import * as ingredientService from "../services/ingredient.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  createIngredientSchema,
  ingredientIdParamSchema,
  updateIngredientSchema,
} from "../validators/ingredient.validator";

export async function listIngredients(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ingredients = await ingredientService.listIngredients(req.user!.restaurantId);
    sendSuccess(res, 200, { ingredients });
  } catch (error) {
    next(error);
  }
}

export async function getIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = ingredientIdParamSchema.parse(req.params);
    const ingredient = await ingredientService.getIngredient(id, req.user!.restaurantId);
    sendSuccess(res, 200, { ingredient });
  } catch (error) {
    next(error);
  }
}

export async function createIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ingredient = await ingredientService.createIngredient(
      req.user!.restaurantId,
      createIngredientSchema.parse(req.body),
    );
    sendSuccess(res, 201, { ingredient }, "Ingredient created successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = ingredientIdParamSchema.parse(req.params);
    const ingredient = await ingredientService.updateIngredient(
      id,
      req.user!.restaurantId,
      updateIngredientSchema.parse(req.body),
    );
    sendSuccess(res, 200, { ingredient }, "Ingredient updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = ingredientIdParamSchema.parse(req.params);
    await ingredientService.deleteIngredient(id, req.user!.restaurantId);
    sendSuccess(res, 200, undefined, "Ingredient deleted successfully");
  } catch (error) {
    next(error);
  }
}
