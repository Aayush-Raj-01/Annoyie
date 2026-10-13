"use client";

import React, { useEffect } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastNotificationProps {
  message: string | null;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

export default function ToastNotification({
  message,
  variant = "success",
  duration = 3200,
  onClose,
}: ToastNotificationProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = variant === "success";
  const isError = variant === "error";
  const isWarning = variant === "warning";

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-24 sm:bottom-8 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-8 z-[110] max-w-[90vw] sm:max-w-md animate-fadeIn"
    >
      <div
        className={`px-4 py-2.5 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center gap-3 transition-all ${
          isSuccess
            ? "bg-zinc-950/90 border-emerald-500/20 text-zinc-200 shadow-emerald-950/20"
            : isError
            ? "bg-zinc-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/30"
            : isWarning
            ? "bg-zinc-950/90 border-amber-500/30 text-amber-200 shadow-amber-950/20"
            : "bg-zinc-950/90 border-white/10 text-zinc-200 shadow-black/50"
        }`}
      >
        {/* State Indicator */}
        {isSuccess && (
          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {isError && (
          <div className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        {isWarning && (
          <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
        )}

        {!isSuccess && !isError && !isWarning && (
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
        )}

        {/* Message */}
        <p className="text-xs font-medium tracking-tight pr-1 break-words">
          {message}
        </p>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto w-5 h-5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
