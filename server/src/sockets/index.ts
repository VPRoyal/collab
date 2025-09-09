import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { publisher, subscriber, redis } from "@/config/redis";
import { createMessage } from "@/services/chat";
import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import { getDocState, updateDoc } from "@/services/docs";
import logger from "@/utils/logger";

/* ----------------------------
 * Types & Globals
 * -------------------------- */
interface Room {
  ydoc: Y.Doc;
  awareness: Awareness;
}
const rooms: Record<string, Room> = {};
const DOC_TTL = 60; // seconds
const docSaveTimers: Record<string, NodeJS.Timeout> = {};

/* ----------------------------
 * Utilities
 * -------------------------- */
const normalizeToUint8 = (payload: any): Uint8Array => {
  if (!payload) return new Uint8Array();
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (Array.isArray(payload)) return new Uint8Array(payload);
  if (payload.data && Array.isArray(payload.data)) {
    return new Uint8Array(payload.data);
  }
  return new Uint8Array(Object.values(payload));
};

/**
 * Throttle DB persistence of documents
 * Prevents frequent writes when many tiny updates occur
 */
const throttleDocSave = (docId: string, ydoc: Y.Doc) => {
  if (docSaveTimers[docId]) return;

  docSaveTimers[docId] = setTimeout(async () => {
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      await updateDoc(docId, { state: Buffer.from(update) });
      logger.info("doc:saved", { docId });
    } catch (err) {
      logger.error("doc:save_failed", { docId, err });
    } finally {
      delete docSaveTimers[docId];
    }
  }, 5000);
};

/* ----------------------------
 * Main Socket Registration
 * -------------------------- */
const registerSockets = async (io: Server) => {
  io.adapter(createAdapter(publisher, subscriber));

  /** Clear stale redis presence on server restart */
  try {
    const keys = await redis.keys("doc:*:active");
    if (keys.length) {
      await redis.del(...keys);
      logger.info("redis:presence:cleared", { total: keys.length });
    }
  } catch (err) {
    logger.error("redis:presence:clear_failed", { err });
  }

  io.on("connection", (socket) => {
    const slog = logger.child({ socketId: socket.id, module: "socket" });
    slog.info("socket:connected");

    /* ---- DOC: JOIN ---- */
    socket.on("doc:join", async (docId: string, clientID: number) => {
      if (!docId) return;
      try {
        socket.join(docId);
        socket.data.docId = docId;
        socket.data.clientID = clientID;

        slog.info("doc:join", { docId, clientID });

        if (!rooms[docId]) {
          const ydoc = new Y.Doc();
          const awareness = new Awareness(ydoc);

          try {
            const dbDoc = await getDocState(docId);
            if (dbDoc?.state) {
              Y.applyUpdate(ydoc, normalizeToUint8(dbDoc.state));
              logger.info("doc:hydrated", { docId });
            }
          } catch (err) {
            logger.warn("doc:hydrate_failed", { docId, err });
          }

          rooms[docId] = { ydoc, awareness };
        }

        const room = rooms[docId];

        // Send latest doc & awareness state to this client
        socket.emit("doc:update", Y.encodeStateAsUpdate(room.ydoc));
        socket.emit(
          "awareness:update",
          encodeAwarenessUpdate(
            room.awareness,
            Array.from(room.awareness.getStates().keys())
          )
        );

        // Presence tracking in Redis
        try {
          await redis.sadd(`doc:${docId}:active`, socket.id);
          await redis.expire(`doc:${docId}:active`, DOC_TTL);
          const count = await redis.scard(`doc:${docId}:active`);
          logger.info("presence:count", { docId, count });
        } catch (err) {
          logger.error("redis:presence_error", { docId, err });
        }
      } catch (err) {
        slog.error("doc:join_failed", { docId, err });
      }
    });

    /* ---- DOC: UPDATE ---- */
    socket.on("doc:update", (docId: string, update: Uint8Array) => {
      try {
        const room = rooms[docId];
        if (!room) return;
        const u8 = normalizeToUint8(update);

        socket.to(docId).emit("doc:update", u8);
        Y.applyUpdate(room.ydoc, u8);
        throttleDocSave(docId, room.ydoc);
      } catch (err) {
        slog.error("doc:update_failed", { docId, err });
      }
    });

    /* ---- AWARENESS ---- */
    socket.on("awareness:update", async (docId: string, update: Uint8Array) => {
      try {
        const room = rooms[docId];
        if (!room) return;

        const u8 = normalizeToUint8(update);
        socket.to(docId).emit("awareness:update", u8);
        applyAwarenessUpdate(room.awareness, u8, "socket");

        // Refresh presence timeout
        try {
          await redis.expire(`doc:${docId}:active`, DOC_TTL);
        } catch (err) {
          logger.error("redis:expire_error", { docId, err });
        }
      } catch (err) {
        slog.error("awareness:update_failed", { docId, err });
      }
    });

    /* ---- CHAT ---- */
    socket.on(
      "chat:send",
      async (docId: string, payload: { message: string; user: any }) => {
        if (!docId || !payload?.message?.trim()) return;
        try {
          const saved = await createMessage(
            docId,
            payload.user.id,
            payload.message
          );
          const messageToEmit = {
            ...saved,
            user: { ...saved.user, color: payload?.user?.color || "" },
          };

          io.to(docId).emit("chat:new", messageToEmit);
        } catch (err) {
          logger.error("chat:persist_failed", { docId, err });
        }
      }
    );

    /* ---- DISCONNECT ---- */
    socket.on("disconnecting", async () => {
      const docId = socket.data?.docId;
      const clientID = socket.data?.clientID;

      slog.info("socket:disconnecting", { docId, clientID });

      try {
        const room = rooms[docId];
        if (room && clientID != null) {
          // Clean awareness
          removeAwarenessStates(room.awareness, [clientID], "socket");
          slog.info("awareness:client_removed", { clientID });

          // Notify others
          const update = encodeAwarenessUpdate(room.awareness, [clientID]);
          socket.to(docId).emit("awareness:update", update);

          // Clean redis presence
          await redis.srem(`doc:${docId}:active`, socket.id);
          const count = await redis.scard(`doc:${docId}:active`);

          if (count === 0) {
            throttleDocSave(docId, room.ydoc);
            delete rooms[docId];
            logger.info("doc:room_cleaned", { docId });
          }
        }
      } catch (err) {
        logger.error("presence:cleanup_error", { docId, err });
      }
    });
  });
};

export default registerSockets;