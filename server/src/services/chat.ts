import { prisma } from "@/config/prisma";
import logger from "@/utils/logger";
import { InternalServerError } from "@/utils/errors";

export const CHAT_HISTORY_LIMIT = 20;
export const GET_CHAT_OBJECT = {
  id: true,
  message: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
    },
  },
};

export const getChats = async (docId: string) => {
  try {
    const messages = await prisma.chat.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: "desc" },
      take: CHAT_HISTORY_LIMIT,
      select: GET_CHAT_OBJECT,
    });
    return messages;
  } catch (error) {
    logger.error("chat:get_failed", { docId, err: error });
    throw new InternalServerError("Failed to fetch chat messages");
  }
};

export const createMessage = async (
  docId: string,
  userId: string,
  message: string,
  createdAt?: Date
) => {
  try {
    const data: any = {
      documentId: docId,
      userId,
      message,
    };
    if (createdAt) data["createdAt"] = createdAt;

    const chat = await prisma.chat.create({
      data,
      select: GET_CHAT_OBJECT,
    });
    const createDate = chat.createdAt;
    const normalized = {
      ...chat,
      createdAt: createDate instanceof Date ? createDate.toISOString() : String(createDate),
    };
    return normalized;
  } catch (error) {
    logger.error("chat:create_failed", { docId, userId, err: error });
    throw new InternalServerError("Failed to create chat message");
  }
};
