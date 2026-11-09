"use client";

import React, { useState, useRef, useEffect } from "react";

export type QuickActionType = "image" | "video" | "audio" | "design" | "new_chat";

interface QuickActionMenuProps {
  onSelectAction: (action: QuickActionType) => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "right";
  buttonSize?: "sm" | "md" | "lg";
  className?: string;
}

export default function QuickActionMenu({
  onSelectAction,
  position = "top-left",
  buttonSize = "md",
  className = "",
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<QuickActionType | null>("audio");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  }[buttonSize];

  const positionClasses = {
    "top-left": "bottom-full left-0 mb-3 origin-bottom-left",
    "top-right": "bottom-full right-0 mb-3 origin-bottom-right",
    "bottom-left": "top-full left-0 mt-3 origin-top-left",
    "bottom-right": "top-full right-0 mt-3 origin-top-right",
    right: "left-full top-0 ml-3 origin-top-left",
  }[position];

  const handleAction = (action: QuickActionType) => {
    setIsOpen(false);
    onSelectAction(action);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Glowing Neon Pink Circular Plus Button - Exactly as in Reference Image 1 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#ff1e83] via-[#ff3b99] to-[#ff63ad] text-zinc-950 font-black flex items-center justify-center shadow-[0_0_24px_rgba(255,30,131,0.55)] border border-pink-300/40 hover:shadow-[0_0_34px_rgba(255,30,131,0.85)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-20 group relative`}
        title="Quick Actions"
        aria-label="Quick Actions"
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-45" : "group-hover:rotate-90"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Floating Dark Glassmorphic Flyout Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute ${positionClasses} z-50 w-52 p-2 rounded-[22px] bg-[#14151b]/95 backdrop-blur-2xl border border-white/[0.09] shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="space-y-1">
            {/* 1. Image */}
            <button
              type="button"
              onClick={() => handleAction("image")}
              onMouseEnter={() => setActiveHover("image")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeHover === "image"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="2 2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Image</span>
            </button>

            {/* 2. Video */}
            <button
              type="button"
              onClick={() => handleAction("video")}
              onMouseEnter={() => setActiveHover("video")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeHover === "video"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="6" width="14" height="12" rx="2" strokeLinecap="round" />
                <path d="M16 10l5-3v10l-5-3v-4z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Video</span>
            </button>

            {/* 3. Audio (Sparkle Soundwave - Highlighted in reference image) */}
            <button
              type="button"
              onClick={() => handleAction("audio")}
              onMouseEnter={() => setActiveHover("audio")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeHover === "audio"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {/* Pink sparkling waveform icon matching screenshot */}
              <div className="relative flex items-center gap-0.5 text-pink-400">
                <span className="w-0.5 h-1.5 bg-zinc-400 rounded-full" />
                <span className="w-0.5 h-3 bg-pink-400 rounded-full" />
                <span className="w-0.5 h-4 bg-pink-400 rounded-full" />
                <span className="w-0.5 h-2.5 bg-pink-400 rounded-full" />
                <span className="w-0.5 h-1 bg-zinc-400 rounded-full" />
                <span className="absolute -top-1 -right-1 text-[8px] text-pink-400 animate-pulse">✦</span>
              </div>
              <span className="flex-1">Audio</span>
              <span className="text-[10px] font-mono text-pink-400/80 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                Voice
              </span>
            </button>

            {/* 4. Design */}
            <button
              type="button"
              onClick={() => handleAction("design")}
              onMouseEnter={() => setActiveHover("design")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeHover === "design"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4L4 16v4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
              </svg>
              <span>Design / Stickers</span>
            </button>

            {/* 5. New project / Chat */}
            <button
              type="button"
              onClick={() => handleAction("new_chat")}
              onMouseEnter={() => setActiveHover("new_chat")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border-t border-white/[0.06] mt-1 pt-2 ${
                activeHover === "new_chat"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>New project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

