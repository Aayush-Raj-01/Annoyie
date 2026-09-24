"use client";

import { useEffect, useCallback } from "react";
import { connectSocket, disconnectSocket, sendMessage } from "@/lib/socket/chatClient";
import { useChatStore } from "@/store/chatStore";
import type { SendMessageDTO } from "@/types/chat";

export function useChatWebSocket() {
  const addMessage = useChatStore((state) => state.addMessage);
  const setConnectionStatus = useChatStore((state) => state.setConnectionStatus);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const activeRoomId = useChatStore((state) => state.activeRoomId);

  useEffect(() => {
    // Connect STOMP socket with message handler and status listener
    connectSocket(
      (incomingMsg) => {
        // incomingMsg can be { sender, roomId, content } or full Message entity
        addMessage(incomingMsg);
      },
      (connected, connecting) => {
        setConnectionStatus(connected, connecting);
      }
    );

    // Optional cleanup on complete unmount if required
    return () => {
      // Keep socket alive across route switches or disconnect
    };
  }, [addMessage, setConnectionStatus]);

  const send = useCallback(
    (content: string, sender: string, targetRoomId?: number) => {
      const targetRoom = targetRoomId ?? activeRoomId;
      if (!content.trim()) return;

      const payload: SendMessageDTO = {
        senderEmail: sender.trim() || "Anonymous",
        roomId: targetRoom,
        content: content.trim(),
      };

      sendMessage(payload);
    },
    [activeRoomId]
  );

  return {
    isConnected,
    isConnecting,
    send,
  };
}
