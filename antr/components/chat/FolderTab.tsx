"use client";

import React from "react";

export interface TabItem {
  id: string | number;
  label: string;
  icon?: "cube" | "chat" | "sparkles" | "code" | "media" | "hash";
  customIcon?: React.ReactNode;
  badge?: string | number;
  closable?: boolean;
}

interface FolderTabsProps {
  tabs: TabItem[];
  activeId: string | number;
  onSelect: (id: string | number) => void;
  onClose?: (id: string | number) => void;
  onAddTab?: () => void;
  className?: string;
  bgColor?: string; // hex or tw class for tab body and concave curves
}

export function IsometricCubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top face */}
      <path d="M12 2.8L19.2 7L12 11.2L4.8 7L12 2.8Z" fill="#9CA3AF" />
      {/* Left face */}
      <path d="M4.5 7.8L11.5 11.8V20.2L4.5 16.2V7.8Z" fill="#4B5563" />
      {/* Right face - bright highlight like in reference */}
      <path d="M12.5 11.8L19.5 7.8V16.2L12.5 20.2V11.8Z" fill="#F3F4F6" />
    </svg>
  );
}

export function IsometricSparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#sparkle-grad)" />
      <defs>
        <linearGradient id="sparkle-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F43F5E" />
          <stop offset="1" stopColor="#FB7185" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IsometricMediaIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="3" fill="#10B981" />
      <circle cx="8.5" cy="9.5" r="2" fill="#A7F3D0" />
      <path d="M21 16L15.5 10.5L9 17L6 14L3 17V17C3 18.6569 4.34315 20 6 20H18C19.6569 20 21 18.6569 21 17V16Z" fill="#047857" />
    </svg>
  );
}

export default function FolderTabs({
  tabs,
  activeId,
  onSelect,
  onClose,
  onAddTab,
  className = "",
  bgColor = "#121417",
}: FolderTabsProps) {
  return (
    <div
      className={`flex items-end gap-1 px-3 pt-1.5 select-none overflow-x-auto scrollbar-none bg-[#0a0b0e] border-b border-white/[0.06] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <div key={tab.id} className="relative group shrink-0">
            {/* Left Concave Inverted Curve */}
            {isActive && (
              <svg
                className="absolute -left-3 bottom-0 w-3 h-3 pointer-events-none z-10"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path d="M12 0 C12 6.627 6.627 12 0 12 L12 12 Z" fill={bgColor} />
              </svg>
            )}

            {/* Tab Pill Body */}
            <button
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
                isActive
                  ? "text-zinc-100 shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
              style={{
                backgroundColor: isActive ? bgColor : undefined,
              }}
            >
              {/* Tab Icon */}
              {tab.customIcon ? (
                tab.customIcon
              ) : tab.icon === "cube" ? (
                <IsometricCubeIcon />
              ) : tab.icon === "sparkles" ? (
                <IsometricSparkleIcon />
              ) : tab.icon === "media" ? (
                <IsometricMediaIcon />
              ) : (
                <span className="text-zinc-400 font-mono text-sm">#</span>
              )}

              {/* Tab Label */}
              <span className="truncate max-w-[130px] font-medium tracking-tight">
                {tab.label}
              </span>

              {/* Badge */}
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}

              {/* Optional Close Button */}
              {tab.closable && onClose && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>

            {/* Right Concave Inverted Curve */}
            {isActive && (
              <svg
                className="absolute -right-3 bottom-0 w-3 h-3 pointer-events-none z-10"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path d="M0 0 C0 6.627 5.373 12 12 12 L0 12 Z" fill={bgColor} />
              </svg>
            )}
          </div>
        );
      })}

      {/* Optional Add Tab Action */}
      {onAddTab && (
        <button
          type="button"
          onClick={onAddTab}
          className="mb-1 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          title="Open new chat tab"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}

