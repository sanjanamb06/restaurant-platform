import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.MANAGER, Role.ADMIN));

// GET  /api/ai/forecast?horizon=7     — get demand forecasts
router.get("/forecast", aiController.getForecast);

// POST /api/ai/train                  — trigger model retraining
router.post("/train", aiController.trainModels);

export default router;
