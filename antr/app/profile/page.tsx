"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import {
  getUserProfile,
  clearUserProfile,
  syncUserProfile,
  saveUserProfile,
  uploadAvatarImage,
  formatStudentYear,
  UserProfile,
} from "../lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      let data = getUserProfile();
      if (!data) {
        data = await syncUserProfile();
      }
      if (!isMounted) return;
      if (!data || !data.anonymousName || data.anonymousName.startsWith("Guest_")) {
        router.replace("/authentication");
        return;
      }
      setProfile(data);
      setLoaded(true);
    };

    load();

    const handleUpdate = () => {
      setProfile(getUserProfile());
    };

    window.addEventListener("annoyms_profile_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("annoyms_profile_updated", handleUpdate);
    };
  }, []);

  const handleCopyEmail = () => {
    if (!profile?.email) return;
    navigator.clipboard.writeText(profile.email);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleStealth = () => {
    if (!profile) return;
    const updated = saveUserProfile({
      ...profile,
      anonymousName: profile.anonymousName,
      stealthMode: !profile.stealthMode,
    });
    setProfile(updated);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");
      const url = await uploadAvatarImage(file, profile.email);
      const updated = saveUserProfile({
        ...profile,
        anonymousName: profile.anonymousName,
        avatarUrl: url,
      });
      setProfile(updated);

      // Sync avatar to backend user record
      if (profile.email) {
        fetch("http://localhost:8080/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: profile.email,
            username: profile.anonymousName,
            anonymousName: profile.anonymousName,
            avatarUrl: url,
            gender: profile.gender || null,
            tag: profile.hobbies?.join(",") || null,
          }),
        }).catch((e) => console.warn("Backend profile sync skipped:", e));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSignOut = () => {
    clearUserProfile();
    router.push("/authentication");
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between py-12 px-4">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="h-6 w-32 bg-zinc-900 rounded-lg animate-pulse" />
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-48 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-full bg-zinc-800/40 rounded-xl animate-pulse" />
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between pt-10 pb-28 px-4">
      {/* Hidden file input for photo upload */}

      <div className="max-w-lg w-full mx-auto space-y-6">
        {/* Simple Page Header */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <h1 className="text-xl font-semibold tracking-tight text-emerald-600 profilepg absolute"
            style={{ textShadow: "0 0 20px #10B981" }}>Profile</h1>
            <h1 className="text-xl font-semibold tracking-tight text-white profilepg translate-x-1 translate-y-1">Profile</h1>
          </div>
          
        </div>

        {profile ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm p-6 space-y-6 shadow-xl">
            {/* User Identity Header */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/80 flex items-center justify-center">
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  ) : profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.anonymousName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-zinc-200">
                      {profile.anonymousName?.slice(0, 2).toUpperCase() || "AN"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                    {profile.anonymousName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shadow-sm">
                    {formatStudentYear(
                      profile.studentYear ||
                        (profile.admissionYear ? new Date().getFullYear() - profile.admissionYear + 1 : 1)
                    )}
                  </span>
                </div>
                {profile.admissionYear && (
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Class of {profile.admissionYear + 4}
                  </p>
                )}
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                {uploadError}
              </p>
            )}

            {/* Bio Section */}
            {profile.bio && (
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  About
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Tags / Specializations */}
            <div className="pt-2 border-t border-zinc-800/60">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.hobbies && profile.hobbies.length > 0 ? (
                  profile.hobbies.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No tags selected</span>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/60 text-xs">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Current Year
                </span>
                <span className="text-emerald-400 font-semibold font-mono">
                  {formatStudentYear(
                    profile.studentYear ||
                      (profile.admissionYear ? new Date().getFullYear() - profile.admissionYear + 1 : 1)
                  )}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Gender
                </span>
                <span className="text-zinc-200">{profile.gender || "Not specified"}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Member Since
                </span>
                <span className="text-zinc-300 font-mono">
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>


            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/onboarding"
                className="flex-1 text-center py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Edit Profile
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-center py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Empty / Guest State */
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">No Profile Found</h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                You haven&apos;t set up an anonymous persona yet. Set up your profile to start chatting.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/onboarding"
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors cursor-pointer shadow-sm"
              >
                Set Up Profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
