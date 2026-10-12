"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile, UserProfile } from "@/app/lib/auth";
import PostItemModal from "@/components/marketplace/PostItemModal";
import ListingMediaGallery from "@/components/marketplace/ListingMediaGallery";
import ImageZoomModal from "@/components/marketplace/ImageZoomModal";
import ProfileHeaderNavigation from "@/components/profile/ProfileHeaderNavigation";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  MarketplaceProfile,
  fetchMarketplaceProfile,
  createMarketplaceProfile,
  updateMarketplaceProfile,
  checkMarketplaceDisplayName,
  fetchUserMarketplaceListings,
  deleteMarketplaceListing,
  MarketplaceListing,
  subscribeMarketplaceListingChange,
  notifyMarketplaceListingChange,
  uploadMarketplaceMedia,
  getCachedMarketplaceProfile,
  subscribeMarketplaceProfileChange,
} from "@/lib/api/marketplace";

export default function MarketplaceProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getUserProfile());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Marketplace profile state
  const [marketProfile, setMarketProfile] = useState<MarketplaceProfile | null>(() => {
    const user = getUserProfile();
    return getCachedMarketplaceProfile(user?.id);
  });
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(() => {
    const user = getUserProfile();
    const cached = getCachedMarketplaceProfile(user?.id);
    return !cached;
  });

  // User's active listings state
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState<number | null>(null);
  const [isAvatarZoomOpen, setIsAvatarZoomOpen] = useState(false);

  // Edit / Create Form states
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    const user = getUserProfile();
    const cached = getCachedMarketplaceProfile(user?.id);
    return cached?.displayName || "";
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    const user = getUserProfile();
    const cached = getCachedMarketplaceProfile(user?.id);
    return cached?.phoneNumber || "";
  });
  const [bio, setBio] = useState(() => {
    const user = getUserProfile();
    const cached = getCachedMarketplaceProfile(user?.id);
    return cached?.bio || "";
  });
  const [profileImage, setProfileImage] = useState<string>(() => {
    const user = getUserProfile();
    const cached = getCachedMarketplaceProfile(user?.id);
    return cached?.profileImage || "";
  });

  // Validation & status states
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Synchronize profile changes across tabs
  useEffect(() => {
    const unsub = subscribeMarketplaceProfileChange((p) => {
      if (p) {
        setMarketProfile(p);
        setDisplayName(p.displayName || "");
        setPhoneNumber(p.phoneNumber || "");
        setBio(p.bio || "");
        setProfileImage(p.profileImage || "");
      }
    });
    return unsub;
  }, []);

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
          // Check cached profile first
          const cached = getCachedMarketplaceProfile(user.id);
          if (cached && isMounted) {
            setMarketProfile(cached);
            setDisplayName(cached.displayName || "");
            setPhoneNumber(cached.phoneNumber || "");
            setBio(cached.bio || "");
            setProfileImage(cached.profileImage || "");
            setIsLoadingProfile(false);
          }

          const profile = await fetchMarketplaceProfile(user.id);
          if (isMounted) {
            setMarketProfile(profile);
            if (profile) {
              setDisplayName(profile.displayName || "");
              setPhoneNumber(profile.phoneNumber || "");
              setBio(profile.bio || "");
              setProfileImage(profile.profileImage || "");
            } else {
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

  // Load seller's active listings
  useEffect(() => {
    const uid = currentUser?.id;
    if (typeof uid !== "number") return;
    let isMounted = true;

    async function loadUserListings(targetUserId: number) {
      setIsLoadingListings(true);
      try {
        const items = await fetchUserMarketplaceListings(targetUserId);
        if (isMounted) {
          setUserListings(items);
        }
      } catch (err) {
        console.warn("Failed to load user marketplace listings:", err);
      } finally {
        if (isMounted) {
          setIsLoadingListings(false);
        }
      }
    }

    loadUserListings(uid);

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Synchronize marketplace listings
  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) return;

    const unsubscribe = subscribeMarketplaceListingChange((event) => {
      if (event.type === "created") {
        if (event.listing.sellerUserId === uid) {
          setUserListings((prev) => {
            if (prev.some((item) => item.id === event.listing.id)) return prev;
            return [event.listing, ...prev];
          });
        }
      } else if (event.type === "deleted") {
        setUserListings((prev) => prev.filter((item) => item.id !== event.listingId));
      } else if (event.type === "refreshed") {
        fetchUserMarketplaceListings(uid).then((items) => {
          if (Array.isArray(items)) setUserListings(items);
        });
      }
    });

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchUserMarketplaceListings(uid).then((items) => {
          if (Array.isArray(items)) setUserListings(items);
        });
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [currentUser?.id]);

  const handleListingCreated = (newListing: MarketplaceListing) => {
    setUserListings((prev) => {
      if (prev.some((item) => item.id === newListing.id)) return prev;
      return [newListing, ...prev];
    });
    notifyMarketplaceListingChange({ type: "created", listing: newListing });
    setSaveSuccessMsg(`Item "${newListing.title}" posted successfully!`);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const handleDeleteListingClick = (listingId: number) => {
    setListingToDelete(listingId);
  };

  const handleConfirmDeleteListing = async () => {
    if (listingToDelete === null) return;
    const listingId = listingToDelete;
    const itemToDelete = userListings.find((item) => item.id === listingId);
    setDeletingListingId(listingId);

    // Optimistic UI removal
    setUserListings((prev) => prev.filter((item) => item.id !== listingId));
    setListingToDelete(null);

    const resolvedUserId = currentUser?.id || itemToDelete?.sellerUserId || marketProfile?.userId || marketProfile?.id;
    try {
      const ok = await deleteMarketplaceListing(listingId, resolvedUserId);
      if (ok) {
        setSaveSuccessMsg("Item listing deleted successfully");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
        notifyMarketplaceListingChange({ type: "deleted", listingId });
      } else {
        if (currentUser?.id) {
          const fresh = await fetchUserMarketplaceListings(currentUser.id);
          setUserListings(fresh);
        } else if (itemToDelete) {
          setUserListings((prev) => [itemToDelete, ...prev]);
        }
        setFormError("Failed to delete item listing. Please try again.");
        setTimeout(() => setFormError(""), 4000);
      }
    } catch (err) {
      console.warn("Failed to delete listing:", err);
      if (currentUser?.id) {
        const fresh = await fetchUserMarketplaceListings(currentUser.id);
        setUserListings(fresh);
      } else if (itemToDelete) {
        setUserListings((prev) => [itemToDelete, ...prev]);
      }
      setFormError("Failed to delete item listing. Please try again.");
      setTimeout(() => setFormError(""), 4000);
    } finally {
      setDeletingListingId(null);
    }
  };

  // 2. Real-time name availability checker debounce
  useEffect(() => {
    if (!displayName || displayName.trim().length < 3) {
      setNameAvailable(null);
      return;
    }

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
      const res = await uploadMarketplaceMedia(file);
      const uploadedUrl = res.url;
      setProfileImage(uploadedUrl);

      if (marketProfile && currentUser?.id) {
        const updated = await updateMarketplaceProfile(currentUser.id, {
          displayName: marketProfile.displayName,
          bio: marketProfile.bio || undefined,
          phoneNumber: marketProfile.phoneNumber || undefined,
          profileImage: uploadedUrl,
        });
        setMarketProfile(updated);
        setSaveSuccessMsg("Profile photo updated");
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

  const handleRemoveStorefrontPhoto = async () => {
    setProfileImage("");
    if (marketProfile && currentUser?.id) {
      try {
        const updated = await updateMarketplaceProfile(currentUser.id, {
          displayName: marketProfile.displayName,
          bio: marketProfile.bio || undefined,
          phoneNumber: marketProfile.phoneNumber || undefined,
          profileImage: "",
        });
        setMarketProfile(updated);
        setSaveSuccessMsg("Profile photo removed");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
      } catch (err) {
        console.warn("Could not remove photo:", err);
      }
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

    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone.length > 0 && !/^[0-9+\s-]{7,15}$/.test(trimmedPhone)) {
      setFormError("Please enter a valid phone number (e.g. +91 9876543210) or leave it blank.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      if (marketProfile) {
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
        try {
          const created = await createMarketplaceProfile(currentUser.id, {
            displayName: trimmedName,
            bio: bio.trim(),
            phoneNumber: trimmedPhone || undefined,
            profileImage: profileImage || undefined,
          });
          setMarketProfile(created);
          setIsEditing(false);
          setSaveSuccessMsg("Marketplace seller profile created!");
        } catch (createErr: unknown) {
          const errStr = createErr instanceof Error ? createErr.message : String(createErr);
          if (errStr.toLowerCase().includes("already exists")) {
            const existing = await fetchMarketplaceProfile(currentUser.id);
            if (existing) {
              setMarketProfile(existing);
              setIsEditing(false);
              setSaveSuccessMsg("Loaded your existing Marketplace seller profile!");
            } else {
              throw createErr;
            }
          } else {
            throw createErr;
          }
        }
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

  const copyShareProfileLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedProfileLink(true);
      setTimeout(() => setCopiedProfileLink(false), 2000);
    }
  };

  // Loading skeleton
  if (isLoadingAuth || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between py-12 px-4 selection:bg-emerald-500/30">
        <div className="max-w-2xl w-full mx-auto space-y-6 pt-6">
          <div className="h-6 w-40 bg-zinc-900 rounded-full animate-pulse" />
          <div className="p-6 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-zinc-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-60 bg-zinc-800/60 rounded animate-pulse" />
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
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between pt-6 pb-28 px-4 selection:bg-emerald-500/30">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Top Navigation Header with Back to Marketplace and Segmented Persona Pill */}
        <ProfileHeaderNavigation
          activeTab="marketplace"
          backHref="/marketplace"
          backLabel="Marketplace"
        />

        {/* Feedback message alerts */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-[0_0_24px_rgba(16,185,129,0.12)]">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-600 hover:border-emerald-500/60 flex items-center justify-center cursor-pointer transition-colors relative group shrink-0"
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
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Arjun_Hostel3 or CampusBookDen"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Your public handle on marketplace listings. Must be unique.
                  </p>
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Phone / WhatsApp Number <span className="text-zinc-500 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Not mandatory</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210 (optional)"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] font-mono"
                  />
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

                <button
                  type="submit"
                  disabled={isSaving || isCheckingName || nameAvailable === false}
                  className="w-full py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs sm:text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isSaving ? "Creating Profile..." : "Save & Activate Profile →"}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* CASE 2: INSTAGRAM-STYLE ALL-IN-ONE PROFILE CARD */}
        {marketProfile && !isEditing ? (
          <div className="space-y-6">
            {/* Unified Instagram-Style Profile Box */}
            <div className="p-1 rounded-[2.25rem] bg-gradient-to-b from-white/[0.1] via-white/[0.04] to-transparent border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="p-6 sm:p-8 rounded-[calc(2.25rem-0.25rem)] bg-[#0c0c0e]/95 backdrop-blur-2xl space-y-6">
                
                {/* 1. Top Username Header Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>@{marketProfile.displayName}</span>
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center" title="Campus Verified Seller">
                        ✓
                      </span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/marketplace/messages"
                      className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                      title="Marketplace DMs"
                    >
                      <span>💬</span>
                      <span>DMs</span>
                    </Link>
                  </div>
                </div>

                {/* 2. Instagram Header: Avatar on Left + 3-Stat Counters on Right */}
                <div className="flex items-center justify-between gap-6 sm:gap-10">
                  {/* Instagram Story Gradient Ring Avatar */}
                  <div className="relative shrink-0 group">
                    <div className="p-[3px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-zinc-950 p-[2px]">
                        <div
                          onClick={() => {
                            if (marketProfile.profileImage) {
                              setIsAvatarZoomOpen(true);
                            } else {
                              fileInputRef.current?.click();
                            }
                          }}
                          className={`w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center relative ${
                            marketProfile.profileImage ? "cursor-zoom-in" : "cursor-pointer"
                          }`}
                          title={marketProfile.profileImage ? "Click to zoom photo" : "Upload avatar"}
                        >
                          {isUploadingPhoto ? (
                            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          ) : marketProfile.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={marketProfile.profileImage}
                              alt={marketProfile.displayName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
                              {marketProfile.displayName.slice(0, 2).toUpperCase()}
                            </span>
                          )}

                          {/* Quick Zoom / Change Badge Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-mono pointer-events-none">
                            <span>🔍</span>
                            <span>{marketProfile.profileImage ? "Zoom" : "Upload"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Camera icon button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-zinc-950 text-xs shadow-md cursor-pointer hover:bg-emerald-400 transition-colors"
                      title="Upload photo"
                    >
                      +
                    </button>
                  </div>

                  {/* 3-Column Stats Row (Instagram Style) */}
                  <div className="flex-1 flex items-center justify-around text-center max-w-sm">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-white font-mono">
                        {userListings.length}
                      </div>
                      <div className="text-[11px] sm:text-xs text-zinc-400">listings</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                        100%
                      </div>
                      <div className="text-[11px] sm:text-xs text-zinc-400">verified</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-teal-400 font-mono">
                        Active
                      </div>
                      <div className="text-[11px] sm:text-xs text-zinc-400">status</div>
                    </div>
                  </div>
                </div>

                {/* 3. Instagram Bio & Details Section (All In One Flow) */}
                <div className="space-y-2 pt-1 text-xs sm:text-sm">
                  {/* Name and Tag */}
                  <div>
                    <div className="font-bold text-white text-sm sm:text-base leading-tight">
                      {marketProfile.displayName}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium mt-0.5">
                      <span className="text-emerald-400">🎓</span>
                      <span>Verified Campus Student</span>
                      {currentUser?.email && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-500 font-mono">
                            {currentUser.email.split("@")[1] || "campus"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio Text */}
                  {marketProfile.bio ? (
                    <p className="text-zinc-200 whitespace-pre-line leading-relaxed text-xs sm:text-sm pt-0.5">
                      {marketProfile.bio}
                    </p>
                  ) : (
                    <p className="text-zinc-500 italic text-xs">
                      No bio yet. Tap &quot;Edit Profile&quot; to write about what you sell, hostel pickup spots, etc.
                    </p>
                  )}

                  {/* Instagram-style Link / WhatsApp in Bio */}
                  {marketProfile.phoneNumber ? (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <a
                        href={`https://wa.me/${marketProfile.phoneNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
                      >
                        <span>💬</span>
                        <span className="font-mono">WhatsApp: {marketProfile.phoneNumber}</span>
                      </a>
                      <button
                        type="button"
                        onClick={copyPhoneNumber}
                        className="text-[11px] text-zinc-400 hover:text-white font-mono px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/5 cursor-pointer"
                      >
                        {copiedPhone ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* 4. Instagram Action Buttons Row */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(marketProfile.displayName);
                      setPhoneNumber(marketProfile.phoneNumber || "");
                      setBio(marketProfile.bio || "");
                      setProfileImage(marketProfile.profileImage || "");
                      setIsEditing(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-white text-xs font-semibold transition-all border border-white/5 text-center cursor-pointer active:scale-95"
                  >
                    Edit profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(true)}
                    className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all text-center cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    + Post item
                  </button>

                  <button
                    type="button"
                    onClick={copyShareProfileLink}
                    className="py-2 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 hover:text-white text-xs font-semibold transition-all border border-white/5 text-center cursor-pointer active:scale-95"
                  >
                    {copiedProfileLink ? "✓ Copied" : "Share"}
                  </button>
                </div>

                {/* 5. Instagram Tab Header */}
                <div className="border-t border-white/[0.08] pt-1">
                  <div className="flex items-center justify-center text-xs font-semibold uppercase tracking-wider">
                    <div className="py-3 border-t-2 border-emerald-400 -mt-[5px] flex items-center justify-center gap-2 text-white">
                      <span>📦</span>
                      <span>Listings ({userListings.length})</span>
                    </div>
                  </div>
                </div>

                {/* 6. TAB CONTENT: LISTINGS */}
                <div className="space-y-4 pt-1">
                  {isLoadingListings ? (
                    <div className="p-8 rounded-2xl bg-zinc-900/30 border border-white/[0.04] text-center text-xs text-zinc-500 font-mono">
                      Loading your listings...
                    </div>
                  ) : userListings.length === 0 ? (
                    /* Empty state for listings */
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
                        <button
                          type="button"
                          onClick={() => setIsPostModalOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95"
                        >
                          <span>+ Post an Item</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* User's active listings grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {userListings.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.06] hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-3 group"
                        >
                          <div className="space-y-2">
                            <ListingMediaGallery
                              mediaUrls={item.mediaUrls}
                              imageUrl={item.imageUrl}
                              title={item.title}
                            />
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  {item.category}
                                </span>
                                {item.bargainAvailable ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <span>🤝</span>
                                    <span>Bargain</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800/60 text-zinc-400 border border-white/[0.04]">
                                    Fixed
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold font-mono text-emerald-400">
                                ₹{item.price}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                              {item.title}
                            </h4>

                            {(item.hostelName || item.roomNo) && (
                              <div className="flex items-center gap-1.5 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded-xl px-2.5 py-1 font-medium">
                                <span className="text-emerald-400 text-xs">🏠</span>
                                <span className="text-white font-semibold">{item.hostelName || "Hostel"}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-300 font-mono">Room {item.roomNo || "—"}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteListingClick(item.id)}
                              disabled={deletingListingId === item.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingListingId === item.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* CASE 3: EDIT PROFILE MODAL / FORM */}
        {isEditing && marketProfile ? (
          <div className="p-2 rounded-[2.25rem] bg-gradient-to-b from-white/[0.09] to-white/[0.02] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
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
                    className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-600 hover:border-emerald-500/60 flex items-center justify-center cursor-pointer transition-colors relative shrink-0"
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
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Change photo
                      </button>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={handleRemoveStorefrontPhoto}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">JPG or PNG under 5MB</p>
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

                {/* Phone */}
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

      {/* Post an Item Modal */}
      {currentUser && currentUser.id && (
        <PostItemModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={handleListingCreated}
          userId={currentUser.id}
          sellerName={marketProfile?.displayName || currentUser.anonymousName}
          userEmail={currentUser.email}
        />
      )}

      {/* Avatar Zoom Modal */}
      {marketProfile?.profileImage && (
        <ImageZoomModal
          isOpen={isAvatarZoomOpen}
          onClose={() => setIsAvatarZoomOpen(false)}
          images={[marketProfile.profileImage]}
          title={marketProfile.displayName}
        />
      )}

      {/* Modern Confirm Modal */}
      <ConfirmModal
        isOpen={listingToDelete !== null}
        title="Remove Listing"
        description="Are you sure you want to remove this item listing? It will no longer be visible to other students on the marketplace."
        confirmText="Remove listing"
        cancelText="Keep"
        variant="danger"
        isLoading={deletingListingId !== null}
        onConfirm={handleConfirmDeleteListing}
        onClose={() => {
          if (!deletingListingId) setListingToDelete(null);
        }}
      />

      <Navbar />
    </div>
  );
}
