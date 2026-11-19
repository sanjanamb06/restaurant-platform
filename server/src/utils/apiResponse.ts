import { Response } from "express";

export interface ApiResponseBody<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string,
): Response<ApiResponseBody<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
}
