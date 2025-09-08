import { Router } from "express";
import { ChatController } from "@/controllers";

const router = Router();

// GET /chat/:docId → last N messages
router.get("/:docId", ChatController.getChatMessages);

export default router;