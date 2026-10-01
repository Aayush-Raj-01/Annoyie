import { create } from "zustand";
import type { Message, ChatRoom } from "@/types/chat";

// ─── Default Chat Rooms ───────────────────────────────────────────────────────
export const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 1,
    name: "General Lounge",
    description: "Casual chat & open community banter",
    emoji: "💬",
    category: "Community",
    memberCount: 42,
  },
  {
    id: 2,
    name: "Coders & Tech",
    description: "Dev talk, bugs, frameworks, and architecture",
    emoji: "💻",
    category: "Development",
    memberCount: 28,
  },
  {
    id: 3,
    name: "Off-Topic & Chill",
    description: "Memes, coffee, music, life, and random thoughts",
    emoji: "☕",
    category: "Social",
    memberCount: 19,
  },
  {
    id: 4,
    name: "Anonymous Confessions",
    description: "Whisper your secrets in 100% anonymous comfort",
    emoji: "🕶️",
    category: "Confessions",
    memberCount: 35,
  },
];

interface ChatState {
  activeRoomId: number;
  messagesByRoom: Record<number, Message[]>;
  unreadCounts: Record<number, number>;
  isConnected: boolean;
  isConnecting: boolean;
  activeRoom: ChatRoom;

  setActiveRoom: (roomId: number) => void;
  markRoomAsRead: (roomId: number) => void;
  setMessages: (roomId: number, messages: Message[]) => void;
  addMessage: (message: Partial<Message> & { sender: string; content: string }) => void;
  setConnectionStatus: (connected: boolean, connecting?: boolean) => void;
  clearRoom: (roomId: number) => void;
}

function resolveSenderName(sender: any, fallback?: any): string {
  if (typeof sender === "string" && sender.trim()) {
    return sender.trim();
  }
  if (sender && typeof sender === "object") {
    const candidate = sender.username || sender.name || sender.email;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }
  return "Anonymous";
}

function resolveAvatarUrl(raw: any): string | undefined {
  if (!raw) return undefined;
  if (typeof raw.avatarUrl === "string" && raw.avatarUrl.trim()) {
    return raw.avatarUrl.trim();
  }
  if (raw.sender && typeof raw.sender === "object") {
    if (typeof raw.sender.avatarUrl === "string" && raw.sender.avatarUrl.trim()) {
      return raw.sender.avatarUrl.trim();
    }
  }
  return undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeRoomId: 1,
  messagesByRoom: {},
  unreadCounts: {},
  isConnected: false,
  isConnecting: true,
  activeRoom: CHAT_ROOMS[0],

  setActiveRoom: (roomId) => {
    const room = CHAT_ROOMS.find((r) => r.id === roomId) || {
      id: roomId,
      name: `Room #${roomId}`,
      description: "Chat room",
      emoji: "💭",
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`annoyms_last_read_${roomId}`, Date.now().toString());
      } catch {}
    }
    set((state) => ({
      activeRoomId: roomId,
      activeRoom: room,
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: 0,
      },
    }));
  },

  markRoomAsRead: (roomId) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`annoyms_last_read_${roomId}`, Date.now().toString());
      } catch {}
    }
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: 0,
      },
    }));
  },

  setMessages: (roomId, messages) => {
    // Collect known avatars per sender from incoming messages and stored profile
    const avatarBySender: Record<string, string> = {};
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("annoyms_user_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.anonymousName && parsed?.avatarUrl) {
            avatarBySender[parsed.anonymousName] = parsed.avatarUrl;
          }
        }
      } catch {}
    }

    for (const m of messages) {
      const sender = resolveSenderName(m.sender, (m as any).senderEmail);
      const avatar = resolveAvatarUrl(m);
      if (sender && avatar && !avatarBySender[sender]) {
        avatarBySender[sender] = avatar;
      }
    }

    // Deduplicate array by id if present & ensure clean normalization
    const seen = new Set<string | number>();
    const unique = messages
      .filter((m) => {
        if (m.id == null) return true;
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .map((m) => {
        const sender = resolveSenderName(m.sender, (m as any).senderEmail);
        const avatar = resolveAvatarUrl(m) || (sender ? avatarBySender[sender] : undefined);
        return {
          ...m,
          sender,
          tag: m.tag ?? (typeof m.sender === "object" ? (m.sender as any)?.tag : undefined),
          avatarUrl: avatar,
        };
      });

    const currentActiveId = get().activeRoomId;
    let unreadCount = 0;
    if (roomId !== currentActiveId && typeof window !== "undefined") {
      try {
        const lastRead = localStorage.getItem(`annoyms_last_read_${roomId}`);
        if (lastRead) {
          const lastReadTime = Number(lastRead);
          unreadCount = unique.filter((m) => new Date(m.createdAt).getTime() > lastReadTime).length;
        }
      } catch {}
    }

    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: unique,
      },
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: roomId === currentActiveId ? 0 : unreadCount,
      },
    }));
  },

  addMessage: (rawMessage) => {
    // Normalize roomId
    const roomId = rawMessage.room?.id ?? rawMessage.roomId ?? get().activeRoomId;
    if (!roomId) return;

    const resolvedSender = resolveSenderName(rawMessage.sender, (rawMessage as any).senderEmail);
    const resolvedTag =
      rawMessage.tag ??
      (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.tag : undefined);

    let resolvedAvatarUrl = resolveAvatarUrl(rawMessage);
    if (!resolvedAvatarUrl && resolvedSender) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("annoyms_user_profile");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.anonymousName === resolvedSender && parsed?.avatarUrl) {
              resolvedAvatarUrl = parsed.avatarUrl;
            }
          }
        } catch {}
      }
      if (!resolvedAvatarUrl) {
        const existing = get().messagesByRoom[roomId] ?? [];
        const prevMsg = existing.find((m) => m.sender === resolvedSender && m.avatarUrl);
        if (prevMsg?.avatarUrl) {
          resolvedAvatarUrl = prevMsg.avatarUrl;
        }
      }
    }

    const normalizedMessage: Message = {
      id: rawMessage.id ?? `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: resolvedSender,
      content: rawMessage.content,
      createdAt: rawMessage.createdAt ?? new Date().toISOString(),
      room: { id: roomId },
      roomId: roomId,
      tag: resolvedTag,
      avatarUrl: resolvedAvatarUrl,
    };

    const existing = get().messagesByRoom[roomId] ?? [];

    // Deduplication check
    const isDuplicate = existing.some((m) => {
      if (m.id === normalizedMessage.id) return true;
      // Also check exact match of sender + content within 1.5 seconds to avoid echo
      if (
        m.sender === normalizedMessage.sender &&
        m.content === normalizedMessage.content &&
        Math.abs(new Date(m.createdAt).getTime() - new Date(normalizedMessage.createdAt).getTime()) < 1500
      ) {
        return true;
      }
      return false;
    });

    if (isDuplicate) return;

    const isCurrentActive = roomId === get().activeRoomId;
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: [...existing, normalizedMessage],
      },
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: isCurrentActive ? 0 : (state.unreadCounts[roomId] || 0) + 1,
      },
    }));
  },

  setConnectionStatus: (connected, connecting = false) => {
    set({ isConnected: connected, isConnecting: connecting });
  },

  clearRoom: (roomId) =>
    set((state) => {
      const updated = { ...state.messagesByRoom };
      delete updated[roomId];
      return { messagesByRoom: updated };
    }),
}));
