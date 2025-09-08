import dotenv from "dotenv";
dotenv.config(); // load env

import { server, io } from "./app";
import registerSockets from "@/sockets";
import { connectRedisAll, disconnectRedisAll, clearAppKeys } from "@/config/redis";
import logger from "@/utils/logger";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

async function start() {
  try {
    await connectRedisAll();
    await clearAppKeys()

    registerSockets(io);

    server.listen(PORT, () => {
      logger.info("server:listening", { port: PORT });
    });
  } catch (err) {
    logger.fatal("server:start_failed", { err });
    await shutdown();
    process.exit(1);
  }
}

// shutdown helper
async function shutdown() {
  try {
    logger.warn("server:shutdown:init");
    // Disconnect Redis clients
    await disconnectRedisAll();
  } catch (err) {
    logger.warn("server:shutdown:redis_error", { err });
  }

  // Close the HTTP server
  await new Promise<void>((resolve) => {
    server.close(() => {
      logger.info("server:http_closed");
      resolve();
    });

    // Force exit if close hangs
    setTimeout(() => {
      logger.warn("server:shutdown:forced");
      resolve();
    }, 10_000).unref();
  });
}

process.on("SIGINT", async () => {
  logger.warn("process:sigint");
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.warn("process:sigterm");
  await shutdown();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error("process:unhandled_rejection", { reason });
});
process.on("uncaughtException", (err) => {
  logger.fatal("process:uncaught_exception", { err });
  shutdown().then(() => process.exit(1));
});

start();
