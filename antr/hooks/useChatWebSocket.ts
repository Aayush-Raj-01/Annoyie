"use client";

import { useEffect, useCallback } from "react";
import { connectSocket, sendMessage, subscribeToPresence } from "@/lib/socket/chatClient";
import { useChatStore } from "@/store/chatStore";
import type { SendMessageDTO } from "@/types/chat";

export function useChatWebSocket() {
  const addMessage = useChatStore((state) => state.addMessage);
  const setConnectionStatus = useChatStore((state) => state.setConnectionStatus);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const activeRoomId = useChatStore((state) => state.activeRoomId);

  const fetchOnlinePresence = useChatStore((state) => state.fetchOnlinePresence);
  const setOnlinePresence = useChatStore((state) => state.setOnlinePresence);
  const updateUserPresence = useChatStore((state) => state.updateUserPresence);

  useEffect(() => {
    // 1. Connect STOMP socket with message handler and status listener
    connectSocket(
      (incomingMsg) => {
        addMessage(incomingMsg);
      },
      (connected, connecting) => {
        setConnectionStatus(connected, connecting);
      }
    );

    // 2. Initial presence sync
    fetchOnlinePresence();

    // 3. Real-time presence listener from WebSocket
    const unsubPresence = subscribeToPresence((presence) => {
      if (Array.isArray(presence.onlineUserIds) && Array.isArray(presence.onlineUsernames)) {
        setOnlinePresence(presence.onlineUserIds, presence.onlineUsernames);
      } else if (presence.userId != null || presence.username != null) {
        updateUserPresence(presence.userId, presence.username, presence.online);
      }
    });

    // 4. Polling heartbeat sync every 15s
    const pollInterval = setInterval(() => {
      fetchOnlinePresence();
    }, 15000);

    return () => {
      unsubPresence();
      clearInterval(pollInterval);
    };
  }, [addMessage, setConnectionStatus, fetchOnlinePresence, setOnlinePresence, updateUserPresence]);

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
