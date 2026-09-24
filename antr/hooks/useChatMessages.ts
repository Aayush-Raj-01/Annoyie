"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMessages } from "@/lib/api/messages";
import { useChatStore } from "@/store/chatStore";

export function useChatMessages(roomId: number) {
  const setMessages = useChatStore((state) => state.setMessages);
  const messagesByRoom = useChatStore((state) => state.messagesByRoom);

  const query = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const data = await fetchMessages(roomId);
      return data;
    },
    enabled: typeof roomId === "number" && !isNaN(roomId),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });

  // When React Query delivers historical messages, sync them into the Zustand store
  useEffect(() => {
    if (query.data && Array.isArray(query.data)) {
      setMessages(roomId, query.data);
    }
  }, [query.data, roomId, setMessages]);

  // Messages displayed are the ones currently stored in Zustand for this room
  // (which combines initial historical messages + any newly arrived real-time messages)
  const roomMessages = messagesByRoom[roomId] ?? query.data ?? [];

  return {
    messages: roomMessages,
    isLoading: query.isLoading && !messagesByRoom[roomId],
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
