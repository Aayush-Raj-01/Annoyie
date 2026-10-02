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
}

// ─── Payload sent via WebSocket /app/sendMessage ─────────────────────────────
export interface SendMessageDTO {
  senderEmail: string;
  roomId: number;
  content: string;
  sender?: string;
  avatarUrl?: string;
  tag?: string;
  studentYear?: number;
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
