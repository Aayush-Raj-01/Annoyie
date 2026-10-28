"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showStatus?: boolean;
  isConnected?: boolean;
  isConnecting?: boolean;
  isBlocked?: boolean;
}

// Sophisticated architectural palettes: deep charcoal, obsidian emerald, brushed graphite, dark slate, deep espresso, muted bronze
const AVATAR_PALETTES = [
  "bg-zinc-800 text-zinc-200 border-zinc-700/60",
  "bg-[#132820] text-emerald-300 border-emerald-600/30",
  "bg-[#1c2230] text-sky-300 border-sky-600/30",
  "bg-[#241c2c] text-purple-300 border-purple-600/30",
  "bg-[#261e14] text-amber-300 border-amber-600/30",
  "bg-[#1a2327] text-teal-300 border-teal-600/30",
  "bg-[#25181c] text-rose-300 border-rose-600/30",
];

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const clean = name.trim().replace(/^[@_]+/, "");
  if (!clean) return "AN";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
  showStatus = false,
  isConnected = false,
  isConnecting = false,
  isBlocked = false,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const hash = getHash(name || "Anonymous");
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const initials = getInitials(name || "Anonymous");

  // Dimension classes
  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-16 h-16 text-base",
  };

  const statusSizeMap = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
  };

  const hasValidImage = Boolean(src && src.trim() && !imageFailed);

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden border border-white/[0.08] ring-1 ring-black/40 flex items-center justify-center relative shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]`}
      >
        {hasValidImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src!}
            alt={name || "User Avatar"}
            className="w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`w-full h-full ${palette} border flex items-center justify-center font-bold tracking-tight font-mono`}
          >
            <span>{initials}</span>
          </div>
        )}
      </div>

      {/* Blocked Indicator Badge */}
      {isBlocked && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full ring-2 ring-[#08090d] flex items-center justify-center text-[8px] text-white font-black"
          title="Blocked user"
        >
          ✕
        </span>
      )}

      {/* Online / Connecting Status Dot */}
      {showStatus && !isBlocked && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeMap[size]} rounded-full ring-2 ring-[#08090d] ${
            isConnected
              ? "bg-emerald-400"
              : isConnecting
              ? "bg-amber-400 animate-pulse"
              : "bg-zinc-600"
          }`}
          title={isConnected ? "Online" : isConnecting ? "Connecting..." : "Offline"}
        />
      )}
    </div>
  );
}
