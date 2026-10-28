import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { SendMessageDTO } from "@/types/chat";
import { apiUrl } from "@/lib/config/api";
import { getAuthToken, getUserProfile } from "@/app/lib/auth";

let stompClient: Client | null = null;
let currentMessageCallback: ((msg: any) => void) | null = null;
let currentStatusCallback: ((connected: boolean, connecting: boolean) => void) | null = null;

type GalleryCallback = (post: any) => void;
type GalleryDeleteCallback = (deleteInfo: { id: number }) => void;
type PresenceCallback = (presence: {
  type: string;
  userId?: number;
  username?: string;
  online: boolean;
  onlineUserIds?: number[];
  onlineUsernames?: string[];
  timestamp?: number;
}) => void;

const galleryCallbacks: Set<GalleryCallback> = new Set();
const galleryDeleteCallbacks: Set<GalleryDeleteCallback> = new Set();
const presenceCallbacks: Set<PresenceCallback> = new Set();

let roomSubscriptions: any[] = [];
let dmMessagesSubscription: any = null;
let gallerySubscription: any = null;
let galleryDeleteSubscription: any = null;
let presenceSubscription: any = null;

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

export function subscribeToPresence(cb: PresenceCallback): () => void {
  presenceCallbacks.add(cb);
  return () => {
    presenceCallbacks.delete(cb);
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

  const token = getAuthToken();
  if (!token) {
    currentStatusCallback?.(false, false);
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(apiUrl("/chat")),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: (frame) => {
      console.log("[STOMP] Connected successfully", frame.headers);
      currentStatusCallback?.(true, false);

      // Clean up previous subscriptions if any before re-subscribing
      roomSubscriptions.forEach((subscription) => {
        try { subscription.unsubscribe(); } catch {}
      });
      roomSubscriptions = [];
      if (dmMessagesSubscription) {
        try { dmMessagesSubscription.unsubscribe(); } catch {}
      }
      if (gallerySubscription) {
        try { gallerySubscription.unsubscribe(); } catch {}
      }
      if (galleryDeleteSubscription) {
        try { galleryDeleteSubscription.unsubscribe(); } catch {}
      }
      if (presenceSubscription) {
        try { presenceSubscription.unsubscribe(); } catch {}
      }

      const receiveMessage = (messageFrame: any) => {
        try {
          const payload = JSON.parse(messageFrame.body);
          if (currentMessageCallback) {
            currentMessageCallback(payload);
          }
        } catch (err) {
          console.error("[STOMP] Failed to parse message frame:", err);
        }
      };
      const roomIds = [1, 6, 7, 8];
      const studentYear = getUserProfile()?.studentYear;
      if (studentYear != null && studentYear >= 1 && studentYear <= 4) roomIds.push(studentYear + 1);
      roomSubscriptions = roomIds
        .map((roomId) => stompClient?.subscribe(`/topic/room/${roomId}`, receiveMessage))
        .filter(Boolean);
      dmMessagesSubscription = stompClient?.subscribe("/user/queue/messages", receiveMessage);

      // Subscribe to real-time gallery upload topic
      gallerySubscription = stompClient?.subscribe("/topic/gallery", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          galleryCallbacks.forEach((cb) => cb(payload));
        } catch (err) {
          console.error("[STOMP] Failed to parse gallery frame:", err);
        }
      });

      // Subscribe to real-time gallery delete topic
      galleryDeleteSubscription = stompClient?.subscribe("/topic/gallery/delete", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          galleryDeleteCallbacks.forEach((cb) => cb(payload));
        } catch (err) {
          console.error("[STOMP] Failed to parse gallery delete frame:", err);
        }
      });

      // Subscribe to real-time presence topic
      presenceSubscription = stompClient?.subscribe("/topic/presence", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          presenceCallbacks.forEach((cb) => cb(payload));
        } catch (err) {
          console.error("[STOMP] Failed to parse presence frame:", err);
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
    const res = await fetch(apiUrl("/messages"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
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
    if (presenceSubscription) {
      try { presenceSubscription.unsubscribe(); } catch {}
      presenceSubscription = null;
    }
    stompClient.deactivate();
    stompClient = null;
    currentStatusCallback?.(false, false);
  }
}

export function isSocketConnected(): boolean {
  return !!stompClient?.connected;
}
