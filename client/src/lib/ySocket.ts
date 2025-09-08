import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import { socketClient } from "@/lib/socket";
import type { Chat } from "@/types";

export class YSocketIOProvider {
  docId: string;
  ydoc: Y.Doc;
  awareness: Awareness;
  isConnected = false;
  synced = false;

  private onSyncedCbs: Array<() => void> = [];
  private listeners: (() => void)[] = [];
  private statusListeners: ((status: boolean) => void)[] = [];
 private chatListeners: ((msg: Chat) => void)[] = [];

  constructor(
    docId: string,
    ydoc: Y.Doc,
    user: { id: string; name: string; color: string },
  ) {
    this.docId = docId;
    this.ydoc = ydoc;
    this.awareness = new Awareness(ydoc);

    this.awareness.setLocalState({ user, typing: false, cursor: null });
    socketClient.connect(user.id);

    /** --- Socket Handlers --- **/
    const handleConnect = () => {
      this.setConnection(true);
      socketClient.emit("doc:join", this.docId);
      this.restoreAwareness(user);
    };

    const handleDisconnect = () => {
      this.setConnection(false);
    };

    const handleDocUpdate = (update: Uint8Array) => {
      Y.applyUpdate(this.ydoc, new Uint8Array(update));
      if (!this.synced) {
        this.synced = true;
        this.onSyncedCbs.forEach((cb) => cb());
        this.onSyncedCbs = []; // cleanup once synced
      }
    };

    const handleAwarenessUpdate = (update: Uint8Array) => {
      applyAwarenessUpdate(this.awareness, new Uint8Array(update), "socket");
    };
    const handleChatNew = (msg: Chat) => {
      this.chatListeners.forEach((cb) => cb(msg));
    };

    // Register
    socketClient.on("connect", handleConnect);
    socketClient.on("disconnect", handleDisconnect);
    socketClient.on("doc:update", handleDocUpdate);
    socketClient.on("awareness:update", handleAwarenessUpdate);
    socketClient.on("chat:new", handleChatNew);

    this.listeners.push(() => socketClient.off("connect", handleConnect));
    this.listeners.push(() => socketClient.off("disconnect", handleDisconnect));
    this.listeners.push(() => socketClient.off("doc:update", handleDocUpdate));
    this.listeners.push(() =>
      socketClient.off("awareness:update", handleAwarenessUpdate)
    );
    this.listeners.push(() => socketClient.off("chat:new", handleChatNew));


    /** --- Y.Doc events --- **/
    let rafId: number | null = null;
    ydoc.on("update", (update: Uint8Array) => {
      // if (rafId) cancelAnimationFrame(rafId);
      // rafId = requestAnimationFrame(() => {
      socketClient.emit("doc:update", this.docId, update);
      // });
    });

    this.awareness.on(
      "update",
      ({
        added,
        updated,
        removed,
      }: {
        added: number[];
        updated: number[];
        removed: number[];
      }) => {
        // throttle awareness updates (esp. cursor)
        // if (rafId) cancelAnimationFrame(rafId);
        // rafId = requestAnimationFrame(() => {
        const update = encodeAwarenessUpdate(this.awareness, [
          ...added,
          ...updated,
          ...removed,
        ]);
        socketClient.emit("awareness:update", this.docId, update);
        // });
      }
    );
  }

  private setConnection(status: boolean) {
    this.isConnected = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  onStatusChange(cb: (status: boolean) => void) {
    this.statusListeners.push(cb);
    return () => {
      this.statusListeners = this.statusListeners.filter((fn) => fn !== cb);
    };
  }

  private restoreAwareness(user: { id: string; name: string; color: string }) {
    const current = this.awareness.getLocalState();
    if (!current) {
      this.awareness.setLocalState({ user, typing: false, cursor: null });
    } else {
      this.awareness.setLocalState(current);
    }
  }

  onSynced(cb: () => void) {
    if (this.synced) cb();
    else this.onSyncedCbs.push(cb);
  }

  setTyping(isTyping: boolean) {
    this.awareness.setLocalStateField("typing", isTyping);
  }

  setCursor(cursor: { from: number; to: number } | null) {
    this.awareness.setLocalStateField("cursor", cursor);
  }
  sendChatMessage(message: string, user: { id: string; username: string; color: string }) {
    socketClient.emit("chat:send", this.docId, {
      message,
      user,
    });
  }

  onChatMessage(cb: (msg: Chat) => void) {
    this.chatListeners.push(cb);
    return () => {
      this.chatListeners = this.chatListeners.filter((fn) => fn !== cb);
    };
  }

  destroy() {
    this.awareness.setLocalState(null);
    this.ydoc.destroy();
    this.awareness.destroy();

    this.listeners.forEach((off) => off());
    this.listeners = [];

    this.statusListeners = []; 
this.chatListeners = [];
    socketClient.disconnect();
  }
}

function normalizeToUint8(payload: any): Uint8Array {
  if (!payload) return new Uint8Array();
  if (payload instanceof Uint8Array) return payload;
  if (Array.isArray(payload)) return new Uint8Array(payload);
  if (payload.data && Array.isArray(payload.data)) return new Uint8Array(payload.data);
  return new Uint8Array(Object.values(payload)); // fallback
}
