"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PinterestBackground from "@/components/ui/PinterestBackground";
import { getUserProfile, clearUserProfile, UserProfile, syncUserProfile } from "@/app/lib/auth";

export default function BlockedAccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [isChecking, setIsChecking] = useState(false);

  // Poll once to verify if administrator unblocked the account
  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const refreshed = await syncUserProfile();
      if (refreshed && !refreshed.blocked) {
        localStorage.removeItem("annoyms_is_blocked");
        router.replace("/");
        return;
      }
    } catch (err) {
      console.warn("Status check failed:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("annoyms_is_blocked");
    clearUserProfile();
    router.replace("/authentication");
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-rose-500/30">
      {/* Background Ambience */}
      <PinterestBackground variant="dots" />

      {/* Subtle crimson radial gradient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Tag */}
      <header className="relative z-10 flex items-center justify-between max-w-lg w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold flex items-center justify-center text-xs font-mono">
            ⛔
          </span>
          <span className="font-bold text-sm tracking-tight text-white">
            Annoyoi <span className="text-zinc-500">/IMSEC</span>
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
          Suspended
        </span>
      </header>

      {/* Main Blocked Card */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-8">
        <div className="p-6 sm:p-9 rounded-[2rem] bg-[#0e0f16]/90 border border-rose-500/20 shadow-[0_24px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-6 text-center">
          {/* Animated Lock Shield Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping opacity-25" />
            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-rose-500/20 to-zinc-900 border border-rose-500/40 flex items-center justify-center text-3xl shadow-xl shadow-rose-950/50">
              🚫
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Account Suspended
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Your account has been blocked by the platform administrator for violating campus peer safety policies.
            </p>
          </div>

          {/* Account Details Panel */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-zinc-500 font-mono">ACCOUNT</span>
              <span className="text-white font-semibold font-mono">
                @{profile?.anonymousName || "campus_user"}
              </span>
            </div>

            {profile?.email && (
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 font-mono">EMAIL</span>
                <span className="text-zinc-300 font-mono text-[11px] truncate max-w-[220px]">
                  {profile.email}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-zinc-500 font-mono">RESTRICTION</span>
              <span className="text-rose-400 font-medium">Full Campus Platform Ban</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-mono">REASON</span>
              <span className="text-zinc-400 text-[11px]">Admin moderation enforcement</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full py-3 rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-50"
            >
              {isChecking ? "Checking Account Status..." : "↻ Check If Unblocked"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`mailto:dwx1110804@gmail.com?subject=${encodeURIComponent(
                  `[Annoyoi Account Appeal] @${profile?.anonymousName || "User"}`
                )}&body=${encodeURIComponent(
                  `Hello Admin,\n\nI am requesting a review of my account suspension on Annoyoi /IMSEC.\n\nUsername: @${
                    profile?.anonymousName || ""
                  }\nEmail: ${profile?.email || ""}\n\nReason for appeal:\n`
                )}`}
                className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>✉ Appeal Ban</span>
              </a>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Switch Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-center text-[11px] text-zinc-600 font-mono max-w-lg mx-auto">
        IMS Engineering College • Verified Peer Network Trust &amp; Safety
      </footer>
    </div>
  );
}
