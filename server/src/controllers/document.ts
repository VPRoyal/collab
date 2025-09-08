import { Request, Response, NextFunction } from "express";
import { createDoc, listDocs, getDocById, updateDoc, addEditor } from "@/services/docs";
import { redis } from "@/config/redis";
import { success, created as createdRes } from "@/utils/response";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import logger from "@/utils/logger";
import asyncHandler from "@/utils/asyncHandler";

const log = logger.child({ module: "document" });

const createDocument = async (req: Request, res: Response, _next: NextFunction) => {
  const { title, authorId } = req.body as { title?: string; authorId?: string };
  if (!title || !authorId) {
    throw new BadRequestError("Title and authorId are required");
  }
  const doc = await createDoc(title, authorId);
  log.info("doc:created", { docId: doc.id, authorId });
  return createdRes(res, doc, "Document created");
};

const listDocuments = async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.query?.userId as string | undefined;
  if (!userId) throw new BadRequestError("User ID is required");

  const docs = await listDocs(userId);
  const docsWithPresence = await Promise.all(
    docs.map(async (doc) => {
      const count = await redis.scard(`doc:${doc.id}:active`);
      return { ...doc, activeCount: count } as any;
    })
  );
  log.info("doc:list", { userId, count: docsWithPresence.length });
  return success(res, docsWithPresence, "Documents fetched");
};

const getDocumentById = async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const userId = req.query?.userId as string | undefined;
  if (!id || !userId) throw new BadRequestError("ID and user ID are required");

  const doc = await getDocById(id);
  if (!doc) throw new NotFoundError("Document not found");

  if (doc.author.id === userId) {
    log.info("doc:get:author", { docId: id, userId });
    return success(res, getDocObj(doc), "Document fetched");
  }

  const alreadyEditor = doc.editors.some((e) => e.userId === userId);
  if (alreadyEditor) {
    log.info("doc:get:editor", { docId: id, userId });
    return success(res, getDocObj(doc), "Document fetched");
  }

  await addEditor(id, userId);
  log.info("doc:editor:added", { docId: id, userId });
  return success(res, getDocObj(doc), "Document fetched");
};

const updateDocument = async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const { title } = req.body as { title?: string };
  if (!title) throw new BadRequestError("Nothing to update");

  const updated = await updateDoc(id, { title });
  log.info("doc:updated", { docId: id });
  return success(res, updated, "Document updated");
};

export default {
  createDocument: asyncHandler(createDocument),
  listDocuments: asyncHandler(listDocuments),
  getDocumentById: asyncHandler(getDocumentById),
  updateDocument: asyncHandler(updateDocument),
};

function getDocObj(doc: any) {
  return {
    id: doc.id,
    title: doc.title,
    state: doc.state,
    content: doc.content,
    updatedAt: doc.updatedAt,
    author: doc.author,
    chat: doc.chat,
  };
}
