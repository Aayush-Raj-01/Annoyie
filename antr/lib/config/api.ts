const configuredBase =
  process.env.NEXT_PUBLIC_API_URL ?? "";

export const API_BASE_URL = configuredBase.replace(/\/+$/, "");

export function apiUrl(path: string): string {
  if (process.env.NODE_ENV === "production" && !API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL must point to the production API before building the frontend.");
  }
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}
