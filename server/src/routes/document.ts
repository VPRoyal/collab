import { Router } from "express";
import { DocumentController } from "@/controllers";
const {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocument
} =DocumentController;

const router = Router();

router.post("/create", createDocument);

router.put("/:id", updateDocument);

router.get("/list", listDocuments);

router.get("/:id", getDocumentById);

export default router;