"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { getUserProfile, clearUserProfile, UserProfile } from "../lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = getUserProfile();
    setProfile(data);
    setLoaded(true);

    const handleUpdate = () => {
      setProfile(getUserProfile());
    };
    window.addEventListener("annoyms_profile_updated", handleUpdate);
    return () => window.removeEventListener("annoyms_profile_updated", handleUpdate);
  }, []);

  const handleSignOut = () => {
    clearUserProfile();
    router.push("/authentication");
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading persona...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 pt-10 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">User Profile</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {profile ? "Anonymous Identity Active" : "Guest"}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-1 font-medium"
              title="Sign Out"
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        </div>

        {profile ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur p-6 shadow-xl space-y-6">
            {/* Persona Avatar & Handle */}
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 font-bold text-white">
                🎭
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                  Anonymous Persona
                </span>
                <h2 className="text-xl font-bold truncate text-white">
                  {profile.anonymousName}
                </h2>
                <p className="text-xs text-zinc-500 truncate font-mono mt-0.5">
                  Private ID: {profile.email}
                </p>
              </div>
            </div>

            {/* Hobby Tags */}
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                Hobby & Specialization
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies && profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                    >
                      <span>{hobby === "Coder" ? "💻" : "☕"}</span>
                      {hobby}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No tags selected</span>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                Gender
              </span>
              <p className="text-sm font-medium text-zinc-200">
                {profile.gender ? profile.gender : (
                  <span className="text-zinc-500 italic">Not specified (Hidden)</span>
                )}
              </p>
            </div>

            {/* Member Since */}
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                Created
              </span>
              <p className="text-xs text-zinc-400 font-mono">
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <Link
                href="/onboarding"
                className="flex-1 text-center py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
              >
                ✏️ Edit Persona
              </Link>
              <Link
                href="/chats"
                className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-all cursor-pointer shadow-md shadow-blue-600/20"
              >
                💬 Open Chats
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-center py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚪</span> Sign Out of Account
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-4">
            <div className="text-4xl mb-2">🕶️</div>
            <h2 className="text-lg font-semibold">No Anonymous Persona Found</h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              You haven&apos;t set up an anonymous username or tags yet. Complete the quick onboarding to start!
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/onboarding"
                className="py-2.5 px-4 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-all cursor-pointer"
              >
                Setup Persona
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
