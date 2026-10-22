import type { Message, DMConversation } from "@/types/chat";
import { getAuthToken } from "@/app/lib/auth";
import { apiUrl } from "@/lib/config/api";

function extractSenderName(sender: any, fallbackEmail?: any): string {
  if (typeof sender === "string" && sender.trim()) {
    return sender.trim();
  }
  if (sender && typeof sender === "object") {
    const candidate = sender.username || sender.name || sender.email;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  if (typeof fallbackEmail === "string" && fallbackEmail.trim()) {
    return fallbackEmail.trim();
  }
  return "Anonymous";
}

function extractAvatarUrl(item: any): string | undefined {
  if (typeof item.avatarUrl === "string" && item.avatarUrl.trim()) {
    return item.avatarUrl.trim();
  }
  if (item.sender && typeof item.sender === "object") {
    if (typeof item.sender.avatarUrl === "string" && item.sender.avatarUrl.trim()) {
      return item.sender.avatarUrl.trim();
    }
  }
  return undefined;
}

export function normalizeRawMessage(item: any, fallbackRoomId?: number): Message {
  const senderId =
    typeof item.senderId === "number"
      ? item.senderId
      : typeof item.sender === "object" && typeof item.sender?.id === "number"
      ? item.sender.id
      : undefined;

  const receiverId =
    typeof item.receiverId === "number"
      ? item.receiverId
      : typeof item.receiver === "object" && typeof item.receiver?.id === "number"
      ? item.receiver.id
      : undefined;

  const roomId = item.room?.id ?? item.roomId ?? fallbackRoomId;
  const senderEmail =
    typeof item.senderEmail === "string"
      ? item.senderEmail
      : typeof item.sender === "object" && typeof item.sender?.email === "string"
      ? item.sender.email
      : undefined;

  const senderUsername =
    typeof item.senderUsername === "string" && item.senderUsername.trim()
      ? item.senderUsername.trim()
      : typeof item.sender === "object" && typeof item.sender?.username === "string" && item.sender.username.trim()
      ? item.sender.username.trim()
      : extractSenderName(item.sender, senderEmail);

  return {
    id: item.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: senderUsername || extractSenderName(item.sender, senderEmail),
    senderUsername,
    senderEmail,
    senderId,
    receiverId,
    receiver: item.receiver ? { id: receiverId!, username: item.receiver.username, avatarUrl: item.receiver.avatarUrl } : undefined,
    content: item.content ?? item.Content ?? "",
    createdAt: item.createdAt || new Date().toISOString(),
    room: roomId ? { id: roomId } : undefined,
    roomId: roomId,
    tag: item.tag || (typeof item.sender === "object" ? item.sender?.tag : undefined),
    avatarUrl: extractAvatarUrl(item),
    studentYear:
      item.studentYear ?? (typeof item.sender === "object" ? item.sender?.studentYear : undefined),
  };
}

export async function fetchMessages(roomId: number): Promise<Message[]> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(`/messages/${roomId}`), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load messages for room #${roomId} (status ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => normalizeRawMessage(item, roomId));
}

export async function fetchDmMessages(user1Id: number, user2Id: number): Promise<Message[]> {
  if (!user1Id || !user2Id) return [];

  const response = await fetch(apiUrl(`/messages/dm/${user1Id}/${user2Id}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load DM messages between user ${user1Id} and ${user2Id} (status ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => normalizeRawMessage(item));
}

export async function fetchDmConversations(userId?: number): Promise<DMConversation[]> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = userId
    ? apiUrl(`/messages/dm-conversations/${userId}`)
    : apiUrl("/messages/dm-conversations");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      userId: Number(item.userId),
      username: item.username,
      avatarUrl: item.avatarUrl,
      tag: item.tag,
      studentYear: item.studentYear,
      lastMessage: item.lastMessage,
      lastMessageTime: item.lastMessageTime,
      unreadCount: item.unreadCount || 0,
    }));
  } catch (err) {
    console.error("Failed to fetch DM conversations:", err);
    return [];
  }
}
