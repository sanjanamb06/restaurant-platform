import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/env";
import { AppError } from "./errorHandler";
import { verifyAccessToken } from "../utils/jwt";

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(401, "Access token is required");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        restaurantId: payload.restaurantId,
      },
      select: { role: true, isActive: true, mustChangePassword: true },
    });

    if (!user) {
      throw new AppError(401, "User no longer exists");
    }

    if (!user.isActive) {
      throw new AppError(403, "Account disabled");
    }

    req.user = {
      userId: payload.userId,
      restaurantId: payload.restaurantId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "Invalid or expired access token"));
  }
}
