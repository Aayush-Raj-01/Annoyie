"use client";

import { useEffect, useCallback } from "react";
import { connectSocket, sendMessage } from "@/lib/socket/chatClient";
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
        addMessage(incomingMsg);
      },
      (connected, connecting) => {
        setConnectionStatus(connected, connecting);
      }
    );

    return () => {
      // Keep socket alive across route switches
    };
  }, [addMessage, setConnectionStatus]);

  const send = useCallback(
    async (
      content: string,
      sender: string,
      targetRoomId?: number,
      senderEmail?: string,
      avatarUrl?: string,
      tag?: string,
      studentYear?: number,
      receiverId?: number,
      senderId?: number
    ) => {
      if (!content.trim()) return;

      const payload: SendMessageDTO = {
        sender: sender.trim() || "Anonymous",
        senderEmail: senderEmail?.trim() || sender.trim() || "Anonymous",
        roomId: receiverId ? undefined : (targetRoomId ?? activeRoomId),
        content: content.trim(),
        avatarUrl: avatarUrl?.trim() || undefined,
        tag: tag?.trim() || undefined,
        studentYear: studentYear,
        receiverId: receiverId,
        senderId: senderId,
      };

      await sendMessage(payload);
    },
    [activeRoomId]
  );

  return {
    isConnected,
    isConnecting,
    send,
  };
}
