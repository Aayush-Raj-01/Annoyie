"use client";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export interface ChatMessage {
  sender: string;
  receiver: string;
  content: string;
  tag?: string;
  timestamp?: string;
}

export function connectSocket(onMessage: (message: ChatMessage) => void) {
  if (client?.active) return; // already connected

  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/chat"),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("[Socket] Connected to chat server");
      client?.subscribe("/topic/messages", (frame) => {
        try {
          onMessage(JSON.parse(frame.body));
        } catch {
          console.warn("[Socket] Failed to parse message:", frame.body);
        }
      });
    },
    onStompError: (frame) => {
      console.error("[Socket] STOMP error:", frame.headers["message"]);
    },
  });

  client.activate();
}

export function sendMessage(data: ChatMessage) {
  if (!client?.active) {
    console.warn("[Socket] Cannot send — not connected");
    return;
  }
  client.publish({
    destination: "/app/sendMessage",
    body: JSON.stringify(data),
  });
}

export function disconnectSocket() {
  client?.deactivate();
  client = null;
}
