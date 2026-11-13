"use client";

import React, { useState } from "react";
import { MarketplaceListing } from "@/lib/api/marketplace";

interface OlxProductCardProps {
  listing: MarketplaceListing;
  isMine?: boolean;
  onDelete?: (id: number, title: string, sellerUserId?: number | null) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onClick?: () => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function OlxProductCard({
  listing,
  isMine = false,
  onDelete,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: OlxProductCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorite((prev) => !prev);
    if (onToggleFavorite) {
      onToggleFavorite(listing.id);
    }
  };

  // Resolve thumbnail image
  const displayImage =
    listing.imageUrl ||
    (listing.mediaUrls && listing.mediaUrls.length > 0 ? listing.mediaUrls[0] : null);

  const formattedPrice = new Intl.NumberFormat("en-IN").format(listing.price);
  const timeAgo = formatRelativeTime(listing.createdAt);

  return (
    <article
      onClick={onClick}
      className="group relative rounded-2xl bg-[#13151f] border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between select-none cursor-pointer active:scale-[0.99]"
    >
      <div>
        {/* Top Media Thumbnail */}
        <div className="relative w-full aspect-[4/3] bg-[#1a1c28] overflow-hidden">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-600">
              📦
            </div>
          )}

          {/* Yellow "FEATURED" Badge (Exact OLX style) */}
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded-sm bg-[#ffce32] text-black text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider shadow-sm">
              FEATURED
            </span>
          </div>

          {/* Top-Right Heart Wishlist Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
              favorite
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105"
                : "bg-black/50 text-white/80 hover:text-white hover:bg-black/80"
            }`}
            title={favorite ? "Remove from saved" : "Save item"}
          >
            <svg
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                favorite ? "fill-current scale-110" : "stroke-current fill-none"
              }`}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Negotiable Tag */}
          {listing.bargainAvailable && (
            <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
              <span className="px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-mono font-bold bg-emerald-500/90 text-black shadow-sm">
                🤝 Negotiable
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-2.5 sm:p-3.5 space-y-1">
          {/* Price */}
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-sm sm:text-lg font-black text-white tracking-tight">
              ₹ {formattedPrice}
            </span>
            {listing.category && (
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider truncate max-w-[70px] sm:max-w-none">
                {listing.category}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-tight">
            {listing.title}
          </h3>

          {/* Location & Time Stamp */}
          <div className="pt-1 flex items-center justify-between text-[9.5px] sm:text-[10.5px] text-zinc-400 font-mono">
            <span className="truncate max-w-[90px] sm:max-w-[130px] flex items-center gap-0.5 text-zinc-400">
              <svg className="w-2.5 h-2.5 text-zinc-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{listing.hostelName || "Campus Hostel"}</span>
            </span>
            <span className="text-zinc-500 shrink-0">{timeAgo}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
