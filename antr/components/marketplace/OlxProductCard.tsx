"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketplaceListing } from "@/lib/api/marketplace";
import ListingMediaGallery from "./ListingMediaGallery";

interface OlxProductCardProps {
  listing: MarketplaceListing;
  isMine?: boolean;
  onDelete?: (id: number, title: string, sellerUserId?: number | null) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export default function OlxProductCard({
  listing,
  isMine = false,
  onDelete,
  isFavorite = false,
  onToggleFavorite,
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

  // Format price with comma separation (e.g. ₹ 4,500)
  const formattedPrice = new Intl.NumberFormat("en-IN").format(listing.price);

  return (
    <article className="group relative rounded-2xl bg-[#13151f] border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between select-none">
      <div>
        {/* Top Media Showcase Container */}
        <div className="relative w-full aspect-[4/3] bg-[#1a1c28] overflow-hidden">
          <ListingMediaGallery
            mediaUrls={listing.mediaUrls}
            imageUrl={listing.imageUrl}
            title={listing.title}
          />

          {/* Yellow "FEATURED" Badge (Exact OLX style) */}
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-sm bg-[#ffce32] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md">
              FEATURED
            </span>
          </div>

          {/* Top-Right Heart Wishlist Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
              favorite
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
                : "bg-black/60 text-white/80 hover:text-white hover:bg-black/80"
            }`}
            title={favorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${favorite ? "fill-current scale-110" : "stroke-current fill-none"}`}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Negotiable / Fixed Tag */}
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
            {listing.bargainAvailable ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/90 text-black shadow-sm">
                🤝 Negotiable
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 bg-black/75 border border-white/10">
                Fixed Price
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-4 space-y-1.5">
          {/* Price (Large & Bold) */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base sm:text-xl font-black text-white tracking-tight">
              ₹ {formattedPrice}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              {listing.category}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>

          {/* Location & Time Stamp */}
          <div className="pt-1 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400">
            <span className="truncate max-w-[120px] sm:max-w-[150px] flex items-center gap-1 text-zinc-400">
              <svg className="w-3 h-3 text-zinc-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{listing.hostelName || "Campus Hostel"}</span>
            </span>
            <span className="font-mono text-zinc-500 shrink-0">
              {listing.roomNo ? `Rm ${listing.roomNo}` : "Campus"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 pt-0">
        <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
          {isMine ? (
            <>
              <Link
                href="/marketplace/profile"
                className="w-full py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/10 text-xs font-semibold text-center transition-all cursor-pointer"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => onDelete && onDelete(listing.id, listing.title, listing.sellerUserId)}
                className="w-full py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 text-xs font-semibold transition-all cursor-pointer"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              {/* Chat with Seller */}
              <Link
                href={`/marketplace/messages?with=${listing.sellerProfileId}&name=${encodeURIComponent(
                  listing.sellerDisplayName
                )}&listingId=${listing.id}&listingTitle=${encodeURIComponent(
                  listing.title
                )}&listingPrice=${listing.price}`}
                className="w-full py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat</span>
              </Link>

              {/* Buy / WhatsApp Call */}
              {listing.sellerPhoneNumber ? (
                <a
                  href={`https://wa.me/${listing.sellerPhoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hi ${listing.sellerDisplayName}, is "${listing.title}" (₹${listing.price}) still available on campus marketplace?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-600/20"
                >
                  <span>Buy</span>
                  <span className="text-[10px]">↗</span>
                </a>
              ) : (
                <Link
                  href={`/marketplace/messages?with=${listing.sellerProfileId}&name=${encodeURIComponent(
                    listing.sellerDisplayName
                  )}&listingId=${listing.id}&listingTitle=${encodeURIComponent(
                    listing.title
                  )}&listingPrice=${listing.price}`}
                  className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-600/20"
                >
                  Buy
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

