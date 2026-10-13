"use client";

import React, { useEffect } from "react";

export type ConfirmVariant = "danger" | "warning" | "info" | "default";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={!isLoading ? onClose : undefined}
    >
      {/* Outer Shell with double-bezel aesthetic */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl p-1 bg-gradient-to-b from-white/15 via-white/[0.05] to-transparent border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.85)] z-10 animate-scaleUp"
      >
        {/* Inner Core */}
        <div className="rounded-[calc(1.5rem-2px)] bg-zinc-950/95 p-6 flex flex-col items-center text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          {/* Variant Icon Badge */}
          {isDanger && (
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(244,63,94,0.18)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
          )}

          {isWarning && (
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(245,158,11,0.18)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}

          {!isDanger && !isWarning && (
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(99,102,241,0.18)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {/* Heading */}
          <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>

          {/* Description */}
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-[280px]">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60"
                  : isWarning
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/60"
                  : "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
