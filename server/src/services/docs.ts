import { prisma } from "@/config/prisma";
import { GET_CHAT_OBJECT, CHAT_HISTORY_LIMIT } from "./chat";
import logger from "@/utils/logger";
import { InternalServerError } from "@/utils/errors";

export const createDoc = async (title: string, authorId: string) => {
  try {
    const doc = await prisma.document.create({ data: { title, authorId, content: "" } });
    return doc;
  } catch (err) {
    logger.error("doc:create_failed", { authorId, title, err });
    throw new InternalServerError("Failed to create document");
  }
};

export const listDocs = async (userId: string) => {
  try {
    const docs = await prisma.document.findMany({
      where: {
        OR: [
          { authorId: userId },
          { editors: { some: { userId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true },
        },
      },
    });
    return docs;
  } catch (err) {
    logger.error("doc:list_failed", { userId, err });
    throw new InternalServerError("Failed to list documents");
  }
};

export const getDocById = async (id: string) => {
  try {
    return await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
        editors: true,
        author: {
          select: { id: true, username: true },
        },
        chat: {
          orderBy: { createdAt: "desc" },
          take: CHAT_HISTORY_LIMIT,
          select: GET_CHAT_OBJECT,
        },
      },
    });
  } catch (err) {
    logger.error("doc:get_failed", { id, err });
    throw new InternalServerError("Failed to get document");
  }
};

export const addEditor = async (docId: string, userId: string) => {
  try {
    await prisma.docEditor.create({ data: { documentId: docId, userId } });
  } catch (err) {
    logger.error("doc:add_editor_failed", { docId, userId, err });
    throw new InternalServerError("Failed to add editor");
  }
};

export const updateDoc = async (
  id: string,
  data: { title?: string; state?: Buffer }
) => {
  try {
    return await prisma.document.update({ where: { id }, data });
  } catch (err) {
    logger.error("doc:update_failed", { id, err });
    throw new InternalServerError("Failed to update document");
  }
};

export const getDocState = async (id: string) => {
  try {
    return await prisma.document.findUnique({
      where: { id },
      select: { state: true, id: true },
    });
  } catch (err) {
    logger.error("doc:get_state_failed", { id, err });
    throw new InternalServerError("Failed to get document state");
  }
};
