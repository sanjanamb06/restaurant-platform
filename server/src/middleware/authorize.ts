import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
