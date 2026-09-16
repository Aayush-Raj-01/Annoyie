export interface UserProfile {
  email: string;
  anonymousName: string;
  gender?: string;
  hobbies: ("Coder" | "Non-coder")[];
  createdAt: string;
}

const STORAGE_KEY = "annoyms_user_profile";
const PENDING_EMAIL_KEY = "annoyms_pending_email";

export function getPendingEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PENDING_EMAIL_KEY) || "";
}

export function setPendingEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_EMAIL_KEY, email);
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
    gender: data.gender?.trim() || undefined,
    hobbies: data.hobbies || existing?.hobbies || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
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
  window.dispatchEvent(new Event("annoyms_profile_updated"));
}
