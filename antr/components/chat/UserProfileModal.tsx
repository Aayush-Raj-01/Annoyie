"use client";

import React, { useEffect, useState, useCallback } from "react";
import UserAvatar from "./UserAvatar";
import { useChatStore } from "@/store/chatStore";
import { apiUrl } from "@/lib/config/api";

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

  const openDm = useChatStore((state) => state.openDm);
  const currentUserId = useChatStore((state) => state.currentUserId);

  const fetchUser = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/users/${id}`), { cache: "no-store" });
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

  const isMe = Boolean(currentUserId && user && Number(currentUserId) === Number(user.id));

  const handleOpenDm = () => {
    if (!user) return;
    if (onMessage) {
      onMessage(user.id);
    } else {
      openDm({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        tag: user.tag,
        studentYear: user.studentYear,
      });
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className={`w-full max-w-sm rounded-3xl bg-[#0d0f16]/98 border border-white/10 shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden pointer-events-auto transform transition-all duration-200 ease-out ${
            visible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-3"
          }`}
        >
          {/* Top Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Header Bar with Title and Close Button */}
          <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              User Profile
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
              title="Close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-5 pb-5 pt-2">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-28 rounded bg-zinc-800 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-zinc-800 animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Avatar + name */}
                <div className="flex flex-col items-center gap-3 pb-3">
                  <div className="relative">
                    <UserAvatar src={user.avatarUrl} name={user.username} size="xl" />
                    {user.studentYear && (
                      <span className="absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold leading-none shadow-md">
                        Yr {user.studentYear}
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
                <div className="border-t border-white/[0.06] mb-3" />

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Tag/Specialization */}
                  {user.tag && (
                    <div className="col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                      <span className="text-xl">{TAG_ICONS[user.tag] ?? "🎓"}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Specialization</p>
                        <p className="text-xs font-semibold text-zinc-100 truncate">{user.tag}</p>
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {user.gender && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                      <span className="text-lg">{user.gender === "Male" ? "♂" : user.gender === "Female" ? "♀" : "⚧"}</span>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Gender</p>
                        <p className="text-xs font-semibold text-zinc-200">{user.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Year standalone if no gender */}
                  {user.studentYear && !user.gender && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
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
                  <div className="mb-3 p-2.5 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Bio</p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {/* Direct Message Action CTA */}
                {!isMe && (
                  <button
                    onClick={handleOpenDm}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_28px_rgba(16,185,129,0.35)] cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <svg className="w-4 h-4 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.4}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>Send Direct Message</span>
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
