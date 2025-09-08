/*
 Standardized error classes and helpers for API responses and logging.
*/

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface ErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details?: ErrorDetails;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, code: ErrorCode = "INTERNAL_SERVER_ERROR", details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ErrorDetails) {
    super(message, 400, "BAD_REQUEST", details);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: ErrorDetails) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: ErrorDetails) {
    super(message, 403, "FORBIDDEN", details);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Not found", details?: ErrorDetails) {
    super(message, 404, "NOT_FOUND", details);
  }
}
export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: ErrorDetails) {
    super(message, 409, "CONFLICT", details);
  }
}
export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity", details?: ErrorDetails) {
    super(message, 422, "UNPROCESSABLE_ENTITY", details);
  }
}
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: ErrorDetails) {
    super(message, 429, "TOO_MANY_REQUESTS", details);
  }
}
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: ErrorDetails) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: ErrorDetails) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
  }
}

export function fromUnknown(err: unknown, defaultMessage = "Internal server error"): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new InternalServerError(err.message);
  return new InternalServerError(defaultMessage, { raw: err });
}

export function serializeAppError(err: AppError, includeStack = process.env.NODE_ENV !== "production") {
  return {
    name: err.name,
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    details: err.details,
    stack: includeStack ? err.stack : undefined,
  };
}
