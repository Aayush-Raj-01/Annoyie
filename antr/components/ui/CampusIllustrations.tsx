"use client";

import React from "react";

export function CampusBuildingLinework({ className = "w-32 h-32 text-zinc-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
      {/* Foundation & Steps */}
      <line x1="10" y1="108" x2="110" y2="108" strokeWidth="1.5" />
      <line x1="16" y1="112" x2="104" y2="112" strokeWidth="1.5" />
      {/* Main Pillars / Facade */}
      <rect x="22" y="44" width="76" height="64" />
      <line x1="38" y1="44" x2="38" y2="108" strokeDasharray="3 3" />
      <line x1="60" y1="44" x2="60" y2="108" strokeDasharray="3 3" />
      <line x1="82" y1="44" x2="82" y2="108" strokeDasharray="3 3" />
      {/* Central Arch Portal */}
      <path d="M52 108 V82 C52 74 68 74 68 82 V108" />
      {/* Triangular Pediment / Roof */}
      <polygon points="60,18 16,44 104,44" strokeWidth="1.4" />
      {/* Roof Clock / Insignia */}
      <circle cx="60" cy="33" r="6" />
      <line x1="60" y1="30" x2="60" y2="33" />
      <line x1="60" y1="33" x2="63" y2="33" />
      {/* Windows */}
      <rect x="28" y="54" width="6" height="10" />
      <rect x="28" y="74" width="6" height="10" />
      <rect x="86" y="54" width="6" height="10" />
      <rect x="86" y="74" width="6" height="10" />
      {/* Flagpole */}
      <line x1="60" y1="18" x2="60" y2="8" />
      <polygon points="60,8 68,11 60,14" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function StudyDeskLinework({ className = "w-28 h-28 text-zinc-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
      {/* Desk surface */}
      <line x1="12" y1="70" x2="88" y2="70" strokeWidth="1.6" />
      {/* Legs */}
      <line x1="18" y1="70" x2="18" y2="92" />
      <line x1="82" y1="70" x2="82" y2="92" />
      <line x1="18" y1="84" x2="82" y2="84" strokeDasharray="2 3" />
      {/* Open Book / Textbook */}
      <path d="M36 68 C42 66 48 66 50 67 C52 66 58 66 64 68 L64 60 C58 58 52 58 50 59 C48 58 42 58 36 60 Z" />
      <line x1="50" y1="59" x2="50" y2="67" />
      {/* Desk Lamp */}
      <path d="M72 70 L72 40 L60 48" />
      <path d="M56 46 L64 42 L66 50 Z" />
      <path d="M50 54 L62 66" strokeDasharray="1.5 2" opacity="0.4" />
      {/* Mug with steam */}
      <rect x="24" y="60" width="6" height="10" rx="1" />
      <path d="M30 63 C33 63 33 67 30 67" />
      <path d="M26 56 C26 54 28 54 28 52" opacity="0.5" />
    </svg>
  );
}

export function CampusStampSeal({ className = "w-24 h-24 text-emerald-400" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className={className}>
      <circle cx="50" cy="50" r="46" strokeWidth="1.2" strokeDasharray="4 2" />
      <circle cx="50" cy="50" r="40" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="28" strokeWidth="0.8" strokeDasharray="2 2" />
      {/* Center symbol: Monogram / Star */}
      <polygon points="50,34 54,44 64,44 56,50 59,60 50,54 41,60 44,50 36,44 46,44" fill="currentColor" opacity="0.15" />
      {/* Text ring */}
      <text x="50" y="24" textAnchor="middle" fontSize="5.5" fill="currentColor" fontFamily="monospace" letterSpacing="1.5">
        ANNOYMS VERIFIED
      </text>
      <text x="50" y="80" textAnchor="middle" fontSize="5" fill="currentColor" fontFamily="monospace" letterSpacing="1">
        STUDENT COMMONS
      </text>
    </svg>
  );
}
