// ─── Chat Message Model ──────────────────────────────────────────────────────
export interface Message {
  id: number | string;
  sender: string | any;
  content: string;
  createdAt: string;
  room?: { id: number };
  roomId?: number;
  tag?: string;
  senderEmail?: string;
  avatarUrl?: string;
  studentYear?: number;
  senderId?: number;
  senderUsername?: string;
  receiverId?: number;
  receiver?: { id: number; username?: string; avatarUrl?: string };
}

// ─── Payload sent via WebSocket /app/sendMessage or HTTP POST /messages ────────
export interface SendMessageDTO {
  senderEmail: string;
  roomId?: number;
  content: string;
  sender?: string;
  avatarUrl?: string;
  tag?: string;
  studentYear?: number;
  senderId?: number;
  receiverId?: number;
}

// ─── Chat Room Model ─────────────────────────────────────────────────────────
export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  emoji?: string;
  category?: string;
  memberCount?: number;
}

// ─── User Search Result Model ────────────────────────────────────────────────
export interface UserSearchResult {
  id: number;
  username: string;
  avatarUrl?: string;
  tag?: string;
  studentYear?: number;
}

// ─── Direct Message Conversation Model ───────────────────────────────────────
export interface DMConversation {
  userId: number;
  username: string;
  avatarUrl?: string;
  tag?: string;
  studentYear?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isBlocked?: boolean;
}
