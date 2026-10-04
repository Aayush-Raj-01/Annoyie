import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Message, SendMessageDTO } from "@/types/chat";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/chat";

let stompClient: Client | null = null;
let currentMessageCallback: ((msg: any) => void) | null = null;
let currentStatusCallback: ((connected: boolean, connecting: boolean) => void) | null = null;

type GalleryCallback = (post: any) => void;
type GalleryDeleteCallback = (deleteInfo: { id: number }) => void;

const galleryCallbacks: Set<GalleryCallback> = new Set();
const galleryDeleteCallbacks: Set<GalleryDeleteCallback> = new Set();

export function subscribeToGallery(
  onPost: GalleryCallback,
  onDelete?: GalleryDeleteCallback
): () => void {
  galleryCallbacks.add(onPost);
  if (onDelete) galleryDeleteCallbacks.add(onDelete);

  return () => {
    galleryCallbacks.delete(onPost);
    if (onDelete) galleryDeleteCallbacks.delete(onDelete);
  };
}

export function getSocketClient(): Client | null {
  return stompClient;
}

export function connectSocket(
  onMessage?: (msg: any) => void,
  onStatusChange?: (connected: boolean, connecting: boolean) => void
): void {
  if (onMessage) {
    currentMessageCallback = onMessage;
  }
  if (onStatusChange) {
    currentStatusCallback = onStatusChange;
  }

  // If already connected, trigger status and return
  if (stompClient?.connected) {
    currentStatusCallback?.(true, false);
    return;
  }

  currentStatusCallback?.(false, true);

  if (stompClient?.active) {
    // Already activated and trying to connect
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: (frame) => {
      console.log("[STOMP] Connected successfully", frame.headers);
      currentStatusCallback?.(true, false);

      // Subscribe to global chat messages topic
      stompClient?.subscribe("/topic/messages", (messageFrame) => {
        try {
          const payload = JSON.parse(messageFrame.body);
          console.log("[STOMP] Incoming message:", payload);
          if (currentMessageCallback) {
            currentMessageCallback(payload);
          }
        } catch (err) {
          console.error("[STOMP] Failed to parse message frame:", err);
        }
      });

      // Subscribe to real-time gallery upload topic
      stompClient?.subscribe("/topic/gallery", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          console.log("[STOMP] Incoming gallery post:", payload);
          galleryCallbacks.forEach((cb) => cb(payload));
        } catch (err) {
          console.error("[STOMP] Failed to parse gallery frame:", err);
        }
      });

      // Subscribe to real-time gallery delete topic
      stompClient?.subscribe("/topic/gallery/delete", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          console.log("[STOMP] Incoming gallery deletion:", payload);
          galleryDeleteCallbacks.forEach((cb) => cb(payload));
        } catch (err) {
          console.error("[STOMP] Failed to parse gallery delete frame:", err);
        }
      });
    },

    onStompError: (frame) => {
      console.error("[STOMP] Broker error:", frame.headers["message"], frame.body);
      currentStatusCallback?.(false, true);
    },

    onWebSocketClose: () => {
      console.warn("[STOMP] WebSocket connection closed, reconnecting in 3s...");
      currentStatusCallback?.(false, true);
    },

    onWebSocketError: (error) => {
      console.error("[STOMP] WebSocket transport error:", error);
      currentStatusCallback?.(false, true);
    },

    onDisconnect: () => {
      console.log("[STOMP] Disconnected");
      currentStatusCallback?.(false, false);
    },
  });

  stompClient.activate();
}

export async function sendMessage(payload: SendMessageDTO): Promise<void> {
  // If STOMP client is live and connected, publish via WebSocket
  if (stompClient && stompClient.connected) {
    try {
      stompClient.publish({
        destination: "/app/sendMessage",
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
      });
      return;
    } catch (wsErr) {
      console.warn("[STOMP] WebSocket publish failed, trying HTTP POST fallback:", wsErr);
    }
  }

  // Fallback to HTTP POST so messages are NEVER lost even when socket is reconnecting
  try {
    const res = await fetch("http://localhost:8080/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to deliver message via HTTP (status ${res.status})`);
    }

    const savedMsg = await res.json();
    if (!stompClient?.connected && currentMessageCallback) {
      currentMessageCallback(savedMsg);
    }
  } catch (httpErr) {
    console.error("[STOMP] Failed to send message via HTTP fallback:", httpErr);
    throw httpErr;
  }
}

export function disconnectSocket(): void {
  if (stompClient) {
    console.log("[STOMP] Deactivating client...");
    stompClient.deactivate();
    stompClient = null;
    currentStatusCallback?.(false, false);
  }
}

export function isSocketConnected(): boolean {
  return !!stompClient?.connected;
}
