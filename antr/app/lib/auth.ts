export interface UserProfile {
  email: string;
  anonymousName: string;
  gender?: string;
  hobbies: string[];
  createdAt: string;
  avatarEmoji?: string;
  avatarUrl?: string;
  avatarColor?: string;
  bio?: string;
  stealthMode?: boolean;
}

const STORAGE_KEY = "annoyms_user_profile";
const PENDING_EMAIL_KEY = "annoyms_pending_email";
const TOKEN_KEY = "annoyms_auth_token";

export function getPendingEmail(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("annoyms_pending") ||
    localStorage.getItem("annoyms_email") ||
    localStorage.getItem(PENDING_EMAIL_KEY) ||
    ""
  );
}

export function setPendingEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_EMAIL_KEY, email);
  localStorage.setItem("annoyms_pending", email);
  localStorage.setItem("annoyms_email", email);
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("annoyms_token") ||
    localStorage.getItem(TOKEN_KEY) ||
    ""
  );
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("annoyms_token", token);
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (err) {
    console.error("Failed to parse user profile:", err);
    return null;
  }
}

export function saveUserProfile(data: Partial<UserProfile> & { anonymousName: string }): UserProfile {
  const existing = getUserProfile();
  const email = data.email || existing?.email || getPendingEmail() || "anonymous@annoyms.local";
  
  const updated: UserProfile = {
    email,
    anonymousName: data.anonymousName.trim(),
    gender: data.gender !== undefined ? data.gender?.trim() || undefined : existing?.gender,
    hobbies: data.hobbies !== undefined ? data.hobbies : existing?.hobbies || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    avatarEmoji: data.avatarEmoji !== undefined ? data.avatarEmoji : (existing?.avatarEmoji || "🎭"),
    avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : existing?.avatarUrl,
    avatarColor: data.avatarColor !== undefined ? data.avatarColor : (existing?.avatarColor || "emerald"),
    bio: data.bio !== undefined ? data.bio : (existing?.bio || ""),
    stealthMode: data.stealthMode !== undefined ? data.stealthMode : (existing?.stealthMode ?? true),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("annoyms_profile_updated"));
  }

  return updated;
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PENDING_EMAIL_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("annoyms_token");
  localStorage.removeItem("annoyms_email");
  localStorage.removeItem("annoyms_pending");
  window.dispatchEvent(new Event("annoyms_profile_updated"));
}

export async function syncUserProfile(token?: string): Promise<UserProfile | null> {
  if (typeof window === "undefined") return null;
  const authToken = token || getAuthToken();
  if (!authToken) return null;

  try {
    const res = await fetch("http://localhost:8080/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.username) {
      const hobbies = data.tag ? (data.tag.split(",") as ("Coder" | "Non-coder")[]) : [];
      return saveUserProfile({
        email: data.email,
        anonymousName: data.username,
        gender: data.gender,
        hobbies: hobbies,
        avatarUrl: data.avatarUrl,
      });
    }
  } catch (err) {
    console.error("Failed to sync profile from backend:", err);
  }
  return null;
}

export async function uploadAvatarImage(file: File, email?: string): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit. Please choose an image under 5MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (email) {
    formData.append("email", email);
  }

  const res = await fetch("http://localhost:8080/auth/upload-avatar", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errMsg = "Failed to upload avatar image";
    try {
      const errJson = await res.json();
      errMsg = errJson.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  return data.avatarUrl;
}

