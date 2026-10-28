"use client";

import React from "react";

interface PinterestBackgroundProps {
  /** Optional variant: 'grid' | 'dots' | 'blueprint' | 'sketch' */
  variant?: "grid" | "dots" | "blueprint" | "sketch";
  /** Optional class name */
  className?: string;
  /** Whether to include decorative corner registration marks and coordinate stamps */
  withIllustrations?: boolean;
}

export default function PinterestBackground({
  variant = "grid",
  className = "",
  withIllustrations = true,
}: PinterestBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Pinterest Architectural Pattern Canvas */}
      {variant === "grid" && (
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      )}

      {variant === "dots" && (
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1.25px, transparent 1.25px)",
            backgroundSize: "28px 28px",
          }}
        />
      )}

      {variant === "blueprint" && (
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
          }}
        />
      )}

      {/* 2. Editorial Linework & Technical Drafting Accents (Pinterest Style) */}
      {withIllustrations && (
        <>
          {/* Top-Left Drafting Corner Registration Mark */}
          <div className="absolute top-6 left-6 flex items-center gap-2 opacity-30 font-mono text-[10px] text-zinc-500">
            <span>+</span>
            <span>SEC_01 // CAMPUS ARCHIVE</span>
          </div>

          {/* Top-Right Blueprint Coordinate Stamp */}
          <div className="absolute top-6 right-6 hidden sm:flex items-center gap-2 opacity-30 font-mono text-[10px] text-zinc-500">
            <span>COORD: 28.6139° N, 77.2090° E</span>
            <span>+</span>
          </div>

          {/* Bottom-Left Pinterest Stamp Badge */}
          <div className="absolute bottom-24 left-8 hidden lg:block opacity-25">
            <svg width="84" height="84" viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-zinc-400">
              <circle cx="50" cy="50" r="46" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="38" strokeWidth="1" />
              <path d="M50 20 L50 80 M20 50 L80 50" strokeWidth="0.75" />
              <text x="50" y="47" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="monospace" letterSpacing="1">
                ANNOYMS
              </text>
              <text x="50" y="58" textAnchor="middle" fontSize="6" fill="currentColor" fontFamily="monospace">
                CAMPUS RELAY
              </text>
            </svg>
          </div>

          {/* Subtle Campus Bicycle Line Art (Bottom Right) */}
          <div className="absolute bottom-24 right-8 hidden lg:block opacity-20">
            <svg width="130" height="80" viewBox="0 0 130 80" fill="none" stroke="currentColor" className="text-zinc-400" strokeWidth="1.2">
              {/* Back Wheel */}
              <circle cx="28" cy="52" r="22" />
              <circle cx="28" cy="52" r="3" fill="currentColor" />
              {/* Front Wheel */}
              <circle cx="102" cy="52" r="22" />
              <circle cx="102" cy="52" r="3" fill="currentColor" />
              {/* Frame */}
              <path d="M28 52 L56 52 L82 28 L46 28 Z" />
              <path d="M56 52 L44 20" />
              <path d="M82 28 L102 52" />
              <path d="M102 52 L94 18 L86 18" />
              {/* Saddle */}
              <path d="M38 20 L50 20" strokeWidth="2" strokeLinecap="round" />
              {/* Pedals */}
              <circle cx="56" cy="52" r="5" />
            </svg>
          </div>

          {/* Floating Architectural Technical Crosses in corners */}
          <div className="absolute top-1/3 left-4 opacity-20 font-mono text-xs text-zinc-500">+</div>
          <div className="absolute top-2/3 right-6 opacity-20 font-mono text-xs text-zinc-500">+</div>
          <div className="absolute top-1/2 right-1/4 opacity-15 font-mono text-xs text-zinc-500">+</div>
        </>
      )}
    </div>
  );
}
