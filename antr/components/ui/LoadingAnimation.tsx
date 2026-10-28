"use client";

import React, { useState, useEffect } from "react";

export interface LoadingAnimationProps {
  /** Size variant: 'sm' (inline/button), 'md' (card), 'lg' (page section), 'xl' (hero/full) */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional status title or text */
  text?: string;
  /** Optional secondary subtitle */
  subtitle?: string;
  /** Whether to render as an overlay spanning the entire screen */
  fullScreen?: boolean;
  /** Custom className for the outer container */
  className?: string;
  /** Optional FIGlet font style */
  figletVariant?: "slant" | "block";
}

// Slant FIGlet font representation of "Annoyie"
// Escaped properly for TypeScript/React strings
const SLANT_FIGLET = [
  "   ___                                   _      ",
  "  /   |   ____   ____   ____   __  __   (_) ___ ",
  " / /| |  / __ \\ / __ \\ / __ \\ / / / /  / / / _ \\",
  "/ ___ | / / / // / / // /_/ // /_/ /  / / /  __/",
  "/_/  |_|/_/ /_//_/ /_/ \\____/ \\__, /  /_/  \\___/ ",
  "                            /____/              ",
];

// Precision Unicode Block FIGlet for high-contrast mobile & desktop
const BLOCK_FIGLET = [
  " █████  ███    ██ ███    ██  ██████  ██    ██ ██ ███████ ",
  "██   ██ ████   ██ ████   ██ ██    ██  ██  ██  ██ ██      ",
  "███████ ██ ██  ██ ██ ██  ██ ██    ██   ████   ██ █████   ",
  "██   ██ ██  ██ ██ ██  ██ ██ ██    ██    ██    ██ ██      ",
  "██   ██ ██   ████ ██   ████  ██████     ██    ██ ███████ ",
];

export default function LoadingAnimation({
  size = "md",
  text,
  subtitle,
  fullScreen = false,
  className = "",
  figletVariant = "slant",
}: LoadingAnimationProps) {
  const lines = figletVariant === "block" ? BLOCK_FIGLET : SLANT_FIGLET;
  const maxCols = lines[0].length;

  // Reveal animation column progress
  const [revealedCols, setRevealedCols] = useState(0);
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);
  const [progressPercent, setProgressPercent] = useState(24);
  const [cursorBlink, setCursorBlink] = useState(true);

  // Progressive typing / laser reveal effect
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= maxCols) {
        setRevealedCols(maxCols);
        setIsFullyRevealed(true);
        clearInterval(interval);
      } else {
        setRevealedCols(current);
      }
    }, 38);

    return () => clearInterval(interval);
  }, [maxCols]);

  // Terminal cursor blinking & progress increment
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorBlink((prev) => !prev);
    }, 450);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 700);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(progressInterval);
    };
  }, []);

  // -------------------------------------------------------------
  // SMALL / INLINE VARIANT (For buttons, small list cards, chat)
  // -------------------------------------------------------------
  if (size === "sm") {
    return (
      <div className={`inline-flex items-center gap-2 select-none font-mono ${className}`}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider text-[11px] text-zinc-200">
            [ ANNOYIE ]
          </span>
          <span className="text-zinc-500 text-[10px]">
            {cursorBlink ? "▌" : " "}
          </span>
        </div>
        {text && <span className="text-zinc-400 text-xs">{text}</span>}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MEDIUM VARIANT (Compact FIGlet reveal for inside feed/cards)
  // -------------------------------------------------------------
  if (size === "md") {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Emblem Top Mark */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white relative">
            <svg
              className="w-5 h-5 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 22 22 22 12 2" />
              <line x1="6.5" y1="16" x2="17.5" y2="16" />
            </svg>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>

        {/* Scaled ASCII Wordmark */}
        <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] shadow-inner max-w-full overflow-x-hidden">
          <pre className="font-mono text-[8px] sm:text-[9.5px] leading-[1.15] text-zinc-200 font-bold select-none text-left">
            {lines.map((line, rowIdx) => {
              const visiblePart = line.slice(0, revealedCols);
              const cursorPart =
                revealedCols < maxCols && rowIdx === Math.floor(lines.length / 2)
                  ? "▌"
                  : "";
              const hiddenPart = line.slice(revealedCols);

              return (
                <div key={rowIdx} className="whitespace-pre">
                  <span className="text-white">{visiblePart}</span>
                  <span className="text-emerald-400">{cursorPart}</span>
                  <span className="text-zinc-800 opacity-20">{hiddenPart}</span>
                </div>
              );
            })}
          </pre>
        </div>

        {/* Telemetry labels */}
        <div className="mt-3 space-y-1 font-mono">
          {text ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {text}
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Annoyie System Loading
            </p>
          )}
          {subtitle && (
            <p className="text-[11px] text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LARGE / EXTRA-LARGE / FULL-SCREEN VARIANT
  // (Full bespoke FIGlet logo reveal with scanline laser sweep)
  // -------------------------------------------------------------
  const fullContent = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* 1. Stencil Monogram Seal */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Rotating calibration ring */}
        <div className="w-16 h-16 rounded-2xl bg-[#0e1017] border border-white/10 flex items-center justify-center relative shadow-lg">
          {/* 2D geometric compass ticks */}
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-zinc-600">▲</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-zinc-600">▼</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-zinc-600">◄</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-zinc-600">►</span>
          </div>

          {/* Stencil "A" Emblem */}
          <svg
            className="w-7 h-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 3 3 21 21 21 12 3" stroke="#ffffff" />
            <line x1="7.5" y1="15" x2="16.5" y2="15" stroke="#10b981" strokeWidth="2.5" />
            <circle cx="12" cy="10" r="1.5" fill="#ffffff" />
          </svg>

          {/* Online status indicator */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>
      </div>

      {/* 2. THE FIGLET ASCII "ANNOYIE" LOGO REVEAL STAGE */}
      <div className="relative px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-[#090b10] border border-white/[0.08] shadow-2xl max-w-full overflow-x-auto scrollbar-none">
        {/* Subtle decorative registration marks */}
        <span className="absolute top-2 left-2 text-[10px] font-mono text-zinc-700 select-none">+</span>
        <span className="absolute top-2 right-2 text-[10px] font-mono text-zinc-700 select-none">+</span>
        <span className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-700 select-none">+</span>
        <span className="absolute bottom-2 right-2 text-[10px] font-mono text-zinc-700 select-none">+</span>

        {/* Laser scanline sweep line across the text */}
        <div
          className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-emerald-400/80 to-transparent pointer-events-none transition-all duration-75"
          style={{
            left: `${Math.min(100, Math.max(0, (revealedCols / maxCols) * 100))}%`,
            opacity: revealedCols < maxCols ? 0.9 : 0,
          }}
        />

        {/* FIGlet text render */}
        <pre className="font-mono text-[7px] sm:text-[9px] md:text-[11px] leading-[1.2] text-zinc-100 font-extrabold select-none tracking-normal text-left py-1">
          {lines.map((line, rowIdx) => {
            const visiblePart = line.slice(0, revealedCols);
            const cursorPart =
              revealedCols < maxCols && rowIdx === Math.floor(lines.length / 2)
                ? "▌"
                : "";
            const hiddenPart = line.slice(revealedCols);

            return (
              <div key={rowIdx} className="whitespace-pre">
                <span className="text-white drop-shadow-sm">{visiblePart}</span>
                <span className="text-emerald-400 font-bold">{cursorPart}</span>
                <span className="text-zinc-800 opacity-20">{hiddenPart}</span>
              </div>
            );
          })}
        </pre>
      </div>

      {/* 3. Terminal Telemetry & Micro-Progress Meter */}
      <div className="mt-4 w-full max-w-xs space-y-2 font-mono text-left">
        {/* Segmented Terminal Progress Bar */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-0.5">
          <span className="text-emerald-400 font-bold">
            SYS://ANNOYIE.REVEAL
          </span>
          <span className="font-bold text-zinc-300">
            {progressPercent}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden p-[1px]">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Text & Subtitle Micro-Labels */}
        <div className="pt-2 text-center space-y-1">
          <p className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-200">
            {text || "Annoyie Campus Network"}
          </p>
          <p className="text-[11px] font-mono text-zinc-500">
            {subtitle || "Synchronizing peer services & listings"}
            <span className="text-emerald-400 ml-1 font-bold">
              {cursorBlink ? "●" : "○"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#07080a] flex items-center justify-center p-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0d0f17] border border-white/10 shadow-2xl flex flex-col items-center max-w-md w-full">
          {fullContent}
        </div>
      </div>
    );
  }

  return fullContent;
}
