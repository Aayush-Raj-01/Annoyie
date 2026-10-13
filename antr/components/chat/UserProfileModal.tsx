"use client";

import React, { useEffect, useState, useCallback } from "react";
import UserAvatar from "./UserAvatar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface UserProfile {
  id: number;
  username: string;
  avatarUrl?: string;
  tag?: string;
  studentYear?: number;
  gender?: string;
  bio?: string;
}

interface UserProfileModalProps {
  userId: number | null;
  onClose: () => void;
  onMessage?: (userId: number) => void;
}

function formatYear(year?: number): string {
  if (!year) return "Unknown";
  const suffixes: Record<number, string> = { 1: "st", 2: "nd", 3: "rd", 4: "th" };
  return `${year}${suffixes[year] ?? "th"} Year`;
}

const TAG_ICONS: Record<string, string> = {
  Coder: "💻",
  Bookworm: "🧠",
  Creative: "🎨",
  Sports: "🏃",
};

export default function UserProfileModal({ userId, onClose, onMessage }: UserProfileModalProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchUser = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setUser({
        id: Number(data.id),
        username: data.username || data.name || "Anonymous",
        avatarUrl: data.avatarUrl || undefined,
        tag: data.tag || undefined,
        studentYear: data.studentYear ?? undefined,
        gender: data.gender || undefined,
        bio: data.bio || undefined,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Animate in when userId changes
  useEffect(() => {
    if (userId !== null) {
      setUser(null);
      setVisible(false);
      fetchUser(userId);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [userId, fetchUser]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (userId === null) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm transition-all duration-300 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="m-3 rounded-2xl bg-[#0d0f16] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">

          {/* Gradient accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-emerald-500/60 via-teal-400/40 to-transparent" />

          {/* Close pill */}
          <div className="flex justify-center pt-3 pb-1">
            <button
              onClick={onClose}
              className="w-10 h-1 rounded-full bg-zinc-700 hover:bg-zinc-500 transition-colors cursor-pointer"
            />
          </div>

          <div className="px-5 pb-5 pt-2">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
                <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
                <div className="h-2 w-20 rounded bg-zinc-800 animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Avatar + name */}
                <div className="flex flex-col items-center gap-3 pb-4">
                  <div className="relative">
                    <UserAvatar src={user.avatarUrl} name={user.username} size="xl" />
                    {user.studentYear && (
                      <span className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold leading-none">
                        Y{user.studentYear}
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      @{user.username}
                    </h2>
                    {user.studentYear && (
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{formatYear(user.studentYear)}</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06] mb-4" />

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {/* Tag/Specialization */}
                  {user.tag && (
                    <div className="col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                      <span className="text-xl">{TAG_ICONS[user.tag] ?? "🎓"}</span>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Specialization</p>
                        <p className="text-sm font-semibold text-zinc-100">{user.tag}</p>
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {user.gender && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                      <span className="text-lg">{user.gender === "Male" ? "♂" : user.gender === "Female" ? "♀" : "⚧"}</span>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Gender</p>
                        <p className="text-xs font-semibold text-zinc-200">{user.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Year standalone if no gender */}
                  {user.studentYear && !user.gender && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Year</p>
                        <p className="text-xs font-semibold text-zinc-200">{formatYear(user.studentYear)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="mb-4 p-3 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {/* CTA */}
                {onMessage && (
                  <button
                    onClick={() => {
                      onMessage(user.id);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_28px_rgba(16,185,129,0.3)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Send Message</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-zinc-500">
                <span className="text-3xl">👤</span>
                <p className="text-xs">Could not load profile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
