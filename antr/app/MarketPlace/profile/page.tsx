"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile, uploadAvatarImage, UserProfile } from "@/app/lib/auth";
import {
  MarketplaceProfile,
  fetchMarketplaceProfile,
  createMarketplaceProfile,
  updateMarketplaceProfile,
  checkMarketplaceDisplayName,
} from "@/lib/api/marketplace";

export default function MarketplaceProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Marketplace profile state
  const [marketProfile, setMarketProfile] = useState<MarketplaceProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Edit / Create Form states
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string>("");

  // Validation & status states
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // 1. Initial Load: Auth and Marketplace Profile
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        let user = getUserProfile();
        if (!user || !user.id) {
          user = await syncUserProfile();
        }

        if (!isMounted) return;

        if (!user || !user.anonymousName || user.anonymousName.startsWith("Guest_")) {
          router.replace("/authentication");
          return;
        }

        setCurrentUser(user);
        setIsLoadingAuth(false);

        // Fetch marketplace profile for this user ID
        if (user.id) {
          const profile = await fetchMarketplaceProfile(user.id);
          if (isMounted) {
            setMarketProfile(profile);
            if (profile) {
              setDisplayName(profile.displayName || "");
              setPhoneNumber(profile.phoneNumber || "");
              setBio(profile.bio || "");
              setProfileImage(profile.profileImage || "");
            } else {
              // Pre-fill suggested display name based on user name
              setDisplayName(`${user.anonymousName.replace(/[^a-zA-Z0-9]/g, "")}_Store`);
            }
          }
        }
      } catch (err) {
        console.error("Error loading marketplace profile page:", err);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Real-time name availability checker debounce
  useEffect(() => {
    if (!displayName || displayName.trim().length < 3) {
      setNameAvailable(null);
      return;
    }

    // If currently editing and the name hasn't changed from existing profile
    if (marketProfile && displayName.trim().toLowerCase() === marketProfile.displayName.trim().toLowerCase()) {
      setNameAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingName(true);
      try {
        const available = await checkMarketplaceDisplayName(displayName.trim());
        setNameAvailable(available);
      } catch {
        setNameAvailable(null);
      } finally {
        setIsCheckingName(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [displayName, marketProfile]);

  // 3. Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Profile image must be under 5MB");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setFormError("");
      const uploadedUrl = await uploadAvatarImage(file, currentUser?.email);
      setProfileImage(uploadedUrl);

      // If user already has a saved profile, persist photo immediately
      if (marketProfile && currentUser?.id) {
        const updated = await updateMarketplaceProfile(currentUser.id, {
          displayName: marketProfile.displayName,
          bio: marketProfile.bio || undefined,
          phoneNumber: marketProfile.phoneNumber || undefined,
          profileImage: uploadedUrl,
        });
        setMarketProfile(updated);
        setSaveSuccessMsg("Marketplace photo updated");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo";
      setFormError(msg);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. Save (Create or Update) Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      setFormError("User account not found. Please log in again.");
      return;
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length < 3) {
      setFormError("Display name must be at least 3 characters");
      return;
    }

    if (nameAvailable === false) {
      setFormError("This display name is already taken by another campus seller.");
      return;
    }

    // Phone number is completely optional. Only validate format if user entered something.
    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone.length > 0 && !/^[0-9+\s-]{7,15}$/.test(trimmedPhone)) {
      setFormError("Please enter a valid phone number (e.g. +91 9876543210) or leave it blank.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      if (marketProfile) {
        // Update existing profile
        const updated = await updateMarketplaceProfile(currentUser.id, {
          displayName: trimmedName,
          bio: bio.trim(),
          phoneNumber: trimmedPhone || undefined,
          profileImage: profileImage || undefined,
        });
        setMarketProfile(updated);
        setIsEditing(false);
        setSaveSuccessMsg("Marketplace profile updated successfully!");
      } else {
        // Create new profile
        const created = await createMarketplaceProfile(currentUser.id, {
          displayName: trimmedName,
          bio: bio.trim(),
          phoneNumber: trimmedPhone || undefined,
          profileImage: profileImage || undefined,
        });
        setMarketProfile(created);
        setIsEditing(false);
        setSaveSuccessMsg("Marketplace seller profile created!");
      }
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const copyPhoneNumber = () => {
    if (!marketProfile?.phoneNumber) return;
    navigator.clipboard.writeText(marketProfile.phoneNumber);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Loading skeleton
  if (isLoadingAuth || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between py-12 px-4 selection:bg-emerald-500/30">
        <div className="max-w-2xl w-full mx-auto space-y-6 pt-6">
          <div className="h-6 w-40 bg-zinc-900 rounded-full animate-pulse" />
          <div className="p-2 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-4">
            <div className="h-36 rounded-[1.75rem] bg-zinc-900/60 animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-6 w-1/3 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-24 w-full bg-zinc-800/30 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between pt-8 pb-28 px-4 selection:bg-emerald-500/30">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Top Dual-Persona Navigation Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold tracking-[0.2em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                Campus Marketplace
              </span>
              <span className="text-zinc-600 font-mono text-xs">•</span>
              <span className="text-xs font-mono text-zinc-400">Seller Profile</span>
            </div>

            {/* Persona Switcher Quick Bar */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/80 border border-white/[0.08] backdrop-blur-md">
              <Link
                href="/profile"
                className="px-3 py-1 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-1.5"
                title="Go to Anonymous Chat Profile"
              >
                <span>🎭</span>
                <span>Chat Persona</span>
              </Link>
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center gap-1.5">
                <span>🏪</span>
                <span>Marketplace</span>
              </div>
            </div>
          </div>

          {/* Persona Clarification Callout */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] flex items-start gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 text-sm mt-0.5">
              💡
            </div>
            <div className="text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-white">Separate Marketplace Profile:</span> While your chat handle is
              anonymous, this profile represents your campus seller identity for listing items and interacting with buyers safely.
            </div>
          </div>
        </div>

        {/* Feedback message alerts */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-form-switch shadow-[0_0_24px_rgba(16,185,129,0.12)]">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMsg("")}
              className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {formError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between animate-form-switch">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formError}</span>
            </div>
            <button
              onClick={() => setFormError("")}
              className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* CASE 1: USER HAS NOT CREATED A MARKETPLACE PROFILE YET */}
        {!marketProfile && !isEditing ? (
          <div className="p-2 rounded-[2.25rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
            <div className="p-6 sm:p-8 rounded-[calc(2.25rem-0.5rem)] bg-[#0c0c0e]/95 space-y-8 backdrop-blur-2xl">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600/30 via-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  🏪
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Create Marketplace Profile
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Start buying and selling with verified students at your university. Set up your public seller handle,
                  optional WhatsApp number, and bio.
                </p>
              </div>

              {/* Create Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-6 pt-2">
                {/* Photo Upload Row */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06]">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-600 hover:border-emerald-500/60 flex items-center justify-center cursor-pointer transition-colors relative group shrink-0"
                  >
                    {isUploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-lg">📷</span>
                        <span className="block text-[9px] text-zinc-400 font-mono">Upload</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">Storefront Avatar (Optional)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Upload a friendly photo or shop logo (PNG, JPG under 5MB).
                    </div>
                  </div>
                </div>

                {/* Display Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Seller Display Name <span className="text-emerald-400">*</span>
                    </label>
                    {isCheckingName && (
                      <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Checking...
                      </span>
                    )}
                    {!isCheckingName && nameAvailable === true && (
                      <span className="text-[11px] text-emerald-400 font-mono font-medium">✓ Available</span>
                    )}
                    {!isCheckingName && nameAvailable === false && (
                      <span className="text-[11px] text-rose-400 font-mono font-medium">✗ Name taken</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Arjun_Hostel3 or CampusBookDen"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Your public handle on marketplace listings. Must be unique.
                  </p>
                </div>

                {/* Phone Number Field - NOT MANDATORY */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Phone / WhatsApp Number <span className="text-zinc-500 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Not mandatory</span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210 (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Optional. Add a number if you wish buyers to message you directly on WhatsApp.
                  </p>
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Seller Bio (Optional)</label>
                    <span className="text-[10px] font-mono text-zinc-500">{bio.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. 4th Year Mechanical. Selling textbooks, notes, and gym gear. Pickups near Hostel 7."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-zinc-500 text-xs sm:text-sm outline-none transition-all resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSaving || isCheckingName || nameAvailable === false}
                  className="w-full group relative overflow-hidden py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs sm:text-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99]"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Activate Profile</span>
                      <div className="w-6 h-6 rounded-full bg-zinc-950/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* CASE 2: USER HAS A MARKETPLACE PROFILE */}
        {marketProfile && !isEditing ? (
          <div className="space-y-6">
            {/* Doppelrand Machined Profile Card */}
            <div className="p-2 rounded-[2.25rem] bg-gradient-to-b from-white/[0.09] to-white/[0.02] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              <div className="rounded-[calc(2.25rem-0.5rem)] bg-[#0c0c0e]/95 overflow-hidden backdrop-blur-2xl">
                {/* Visual Banner */}
                <div className="h-32 sm:h-36 relative bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/40 border-b border-white/[0.08] overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                {/* Profile Core Content */}
                <div className="px-6 sm:px-8 pb-8 pt-0 relative space-y-6">
                  {/* Avatar & Action Row */}
                  <div className="flex items-end justify-between -mt-14 sm:-mt-16 gap-4 flex-wrap">
                    {/* Double-bezel Avatar Frame */}
                    <div className="relative group">
                      <div className="p-1.5 rounded-[1.75rem] bg-zinc-950 border border-white/15 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[calc(1.75rem-0.375rem)] overflow-hidden bg-zinc-900 flex items-center justify-center relative">
                          {isUploadingPhoto ? (
                            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          ) : marketProfile.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={marketProfile.profileImage}
                              alt={marketProfile.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl font-bold text-emerald-400 font-mono">
                              {marketProfile.displayName.slice(0, 2).toUpperCase()}
                            </span>
                          )}

                          {/* Quick Photo Change Overlay */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Update Profile Photo"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono cursor-pointer"
                          >
                            <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                              />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Change</span>
                          </button>
                        </div>
                      </div>

                      {/* Verified Badge Icon */}
                      <div
                        className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-bold text-xs shadow-md"
                        title="Verified Campus Student"
                      >
                        ✓
                      </div>
                    </div>

                    {/* Edit Profile Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayName(marketProfile.displayName);
                        setPhoneNumber(marketProfile.phoneNumber || "");
                        setBio(marketProfile.bio || "");
                        setProfileImage(marketProfile.profileImage || "");
                        setIsEditing(true);
                      }}
                      className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  {/* Primary Info Block */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        {marketProfile.displayName}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        <span>●</span> Active Seller
                      </span>
                    </div>

                    {/* Verified Campus Email Reference */}
                    <div className="text-xs text-zinc-400 flex items-center gap-2 font-mono">
                      <span>🎓 Verified Student</span>
                      {currentUser?.email && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-500">{currentUser.email.split("@")[1] || "campus"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {marketProfile.bio ? (
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {marketProfile.bio}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 text-xs text-zinc-500 italic">
                      No seller bio provided yet. Click &quot;Edit Profile&quot; to add a short note about your items or hostel.
                    </div>
                  )}

                  {/* Phone & Contact Channel (NOT MANDATORY) */}
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        Direct Buyer Contact
                      </div>
                      <div className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                        <span>📞</span>
                        {marketProfile.phoneNumber ? (
                          <span>{marketProfile.phoneNumber}</span>
                        ) : (
                          <span className="text-xs text-zinc-500 font-sans italic">Not provided (Optional)</span>
                        )}
                      </div>
                    </div>

                    {marketProfile.phoneNumber ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={copyPhoneNumber}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                          <span>{copiedPhone ? "Copied!" : "Copy"}</span>
                        </button>

                        <a
                          href={`https://wa.me/${marketProfile.phoneNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <span>💬 WhatsApp</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayName(marketProfile.displayName);
                          setPhoneNumber("");
                          setBio(marketProfile.bio || "");
                          setProfileImage(marketProfile.profileImage || "");
                          setIsEditing(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        + Add Phone
                      </button>
                    )}
                  </div>

                  {/* Marketplace DMs / Inquiries Card */}

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-teal-950/20 border border-emerald-500/20 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg text-emerald-400 shrink-0">
                        💬
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Marketplace DMs & Inquiries</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Separate from Chat
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Direct private messages between campus buyers & sellers for price negotiations
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/marketplace/messages"
                      className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      Open DMs →
                    </Link>
                  </div>

                  {/* Campus Seller Reputation Matrix */}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/[0.04] text-center">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">Trust Score</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">100%</div>
                      <div className="text-[9px] text-zinc-500">Verified Campus ID</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/[0.04] text-center">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">Response</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">&lt; 15m</div>
                      <div className="text-[9px] text-zinc-500">In-campus</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/[0.04] text-center">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">Handover</div>
                      <div className="text-base font-bold text-teal-300 font-mono mt-0.5">Campus</div>
                      <div className="text-[9px] text-zinc-500">In-person safety</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/[0.04] text-center">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">Profile Status</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">Active</div>
                      <div className="text-[9px] text-zinc-500">Live on Market</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Listings Section */}
            <div className="p-6 rounded-[2rem] bg-zinc-900/40 border border-white/[0.06] space-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Your Marketplace Listings</h3>
                  <p className="text-xs text-zinc-400">Items you have currently posted for campus buyers</p>
                </div>

                <Link
                  href="/marketplace"
                  className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <span>Browse Market</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Empty state for listings */}
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-xl">
                  📦
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">No active listings yet</div>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Got old textbooks, cycle, calculator, or essentials to sell? Post items directly to your campus market.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-xs font-semibold text-white transition-colors"
                  >
                    <span>+ Post an Item</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* CASE 3: EDIT PROFILE MODAL / FORM */}
        {isEditing && marketProfile ? (
          <div className="p-2 rounded-[2.25rem] bg-gradient-to-b from-white/[0.09] to-white/[0.02] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-form-switch">
            <div className="p-6 sm:p-8 rounded-[calc(2.25rem-0.5rem)] bg-[#0c0c0e]/95 space-y-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Marketplace Profile</h2>
                  <p className="text-xs text-zinc-400">Update your seller handle, optional phone number, and bio</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-mono cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Photo Preview & Change */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06]">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-600 hover:border-emerald-500/60 flex items-center justify-center cursor-pointer transition-colors relative shrink-0"
                  >
                    {isUploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-zinc-500 font-mono">
                        {displayName.slice(0, 2).toUpperCase() || "MP"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Change storefront photo
                    </button>
                    <p className="text-[11px] text-zinc-400 mt-0.5">JPG or PNG under 5MB</p>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Display Name <span className="text-emerald-400">*</span></label>
                    {isCheckingName && (
                      <span className="text-[11px] text-zinc-400 font-mono">Checking availability...</span>
                    )}
                    {!isCheckingName && nameAvailable === true && (
                      <span className="text-[11px] text-emerald-400 font-mono font-medium">✓ Available</span>
                    )}
                    {!isCheckingName && nameAvailable === false && (
                      <span className="text-[11px] text-rose-400 font-mono font-medium">✗ Already in use</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 text-white text-xs sm:text-sm font-medium outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Phone - OPTIONAL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Phone / WhatsApp Number <span className="text-zinc-500 font-normal">(Optional)</span></label>
                    <span className="text-[10px] text-zinc-500 font-mono">Not mandatory</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210 (optional)"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 text-white text-xs sm:text-sm font-mono outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Leave blank if you do not want to provide a phone number.
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Seller Bio (Optional)</label>
                    <span className="text-[10px] font-mono text-zinc-500">{bio.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 text-white text-xs sm:text-sm outline-none transition-all resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Button Row */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 px-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isCheckingName || nameAvailable === false}
                    className="flex-1 py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      <Navbar />
    </div>
  );
}
