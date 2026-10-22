import { apiUrl } from "@/lib/config/api";

export interface MarketplaceProfile {
  id: number;
  displayName: string;
  profileImage?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  userId?: number | null;
}

export interface CreateMarketplaceProfilePayload {
  displayName: string;
  bio?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface UpdateMarketplaceProfilePayload {
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface MarketplaceListing {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  mediaUrls?: string[];
  createdAt: string;
  sellerProfileId: number;
  sellerDisplayName: string;
  sellerProfileImage?: string | null;
  sellerPhoneNumber?: string | null;
  sellerUserId?: number | null;
  bargainAvailable?: boolean;
  hostelName?: string | null;
  roomNo?: string | null;
}

export interface CreateMarketplaceListingPayload {
  title: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  mediaUrls?: string[];
  bargainAvailable?: boolean;
  hostelName: string;
  roomNo: string;
}

const MARKETPLACE_PROFILE_KEY = "annoyms_marketplace_profile";

export function getCachedMarketplaceProfile(userId?: number): MarketplaceProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MARKETPLACE_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    if (userId != null && parsed.userId != null && Number(parsed.userId) !== Number(userId)) {
      return null;
    }
    return parsed as MarketplaceProfile;
  } catch {
    return null;
  }
}

export function saveCachedMarketplaceProfile(profile: MarketplaceProfile | null, userId?: number): void {
  if (typeof window === "undefined") return;
  try {
    if (!profile) {
      localStorage.removeItem(MARKETPLACE_PROFILE_KEY);
    } else {
      const toStore: MarketplaceProfile = {
        ...profile,
        userId: userId ?? profile.userId ?? null,
      };
      localStorage.setItem(MARKETPLACE_PROFILE_KEY, JSON.stringify(toStore));
    }
    window.dispatchEvent(new CustomEvent("annoyms_marketplace_profile_updated", { detail: profile }));
  } catch (err) {
    console.warn("Could not cache marketplace profile:", err);
  }
}

export function clearCachedMarketplaceProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MARKETPLACE_PROFILE_KEY);
    window.dispatchEvent(new CustomEvent("annoyms_marketplace_profile_updated", { detail: null }));
  } catch (err) {
    console.warn("Could not clear cached marketplace profile:", err);
  }
}

export function subscribeMarketplaceProfileChange(callback: (profile: MarketplaceProfile | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<MarketplaceProfile | null>;
    callback(custom.detail !== undefined ? custom.detail : getCachedMarketplaceProfile());
  };
  window.addEventListener("annoyms_marketplace_profile_updated", handler);
  return () => {
    window.removeEventListener("annoyms_marketplace_profile_updated", handler);
  };
}

export async function fetchMarketplaceProfile(userId: number): Promise<MarketplaceProfile | null> {
  if (!userId || isNaN(Number(userId))) return null;
  const numUserId = Number(userId);

  try {
    const res = await fetch(apiUrl(`/marketplace/profile/${numUserId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      saveCachedMarketplaceProfile(null, numUserId);
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch marketplace profile: ${res.statusText}`);
    }

    const data: MarketplaceProfile = await res.json();
    const withUser = { ...data, userId: numUserId };
    saveCachedMarketplaceProfile(withUser, numUserId);
    return withUser;
  } catch (err) {
    console.warn("fetchMarketplaceProfile error:", err);
    // In case of transient network issue, fallback to cached profile for this user
    return getCachedMarketplaceProfile(numUserId);
  }
}

export async function fetchMarketplaceProfileById(profileId: number): Promise<MarketplaceProfile | null> {
  try {
    const res = await fetch(apiUrl(`/marketplace/profile/view/${profileId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn("fetchMarketplaceProfileById error:", err);
    return null;
  }
}

export async function createMarketplaceProfile(
  userId: number,
  payload: CreateMarketplaceProfilePayload
): Promise<MarketplaceProfile> {
  const numUserId = Number(userId);
  const res = await fetch(apiUrl(`/marketplace/profile/${numUserId}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Failed to create marketplace profile";
    try {
      const json = await res.json();
      errMsg = json.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  const created: MarketplaceProfile = await res.json();
  const withUser = { ...created, userId: numUserId };
  saveCachedMarketplaceProfile(withUser, numUserId);
  return withUser;
}

export async function updateMarketplaceProfile(
  userId: number,
  payload: UpdateMarketplaceProfilePayload
): Promise<MarketplaceProfile> {
  const numUserId = Number(userId);
  const res = await fetch(apiUrl(`/marketplace/profile/${numUserId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Failed to update marketplace profile";
    try {
      const json = await res.json();
      errMsg = json.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  const updated: MarketplaceProfile = await res.json();
  const withUser = { ...updated, userId: numUserId };
  saveCachedMarketplaceProfile(withUser, numUserId);
  return withUser;
}

export async function checkMarketplaceDisplayName(name: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/marketplace/profile/check-name?name=${encodeURIComponent(name.trim())}`), {
      method: "GET",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.available);
  } catch (err) {
    console.warn("checkMarketplaceDisplayName error:", err);
    return true;
  }
}

export async function fetchMarketplaceListings(): Promise<MarketplaceListing[]> {
  try {
    const res = await fetch(apiUrl(`/marketplace/listings?t=${Date.now()}`), {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("fetchMarketplaceListings error:", err);
    return [];
  }
}

export async function fetchUserMarketplaceListings(userId: number): Promise<MarketplaceListing[]> {
  try {
    const res = await fetch(apiUrl(`/marketplace/listings/user/${userId}?t=${Date.now()}`), {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("fetchUserMarketplaceListings error:", err);
    return [];
  }
}

export async function fetchSellerMarketplaceListings(sellerProfileId: number): Promise<MarketplaceListing[]> {
  try {
    const res = await fetch(apiUrl(`/marketplace/listings/seller/${sellerProfileId}?t=${Date.now()}`), {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("fetchSellerMarketplaceListings error:", err);
    return [];
  }
}

export async function createMarketplaceListing(
  userId: number,
  payload: CreateMarketplaceListingPayload
): Promise<MarketplaceListing> {
  const res = await fetch(apiUrl(`/marketplace/listings/${userId}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Failed to create listing";
    try {
      const json = await res.json();
      errMsg = json.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  return await res.json();
}

export async function deleteMarketplaceListing(listingId: number, userId?: number | null): Promise<boolean> {
  try {
    let token = "";
    if (typeof window !== "undefined") {
      token = localStorage.getItem("annoyms_token") || localStorage.getItem("annoyms_auth_token") || "";
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = userId
      ? apiUrl(`/marketplace/listings/${listingId}?userId=${userId}`)
      : apiUrl(`/marketplace/listings/${listingId}`);
    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`deleteMarketplaceListing failed (${res.status}):`, errText);
    }
    return res.ok;
  } catch (err) {
    console.warn("deleteMarketplaceListing error:", err);
    return false;
  }
}

export async function uploadMarketplaceMedia(file: File): Promise<{ url: string; type: "image" | "video" }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiUrl("/marketplace/listings/upload-media"), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errMsg = "Failed to upload media";
    try {
      const json = await res.json();
      errMsg = json.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  return await res.json();
}

export type MarketplaceChangeEvent =
  | { type: "created"; listing: MarketplaceListing }
  | { type: "deleted"; listingId: number }
  | { type: "refreshed" };

export function notifyMarketplaceListingChange(event: MarketplaceChangeEvent): void {
  if (typeof window === "undefined") return;
  try {
    // 1. Same-window custom event
    window.dispatchEvent(new CustomEvent<MarketplaceChangeEvent>("marketplace:change", { detail: event }));

    // 2. Cross-tab BroadcastChannel
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("campus_marketplace_sync");
      bc.postMessage(event);
      bc.close();
    }

    // 3. Cross-tab fallback via localStorage
    localStorage.setItem(
      "marketplace_sync_event",
      JSON.stringify({ event, timestamp: Date.now(), rand: Math.random() })
    );
  } catch (err) {
    console.warn("notifyMarketplaceListingChange error:", err);
  }
}

export function subscribeMarketplaceListingChange(
  callback: (event: MarketplaceChangeEvent) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  // Custom event handler
  const handleCustom = (e: Event) => {
    const customEvent = e as CustomEvent<MarketplaceChangeEvent>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };
  window.addEventListener("marketplace:change", handleCustom);

  // Broadcast channel handler
  let bc: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    try {
      bc = new BroadcastChannel("campus_marketplace_sync");
      bc.onmessage = (msgEvent) => {
        if (msgEvent.data) {
          callback(msgEvent.data as MarketplaceChangeEvent);
        }
      };
    } catch {
      // ignore
    }
  }

  // Storage event handler
  const handleStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key === "marketplace_sync_event" && storageEvent.newValue) {
      try {
        const parsed = JSON.parse(storageEvent.newValue);
        if (parsed?.event) {
          callback(parsed.event as MarketplaceChangeEvent);
        }
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("marketplace:change", handleCustom);
    window.removeEventListener("storage", handleStorage);
    if (bc) {
      bc.close();
    }
  };
}
