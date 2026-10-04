import type { UserSearchResult } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function searchUsers(
  query: string,
  excludeId?: number,
  excludeUsername?: string
): Promise<UserSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const params = new URLSearchParams({ query: trimmed });
    if (excludeId) params.append("excludeId", String(excludeId));
    if (excludeUsername && excludeUsername.trim()) {
      params.append("excludeUsername", excludeUsername.trim());
    }

    const res = await fetch(`${API_BASE_URL}/api/users/search?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`User search failed with status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: Number(item.id),
      username: item.username || item.name || "Anonymous",
      avatarUrl: item.avatarUrl || undefined,
      tag: item.tag || undefined,
      studentYear: item.studentYear ?? undefined,
    }));
  } catch (err) {
    console.error("Failed to search users:", err);
    return [];
  }
}

export async function getUserById(id: number): Promise<UserSearchResult | null> {
  if (!id) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const item = await res.json();
    if (!item || !item.id) return null;

    return {
      id: Number(item.id),
      username: item.username || item.name || "Anonymous",
      avatarUrl: item.avatarUrl || undefined,
      tag: item.tag || undefined,
      studentYear: item.studentYear ?? undefined,
    };
  } catch (err) {
    console.error(`Failed to fetch user #${id}:`, err);
    return null;
  }
}

