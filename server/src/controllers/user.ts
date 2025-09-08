import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/prisma";
import { success } from "@/utils/response";
import { BadRequestError } from "@/utils/errors";
import logger from "@/utils/logger";
import asyncHandler from "@/utils/asyncHandler";

async function loginUser(req: Request, res: Response, _next: NextFunction) {
  const { username } = req.body as { username?: string };
  if (!username || typeof username !== "string" || !username.trim()) {
    throw new BadRequestError("Username is required");
  }

  const log = logger.child({ module: "user", op: "login", username });
  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    user = await prisma.user.create({ data: { username, lastActive: new Date() } });
    log.info("user:created", { userId: user.id });
  } else {
    log.info("user:found", { userId: user.id });
  }

  return success(res, { user }, "Login successful");
}

export default { loginUser: asyncHandler(loginUser) };
