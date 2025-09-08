import Redis from "ioredis";
import logger from "@/utils/logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(redisUrl);

export const publisher = redis.duplicate({ lazyConnect: true });
export const subscriber = redis.duplicate({ lazyConnect: true });

function attachLoggers(client: Redis, label: string) {
  const log = logger.child({ module: "redis", label });
  client.on("connect", () => log.info("redis:connect"));
  client.on("ready", () => log.info("redis:ready"));
  client.on("error", (err) => log.error("redis:error", { err }));
  client.on("close", () => log.warn("redis:close"));
  client.on("end", () => log.warn("redis:end"));
}
attachLoggers(redis, "client");
attachLoggers(publisher, "publisher");
attachLoggers(subscriber, "subscriber");

async function waitReady(client: Redis) {
  if (client.status === "ready") return;
  if (client.status === "connecting") {
    await new Promise<void>((resolve, reject) => {
      client.once("ready", () => resolve());
      client.once("error", (err) => reject(err));
    });
    return;
  }

  await (client as any).connect();
}

export async function connectRedisAll() {
  // connect primary first (optional)
  await waitReady(redis);

  // duplicate clients may already be connecting; wait or connect
  await Promise.all([waitReady(publisher), waitReady(subscriber)]);
  logger.info("redis:all_connected");
}

// disconnect All
export async function disconnectRedisAll() {
  await Promise.allSettled([redis.quit(), publisher.quit(), subscriber.quit()]);
  logger.info("redis:all_quit");
}

export async function clearAppKeys() {
  const keys = await redis.keys("doc:*"); // or "*" if you want all
  if (keys.length > 0) {
    await redis.del(keys);
    logger.info("redis:cleared", { count: keys.length });
  } else {
    logger.info("redis:cleared", { count: 0 });
  }
}