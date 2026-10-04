export interface GalleryPost {
  id: number;
  mediaUrl: string;
  mediaType: string;
  caption?: string | null;
  createdAt: string;
  uploaderId?: number | null;
  uploaderUsername?: string;
  uploaderAvatarUrl?: string | null;
  uploaderTag?: string | null;
}

const BACKEND_BASE = "http://localhost:8080";

export async function fetchRandomGalleryFeed(limit = 40): Promise<GalleryPost[]> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/gallery?limit=${limit}&t=${Date.now()}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch gallery feed: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching gallery:", err);
    return [];
  }
}

export async function uploadGalleryPhoto(
  file: File,
  caption?: string,
  email?: string,
  username?: string
): Promise<GalleryPost> {
  const formData = new FormData();
  formData.append("file", file);
  if (caption && caption.trim()) {
    formData.append("caption", caption.trim());
  }
  if (email && email.trim()) {
    formData.append("email", email.trim());
  }
  if (username && username.trim()) {
    formData.append("username", username.trim());
  }

  const res = await fetch(`${BACKEND_BASE}/api/gallery/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = "Failed to upload photo";
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch {
      const text = await res.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function deleteGalleryPhoto(
  id: number,
  email?: string,
  username?: string
): Promise<boolean> {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  if (username) params.append("username", username);

  const res = await fetch(`${BACKEND_BASE}/api/gallery/${id}?${params.toString()}`, {
    method: "DELETE",
  });
  return res.ok;
}
