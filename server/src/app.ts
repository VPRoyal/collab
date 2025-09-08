import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { UserRouter, DocumentRouter, ChatRouter } from "@/routes";
import { requestLogger } from "@/utils/logger";
import errorHandler from "@/middlewares/error";
import { NotFoundError } from "@/utils/errors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// REST API routes
app.use("/user", UserRouter);
app.use("/docs", DocumentRouter);
app.use("/chat", ChatRouter);

// 404 handler for unknown routes
app.use((req, _res, next) => {
  next(new NotFoundError("Route not found", { method: req.method, url: req.originalUrl }));
});

// Centralized error handler
app.use(errorHandler);

// Base HTTP server
const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // change for production
    methods: ["GET", "POST"],
  },
});

export { app, server, io };