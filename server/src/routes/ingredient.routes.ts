import { Role } from "@prisma/client";
import { Router } from "express";
import * as ingredientController from "../controllers/ingredient.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { requirePasswordChange } from "../middleware/requirePasswordChange";

const router = Router();

const readAuth = [authenticate, requirePasswordChange];
const writeAuth = [authenticate, requirePasswordChange, authorize(Role.ADMIN, Role.MANAGER)];

router.get("/", ...readAuth, ingredientController.listIngredients);
router.get("/:id", ...readAuth, ingredientController.getIngredient);
router.post("/", ...writeAuth, ingredientController.createIngredient);
router.patch("/:id", ...writeAuth, ingredientController.updateIngredient);
router.delete("/:id", ...writeAuth, ingredientController.deleteIngredient);

export default router;
