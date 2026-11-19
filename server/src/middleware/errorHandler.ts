import { Prisma } from "@prisma/client";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      data: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    const message = target.includes("username")
      ? "This username is already taken, please choose another"
      : "A record with these details already exists";
    res.status(409).json({ success: false, error: message });
    return;
  }

  console.error(error);
  res.status(500).json({ success: false, error: "Internal server error" });
};
