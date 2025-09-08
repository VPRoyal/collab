import { Response } from "express";
import { AppError, serializeAppError } from "@/utils/errors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ReturnType<typeof serializeAppError>;
}

export function success<T>(res: Response, data: T, message = "OK", status = 200) {
  const payload: ApiResponse<T> = { success: true, message, data };
  return res.status(status).json(payload);
}

export function created<T>(res: Response, data: T, message = "Created") {
  return success(res, data, message, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function error(res: Response, err: AppError) {
  const payload: ApiResponse = { success: false, error: serializeAppError(err) };
  return res.status(err.statusCode || 500).json(payload);
}
