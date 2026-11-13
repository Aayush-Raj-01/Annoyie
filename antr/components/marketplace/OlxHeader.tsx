"use client";

import React, { useState } from "react";
import Link from "next/link";

interface OlxHeaderProps {
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  unreadCount?: number;
  onOpenDrawer?: () => void;
  onPostClick?: () => void;
}

export const CAMPUS_LOCATIONS = [
  "All Campus",
  "Boys Hostel (Block A)",
  "Boys Hostel (Block B)",
  "Boys Hostel (Block C)",
  "Girls Hostel",
  "Faculty Quarters",
  "Day Scholar (Ghaziabad / NCR)",
];

export default function OlxHeader({
  currentLocation,
  onSelectLocation,
  unreadCount = 0,
  onOpenDrawer,
  onPostClick,
}: OlxHeaderProps) {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  return (
    <header className="w-full py-3 border-b border-white/[0.08] bg-[#0c0e14]/95 backdrop-blur-xl sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: MarketPlace Brand Title */}
        <Link href="/marketplace" className="flex items-center gap-2 group">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            MarketPlace
          </h1>
        </Link>

        {/* Right: Location Selector Pill & Messages */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Picker Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{currentLocation}</span>
              <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Location Dropdown Menu */}
            {isLocationDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 p-1.5 rounded-2xl bg-[#161822]/98 backdrop-blur-2xl border border-white/[0.1] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/[0.06] mb-1">
                  Select Location / Hostel
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                  {CAMPUS_LOCATIONS.map((loc) => {
                    const isSelected = currentLocation === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          onSelectLocation(loc);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                            : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="truncate">{loc}</span>
                        {isSelected && <span className="text-emerald-400 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Inquiries / Chat Inbox */}
          <Link
            href="/marketplace/messages"
            className="relative p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Messages & Buyer Inquiries"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Header "+ SELL" Button (Accessible on both Mobile & Desktop) */}
          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs tracking-wider shadow-md shadow-emerald-500/30 border border-emerald-400/40 active:scale-95 transition-all cursor-pointer uppercase select-none group shrink-0"
              title="Post an Ad on Campus Marketplace"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>+ SELL</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

