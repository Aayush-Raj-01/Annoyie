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
}

// ─── Payload sent via WebSocket /app/sendMessage ─────────────────────────────
export interface SendMessageDTO {
  senderEmail: string;
  roomId: number;
  content: string;
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
