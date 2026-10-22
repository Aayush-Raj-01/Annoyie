const configuredBase =
  process.env.NEXT_PUBLIC_API_URL ?? "";

export const API_BASE_URL = configuredBase.replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}
