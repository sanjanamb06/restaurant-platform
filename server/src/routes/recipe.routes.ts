import { Role } from "@prisma/client";
import { Router } from "express";
import * as recipeController from "../controllers/recipe.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { requirePasswordChange } from "../middleware/requirePasswordChange";

const router = Router();

const readAuth = [authenticate, requirePasswordChange];
const writeAuth = [authenticate, requirePasswordChange, authorize(Role.ADMIN, Role.MANAGER)];

router.get("/:id/ingredients", ...readAuth, recipeController.listRecipeIngredients);
router.post("/:id/ingredients", ...writeAuth, recipeController.addRecipeIngredient);
router.patch("/:id/ingredients/:ingredientId", ...writeAuth, recipeController.updateRecipeIngredient);
router.delete("/:id/ingredients/:ingredientId", ...writeAuth, recipeController.removeRecipeIngredient);

export default router;
