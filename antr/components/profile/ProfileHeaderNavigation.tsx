"use client";

import React from "react";
import Link from "next/link";

interface ProfileHeaderNavigationProps {
  activeTab: "marketplace" | "chat";
  backHref?: string;
  backLabel?: string;
}

export default function ProfileHeaderNavigation({
  activeTab,
  backHref = "/marketplace",
  backLabel = "Marketplace",
}: ProfileHeaderNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap w-full">
      {/* Back to Marketplace Button */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-emerald-500/40 text-[11px] sm:text-xs font-medium transition-all shadow-md group cursor-pointer active:scale-95 shrink-0"
        title={`Go back to ${backLabel}`}
      >
        <span className="text-emerald-400 transition-transform group-hover:-translate-x-0.5 font-bold">
          ←
        </span>
        <span>
          <span className="hidden sm:inline">Back to </span>
          {backLabel}
        </span>
      </Link>

      {/* Segmented Persona Switcher Pill (Consistent across both Marketplace & Chat Profile) */}
      <div className="flex items-center p-1 rounded-full bg-zinc-900/90 border border-white/[0.08] backdrop-blur-md shadow-md gap-0.5 sm:gap-1">
        {activeTab === "marketplace" ? (
          <div className="px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 select-none">
            <span>🏪</span>
            <span>Marketplace</span>
          </div>
        ) : (
          <Link
            href="/marketplace/profile"
            className="px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1.5"
            title="Switch to Marketplace Profile"
          >
            <span>🏪</span>
            <span>Marketplace</span>
          </Link>
        )}

        {activeTab === "chat" ? (
          <div className="px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 select-none">
            <span>💬</span>
            <span>Chat Profile</span>
          </div>
        ) : (
          <Link
            href="/profile"
            className="px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1.5"
            title="Switch to Chat Profile"
          >
            <span>💬</span>
            <span>Chat Profile</span>
          </Link>
        )}
      </div>
    </div>
  );
}
