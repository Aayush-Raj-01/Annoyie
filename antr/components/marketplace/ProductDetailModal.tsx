"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketplaceListing } from "@/lib/api/marketplace";

interface ProductDetailModalProps {
  listing: MarketplaceListing | null;
  isOpen: boolean;
  onClose: () => void;
  isMine?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onDelete?: (id: number, title: string, sellerUserId?: number | null) => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ProductDetailModal({
  listing,
  isOpen,
  onClose,
  isMine = false,
  isFavorite = false,
  onToggleFavorite,
  onDelete,
}: ProductDetailModalProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  if (!isOpen || !listing) return null;

  // Compile all media
  const allMedia: string[] = [];
  if (listing.mediaUrls && listing.mediaUrls.length > 0) {
    listing.mediaUrls.forEach((u) => {
      if (u && u.trim() && !allMedia.includes(u.trim())) {
        allMedia.push(u.trim());
      }
    });
  } else if (listing.imageUrl && listing.imageUrl.trim()) {
    allMedia.push(listing.imageUrl.trim());
  }

  const currentMediaUrl = allMedia[activeMediaIndex] || allMedia[0] || "";
  const isVideo =
    currentMediaUrl.toLowerCase().endsWith(".mp4") ||
    currentMediaUrl.toLowerCase().endsWith(".webm") ||
    currentMediaUrl.toLowerCase().includes("/video/");

  const formattedPrice = new Intl.NumberFormat("en-IN").format(listing.price);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Card */}
      <div className="relative w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-[#12141c] border-t sm:border border-white/[0.1] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Mobile Pull Bar Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider border border-emerald-500/25">
              {listing.category || "General"}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              {formatRelativeTime(listing.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(listing.id)}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isFavorite
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-white/[0.05] text-zinc-400 hover:text-white"
                }`}
                title={isFavorite ? "Remove from saved" : "Save item"}
              >
                <svg className={`w-4 h-4 ${isFavorite ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          
          {/* Main Showcase Image / Media */}
          {allMedia.length > 0 && (
            <div className="space-y-2">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08]">
                {isVideo ? (
                  <video src={currentMediaUrl} controls autoPlay muted className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentMediaUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600";
                    }}
                  />
                )}

                {/* Yellow "FEATURED" OLX Badge */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded bg-[#ffce32] text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                    CAMPUS VERIFIED
                  </span>
                </div>
              </div>

              {/* Multi-Photo Thumbnails */}
              {allMedia.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allMedia.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeMediaIndex === idx
                          ? "border-emerald-500 scale-105 shadow-md"
                          : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pricing & Bargain Header */}
          <div className="flex items-baseline justify-between gap-3 pt-1">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              ₹ {formattedPrice}
            </div>
            <div>
              {listing.bargainAvailable ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🤝 Price is Negotiable
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono text-zinc-400 bg-white/[0.05] border border-white/10">
                  Fixed Price
                </span>
              )}
            </div>
          </div>

          {/* Product Title */}
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            {listing.title}
          </h2>

          {/* Location Badge */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 pb-2 border-b border-white/[0.06]">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{listing.hostelName || "Campus Hostel"}</span>
            </span>
            {listing.roomNo && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-zinc-400">Room {listing.roomNo}</span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.04]">
              {listing.description || "No additional description provided by the seller."}
            </p>
          </div>

          {/* Seller Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
                {listing.sellerProfileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.sellerProfileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  (listing.sellerDisplayName?.slice(0, 2) || "ST").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {listing.sellerDisplayName || "Campus Seller"}
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  Verified Campus Member
                </p>
              </div>
            </div>

            <Link
              href={`/marketplace/profile`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium shrink-0"
            >
              View Profile →
            </Link>
          </div>
        </div>

        {/* Modal Sticky Bottom Action Footer (Thumb friendly on mobile) */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0d0e14]/98 shrink-0">
          {isMine ? (
            <div className="flex items-center gap-3">
              <Link
                href="/marketplace/profile"
                className="flex-1 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
              >
                ✏️ Edit Listing
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) {
                    onDelete(listing.id, listing.title, listing.sellerUserId);
                    onClose();
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                🗑️ Remove Ad
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Direct In-App Chat */}
              <Link
                href={`/marketplace/messages?with=${listing.sellerProfileId}&name=${encodeURIComponent(
                  listing.sellerDisplayName
                )}&listingId=${listing.id}&listingTitle=${encodeURIComponent(
                  listing.title
                )}&listingPrice=${listing.price}`}
                className="flex-1 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat in App</span>
              </Link>

              {/* WhatsApp or Direct Contact */}
              {listing.sellerPhoneNumber ? (
                <a
                  href={`https://wa.me/${listing.sellerPhoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hi ${listing.sellerDisplayName}, is "${listing.title}" (₹${listing.price}) still available on campus marketplace?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98"
                >
                  <span>💬 WhatsApp</span>
                  <span className="text-xs">↗</span>
                </a>
              ) : (
                <Link
                  href={`/marketplace/messages?with=${listing.sellerProfileId}&name=${encodeURIComponent(
                    listing.sellerDisplayName
                  )}&listingId=${listing.id}&listingTitle=${encodeURIComponent(
                    listing.title
                  )}&listingPrice=${listing.price}`}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98"
                >
                  <span>Make Offer</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

