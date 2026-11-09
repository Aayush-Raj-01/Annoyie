"use client";

import React from "react";

interface OlxSellButtonProps {
  onClick: () => void;
  className?: string;
}

export default function OlxSellButton({ onClick, className = "" }: OlxSellButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.5)] border-2 border-emerald-300/40 active:scale-95 transition-all duration-200 cursor-pointer uppercase select-none group ${className}`}
      title="Post an Ad on Campus Marketplace"
    >
      {/* Camera Icon */}
      <svg
        className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
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
  );
}

