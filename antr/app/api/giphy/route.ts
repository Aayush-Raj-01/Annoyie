import { NextResponse } from "next/server";
import { CURATED_GIFS, STICKERS } from "@/lib/chat/mediaData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") === "stickers" ? "stickers" : "gifs";
  const apiKey =
    process.env.GIPHY_API_KEY ||
    process.env.NEXT_PUBLIC_GIPHY_API_KEY ||
    "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh";

  // 1. Call GIPHY API (stickers or gifs)
  if (apiKey) {
    try {
      const isSticker = type === "stickers";
      const baseApi = isSticker
        ? "https://api.giphy.com/v1/stickers"
        : "https://api.giphy.com/v1/gifs";

      const endpoint = q
        ? `${baseApi}/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=28&rating=g`
        : `${baseApi}/trending?api_key=${apiKey}&limit=28&rating=g`;

      const res = await fetch(endpoint, { next: { revalidate: 60 } });
      if (res.ok) {
        const json = await res.json();
        const items = (json.data || [])
          .map((item: any) => ({
            id: item.id,
            name: item.title || (isSticker ? "GIPHY Sticker" : "GIPHY GIF"),
            url:
              item.images?.fixed_height?.url ||
              item.images?.downsized_medium?.url ||
              item.images?.original?.url ||
              `https://i.giphy.com/${item.id}.gif`,
            previewUrl:
              item.images?.fixed_height?.url ||
              item.images?.fixed_height_small?.url ||
              item.images?.downsized?.url ||
              `https://i.giphy.com/${item.id}.gif`,
            category: isSticker ? "GIPHY Sticker" : "GIPHY",
            type: isSticker ? ("sticker" as const) : ("gif" as const),
          }))
          .filter((g: any) => Boolean(g.url));

        if (items.length > 0) {
          return NextResponse.json({
            items,
            gifs: items,
            stickers: items,
            source: isSticker ? "giphy-stickers-api" : "giphy-api",
          });
        }
      }
    } catch (err) {
      console.warn(`[GIPHY API - ${type}] Fetch error:`, err);
    }
  }

  // 2. Fallback to curated catalog
  if (type === "stickers") {
    const filteredStickers = STICKERS.filter((s) => {
      if (!q) return true;
      const searchLower = q.toLowerCase();
      return (
        s.name.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower)
      );
    });
    return NextResponse.json({
      items: filteredStickers,
      gifs: filteredStickers,
      stickers: filteredStickers,
      source: "curated-stickers",
    });
  }

  const filtered = CURATED_GIFS.filter((gif) => {
    if (!q) return true;
    const searchLower = q.toLowerCase();
    return (
      gif.name.toLowerCase().includes(searchLower) ||
      gif.category.toLowerCase().includes(searchLower) ||
      (gif as any).tags?.some((t: string) => t.toLowerCase().includes(searchLower))
    );
  });

  return NextResponse.json({
    items: filtered,
    gifs: filtered,
    stickers: filtered,
    source: "curated",
  });
}

