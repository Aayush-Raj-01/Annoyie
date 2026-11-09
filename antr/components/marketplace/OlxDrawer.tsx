"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { UserProfile } from "@/app/lib/auth";
import { MarketplaceProfile } from "@/lib/api/marketplace";

interface OlxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  marketProfile: MarketplaceProfile | null;
  unreadCount?: number;
  onPostClick: () => void;
  onFilterMine: () => void;
  onFilterWishlist: () => void;
}

export default function OlxDrawer({
  isOpen,
  onClose,
  currentUser,
  marketProfile,
  unreadCount = 0,
  onPostClick,
  onFilterMine,
  onFilterWishlist,
}: OlxDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = marketProfile?.displayName || currentUser?.anonymousName || "Guest Student";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-[#10121a] border-r border-white/[0.08] shadow-2xl z-10 flex flex-col justify-between p-5 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                MarketPlace
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Campus
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* User Profile Card */}
          <div className="my-5 p-3.5 rounded-2xl bg-[#171924] border border-white/[0.06] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-base shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{displayName}</h3>
              <p className="text-[11px] text-zinc-400 truncate font-mono">
                {currentUser?.studentYear ? `Year ${currentUser.studentYear} Student` : "Campus Member"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>🏠</span>
              <span>Campus Home</span>
            </Link>

            <Link
              href="/chats"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>💬</span>
              <span>Chats & Channels</span>
            </Link>

            <Link
              href="/marketplace/messages"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span>📬</span>
                <span>Buyer Inquiries</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-zinc-950">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => {
                onFilterMine();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
            >
              <span>📦</span>
              <span>My Active Ads</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onFilterWishlist();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
            >
              <span>❤️</span>
              <span>Saved / Wishlist</span>
            </button>

            <Link
              href="/marketplace/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>👤</span>
              <span>Seller Desk / Settings</span>
            </Link>
          </nav>
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPostClick();
            }}
            className="w-full py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>📷</span>
            <span>+ SELL AN ITEM</span>
          </button>
        </div>
      </div>
    </div>
  );
}

