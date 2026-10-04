export interface UserProfile {
  id?: number;
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
  admissionYear?: number;
  studentYear?: number;
}

export function formatStudentYear(year?: number | null): string {
  if (!year || isNaN(year) || year < 1) return "";
  if (year === 1) return "1st Year";
  if (year === 2) return "2nd Year";
  if (year === 3) return "3rd Year";
  return `${year}th Year`;
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

export function syncTokenCookie(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const token = getAuthToken();
  const profile = getUserProfile();
  const loggedIn = isUserLoggedIn();
  if (loggedIn) {
    const val = token || profile?.anonymousName || "active_user";
    document.cookie = `annoyms_token=${encodeURIComponent(val)}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = "annoyms_token=; path=/; max-age=0; SameSite=Lax";
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("annoyms_token", token);
  if (typeof document !== "undefined") {
    document.cookie = `annoyms_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  }
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

export function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = getAuthToken();
  const profile = getUserProfile();
  if (!token && !profile) return false;
  if (!profile?.anonymousName) return Boolean(token && token.trim().length > 0);
  if (profile.anonymousName.startsWith("Guest_") || profile.anonymousName === "Guest") return false;
  return Boolean((token && token.trim().length > 0) || (profile.anonymousName && profile.anonymousName.trim().length > 0));
}

export function saveUserProfile(data: Partial<UserProfile> & { anonymousName: string }): UserProfile {
  const existing = getUserProfile();
  
  // Check if we are updating the exact same user profile
  const isSameUser = Boolean(
    existing && (
      (data.id != null && existing.id != null && data.id === existing.id) ||
      (data.email && existing.email && data.email.toLowerCase() === existing.email.toLowerCase())
    )
  );

  const email = data.email || (isSameUser ? existing?.email : undefined) || getPendingEmail() || "anonymous@annoyms.local";
  
  const updated: UserProfile = {
    id: data.id !== undefined ? data.id : (isSameUser ? existing?.id : undefined),
    email,
    anonymousName: data.anonymousName.trim(),
    gender: data.gender !== undefined ? data.gender?.trim() || undefined : (isSameUser ? existing?.gender : undefined),
    hobbies: data.hobbies !== undefined ? data.hobbies : (isSameUser ? existing?.hobbies || [] : []),
    createdAt: isSameUser && existing?.createdAt ? existing.createdAt : new Date().toISOString(),
    avatarEmoji: data.avatarEmoji !== undefined ? data.avatarEmoji : (isSameUser ? (existing?.avatarEmoji || "🎭") : "🎭"),
    avatarUrl: data.avatarUrl !== undefined ? (data.avatarUrl || undefined) : (isSameUser ? existing?.avatarUrl : undefined),
    avatarColor: data.avatarColor !== undefined ? data.avatarColor : (isSameUser ? (existing?.avatarColor || "emerald") : "emerald"),
    bio: data.bio !== undefined ? data.bio : (isSameUser ? (existing?.bio || "") : ""),
    stealthMode: data.stealthMode !== undefined ? data.stealthMode : (isSameUser ? (existing?.stealthMode ?? true) : true),
    admissionYear: data.admissionYear !== undefined ? data.admissionYear : (isSameUser ? existing?.admissionYear : undefined),
    studentYear: data.studentYear !== undefined ? data.studentYear : (isSameUser ? existing?.studentYear : undefined),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    syncTokenCookie();
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
  localStorage.removeItem("annoyms_dm_conversations");
  localStorage.removeItem("annoyms_blocked_users");
  if (typeof document !== "undefined") {
    document.cookie = "annoyms_token=; path=/; max-age=0; SameSite=Lax";
  }
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
        id: typeof data.id === "number" ? data.id : undefined,
        email: data.email,
        anonymousName: data.username,
        gender: data.gender,
        hobbies: hobbies,
        avatarUrl: data.avatarUrl || undefined,
        admissionYear: data.admissionYear,
        studentYear: data.studentYear,
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

