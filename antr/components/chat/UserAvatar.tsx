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

const GRADIENTS = [
  "from-emerald-500 to-teal-700 text-emerald-100",
  "from-indigo-500 to-violet-700 text-indigo-100",
  "from-rose-500 to-pink-700 text-rose-100",
  "from-amber-500 to-orange-700 text-amber-100",
  "from-cyan-500 to-blue-700 text-cyan-100",
  "from-fuchsia-500 to-purple-700 text-fuchsia-100",
  "from-teal-500 to-emerald-700 text-teal-100",
  "from-violet-600 to-indigo-800 text-violet-100",
];

const PERSONA_EMOJIS = ["⚡", "💻", "🕶️", "🚀", "🎭", "🧠", "👾", "🦊", "🤖", "🎮", "🛡️", "🔮"];

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
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const personaEmoji = PERSONA_EMOJIS[hash % PERSONA_EMOJIS.length];
  const initials = getInitials(name || "Anonymous");

  // Dimension classes
  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const statusSizeMap = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
  };

  const hasValidImage = Boolean(src && src.trim() && !imageFailed);

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden border border-white/10 ring-1 ring-white/5 flex items-center justify-center relative shadow-sm`}
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
            className={`w-full h-full bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold tracking-tight font-mono relative`}
          >
            <span>{initials}</span>
            <span
              className="absolute -bottom-0.5 -right-0.5 text-[9px] leading-none opacity-80"
              title="Persona Badge"
            >
              {personaEmoji}
            </span>
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
          className={`absolute bottom-0 right-0 ${statusSizeMap[size]} rounded-full ring-2 ring-zinc-950 ${
            isConnected
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
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
