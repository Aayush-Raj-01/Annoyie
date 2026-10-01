"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  STICKERS,
  CURATED_GIFS,
  EMOJI_CATEGORIES,
  ALL_EMOJIS,
  searchEmojis,
  MediaItem,
  resolveGiphyUrl,
} from "@/lib/chat/mediaData";

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (content: string) => void;
  onSelectEmoji: (emoji: string) => void;
  initialTab?: "stickers" | "gifs" | "emojis";
}

type TabType = "stickers" | "gifs" | "emojis";

const STICKER_QUICK_TAGS = [
  "Trending",
  "Anime",
  "Cat",
  "Love",
  "Happy",
  "Sad",
  "Cool",
  "Text",
  "Ghost",
  "Dance",
];

const GIF_QUICK_TAGS = [
  "Trending",
  "Laugh",
  "Hype",
  "Cat",
  "Dance",
  "Shocked",
  "Love",
  "Anime",
  "Salute",
  "Bye",
];

export default function MediaPicker({
  isOpen,
  onClose,
  onSelectMedia,
  onSelectEmoji,
  initialTab = "stickers",
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStickerTag, setActiveStickerTag] = useState<string>("Trending");
  const [activeGifTag, setActiveGifTag] = useState<string>("Trending");
  const [activeEmojiCat, setActiveEmojiCat] = useState<string>("All");
  const [customGifUrl, setCustomGifUrl] = useState("");
  
  // GIPHY Live Data State
  const [giphyStickers, setGiphyStickers] = useState<MediaItem[]>(STICKERS);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  const [giphyGifs, setGiphyGifs] = useState<MediaItem[]>(CURATED_GIFS);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialTab when opening
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch GIPHY GIFs
  const fetchGifs = useCallback(async (query: string) => {
    setIsLoadingGifs(true);
    try {
      const q = query.trim() === "Trending" || !query.trim() ? "" : query.trim();
      const res = await fetch(`/api/giphy?type=gifs&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setGiphyGifs(data.items);
        } else {
          setGiphyGifs(CURATED_GIFS);
        }
      }
    } catch (err) {
      console.error("[MediaPicker] Giphy fetch failed:", err);
      setGiphyGifs(CURATED_GIFS);
    } finally {
      setIsLoadingGifs(false);
    }
  }, []);

  // Fetch GIPHY Stickers
  const fetchStickers = useCallback(async (query: string) => {
    setIsLoadingStickers(true);
    try {
      const q = query.trim() === "Trending" || !query.trim() ? "" : query.trim();
      const res = await fetch(`/api/giphy?type=stickers&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setGiphyStickers(data.items);
        } else {
          setGiphyStickers(STICKERS);
        }
      }
    } catch (err) {
      console.error("[MediaPicker] Giphy stickers fetch failed:", err);
      setGiphyStickers(STICKERS);
    } finally {
      setIsLoadingStickers(false);
    }
  }, []);

  // Fetch on opening or tab switch
  useEffect(() => {
    if (!isOpen) return;

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      if (activeTab === "gifs") {
        fetchGifs(searchQuery || activeGifTag);
      } else if (activeTab === "stickers") {
        fetchStickers(searchQuery || activeStickerTag);
      }
    }, 250);

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [isOpen, activeTab, searchQuery, activeGifTag, activeStickerTag, fetchGifs, fetchStickers]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Tab Change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  // Filtered Emojis using search index
  const filteredEmojis = useMemo(() => {
    return searchEmojis(searchQuery, activeEmojiCat);
  }, [activeEmojiCat, searchQuery]);

  const handleCustomGifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGifUrl.trim()) return;
    const resolved = resolveGiphyUrl(customGifUrl.trim());
    onSelectMedia(`[gif:${resolved}]`);
    setCustomGifUrl("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="fixed inset-x-3 bottom-20 z-50 sm:absolute sm:inset-x-auto sm:left-2 sm:bottom-full sm:mb-2.5 sm:w-[420px] max-w-sm sm:max-w-md h-[440px] max-h-[80vh] rounded-2xl bg-[#0c0e14]/98 backdrop-blur-2xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Header with Navigation Tabs */}
      <div className="flex items-center justify-between p-2.5 border-b border-white/[0.06] bg-zinc-950/70">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleTabChange("stickers")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "stickers"
                ? "bg-white/[0.1] text-white border border-white/10 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            ✨ Stickers
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("gifs")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "gifs"
                ? "bg-white/[0.1] text-white border border-white/10 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            🎬 GIFs
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("emojis")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "emojis"
                ? "bg-white/[0.1] text-white border border-white/10 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            😀 Emojis
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Close drawer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="p-2.5 pb-1.5">
        <div className="relative">
          <svg
            className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={
              activeTab === "stickers"
                ? "Search GIPHY stickers (e.g. cat, anime, dance)..."
                : activeTab === "gifs"
                ? "Search reaction GIFs on GIPHY..."
                : "Search emojis (e.g. smile, love, fire, cat)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-zinc-900/80 border border-white/[0.06] rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs p-0.5 rounded-full cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (for Stickers, GIFs, and Emojis) */}
      <div className="flex items-center gap-1.5 px-2.5 pb-2 overflow-x-auto scrollbar-none">
        {activeTab === "stickers" &&
          STICKER_QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setActiveStickerTag(tag);
                setSearchQuery(tag === "Trending" ? "" : tag);
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                (searchQuery === tag || (!searchQuery && activeStickerTag === tag))
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              {tag}
            </button>
          ))}

        {activeTab === "gifs" &&
          GIF_QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setActiveGifTag(tag);
                setSearchQuery(tag === "Trending" ? "" : tag);
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                (searchQuery === tag || (!searchQuery && activeGifTag === tag))
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              {tag}
            </button>
          ))}

        {activeTab === "emojis" && (
          <>
            <button
              type="button"
              onClick={() => setActiveEmojiCat("All")}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeEmojiCat === "All"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              All ({ALL_EMOJIS.length})
            </button>
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveEmojiCat(cat.name)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono tracking-wider shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                  activeEmojiCat === cat.name
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Media Grid View */}
      <div className="flex-1 overflow-y-auto p-2.5 pt-0 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* STICKERS VIEW (GIPHY STICKERS) */}
        {activeTab === "stickers" && (
          <div className="space-y-3">
            {isLoadingStickers ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-emerald-400 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-[11px] font-mono text-zinc-400">Searching GIPHY Stickers...</span>
              </div>
            ) : giphyStickers.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500 font-mono">
                No stickers found. Try another search.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {giphyStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => {
                      onSelectMedia(`[sticker:${sticker.name}:${sticker.url}]`);
                      onClose();
                    }}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-transparent hover:border-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title={sticker.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sticker.previewUrl || sticker.url}
                      alt={sticker.name}
                      className="w-16 h-16 object-contain"
                      loading="lazy"
                    />
                    <span className="text-[9px] font-mono text-zinc-400 truncate max-w-full mt-1 group-hover:text-zinc-200">
                      {sticker.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1 pt-1 border-t border-white/[0.04]">
              <span>Transparent animated stickers</span>
              <span className="text-zinc-400 font-semibold tracking-wider">Powered by GIPHY</span>
            </div>
          </div>
        )}

        {/* GIFS VIEW (GIPHY GIFS) */}
        {activeTab === "gifs" && (
          <div className="space-y-3">
            {isLoadingGifs ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-emerald-400 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-[11px] font-mono text-zinc-400">Searching GIPHY...</span>
              </div>
            ) : giphyGifs.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500 font-mono">
                No GIFs found. Try another search term.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {giphyGifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSelectMedia(`[gif:${gif.url}]`);
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] hover:border-emerald-500/40 transition-all active:scale-98 cursor-pointer h-24"
                    title={gif.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gif.previewUrl || gif.url}
                      alt={gif.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="text-[10px] text-zinc-200 truncate block px-1 font-medium">
                        {gif.name}
                      </span>
                    </div>
                    <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[9px] font-mono text-zinc-300">
                      GIF
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom GIF Link Bar & GIPHY Attribution */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <form onSubmit={handleCustomGifSubmit} className="flex items-center gap-1.5">
                <input
                  type="url"
                  placeholder="Or paste any GIF/Giphy URL..."
                  value={customGifUrl}
                  onChange={(e) => setCustomGifUrl(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-900 border border-white/[0.06] rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40"
                />
                <button
                  type="submit"
                  disabled={!customGifUrl.trim()}
                  className="px-2.5 py-1 text-xs bg-emerald-500 text-zinc-950 font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Send
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-1">
                <span>Any GIF can be sent</span>
                <span className="text-zinc-400 font-semibold tracking-wider">Powered by GIPHY</span>
              </div>
            </div>
          </div>
        )}

        {/* EMOJIS VIEW */}
        {activeTab === "emojis" && (
          <div className="space-y-2">
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 p-0.5">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => {
                    onSelectEmoji(emoji);
                  }}
                  className="h-10 text-2xl hover:bg-white/[0.08] active:scale-125 rounded-xl transition-all cursor-pointer flex items-center justify-center select-none"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1 pt-1 border-t border-white/[0.04]">
              <span>{filteredEmojis.length} emojis</span>
              <span>Tap to insert into message</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
