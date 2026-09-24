import type { Message } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

export async function fetchMessages(roomId: number): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/messages/${roomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // We want fresh data on request
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load messages for room #${roomId} (status ${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  // Normalize message properties in case of casing differences or nested sender entities
  return data.map((item: any) => ({
    id: item.id ?? `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: extractSenderName(item.sender, item.senderEmail),
    senderEmail: typeof item.senderEmail === "string" ? item.senderEmail : undefined,
    content: item.content ?? item.Content ?? "",
    createdAt: item.createdAt || new Date().toISOString(),
    room: item.room ? { id: item.room.id } : { id: roomId },
    roomId: item.room?.id ?? item.roomId ?? roomId,
    tag: item.tag || (typeof item.sender === "object" ? item.sender?.tag : undefined),
  }));
}
