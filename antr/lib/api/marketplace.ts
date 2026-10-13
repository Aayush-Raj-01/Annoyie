export interface MarketplaceProfile {
  id: number;
  displayName: string;
  profileImage?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
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

const BACKEND_BASE = "http://localhost:8080";

export async function fetchMarketplaceProfile(userId: number): Promise<MarketplaceProfile | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/marketplace/profile/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch marketplace profile: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn("fetchMarketplaceProfile error:", err);
    return null;
  }
}

export async function fetchMarketplaceProfileById(profileId: number): Promise<MarketplaceProfile | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/marketplace/profile/view/${profileId}`, {
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
  const res = await fetch(`${BACKEND_BASE}/marketplace/profile/${userId}`, {
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

  return await res.json();
}

export async function updateMarketplaceProfile(
  userId: number,
  payload: UpdateMarketplaceProfilePayload
): Promise<MarketplaceProfile> {
  const res = await fetch(`${BACKEND_BASE}/marketplace/profile/${userId}`, {
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

  return await res.json();
}

export async function checkMarketplaceDisplayName(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/marketplace/profile/check-name?name=${encodeURIComponent(name.trim())}`, {
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
