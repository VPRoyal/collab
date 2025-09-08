import { NextFunction, Request, Response } from "express";
import logger from "@/utils/logger";
import { AppError, fromUnknown } from "@/utils/errors";
import { error as sendError } from "@/utils/response";

export default function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const appErr: AppError = fromUnknown(err);
  logger.error("http:error", {
    method: req.method,
    url: req.originalUrl,
    status: appErr.statusCode,
    code: appErr.code,
    err: appErr,
  });
  return sendError(res, appErr);
}
