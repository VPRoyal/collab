import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";

let prisma: PrismaClient;

declare global {

  var prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });
} else {
  // Prevent hot reloading from creating duplicate instances.
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
      ],
    });
  }
  prisma = global.prisma;
}

// Logging
(prisma as any).$on("query", (e: any) => {
  logger.debug("db:query", { query: e.query, params: e.params, durationMs: e.duration });
});

(prisma as any).$on("info", (e: any) => {
  logger.info("db:info", { message: e.message });
});

(prisma as any).$on("warn", (e: any) => {
  logger.warn("db:warn", { message: e.message });
});

(prisma as any).$on("error", (e: any) => {
  logger.error("db:error", { message: e.message });
});

export { prisma };
