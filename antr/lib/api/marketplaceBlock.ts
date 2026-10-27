// API and Reactive State for Marketplace Blocking
import { apiUrl } from "@/lib/config/api";
import { getAuthHeaders } from "@/app/lib/auth";

export interface MarketplaceBlockedProfile {
  blockId: number;
  blockedProfileId: number;
  displayName: string;
  profileImage?: string | null;
  blockedAt: string;
}

export interface MarketplaceBlockStatus {
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
  isBlockedEitherWay: boolean;
}

export type MarketplaceBlockEvent =
  | { type: "blocked"; targetProfileId: number; blockedProfile: MarketplaceBlockedProfile }
  | { type: "unblocked"; targetProfileId: number }
  | { type: "refreshed" };

const EVENT_NAME = "annoyms_marketplace_blocks_changed";

export function subscribeMarketplaceBlockChange(
  listener: (event: MarketplaceBlockEvent) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<MarketplaceBlockEvent>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function notifyMarketplaceBlockChange(event: MarketplaceBlockEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
}

// Local storage caching helpers
function getCacheKey(profileId: number): string {
  return `annoyms_mp_blocked_${profileId}`;
}

export function getCachedBlockedProfiles(profileId?: number | null): MarketplaceBlockedProfile[] {
  if (typeof window === "undefined" || !profileId) return [];
  try {
    const raw = localStorage.getItem(getCacheKey(profileId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setCachedBlockedProfiles(profileId: number, list: MarketplaceBlockedProfile[]): void {
  if (typeof window === "undefined" || !profileId) return;
  try {
    localStorage.setItem(getCacheKey(profileId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function fetchBlockedMarketplaceProfiles(
  profileId: number
): Promise<MarketplaceBlockedProfile[]> {
  try {
    const res = await fetch(apiUrl(`/marketplace/blocks/${profileId}`), { headers: getAuthHeaders() });
    if (!res.ok) {
      return getCachedBlockedProfiles(profileId);
    }
    const data: MarketplaceBlockedProfile[] = await res.json();
    setCachedBlockedProfiles(profileId, data);
    return data;
  } catch (err) {
    console.warn("Error fetching blocked marketplace profiles:", err);
    return getCachedBlockedProfiles(profileId);
  }
}

export async function checkMarketplaceBlockStatus(
  myProfileId: number,
  targetProfileId: number
): Promise<MarketplaceBlockStatus> {
  try {
    const res = await fetch(
      apiUrl(`/marketplace/blocks/status/${myProfileId}/${targetProfileId}`),
      { headers: getAuthHeaders() }
    );
    if (!res.ok) {
      // Fallback to checking local cache
      const cached = getCachedBlockedProfiles(myProfileId);
      const isBlockedByMe = cached.some((b) => b.blockedProfileId === targetProfileId);
      return { isBlockedByMe, isBlockedByThem: false, isBlockedEitherWay: isBlockedByMe };
    }
    return await res.json();
  } catch (err) {
    console.warn("Error checking block status:", err);
    const cached = getCachedBlockedProfiles(myProfileId);
    const isBlockedByMe = cached.some((b) => b.blockedProfileId === targetProfileId);
    return { isBlockedByMe, isBlockedByThem: false, isBlockedEitherWay: isBlockedByMe };
  }
}

export async function blockMarketplaceProfile(
  myProfileId: number,
  targetProfileId: number
): Promise<MarketplaceBlockedProfile> {
  const res = await fetch(
    apiUrl(`/marketplace/blocks/${myProfileId}/${targetProfileId}`),
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to block user");
  }

  const blocked: MarketplaceBlockedProfile = await res.json();

  // Update local cache
  const current = getCachedBlockedProfiles(myProfileId);
  const updated = [blocked, ...current.filter((b) => b.blockedProfileId !== targetProfileId)];
  setCachedBlockedProfiles(myProfileId, updated);

  notifyMarketplaceBlockChange({
    type: "blocked",
    targetProfileId,
    blockedProfile: blocked,
  });

  return blocked;
}

export async function unblockMarketplaceProfile(
  myProfileId: number,
  targetProfileId: number
): Promise<boolean> {
  const res = await fetch(
    apiUrl(`/marketplace/blocks/${myProfileId}/${targetProfileId}`),
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to unblock user");
  }

  // Update local cache
  const current = getCachedBlockedProfiles(myProfileId);
  const updated = current.filter((b) => b.blockedProfileId !== targetProfileId);
  setCachedBlockedProfiles(myProfileId, updated);

  notifyMarketplaceBlockChange({
    type: "unblocked",
    targetProfileId,
  });

  return true;
}
