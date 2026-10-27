"use client";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { apiUrl } from "@/lib/config/api";
import { getAuthToken, getUserProfile } from "@/app/lib/auth";

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
    webSocketFactory: () => new SockJS(apiUrl("/chat")),
    connectHeaders: { Authorization: `Bearer ${getAuthToken()}` },
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("[Socket] Connected to chat server");
      const receiveMessage = (frame: any) => {
        try {
          onMessage(JSON.parse(frame.body));
        } catch {
          console.warn("[Socket] Failed to parse message:", frame.body);
        }
      };
      const roomIds = [1, 6, 7, 8];
      const studentYear = getUserProfile()?.studentYear;
      if (studentYear != null && studentYear >= 1 && studentYear <= 4) roomIds.push(studentYear + 1);
      for (const roomId of roomIds) {
        client?.subscribe(`/topic/room/${roomId}`, receiveMessage);
      }
      client?.subscribe("/user/queue/messages", receiveMessage);
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
