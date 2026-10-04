"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMessages, fetchDmMessages } from "@/lib/api/messages";
import { useChatStore } from "@/store/chatStore";

export function useChatMessages(
  activeChatType: "channel" | "dm",
  roomId: number,
  myUserId?: number,
  dmUserId?: number
) {
  const setMessages = useChatStore((state) => state.setMessages);
  const setDmMessages = useChatStore((state) => state.setDmMessages);
  const messagesByRoom = useChatStore((state) => state.messagesByRoom);
  const messagesByDm = useChatStore((state) => state.messagesByDm);

  const isChannel = activeChatType === "channel";
  const isDm = activeChatType === "dm" && Boolean(myUserId && dmUserId);

  const channelQuery = useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => fetchMessages(roomId),
    enabled: isChannel && typeof roomId === "number" && !isNaN(roomId),
    staleTime: 1000 * 60 * 3,
  });

  const dmQuery = useQuery({
    queryKey: ["dm-messages", myUserId, dmUserId],
    queryFn: () => fetchDmMessages(myUserId!, dmUserId!),
    enabled: isDm,
    staleTime: 1000 * 60 * 3,
  });

  useEffect(() => {
    if (isChannel && channelQuery.data && Array.isArray(channelQuery.data)) {
      setMessages(roomId, channelQuery.data);
    }
  }, [isChannel, channelQuery.data, roomId, setMessages]);

  useEffect(() => {
    if (isDm && dmUserId && dmQuery.data && Array.isArray(dmQuery.data)) {
      setDmMessages(dmUserId, dmQuery.data);
    }
  }, [isDm, dmUserId, dmQuery.data, setDmMessages]);

  const activeMessages = isChannel
    ? (messagesByRoom[roomId] ?? channelQuery.data ?? [])
    : (dmUserId ? (messagesByDm[dmUserId] ?? dmQuery.data ?? []) : []);

  const activeQuery = isChannel ? channelQuery : dmQuery;

  return {
    messages: activeMessages,
    isLoading: activeQuery.isLoading && activeMessages.length === 0,
    isFetching: activeQuery.isFetching,
    isError: activeQuery.isError,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
  };
}
