import { Router } from "express";
import { UserController } from "@/controllers";
const {loginUser}= UserController;

const router = Router();

// POST /auth/login
router.post("/login", loginUser);

export default router;