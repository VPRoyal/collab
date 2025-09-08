import { NextFunction, Request, Response } from "express";

export default function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => any>(
  fn: T
) {
  return function wrapped(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  } as T;
}
