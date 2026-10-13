"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMessages, fetchDmMessages } from "@/lib/api/messages";
import { CHAT_ROOMS, useChatStore } from "@/store/chatStore";

export function useChatMessages(
  activeChatType: "channel" | "dm",
  roomId: number,
  myUserId?: number,
  dmUserId?: number,
  myStudentYear?: number
) {
  const setMessages = useChatStore((state) => state.setMessages);
  const setDmMessages = useChatStore((state) => state.setDmMessages);
  const messagesByRoom = useChatStore((state) => state.messagesByRoom);
  const messagesByDm = useChatStore((state) => state.messagesByDm);

  const isChannel = activeChatType === "channel";
  const isDm = activeChatType === "dm" && Boolean(myUserId && dmUserId);

  const targetRoom = isChannel ? CHAT_ROOMS.find((r) => r.id === roomId) : null;
  const isPermitted = !targetRoom?.requiredYear || (myStudentYear === targetRoom.requiredYear);

  const channelQuery = useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => fetchMessages(roomId),
    enabled: isChannel && typeof roomId === "number" && !isNaN(roomId) && isPermitted,
    staleTime: 1000 * 60 * 3,
  });

  const dmQuery = useQuery({
    queryKey: ["dm-messages", myUserId, dmUserId],
    queryFn: () => fetchDmMessages(myUserId!, dmUserId!),
    enabled: isDm,
    staleTime: 1000 * 60 * 3,
  });

  useEffect(() => {
    if (isChannel && isPermitted && channelQuery.data && Array.isArray(channelQuery.data)) {
      setMessages(roomId, channelQuery.data);
    }
  }, [isChannel, isPermitted, channelQuery.data, roomId, setMessages]);

  useEffect(() => {
    if (isDm && dmUserId && dmQuery.data && Array.isArray(dmQuery.data)) {
      setDmMessages(dmUserId, dmQuery.data);
    }
  }, [isDm, dmUserId, dmQuery.data, setDmMessages]);

  const activeMessages = isChannel
    ? (isPermitted ? (messagesByRoom[roomId] ?? channelQuery.data ?? []) : [])
    : (dmUserId ? (messagesByDm[dmUserId] ?? dmQuery.data ?? []) : []);

  const activeQuery = isChannel ? channelQuery : dmQuery;

  return {
    messages: activeMessages,
    isLoading: activeQuery.isLoading && activeMessages.length === 0,
    isFetching: activeQuery.isFetching,
    isError: activeQuery.isError,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
    isPermitted,
  };
}
