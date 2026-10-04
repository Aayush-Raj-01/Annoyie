import { create } from "zustand";
import type { Message, ChatRoom, DMConversation, UserSearchResult } from "@/types/chat";
import { getUserById } from "@/lib/api/users";

// ─── Default Chat Rooms ───────────────────────────────────────────────────────
export const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 1,
    name: "All Year",
    description: "BE RESPECTFULL",
    emoji: "💬",
    memberCount: 42,
  },
  {
    id: 2,
    name: "1st Year",
    emoji: "💻",
    memberCount: 28,
  },
  {
    id: 3,
    name: "2nd Year",
    emoji: "☕",
    memberCount: 19,
  },
  {
    id: 4,
    name: "3rd Year",
    emoji: "🕶️",
    memberCount: 35,
  },
  {
    id: 5,
    name: "4th Year",
    emoji: "🕶️",
    memberCount: 35,
  },
  {
    id: 6,
    name: "Coding",
    emoji: "💻",
    memberCount: 35,
  },
  {
    id: 7,
    name: "Creative",
    emoji: "🎨",
    memberCount: 35,
  },
];

const BLOCKED_USERS_KEY = "annoyms_blocked_users";
const DM_CONVERSATIONS_KEY = "annoyms_dm_conversations";

function getInitialBlockedUsers(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getInitialDmConversations(): DMConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DM_CONVERSATIONS_KEY);
    if (!raw) return [];
    const list: DMConversation[] = JSON.parse(raw);
    const stored = getStoredProfile();
    // Sanitize any corrupt local cache where the logged-in user's DP was assigned to other users
    return list.map((c) => {
      if (stored?.avatarUrl && c.avatarUrl === stored.avatarUrl) {
        return { ...c, avatarUrl: undefined };
      }
      return c;
    });
  } catch {
    return [];
  }
}

interface ChatState {
  activeChatType: "channel" | "dm";
  activeRoomId: number;
  activeRoom: ChatRoom;
  activeDmUser: DMConversation | null;
  dmConversations: DMConversation[];
  messagesByRoom: Record<number, Message[]>;
  messagesByDm: Record<number, Message[]>;
  unreadCounts: Record<number, number>;
  unreadDmCounts: Record<number, number>;
  blockedUserIds: number[];
  currentUserId?: number;
  isConnected: boolean;
  isConnecting: boolean;

  setCurrentUserId: (id?: number) => void;
  setActiveRoom: (roomId: number) => void;
  openDm: (user: { id: number; username: string; avatarUrl?: string; tag?: string; studentYear?: number }) => void;
  blockUser: (userId: number) => void;
  unblockUser: (userId: number) => void;
  isUserBlocked: (userId: number) => boolean;
  markRoomAsRead: (roomId: number) => void;
  markDmAsRead: (userId: number) => void;
  setMessages: (roomId: number, messages: Message[]) => void;
  setDmMessages: (otherUserId: number, messages: Message[]) => void;
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

function getStoredProfile(): { id?: number; email?: string; anonymousName?: string; avatarUrl?: string; studentYear?: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("annoyms_user_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeChatType: "channel",
  activeRoomId: 1,
  activeRoom: CHAT_ROOMS[0],
  activeDmUser: null,
  dmConversations: getInitialDmConversations(),
  messagesByRoom: {},
  messagesByDm: {},
  unreadCounts: {},
  unreadDmCounts: {},
  blockedUserIds: getInitialBlockedUsers(),
  currentUserId: getStoredProfile()?.id,
  isConnected: false,
  isConnecting: true,

  setCurrentUserId: (id) => {
    set({ currentUserId: id });
  },

  setActiveRoom: (roomId) => {
    const room = CHAT_ROOMS.find((r) => r.id === roomId) || {
      id: roomId,
      name: `Room ${roomId}`,
      description: "Chat room",
      emoji: "💭",
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`annoyms_last_read_${roomId}`, Date.now().toString());
      } catch {}
    }
    set((state) => ({
      activeChatType: "channel",
      activeRoomId: roomId,
      activeRoom: room,
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: 0,
      },
    }));
  },

  openDm: (user) => {
    const stored = getStoredProfile();
    const myId = get().currentUserId || stored?.id;
    const myName = stored?.anonymousName?.toLowerCase().trim();

    // Prevent DM with oneself
    if ((myId && Number(user.id) === Number(myId)) || (myName && user.username.toLowerCase().trim() === myName)) {
      console.warn("[CHAT] Cannot open direct message with yourself");
      return;
    }

    const isBlocked = get().blockedUserIds.includes(user.id);

    // Guard: Never allow the other user's conversation to use my own avatar
    let cleanAvatar = user.avatarUrl;
    if (stored?.avatarUrl && cleanAvatar === stored.avatarUrl) {
      cleanAvatar = undefined;
    }

    const dmItem: DMConversation = {
      userId: user.id,
      username: user.username,
      avatarUrl: cleanAvatar,
      tag: user.tag,
      studentYear: user.studentYear,
      isBlocked,
    };

    set((state) => {
      const existingConv = state.dmConversations.find((c) => c.userId === user.id);
      const chosenAvatar =
        cleanAvatar !== undefined
          ? cleanAvatar
          : (stored?.avatarUrl && existingConv?.avatarUrl === stored.avatarUrl ? undefined : existingConv?.avatarUrl);

      const mergedItem: DMConversation = {
        ...dmItem,
        avatarUrl: chosenAvatar,
        lastMessage: existingConv?.lastMessage,
        lastMessageTime: existingConv?.lastMessageTime,
      };

      // Add or bring to top in dmConversations
      const filtered = state.dmConversations.filter((c) => c.userId !== user.id);
      const updatedList = [mergedItem, ...filtered];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(DM_CONVERSATIONS_KEY, JSON.stringify(updatedList));
        } catch {}
      }

      return {
        activeChatType: "dm",
        activeDmUser: mergedItem,
        dmConversations: updatedList,
        unreadDmCounts: {
          ...state.unreadDmCounts,
          [user.id]: 0,
        },
      };
    });

    // Asynchronously fetch fresh user details directly from database to guarantee authentic avatar
    getUserById(user.id)
      .then((fresh) => {
        if (!fresh) return;
        set((state) => {
          const updatedConvs = state.dmConversations.map((c) =>
            c.userId === user.id
              ? {
                  ...c,
                  username: fresh.username || c.username,
                  avatarUrl: fresh.avatarUrl || undefined,
                  tag: fresh.tag || c.tag,
                  studentYear: fresh.studentYear ?? c.studentYear,
                }
              : c
          );
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(DM_CONVERSATIONS_KEY, JSON.stringify(updatedConvs));
            } catch {}
          }
          const updatedActive =
            state.activeDmUser?.userId === user.id
              ? {
                  ...state.activeDmUser,
                  username: fresh.username || state.activeDmUser.username,
                  avatarUrl: fresh.avatarUrl || undefined,
                  tag: fresh.tag || state.activeDmUser.tag,
                  studentYear: fresh.studentYear ?? state.activeDmUser.studentYear,
                }
              : state.activeDmUser;
          return {
            dmConversations: updatedConvs,
            activeDmUser: updatedActive,
          };
        });
      })
      .catch(() => {});
  },

  blockUser: (userId) => {
    set((state) => {
      if (state.blockedUserIds.includes(userId)) return state;
      const updatedBlocked = [...state.blockedUserIds, userId];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updatedBlocked));
        } catch {}
      }

      const updatedDmUser =
        state.activeDmUser && state.activeDmUser.userId === userId
          ? { ...state.activeDmUser, isBlocked: true }
          : state.activeDmUser;

      const updatedConversations = state.dmConversations.map((c) =>
        c.userId === userId ? { ...c, isBlocked: true } : c
      );

      return {
        blockedUserIds: updatedBlocked,
        activeDmUser: updatedDmUser,
        dmConversations: updatedConversations,
      };
    });
  },

  unblockUser: (userId) => {
    set((state) => {
      const updatedBlocked = state.blockedUserIds.filter((id) => id !== userId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updatedBlocked));
        } catch {}
      }

      const updatedDmUser =
        state.activeDmUser && state.activeDmUser.userId === userId
          ? { ...state.activeDmUser, isBlocked: false }
          : state.activeDmUser;

      const updatedConversations = state.dmConversations.map((c) =>
        c.userId === userId ? { ...c, isBlocked: false } : c
      );

      return {
        blockedUserIds: updatedBlocked,
        activeDmUser: updatedDmUser,
        dmConversations: updatedConversations,
      };
    });
  },

  isUserBlocked: (userId) => {
    return get().blockedUserIds.includes(userId);
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

  markDmAsRead: (userId) => {
    set((state) => ({
      unreadDmCounts: {
        ...state.unreadDmCounts,
        [userId]: 0,
      },
    }));
  },

  setMessages: (roomId, messages) => {
    const latestUsernameBySenderId: Record<number, string> = {};
    const latestAvatarBySenderId: Record<number, string> = {};
    const latestYearBySenderId: Record<number, number> = {};

    const stored = getStoredProfile();
    if (stored?.anonymousName && stored?.id) {
      latestUsernameBySenderId[stored.id] = stored.anonymousName;
      if (stored.avatarUrl) latestAvatarBySenderId[stored.id] = stored.avatarUrl;
      if (stored.studentYear) latestYearBySenderId[stored.id] = stored.studentYear;
    }

    // Pass 1: Extract latest sender details (from newest messages) strictly by senderId
    for (const m of messages) {
      const sId =
        typeof m.senderId === "number"
          ? m.senderId
          : typeof m.sender === "object" && typeof (m.sender as any)?.id === "number"
          ? (m.sender as any).id
          : undefined;

      const sUsername =
        typeof (m as any).senderUsername === "string" && (m as any).senderUsername.trim()
          ? (m as any).senderUsername.trim()
          : typeof m.sender === "object" && typeof (m.sender as any)?.username === "string" && (m.sender as any).username.trim()
          ? (m.sender as any).username.trim()
          : typeof m.sender === "string" && m.sender.trim()
          ? m.sender.trim()
          : undefined;

      const avatar = resolveAvatarUrl(m);
      const yr =
        (m as any).studentYear ??
        (typeof m.sender === "object" ? (m.sender as any)?.studentYear : undefined);

      if (sId) {
        if (sUsername) latestUsernameBySenderId[sId] = sUsername;
        if (avatar) latestAvatarBySenderId[sId] = avatar;
        if (yr) latestYearBySenderId[sId] = yr;
      }
    }

    // Pass 2: Deduplicate and normalize with synchronized sender names
    const seen = new Set<string | number>();
    const unique = messages
      .filter((m) => {
        if (m.id == null) return true;
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .map((m) => {
        const senderId =
          typeof m.senderId === "number"
            ? m.senderId
            : typeof m.sender === "object" && typeof (m.sender as any)?.id === "number"
            ? (m.sender as any).id
            : undefined;

        const senderEmail =
          typeof (m as any).senderEmail === "string"
            ? (m as any).senderEmail
            : typeof m.sender === "object" && typeof (m.sender as any)?.email === "string"
            ? (m.sender as any).email
            : undefined;

        // Use latest username for this senderId if known
        let senderUsername =
          (senderId && latestUsernameBySenderId[senderId]) ||
          (typeof (m as any).senderUsername === "string" && (m as any).senderUsername.trim()
            ? (m as any).senderUsername.trim()
            : typeof m.sender === "object" && typeof (m.sender as any)?.username === "string" && (m.sender as any).username.trim()
            ? (m.sender as any).username.trim()
            : resolveSenderName(m.sender, senderEmail));

        // If this message belongs to the currently logged in user, ensure their current name is used
        const isMyMessage =
          (stored?.id && senderId === stored.id) ||
          (stored?.email && senderEmail && stored.email.toLowerCase() === senderEmail.toLowerCase());
        if (isMyMessage && stored?.anonymousName) {
          senderUsername = stored.anonymousName;
        }

        const sender = senderUsername || resolveSenderName(m.sender, senderEmail);
        const avatar =
          (senderId && latestAvatarBySenderId[senderId]) ||
          resolveAvatarUrl(m) ||
          undefined;

        const studentYear =
          (senderId && latestYearBySenderId[senderId]) ??
          (m as any).studentYear ??
          (typeof m.sender === "object" ? (m.sender as any)?.studentYear : undefined) ??
          1;

        return {
          ...m,
          sender,
          senderId,
          senderEmail,
          senderUsername,
          tag: m.tag ?? (typeof m.sender === "object" ? (m.sender as any)?.tag : undefined),
          avatarUrl: avatar,
          studentYear,
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
        [roomId]: roomId === currentActiveId && state.activeChatType === "channel" ? 0 : unreadCount,
      },
    }));
  },

  setDmMessages: (otherUserId, messages) => {
    const stored = getStoredProfile();
    const latestUsernameBySenderId: Record<number, string> = {};
    const latestAvatarBySenderId: Record<number, string> = {};
    const latestYearBySenderId: Record<number, number> = {};

    if (stored?.anonymousName && stored?.id) {
      latestUsernameBySenderId[stored.id] = stored.anonymousName;
      if (stored.avatarUrl) latestAvatarBySenderId[stored.id] = stored.avatarUrl;
      if (stored.studentYear) latestYearBySenderId[stored.id] = stored.studentYear;
    }

    for (const m of messages) {
      const sId =
        typeof m.senderId === "number"
          ? m.senderId
          : typeof m.sender === "object" && typeof (m.sender as any)?.id === "number"
          ? (m.sender as any).id
          : undefined;

      const sUsername =
        typeof (m as any).senderUsername === "string" && (m as any).senderUsername.trim()
          ? (m as any).senderUsername.trim()
          : typeof m.sender === "object" && typeof (m.sender as any)?.username === "string" && (m.sender as any).username.trim()
          ? (m.sender as any).username.trim()
          : typeof m.sender === "string" && m.sender.trim()
          ? m.sender.trim()
          : undefined;

      const avatar = resolveAvatarUrl(m);
      const yr =
        (m as any).studentYear ??
        (typeof m.sender === "object" ? (m.sender as any)?.studentYear : undefined);

      if (sId) {
        if (sUsername) latestUsernameBySenderId[sId] = sUsername;
        if (avatar) latestAvatarBySenderId[sId] = avatar;
        if (yr) latestYearBySenderId[sId] = yr;
      }
    }

    const seen = new Set<string | number>();
    const unique = messages
      .filter((m) => {
        if (m.id == null) return true;
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .map((m) => {
        const senderId =
          typeof m.senderId === "number"
            ? m.senderId
            : typeof m.sender === "object" && typeof (m.sender as any)?.id === "number"
            ? (m.sender as any).id
            : undefined;

        const receiverId =
          typeof m.receiverId === "number"
            ? m.receiverId
            : typeof m.receiver === "object" && typeof (m.receiver as any)?.id === "number"
            ? (m.receiver as any).id
            : undefined;

        const senderEmail =
          typeof (m as any).senderEmail === "string"
            ? (m as any).senderEmail
            : typeof m.sender === "object" && typeof (m.sender as any)?.email === "string"
            ? (m.sender as any).email
            : undefined;

        let senderUsername =
          (senderId && latestUsernameBySenderId[senderId]) ||
          (typeof (m as any).senderUsername === "string" && (m as any).senderUsername.trim()
            ? (m as any).senderUsername.trim()
            : typeof m.sender === "object" && typeof (m.sender as any)?.username === "string" && (m.sender as any).username.trim()
            ? (m.sender as any).username.trim()
            : resolveSenderName(m.sender, senderEmail));

        const isMyMessage =
          (stored?.id && senderId === stored.id) ||
          (stored?.email && senderEmail && stored.email.toLowerCase() === senderEmail.toLowerCase());
        if (isMyMessage && stored?.anonymousName) {
          senderUsername = stored.anonymousName;
        }

        const avatar =
          (senderId && latestAvatarBySenderId[senderId]) ||
          resolveAvatarUrl(m);

        const studentYear =
          (senderId && latestYearBySenderId[senderId]) ??
          (m as any).studentYear ??
          (typeof m.sender === "object" ? (m.sender as any)?.studentYear : undefined) ??
          1;

        return {
          ...m,
          sender: senderUsername || resolveSenderName(m.sender, senderEmail),
          senderId,
          receiverId,
          senderEmail,
          senderUsername,
          avatarUrl: avatar,
          studentYear,
        };
      });

    let otherUserAvatar: string | undefined = latestAvatarBySenderId[otherUserId];
    if (!otherUserAvatar) {
      for (const m of messages) {
        if (m.receiver && typeof m.receiver === "object" && (m.receiver as any).id === otherUserId) {
          if ((m.receiver as any).avatarUrl) {
            otherUserAvatar = (m.receiver as any).avatarUrl;
            break;
          }
        }
      }
    }

    set((state) => {
      const updatedConvs = state.dmConversations.map((c) => {
        if (c.userId === otherUserId) {
          return {
            ...c,
            avatarUrl: otherUserAvatar || undefined,
          };
        }
        return c;
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(DM_CONVERSATIONS_KEY, JSON.stringify(updatedConvs));
        } catch {}
      }

      const updatedActive =
        state.activeDmUser?.userId === otherUserId
          ? {
              ...state.activeDmUser,
              avatarUrl: otherUserAvatar || undefined,
            }
          : state.activeDmUser;

      return {
        messagesByDm: {
          ...state.messagesByDm,
          [otherUserId]: unique,
        },
        dmConversations: updatedConvs,
        activeDmUser: updatedActive,
        unreadDmCounts: {
          ...state.unreadDmCounts,
          [otherUserId]:
            state.activeChatType === "dm" && state.activeDmUser?.userId === otherUserId
              ? 0
              : state.unreadDmCounts[otherUserId] || 0,
        },
      };
    });
  },

  addMessage: (rawMessage) => {
    const stored = getStoredProfile();
    const myId = get().currentUserId || stored?.id;
    const myEmail = stored?.email?.toLowerCase().trim();

    // Detect if this message is a Direct Message
    const senderId =
      rawMessage.senderId ??
      (typeof rawMessage.sender === "object" && typeof rawMessage.sender?.id === "number"
        ? rawMessage.sender.id
        : undefined);

    const receiverId =
      rawMessage.receiverId ??
      (typeof rawMessage.receiver === "object" && typeof rawMessage.receiver?.id === "number"
        ? rawMessage.receiver.id
        : undefined);

    const isDm = Boolean(receiverId || rawMessage.receiver);
    const rawEmail =
      (rawMessage as any).senderEmail ??
      (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.email : undefined);
    const cleanSenderEmail =
      typeof rawEmail === "string" && rawEmail.includes("@")
        ? rawEmail.trim().toLowerCase()
        : undefined;

    if (isDm) {
      // Direct message routing
      let otherUserId: number | undefined;
      const myName = stored?.anonymousName?.toLowerCase();
      const rawSenderName = resolveSenderName(rawMessage.sender, rawEmail).toLowerCase();
      const isSentByMe =
        (typeof myId === "number" && typeof senderId === "number" && myId === senderId) ||
        (Boolean(myEmail) && Boolean(cleanSenderEmail) && myEmail === cleanSenderEmail) ||
        (Boolean(myName) && Boolean(rawSenderName) && rawSenderName === myName);

      if (isSentByMe) {
        otherUserId = receiverId;
      } else {
        otherUserId = senderId;
      }

      if (!otherUserId) return;

      // Disallow DM with oneself
      if (senderId && receiverId && senderId === receiverId) return;
      if (myId && otherUserId === myId) return;

      // If sender is blocked by me, reject incoming message
      if (!isSentByMe && get().blockedUserIds.includes(otherUserId)) {
        console.warn(`[CHAT] Suppressing DM from blocked user: ${otherUserId}`);
        return;
      }

      const senderUsername =
        (rawMessage as any).senderUsername ??
        (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.username : undefined);

      const resolvedSender = senderUsername || resolveSenderName(rawMessage.sender, rawEmail);

      const normalizedMsg: Message = {
        id: rawMessage.id ?? `dm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: resolvedSender,
        senderId,
        senderEmail: typeof rawEmail === "string" ? rawEmail : undefined,
        senderUsername: senderUsername || resolvedSender,
        receiverId,
        receiver: rawMessage.receiver,
        content: rawMessage.content,
        createdAt: rawMessage.createdAt ?? new Date().toISOString(),
        avatarUrl: resolveAvatarUrl(rawMessage),
        tag: rawMessage.tag ?? (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.tag : undefined),
        studentYear:
          (rawMessage as any).studentYear ??
          (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.studentYear : undefined) ??
          1,
      };

      const existingDm = get().messagesByDm[otherUserId] ?? [];

      // 1. Exact ID check: if server message already present, drop duplicate
      if (normalizedMsg.id != null) {
        const idExists = existingDm.some((m) => m.id != null && String(m.id) === String(normalizedMsg.id));
        if (idExists) return;
      }

      // 2. Optimistic reconciliation: replace pending temp message if confirmed by server
      const isIncomingTemp = typeof normalizedMsg.id === "string" && normalizedMsg.id.startsWith("temp-");
      let reconciledDm: Message[] | null = null;

      if (!isIncomingTemp) {
        const tempIdx = existingDm.findIndex((m) => {
          const isMTemp = typeof m.id === "string" && (m.id.startsWith("temp-") || m.id.startsWith("dm-"));
          if (!isMTemp) return false;
          if (m.content.trim() !== normalizedMsg.content.trim()) return false;
          return (
            (normalizedMsg.senderId != null && m.senderId === normalizedMsg.senderId) ||
            (normalizedMsg.sender && m.sender === normalizedMsg.sender)
          );
        });

        if (tempIdx !== -1) {
          reconciledDm = [...existingDm];
          reconciledDm[tempIdx] = normalizedMsg;
        }
      }

      // 3. Fallback duplicate check within 4 seconds window
      if (!reconciledDm) {
        const isDuplicate = existingDm.some((m) => {
          const sameSender =
            (normalizedMsg.senderId != null && m.senderId === normalizedMsg.senderId) ||
            m.sender === normalizedMsg.sender;
          return (
            sameSender &&
            m.content.trim() === normalizedMsg.content.trim() &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(normalizedMsg.createdAt).getTime()) < 4000
          );
        });
        if (isDuplicate) return;
      }

      const nextDmList = reconciledDm ?? [...existingDm, normalizedMsg];

      // 4. Retroactive username sync for this senderId in DM conversation
      const finalDmList = senderId
        ? nextDmList.map((m) =>
            m.senderId === senderId
              ? {
                  ...m,
                  sender: resolvedSender,
                  senderUsername: resolvedSender,
                  avatarUrl: normalizedMsg.avatarUrl || m.avatarUrl,
                  studentYear: normalizedMsg.studentYear ?? m.studentYear ?? 1,
                }
              : m
          )
        : nextDmList;

      const isCurrentActiveDm =
        get().activeChatType === "dm" && get().activeDmUser?.userId === otherUserId;

      const otherUsername =
        isSentByMe && rawMessage.receiver && typeof rawMessage.receiver === "object"
          ? (rawMessage.receiver as any).username || `User #${otherUserId}`
          : !isSentByMe
          ? resolvedSender
          : `User #${otherUserId}`;

      set((state) => {
        const existingConv = state.dmConversations.find((c) => c.userId === otherUserId);

        // CRITICAL FIX: The other user's conversation avatar must NEVER be assigned the current user's avatar!
        const otherUserAvatar = !isSentByMe
          ? (resolveAvatarUrl(rawMessage) || undefined)
          : (rawMessage.receiver && typeof rawMessage.receiver === "object"
              ? (rawMessage.receiver as any).avatarUrl || undefined
              : (stored?.avatarUrl && existingConv?.avatarUrl === stored.avatarUrl ? undefined : existingConv?.avatarUrl));

        const updatedConv: DMConversation = {
          userId: otherUserId!,
          username: existingConv?.username || otherUsername,
          avatarUrl: otherUserAvatar,
          tag: existingConv?.tag || normalizedMsg.tag,
          studentYear: existingConv?.studentYear || normalizedMsg.studentYear,
          lastMessage: normalizedMsg.content,
          lastMessageTime: normalizedMsg.createdAt,
          isBlocked: state.blockedUserIds.includes(otherUserId!),
        };

        const filteredList = state.dmConversations.filter((c) => c.userId !== otherUserId);
        const updatedConversations = [updatedConv, ...filteredList];

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(DM_CONVERSATIONS_KEY, JSON.stringify(updatedConversations));
          } catch {}
        }

        const updatedActiveDmUser = isCurrentActiveDm && state.activeDmUser
          ? {
              ...state.activeDmUser,
              username: updatedConv.username,
              avatarUrl: updatedConv.avatarUrl,
              tag: updatedConv.tag,
              studentYear: updatedConv.studentYear,
            }
          : state.activeDmUser;

        return {
          messagesByDm: {
            ...state.messagesByDm,
            [otherUserId!]: finalDmList,
          },
          dmConversations: updatedConversations,
          activeDmUser: updatedActiveDmUser,
          unreadDmCounts: {
            ...state.unreadDmCounts,
            [otherUserId!]: isCurrentActiveDm ? 0 : (state.unreadDmCounts[otherUserId!] || 0) + 1,
          },
        };
      });

      return;
    }

    // ─── Standard Channel Message Routing ────────────────────────────────────
    const roomId = rawMessage.room?.id ?? rawMessage.roomId ?? get().activeRoomId;
    if (!roomId) return;

    const senderUsername =
      (rawMessage as any).senderUsername ??
      (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.username : undefined);

    const resolvedSender = senderUsername || resolveSenderName(rawMessage.sender, rawEmail);
    const resolvedTag =
      rawMessage.tag ??
      (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.tag : undefined);

    let resolvedAvatarUrl = resolveAvatarUrl(rawMessage);
    let resolvedStudentYear =
      (rawMessage as any).studentYear ??
      (typeof rawMessage.sender === "object" ? (rawMessage.sender as any)?.studentYear : undefined);

    const isMyMessage =
      (stored?.id && senderId === stored.id) ||
      (stored?.email && cleanSenderEmail && stored.email.toLowerCase() === cleanSenderEmail);

    if (isMyMessage) {
      if (!resolvedAvatarUrl && stored?.avatarUrl) resolvedAvatarUrl = stored.avatarUrl;
      if (!resolvedStudentYear && stored?.studentYear) resolvedStudentYear = stored.studentYear;
    }

    if (!resolvedStudentYear && senderId) {
      const existing = get().messagesByRoom[roomId] ?? [];
      const prevMsg = existing.find((m) => m.senderId === senderId && m.studentYear);
      if (prevMsg?.studentYear) {
        resolvedStudentYear = prevMsg.studentYear;
      }
    }

    const normalizedMessage: Message = {
      id: rawMessage.id ?? `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: resolvedSender,
      senderId,
      senderEmail: typeof rawEmail === "string" ? rawEmail : undefined,
      senderUsername: senderUsername || resolvedSender,
      content: rawMessage.content,
      createdAt: rawMessage.createdAt ?? new Date().toISOString(),
      room: { id: roomId },
      roomId: roomId,
      tag: resolvedTag,
      avatarUrl: resolvedAvatarUrl,
      studentYear: resolvedStudentYear ?? 1,
    };

    const existing = get().messagesByRoom[roomId] ?? [];

    // 1. Exact ID deduplication
    if (normalizedMessage.id != null) {
      const idExists = existing.some((m) => m.id != null && String(m.id) === String(normalizedMessage.id));
      if (idExists) return;
    }

    // 2. Optimistic reconciliation: replace pending temp message if confirmed by server
    const isIncomingTemp = typeof normalizedMessage.id === "string" && normalizedMessage.id.startsWith("temp-");
    let reconciledRoom: Message[] | null = null;

    if (!isIncomingTemp) {
      const tempIdx = existing.findIndex((m) => {
        const isMTemp = typeof m.id === "string" && (m.id.startsWith("temp-") || m.id.startsWith("ws-"));
        if (!isMTemp) return false;
        if (m.content.trim() !== normalizedMessage.content.trim()) return false;
        return (
          (normalizedMessage.senderId != null && m.senderId === normalizedMessage.senderId) ||
          (normalizedMessage.sender && m.sender === normalizedMessage.sender)
        );
      });

      if (tempIdx !== -1) {
        reconciledRoom = [...existing];
        reconciledRoom[tempIdx] = normalizedMessage;
      }
    }

    // 3. Fallback duplicate check within 4 seconds window
    if (!reconciledRoom) {
      const isDuplicate = existing.some((m) => {
        const sameSender =
          (normalizedMessage.senderId != null && m.senderId === normalizedMessage.senderId) ||
          m.sender === normalizedMessage.sender;
        return (
          sameSender &&
          m.content.trim() === normalizedMessage.content.trim() &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(normalizedMessage.createdAt).getTime()) < 4000
        );
      });
      if (isDuplicate) return;
    }

    const nextRoomList = reconciledRoom ?? [...existing, normalizedMessage];

    // 4. Retroactively synchronize username and avatar for this senderId across all messages in this room
    const finalRoomList = senderId
      ? nextRoomList.map((m) =>
          m.senderId === senderId
            ? {
                ...m,
                sender: resolvedSender,
                senderUsername: resolvedSender,
                avatarUrl: normalizedMessage.avatarUrl || m.avatarUrl,
                studentYear: normalizedMessage.studentYear ?? m.studentYear ?? 1,
              }
            : m
        )
      : nextRoomList;

    const isCurrentActive = roomId === get().activeRoomId && get().activeChatType === "channel";
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: finalRoomList,
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
