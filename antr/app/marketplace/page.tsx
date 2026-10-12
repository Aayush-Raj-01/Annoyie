"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile, UserProfile } from "@/app/lib/auth";
import PostItemModal from "@/components/marketplace/PostItemModal";
import ListingMediaGallery from "@/components/marketplace/ListingMediaGallery";
import ImageZoomModal from "@/components/marketplace/ImageZoomModal";
import ConfirmModal, { ConfirmVariant } from "@/components/ui/ConfirmModal";
import ToastNotification, { ToastVariant } from "@/components/ui/ToastNotification";
import {
  MarketplaceProfile,
  fetchMarketplaceProfile,
  fetchMarketplaceListings,
  deleteMarketplaceListing,
  subscribeMarketplaceListingChange,
  notifyMarketplaceListingChange,
  MarketplaceListing,
  getCachedMarketplaceProfile,
  subscribeMarketplaceProfileChange,
} from "@/lib/api/marketplace";
import { fetchMarketplaceUnreadCount } from "@/lib/api/marketplaceChat";
import {
  fetchBlockedMarketplaceProfiles,
  blockMarketplaceProfile,
  subscribeMarketplaceBlockChange,
} from "@/lib/api/marketplaceBlock";

const CATEGORIES = ["All", "Textbooks", "Electronics", "Cycles", "Hostel", "Lab Kits", "Other"];

export default function MarketplacePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getUserProfile());
  const [marketProfile, setMarketProfile] = useState<MarketplaceProfile | null>(() => {
    const user = getUserProfile();
    return getCachedMarketplaceProfile(user?.id);
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [blockedSellerIds, setBlockedSellerIds] = useState<Set<number>>(new Set());
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: ConfirmVariant;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    onConfirm: () => {},
  });
  const marketProfileRef = useRef<MarketplaceProfile | null>(null);

  useEffect(() => {
    marketProfileRef.current = marketProfile;
  }, [marketProfile]);

  // Synchronize marketplace profile updates across tabs and other pages
  useEffect(() => {
    const unsubscribeProfile = subscribeMarketplaceProfileChange((updatedProfile) => {
      setMarketProfile(updatedProfile);
      if (updatedProfile?.id) {
        fetchMarketplaceUnreadCount(updatedProfile.id).then(setUnreadDmCount).catch(() => {});
      }
    });
    return unsubscribeProfile;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        let user = getUserProfile();
        if (!user?.id) {
          user = await syncUserProfile();
        }
        if (user && isMounted) {
          setCurrentUser(user);
          if (user.id) {
            // First check cached profile
            const cached = getCachedMarketplaceProfile(user.id);
            if (cached && isMounted) {
              setMarketProfile(cached);
              setIsLoadingProfile(false);
            }

            const profile = await fetchMarketplaceProfile(user.id);
            if (isMounted) {
              setMarketProfile(profile);
              setIsLoadingProfile(false);
              if (profile?.id) {
                fetchMarketplaceUnreadCount(profile.id).then((count) => {
                  if (isMounted) setUnreadDmCount(count);
                }).catch(() => {});
              }
            }
          }
        }

        // Fetch live listings from backend
        const allListings = await fetchMarketplaceListings();
        if (isMounted) {
          setListings(allListings);
        }
      } catch (err) {
        console.warn("Failed to load marketplace:", err);
      } finally {
        if (isMounted) {
          setIsLoadingListings(false);
          setIsLoadingProfile(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time reactive synchronization across tabs and pages
  useEffect(() => {
    // 1. Subscribe to real-time events (create/delete/refresh)
    const unsubscribe = subscribeMarketplaceListingChange((event) => {
      if (event.type === "created") {
        setListings((prev) => {
          if (prev.some((item) => item.id === event.listing.id)) return prev;
          return [event.listing, ...prev];
        });
      } else if (event.type === "deleted") {
        setListings((prev) => prev.filter((item) => item.id !== event.listingId));
      } else if (event.type === "refreshed") {
        fetchMarketplaceListings().then((all) => {
          if (Array.isArray(all)) setListings(all);
        });
      }
    });

    // 2. Refetch whenever user returns to the tab
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchMarketplaceListings().then((all) => {
          if (Array.isArray(all)) setListings(all);
        });
        if (marketProfileRef.current?.id) {
          fetchMarketplaceUnreadCount(marketProfileRef.current.id).then(setUnreadDmCount);
        }
      }
    };
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    // 3. Periodic silent background poll (every 7 seconds)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMarketplaceListings().then((all) => {
          if (Array.isArray(all)) setListings(all);
        });
        if (marketProfileRef.current?.id) {
          fetchMarketplaceUnreadCount(marketProfileRef.current.id).then(setUnreadDmCount);
        }
      }
    }, 7000);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      clearInterval(pollInterval);
    };
  }, []);

  const handleListingCreated = (newListing: MarketplaceListing) => {
    setListings((prev) => {
      if (prev.some((item) => item.id === newListing.id)) return prev;
      return [newListing, ...prev];
    });
    setToast({ message: `"${newListing.title}" posted to Marketplace!`, variant: "success" });
  };

  const handleDeleteListing = (listingId: number, itemTitle: string, sellerUserId?: number | null) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Listing",
      description: `Are you sure you want to remove "${itemTitle}"? It will no longer be visible to buyers on the marketplace.`,
      confirmText: "Remove listing",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        // Instant optimistic removal from UI
        setListings((prev) => prev.filter((item) => item.id !== listingId));
        setToast({ message: `"${itemTitle}" removed`, variant: "success" });

        const resolvedUserId = currentUser?.id || sellerUserId;
        try {
          const ok = await deleteMarketplaceListing(listingId, resolvedUserId);
          if (ok) {
            // Notify other components/tabs
            notifyMarketplaceListingChange({ type: "deleted", listingId });
          } else {
            const refreshed = await fetchMarketplaceListings();
            setListings(refreshed);
            setToast({ message: `Failed to remove "${itemTitle}". Please try again.`, variant: "error" });
          }
        } catch (err) {
          console.warn("Failed to delete listing:", err);
          const refreshed = await fetchMarketplaceListings();
          setListings(refreshed);
          setToast({ message: `Failed to remove "${itemTitle}". Please try again.`, variant: "error" });
        }
      },
    });
  };

  // Synchronize blocked sellers
  useEffect(() => {
    const profileId = marketProfile?.id;
    if (!profileId) return;

    fetchBlockedMarketplaceProfiles(profileId)
      .then((list) => setBlockedSellerIds(new Set(list.map((b) => b.blockedProfileId))))
      .catch(() => {});

    const unsubscribeBlocks = subscribeMarketplaceBlockChange(() => {
      if (profileId) {
        fetchBlockedMarketplaceProfiles(profileId)
          .then((list) => setBlockedSellerIds(new Set(list.map((b) => b.blockedProfileId))))
          .catch(() => {});
      }
    });

    return unsubscribeBlocks;
  }, [marketProfile?.id]);

  const handleBlockSeller = (sellerProfileId: number, sellerName: string) => {
    if (!marketProfile?.id) {
      setToast({
        message: "Please set up your marketplace profile before blocking sellers.",
        variant: "warning",
      });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Block Seller",
      description: `Block seller "${sellerName}"? Their items and messages will be hidden immediately.`,
      confirmText: "Block seller",
      variant: "warning",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await blockMarketplaceProfile(marketProfile.id, sellerProfileId);
          setBlockedSellerIds((prev) => new Set(prev).add(sellerProfileId));
          setToast({ message: `Blocked seller "${sellerName}"`, variant: "success" });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to block seller";
          setToast({ message: msg, variant: "error" });
        }
      },
    });
  };

  const handlePostItemClick = async () => {
    let currentProf = marketProfile || getCachedMarketplaceProfile(currentUser?.id);
    if (!currentProf && isLoadingProfile && currentUser?.id) {
      currentProf = await fetchMarketplaceProfile(currentUser.id);
      if (currentProf) setMarketProfile(currentProf);
    }

    if (!currentProf) {
      router.push("/marketplace/profile");
    } else {
      setIsPostModalOpen(true);
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hostelName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.roomNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sellerDisplayName || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (blockedSellerIds.has(item.sellerProfileId)) return false;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between pt-8 pb-28 px-4 selection:bg-emerald-500/30">
      {/* Toast Notification */}
      <ToastNotification
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />

      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Top Header Row: Title & Distinct Profile Button */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl sm:text-3xl">🏪</span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                Marketplace
              </h1>
              <span className="text-[10px] sm:text-xs font-mono text-emerald-400 font-medium block">
                Buy & Sell
              </span>
            </div>
          </div>

          {/* Distinct, High-Visibility Profile Button (Clear and Clickable on Phone!) */}
          <Link
            href="/marketplace/profile"
            className="group relative flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-t from-zinc-00 to-zinc-800 border border-zinc-600 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
            title="Open your Marketplace Seller Profile"
          >
            {/* Instagram-style Ring Avatar */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full p-[2px] shadow-md">
                <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {marketProfile?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={marketProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {marketProfile?.displayName?.slice(0, 2).toUpperCase() || (isLoadingProfile ? ".." : "👤")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1 transition-colors leading-tight">
                <span className="truncate max-w-[95px] sm:max-w-[130px]">
                  {marketProfile?.displayName || (isLoadingProfile ? "Profile" : "My Profile")}
                </span>
                <span className="text-emerald-400 text-xs font-bold transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400/90 font-medium uppercase tracking-wider block">
                Seller Profile
              </span>
            </div>
          </Link>
        </div>

        {/* Second Row: Action Buttons (Messages + Post an Item) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Direct Marketplace DMs Button */}
          <Link
            href="/marketplace/messages"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-all border border-white/10 hover:border-emerald-500/40 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            title="View all your Marketplace chats and buyer inquiries"
          >
            <span className="text-sm">💬</span>
            <span>Messages</span>
            {unreadDmCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-zinc-950 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse">
                {unreadDmCount}
              </span>
            )}
          </Link>

          {/* Post an Item CTA Button */}
          <button
            type="button"
            onClick={handlePostItemClick}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>+ Post an Item</span>
          </button>
        </div>

        {/* Seller Profile Quick Notice if not set up */}
        {!isLoadingProfile && !marketProfile && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/70 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3 shadow-[0_8px_32px_rgba(16,185,129,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                ✨
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Want to sell your books, cycle, or essentials?</div>
                <div className="text-[11px] text-zinc-400">
                  Set up your dedicated campus seller profile to publish listings and receive buyer inquiries.
                </div>
              </div>
            </div>
            <Link
              href="/marketplace/profile"
              className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Set Up Profile
            </Link>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, cycles, electronics, hostel gear..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-900/70 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-inner"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-zinc-950 font-bold shadow-md"
                    : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listing Cards Grid / Empty State */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Products Listings ({filteredListings.length})
            </span>
            <Link
              href="/marketplace/profile"
              className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <span>👤 My Profile</span>
              <span>→</span>
            </Link>
          </div>

          {isLoadingListings ? (
            <div className="p-16 rounded-[2rem] bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-zinc-400 font-mono">Loading campus listings...</div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="p-12 rounded-[2rem] bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-2xl">
                📦
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold text-white">No items posted yet</div>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Be the first to list textbooks, cycles, calculators, or hostel essentials on campus.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePostItemClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95"
                >
                  <span>+ Post an Item</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredListings.map((item) => {
                const isMine =
                  (currentUser?.id && item.sellerUserId === currentUser.id) ||
                  (marketProfile?.id && item.sellerProfileId === marketProfile.id);

                return (
                  <div
                    key={item.id}
                    className="p-1.5 rounded-[1.75rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div className="p-5 rounded-[calc(1.75rem-0.375rem)] bg-[#0c0c0e]/95 space-y-4 backdrop-blur-xl h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <ListingMediaGallery
                          mediaUrls={item.mediaUrls}
                          imageUrl={item.imageUrl}
                          title={item.title}
                        />

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                                {item.category}
                              </span>
                              {item.bargainAvailable ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                                  <span>🤝</span>
                                  <span>Bargain Available</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800/60 text-zinc-400 border border-white/[0.04]">
                                  Fixed Price
                                </span>
                              )}
                            </div>
                            <span className="text-base font-bold font-mono text-emerald-400">
                              ₹{item.price}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                            {item.title}
                          </h3>

                          {/* Mandatory Campus Location Badge: Hostel & Room */}
                          {(item.hostelName || item.roomNo) && (
                            <div className="flex items-center gap-1.5 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded-xl px-2.5 py-1.5 font-medium">
                              <span className="text-emerald-400 text-xs">🏠</span>
                              <span className="text-white font-semibold">{item.hostelName || "Campus Hostel"}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-300 font-mono">Room {item.roomNo || "—"}</span>
                            </div>
                          )}

                          {item.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Seller & Contact Bar */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            onClick={(e) => {
                              if (item.sellerProfileImage) {
                                e.stopPropagation();
                                setZoomImage({
                                  url: item.sellerProfileImage,
                                  title: `${item.sellerDisplayName}'s Profile Photo`,
                                });
                              }
                            }}
                            className={`w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0 overflow-hidden border border-emerald-500/30 ${
                              item.sellerProfileImage ? "cursor-zoom-in hover:scale-105 transition-transform" : ""
                            }`}
                            title={item.sellerProfileImage ? "Click to zoom profile photo" : undefined}
                          >
                            {item.sellerProfileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.sellerProfileImage}
                                alt={item.sellerDisplayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              item.sellerDisplayName?.slice(0, 1).toUpperCase() || "S"
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-white font-medium truncate block text-xs">
                              {item.sellerDisplayName}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMine ? (
                            <div className="flex items-center gap-1.5">
                              <Link
                                href="/marketplace/profile"
                                className="px-2.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors border border-white/5"
                              >
                                Manage
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteListing(item.id, item.title, item.sellerUserId)}
                                className="px-2.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer active:scale-95"
                                title="Remove your listing instantly"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ) : (
                            <Link
                              href={`/marketplace/messages?with=${item.sellerProfileId}&name=${encodeURIComponent(
                                item.sellerDisplayName
                              )}&listingId=${item.id}&listingTitle=${encodeURIComponent(
                                item.title
                              )}&listingPrice=${item.price}`}
                              className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                            >
                              <span>💬 Chat</span>
                            </Link>
                          )}

                          {item.sellerPhoneNumber && !isMine && (
                            <a
                              href={`https://wa.me/${item.sellerPhoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hi ${item.sellerDisplayName}, is "${item.title}" still available on campus marketplace?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs transition-colors shrink-0"
                              title="Chat on WhatsApp"
                            >
                              <span>📱</span>
                            </a>
                          )}

                          {!isMine && (
                            <button
                              type="button"
                              onClick={() => handleBlockSeller(item.sellerProfileId, item.sellerDisplayName)}
                              className="px-2 py-1.5 rounded-full bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/5 text-[11px] transition-colors cursor-pointer"
                              title={`Block seller ${item.sellerDisplayName}`}
                            >
                              🚫
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

      {/* Seller Avatar Zoom Modal */}
      {zoomImage && (
        <ImageZoomModal
          isOpen={Boolean(zoomImage)}
          onClose={() => setZoomImage(null)}
          images={[zoomImage.url]}
          title={zoomImage.title}
        />
      )}

      {/* Modern Confirm Modal (replacing native browser confirm) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        variant={confirmDialog.variant}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <Navbar />
    </div>
  );
}
