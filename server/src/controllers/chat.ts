import { Request, Response, NextFunction } from "express";
import { getChats } from "@/services/chat";
import { success } from "@/utils/response";
import { BadRequestError } from "@/utils/errors";
import logger from "@/utils/logger";
import asyncHandler from "@/utils/asyncHandler";

const getChatMessages = async (req: Request, res: Response, _next: NextFunction) => {
  const { docId } = req.params;
  if (!docId) throw new BadRequestError("Document ID is required");
  const log = logger.child({ module: "chat", op: "getMessages", docId });
  const messages = await getChats(docId);
  log.info("chat:messages:fetched", { count: messages.length });
  // Reverse so newest messages appear last
  return success(res, messages.reverse(), "Messages fetched");
};

export default { getChatMessages: asyncHandler(getChatMessages) };
