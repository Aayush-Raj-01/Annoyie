import { apiUrl } from "@/lib/config/api";

export interface MarketplaceMessage {
  id: number;
  senderProfileId: number;
  senderDisplayName: string;
  senderProfileImage?: string | null;
  receiverProfileId: number;
  receiverDisplayName: string;
  receiverProfileImage?: string | null;
  listingId?: number | null;
  listingTitle?: string | null;
  listingPrice?: number | null;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface MarketplaceThread {
  otherProfileId: number;
  otherDisplayName: string;
  otherProfileImage?: string | null;
  listingId?: number | null;
  listingTitle?: string | null;
  listingPrice?: number | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SendMarketplaceMessagePayload {
  senderProfileId: number;
  receiverProfileId: number;
  listingId?: number;
  content: string;
}

export async function fetchMarketplaceConversation(
  myProfileId: number,
  otherProfileId: number
): Promise<MarketplaceMessage[]> {
  try {
    const res = await fetch(apiUrl(`/marketplace/messages/${myProfileId}/${otherProfileId}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchMarketplaceConversation error:", err);
    return [];
  }
}

export async function fetchMarketplaceThreads(profileId: number): Promise<MarketplaceThread[]> {
  try {
    const res = await fetch(apiUrl(`/marketplace/messages/threads/${profileId}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchMarketplaceThreads error:", err);
    return [];
  }
}

export async function sendMarketplaceMessage(
  payload: SendMarketplaceMessagePayload
): Promise<MarketplaceMessage> {
  const res = await fetch(apiUrl("/marketplace/messages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Failed to send marketplace message";
    try {
      const data = await res.json();
      errMsg = data.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  return await res.json();
}

export async function fetchMarketplaceUnreadCount(profileId: number): Promise<number> {
  try {
    const res = await fetch(apiUrl(`/marketplace/messages/unread-count/${profileId}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unreadCount || 0;
  } catch {
    return 0;
  }
}
