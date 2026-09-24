import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Message, SendMessageDTO } from "@/types/chat";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/chat";

let stompClient: Client | null = null;
let currentMessageCallback: ((msg: any) => void) | null = null;
let currentStatusCallback: ((connected: boolean, connecting: boolean) => void) | null = null;

export function getSocketClient(): Client | null {
  return stompClient;
}

export function connectSocket(
  onMessage: (msg: any) => void,
  onStatusChange?: (connected: boolean, connecting: boolean) => void
): void {
  currentMessageCallback = onMessage;
  if (onStatusChange) {
    currentStatusCallback = onStatusChange;
  }

  // If already active, trigger status and return
  if (stompClient?.active) {
    currentStatusCallback?.(true, false);
    return;
  }

  currentStatusCallback?.(false, true);

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: (frame) => {
      console.log("[STOMP] Connected successfully", frame.headers);
      currentStatusCallback?.(true, false);

      // Subscribe to global room topic
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
    },

    onStompError: (frame) => {
      console.error("[STOMP] Broker error:", frame.headers["message"], frame.body);
      currentStatusCallback?.(false, true);
    },

    onWebSocketClose: () => {
      console.warn("[STOMP] WebSocket connection closed, reconnecting in 5s...");
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

export function sendMessage(payload: SendMessageDTO): void {
  if (!stompClient || !stompClient.active) {
    console.warn("[STOMP] Cannot send message - socket not active. Reconnecting...");
    stompClient?.activate();
    throw new Error("Chat connection is currently offline. Please wait a moment.");
  }

  stompClient.publish({
    destination: "/app/sendMessage",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
  });
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
  return !!stompClient?.active;
}
