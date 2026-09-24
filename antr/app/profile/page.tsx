"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { getUserProfile, clearUserProfile, syncUserProfile, UserProfile } from "../lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      let data = getUserProfile();
      if (!data) {
        data = await syncUserProfile();
      }
      if (!isMounted) return;
      setProfile(data);
      setLoaded(true);
    };

    loadProfile();

    const handleUpdate = () => {
      setProfile(getUserProfile());
    };
    window.addEventListener("annoyms_profile_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("annoyms_profile_updated", handleUpdate);
    };
  }, []);

  const handleSignOut = () => {
    clearUserProfile();
    router.push("/authentication");
  };

  // Skeleton Loader while profile data is fetching
  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 pt-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-zinc-800/60 rounded-lg animate-pulse" />
            <div className="h-6 w-24 bg-zinc-800/60 rounded-full animate-pulse" />
          </div>

          {/* Profile Card Skeleton */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-48 bg-zinc-800/70 rounded animate-pulse" />
              </div>
            </div>

            {/* Tags Skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-28 bg-zinc-800/70 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-7 w-24 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Details Skeleton */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-zinc-800/70 rounded animate-pulse" />
                <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-zinc-800/70 rounded animate-pulse" />
                <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="pt-4 flex gap-3">
              <div className="flex-1 h-10 bg-zinc-800 rounded-xl animate-pulse" />
              <div className="flex-1 h-10 bg-zinc-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 pt-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">User Profile</h1>
            <p className="text-xs text-zinc-400">Manage your anonymous identity</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {profile ? "Online" : "Guest"}
          </span>
        </div>

        {profile ? (
          /* Profile Card Skeleton & Layout */
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-7 shadow-xl space-y-6">
            {/* Identity Info Header */}
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 shrink-0 overflow-hidden">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.anonymousName || "Profile Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>🎭</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400">
                  Anonymous Persona
                </span>
                <h2 className="text-xl font-bold text-white truncate">
                  {profile.anonymousName}
                </h2>
                <p className="text-xs text-zinc-400 truncate font-mono mt-0.5">
                  Private ID: {profile.email}
                </p>
              </div>
            </div>

            {/* Specialization Tags */}
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                Specialization & Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies && profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium"
                    >
                      <span>{hobby === "Coder" ? "💻" : "☕"}</span>
                      <span>{hobby}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No tags selected</span>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/60 pt-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Gender
                </span>
                <p className="text-sm font-medium text-zinc-200">
                  {profile.gender ? profile.gender : (
                    <span className="text-zinc-500 italic">Not specified</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Member Since
                </span>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
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
          /* Empty / Guest State */
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-4">
            <div className="text-4xl mb-2">🕶️</div>
            <h2 className="text-lg font-semibold text-white">No Anonymous Persona Found</h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              You haven&apos;t set up an anonymous persona yet. Set up your persona to start chatting.
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
