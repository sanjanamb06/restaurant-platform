import { NextFunction, Request, Response } from "express";
import * as recipeService from "../services/recipe.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  addRecipeIngredientSchema,
  recipeIngredientParamSchema,
  recipeMenuItemParamSchema,
  updateRecipeIngredientSchema,
} from "../validators/recipe.validator";

export async function listRecipeIngredients(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = recipeMenuItemParamSchema.parse(req.params);
    const ingredients = await recipeService.listRecipeIngredients(id, req.user!.restaurantId);
    sendSuccess(res, 200, { ingredients });
  } catch (error) {
    next(error);
  }
}

export async function addRecipeIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = recipeMenuItemParamSchema.parse(req.params);
    const ingredient = await recipeService.addRecipeIngredient(
      id,
      req.user!.restaurantId,
      addRecipeIngredientSchema.parse(req.body),
    );
    sendSuccess(res, 201, { ingredient }, "Recipe ingredient added successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateRecipeIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, ingredientId } = recipeIngredientParamSchema.parse(req.params);
    const ingredient = await recipeService.updateRecipeIngredient(
      id,
      ingredientId,
      req.user!.restaurantId,
      updateRecipeIngredientSchema.parse(req.body),
    );
    sendSuccess(res, 200, { ingredient }, "Recipe ingredient updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function removeRecipeIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, ingredientId } = recipeIngredientParamSchema.parse(req.params);
    await recipeService.removeRecipeIngredient(id, ingredientId, req.user!.restaurantId);
    sendSuccess(res, 200, undefined, "Recipe ingredient removed successfully");
  } catch (error) {
    next(error);
  }
}
