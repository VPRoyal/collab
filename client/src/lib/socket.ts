import { io, Socket } from "socket.io-client";

type Listener<T = any> = (data: T) => void;

class SocketClient {
  private socket: Socket | null = null;
  private url: string;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: { event: string; callback: Listener }[] = [];
  private emitQueue: { event: string; args: any[] }[] = []; // ⚡ buffer

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";
  }

  connect(userId: string) {
    if (this.socket?.connected) return;
    this.userId = userId;

    this.socket = io(this.url, {
      transports: ["websocket"],
      query: { userId },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.registerCoreEvents();
  }

  private registerCoreEvents() {
    this.socket?.on("connect", () => {
      this.reconnectAttempts = 0;
      console.log(`✅ Socket connected: ${this.socket?.id}`);
      this.resubscribeListeners();

      // 🔥 flush queued emits
      this.emitQueue.forEach(({ event, args }) => {
        this.socket?.emit(event, ...args);
      });
      this.emitQueue = [];
    });

    this.socket?.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket?.on("connect_error", (err) => {
      console.warn("⚠️ Socket connect error:", err.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("🚨 Max reconnection attempts reached!");
      }
    });
  }

  emit<T = any>(event: string, ...args:any[]) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn(`⚠️ Socket not connected, queueing emit: ${event}`);
      this.emitQueue.push({ event, args });
    }
  }

  on<T = any>(event: string, callback: Listener<T>) {
    this.socket?.on(event, callback);
    this.listeners.push({ event, callback });
  }

  off<T = any>(event: string, callback?: Listener<T>) {
    this.socket?.off(event, callback);
    this.listeners = this.listeners.filter(
      (l) => !(l.event === event && (!callback || callback === l.callback))
    );
  }

  private resubscribeListeners() {
    this.listeners.forEach(({ event, callback }) => {
      this.socket?.off(event, callback);
      this.socket?.on(event, callback);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
    this.listeners = [];
  }
}

export const socketClient = new SocketClient();