"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile, UserProfile } from "@/app/lib/auth";
import PostItemModal from "@/components/marketplace/PostItemModal";
import ListingMediaGallery from "@/components/marketplace/ListingMediaGallery";
import ImageZoomModal from "@/components/marketplace/ImageZoomModal";
import ConfirmModal, { ConfirmVariant } from "@/components/ui/ConfirmModal";
import ToastNotification, { ToastVariant } from "@/components/ui/ToastNotification";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import PinterestBackground from "@/components/ui/PinterestBackground";
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

const CATEGORIES = [
  { id: "All", label: "All Products", countKey: "all", icon: "✦" },
  { id: "Textbooks", label: "Textbooks & Notes", countKey: "Textbooks", icon: "📚" },
  { id: "Electronics", label: "Electronics & Audio", countKey: "Electronics", icon: "⚡" },
  { id: "Cycles", label: "Bicycles & Mobility", countKey: "Cycles", icon: "🚲" },
  { id: "Hostel", label: "Hostel & Room Gear", countKey: "Hostel", icon: "🛏" },
  { id: "Lab Kits", label: "Lab Kits & Drafters", countKey: "Lab Kits", icon: "🔬" },
  { id: "Other", label: "Other Essentials", countKey: "Other", icon: "📦" },
];

const SUB_FILTERS = [
  { id: "all", label: "All Items" },
  { id: "new", label: "New Arrivals" },
  { id: "bargain", label: "On Bargain / Negotiable" },
  { id: "mine", label: "My Listings" },
];

const ITEMS_PER_PAGE = 9;

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

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [subFilter, setSubFilter] = useState<"all" | "new" | "bargain" | "mine">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs & Notifications
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
        if (!user || !user.id) {
          user = await syncUserProfile();
        }
        if (user && isMounted) {
          setCurrentUser(user);
          if (user.id) {
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

  // Real-time reactive synchronization
  useEffect(() => {
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
      description: `Are you sure you want to remove "${itemTitle}"? It will no longer be visible to campus buyers.`,
      confirmText: "Remove listing",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setListings((prev) => prev.filter((item) => item.id !== listingId));
        setToast({ message: `"${itemTitle}" removed`, variant: "success" });

        const resolvedUserId = currentUser?.id || sellerUserId;
        try {
          const ok = await deleteMarketplaceListing(listingId, resolvedUserId);
          if (ok) {
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

  // Filter listings based on category, search, and sub-filter
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (blockedSellerIds.has(item.sellerProfileId)) return false;

      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }

      // Sub-filter
      if (subFilter === "bargain" && !item.bargainAvailable) {
        return false;
      }
      if (subFilter === "mine") {
        const isMine =
          (currentUser?.id && item.sellerUserId === currentUser.id) ||
          (marketProfile?.id && item.sellerProfileId === marketProfile.id);
        if (!isMine) return false;
      }

      // Search query
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matches =
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.hostelName || "").toLowerCase().includes(q) ||
          (item.roomNo || "").toLowerCase().includes(q) ||
          (item.sellerDisplayName || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [listings, selectedCategory, subFilter, searchQuery, blockedSellerIds, currentUser?.id, marketProfile?.id]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredListings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredListings, currentPage]);

  // Featured recommendations row (items outside current page or latest 4)
  const recommendations = useMemo(() => {
    return listings.slice(0, 4);
  }, [listings]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, subFilter, searchQuery]);

  return (
    <div className="min-h-[100dvh] bg-[#090a0f] text-zinc-100 flex flex-col justify-between pt-4 sm:pt-6 pb-28 sm:pb-32 px-3 sm:px-6 relative overflow-x-hidden selection:bg-zinc-800">
      {/* Editorial Pinterest Blueprint Grid Background */}
      <PinterestBackground variant="grid" withIllustrations={true} />

      {/* Toast Notification */}
      <ToastNotification
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />

      <div className="max-w-7xl w-full mx-auto space-y-8">
        {/* ========================================================= */}
        {/* HERO SECTION: Editorial "Shop" Display Banner             */}
        {/* (Directly styled after reference image, dark theme)       */}
        {/* ========================================================= */}
        <section className="relative rounded-3xl overflow-hidden bg-[#10121a] border border-white/[0.08] p-6 sm:p-12">
          {/* Subtle architectural room silhouette background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none select-none overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 800 400" className="w-full h-full text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="60" y="80" width="160" height="240" rx="4" />
              <line x1="60" y1="140" x2="220" y2="140" />
              <line x1="60" y1="200" x2="220" y2="200" />
              <line x1="60" y1="260" x2="220" y2="260" />
              <rect x="280" y="60" width="240" height="280" rx="4" />
              <rect x="580" y="80" width="160" height="240" rx="4" />
              <line x1="580" y1="140" x2="740" y2="140" />
              <line x1="580" y1="200" x2="740" y2="200" />
              <line x1="580" y1="260" x2="740" y2="260" />
            </svg>
          </div>

          {/* Huge "Shop" Wordmark Overlay */}
          <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left select-none">
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-white/90 leading-none">
              Shop
            </h1>
          </div>

          {/* Docked Control Bar: Subtitle & Search Box (Matching Reference Hero Header) */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                Give All You Need
              </span>
              <span className="hidden sm:inline text-xs font-mono text-zinc-500 uppercase tracking-widest">
                // Campus Peer Exchange
              </span>
            </div>

            {/* Pill Search Dock */}
            <div className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search on Annoyms Store..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-full bg-[#181a24] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/30 transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs transition-all hover:bg-zinc-200 active:scale-95 cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Action Header: Post Item, Inquiries & Seller Desk */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Verified Student Listings ({filteredListings.length})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Inquiries */}
            <Link
              href="/marketplace/messages"
              className="px-3.5 py-1.5 rounded-full bg-[#141620] hover:bg-[#1a1d2b] border border-white/[0.08] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Buyer Inquiries"
            >
              <span>💬</span>
              <span>Messages</span>
              {unreadDmCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white text-black">
                  {unreadDmCount}
                </span>
              )}
            </Link>

            {/* List Item CTA */}
            <button
              type="button"
              onClick={handlePostItemClick}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-sm"
            >
              + List Item
            </button>

            {/* Seller Desk */}
            <Link
              href="/marketplace/profile"
              className="px-3 py-1.5 rounded-full bg-[#141620] hover:bg-[#1a1d2b] border border-white/[0.08] text-zinc-300 text-xs font-medium transition-all"
            >
              <span>👤 Seller Desk</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TWO-COLUMN E-COMMERCE LAYOUT (Matching Reference Image)   */}
        {/* Left: Category tree & Sub-filters | Right: Product Grid   */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* ======================================= */}
          {/* LEFT SIDEBAR: Category Tree & Filters   */}
          {/* ======================================= */}
          <aside className="space-y-6 lg:sticky lg:top-8">
            {/* Category Section */}
            <div className="p-5 rounded-2xl bg-[#12131b] border border-white/[0.07] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                  Category
                </h2>
                <span className="text-[10px] font-mono text-zinc-500">
                  {listings.length} items
                </span>
              </div>

              {/* Tree Structure Matching Reference */}
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const count =
                    cat.id === "All"
                      ? listings.length
                      : listings.filter((l) => l.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? "bg-white text-black font-bold shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? "bg-black text-white"
                            : "bg-white/[0.05] text-zinc-500 group-hover:text-zinc-300"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Status Sub-Filters (Matching Reference: New Arrival, Best Seller, etc.) */}
            <div className="p-5 rounded-2xl bg-[#12131b] border border-white/[0.07] space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Filter by Type
              </h3>
              <div className="space-y-1">
                {SUB_FILTERS.map((f) => {
                  const isActive = subFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSubFilter(f.id as any)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? "bg-white/[0.1] text-white font-semibold border border-white/10"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                        isActive ? "border-emerald-400 bg-emerald-500 text-black font-bold" : "border-zinc-700"
                      }`}>
                        {isActive ? "✓" : ""}
                      </span>
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ======================================= */}
          {/* MAIN PRODUCT GRID & CONTROLS            */}
          {/* ======================================= */}
          <main className="lg:col-span-3 space-y-6">
            {isLoadingListings ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <LoadingAnimation
                  size="lg"
                  text="Loading Campus Store"
                  subtitle="Retrieving verified peer listings"
                />
              </div>
            ) : paginatedListings.length === 0 ? (
              /* Empty State */
              <div className="py-20 px-6 rounded-3xl bg-[#12131b] border border-dashed border-white/[0.08] text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl text-zinc-400">
                  📦
                </div>
                <div className="space-y-1">
                  <div className="text-base font-bold text-white">No items found</div>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {searchQuery || selectedCategory !== "All" || subFilter !== "all"
                      ? "Try resetting your search or picking another category."
                      : "No listings posted in this section yet. Post the first item on campus!"}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setSubFilter("all");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={handlePostItemClick}
                    className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200 active:scale-95 cursor-pointer"
                  >
                    + Post Item
                  </button>
                </div>
              </div>
            ) : (
              /* E-Commerce Product Card Grid (Matching Reference Image) */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedListings.map((item) => {
                  const isMine =
                    (currentUser?.id && item.sellerUserId === currentUser.id) ||
                    (marketProfile?.id && item.sellerProfileId === marketProfile.id);

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-[#12131a] border border-white/[0.07] hover:border-white/20 transition-all duration-300 p-3.5 flex flex-col justify-between group shadow-sm hover:shadow-xl select-none"
                    >
                      {/* Top Media Showcase Container (Matching Reference Layout) */}
                      <div className="relative rounded-xl bg-[#171822] overflow-hidden p-2 flex items-center justify-center">
                        <ListingMediaGallery
                          mediaUrls={item.mediaUrls}
                          imageUrl={item.imageUrl}
                          title={item.title}
                        />

                        {/* Top-Right Category Pill Badge (Matching Reference Image) */}
                        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-black/75 text-zinc-300 border border-white/10 backdrop-blur-sm">
                            {item.category}
                          </span>
                        </div>

                        {/* Top-Left Negotiable / Fixed Tag */}
                        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                          {item.bargainAvailable ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                              🤝 Negotiable
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-zinc-400 bg-black/60 border border-white/5 backdrop-blur-sm">
                              Fixed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content (Matching Reference Title, Reviews/Location, Price) */}
                      <div className="pt-3 pb-2 space-y-2">
                        {/* Title & Price Row */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors line-clamp-1 leading-snug flex-1">
                            {item.title}
                          </h3>
                          <span className="font-mono font-bold text-sm sm:text-base text-white shrink-0">
                            ₹{item.price}
                          </span>
                        </div>

                        {/* Campus Location / Reviews Row (Matching Reference "★ 5.0") */}
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                            <span>★</span>
                            <span className="text-zinc-300 font-semibold">
                              {item.hostelName || "Campus Hostel"}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400 font-mono text-[10px]">
                              Rm {item.roomNo || "—"}
                            </span>
                          </div>

                          <span className="text-[10px] text-zinc-500 font-mono">
                            @{item.sellerDisplayName}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Dual Action Button Row (Directly Matching Reference Image!) */}
                      <div className="pt-2 border-t border-white/[0.05] grid grid-cols-2 gap-2 mt-1">
                        {isMine ? (
                          <>
                            <Link
                              href="/marketplace/profile"
                              className="w-full py-2 rounded-xl bg-transparent hover:bg-white/[0.05] text-zinc-300 border border-white/10 text-xs font-semibold text-center transition-all cursor-pointer"
                            >
                              Edit Item
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(item.id, item.title, item.sellerUserId)}
                              className="w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Left Button: Secondary Action (In-App Direct Chat) */}
                            <Link
                              href={`/marketplace/messages?with=${item.sellerProfileId}&name=${encodeURIComponent(
                                item.sellerDisplayName
                              )}&listingId=${item.id}&listingTitle=${encodeURIComponent(
                                item.title
                              )}&listingPrice=${item.price}`}
                              className="w-full py-2 rounded-xl bg-transparent hover:bg-white/[0.05] text-zinc-200 border border-white/10 text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>Chat</span>
                            </Link>

                            {/* Right Button: Primary Action (WhatsApp or Buy/Inquire) */}
                            {item.sellerPhoneNumber ? (
                              <a
                                href={`https://wa.me/${item.sellerPhoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                  `Hi ${item.sellerDisplayName}, is "${item.title}" still available on campus marketplace?`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold text-center transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                                title="Contact via WhatsApp"
                              >
                                <span>Buy Now</span>
                                <span className="text-[10px]">↗</span>
                              </a>
                            ) : (
                              <Link
                                href={`/marketplace/messages?with=${item.sellerProfileId}&name=${encodeURIComponent(
                                  item.sellerDisplayName
                                )}&listingId=${item.id}&listingTitle=${encodeURIComponent(
                                  item.title
                                )}&listingPrice=${item.price}`}
                                className="w-full py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold text-center transition-all active:scale-95 shadow-sm"
                              >
                                Buy Now
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls (Matching Reference: ← Previous | 1 2 3 ... | Next →) */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/[0.04] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  ← Previous
                </button>

                {/* Page Number Chips */}
                <div className="flex items-center gap-1 font-mono">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-white text-black font-bold"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/[0.04] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>

        {/* ========================================================= */}
        {/* "EXPLORE OUR RECOMMENDATIONS" (Matching Reference Image)  */}
        {/* ========================================================= */}
        {recommendations.length > 0 && (
          <section className="pt-8 space-y-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Explore our recommendations
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                Peer Picks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={`rec-${rec.id}`}
                  className="rounded-2xl bg-[#12131a] border border-white/[0.06] p-3 space-y-2 hover:border-white/20 transition-all select-none"
                >
                  <div className="h-32 rounded-xl bg-[#171822] overflow-hidden flex items-center justify-center p-2 relative">
                    <ListingMediaGallery
                      mediaUrls={rec.mediaUrls}
                      imageUrl={rec.imageUrl}
                      title={rec.title}
                    />
                    <span className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/70 text-zinc-300 border border-white/10">
                      {rec.category}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{rec.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">₹{rec.price}</span>
                      <Link
                        href={`/marketplace/messages?with=${rec.sellerProfileId}&name=${encodeURIComponent(
                          rec.sellerDisplayName
                        )}&listingId=${rec.id}&listingTitle=${encodeURIComponent(
                          rec.title
                        )}&listingPrice=${rec.price}`}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        Contact →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* BOTTOM CALLOUT CARD ("Ready to Get Our New Stuff?" Match) */}
        {/* ========================================================= */}
        <section className="rounded-3xl bg-[#12131b] border border-white/[0.08] p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Ready to Sell Your Stuff?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Declutter your dorm room. Sell textbooks, bicycles, calculators, or hostel gear to fellow students with zero commission and instant peer messaging.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePostItemClick}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200 active:scale-95 cursor-pointer shadow-sm text-center"
            >
              + Post a Listing
            </button>
            <Link
              href="/marketplace/profile"
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all text-center"
            >
              Seller Profile
            </Link>
          </div>
        </section>
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

      {/* Confirm Modal */}
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

      {/* Global Navbar */}
      <Navbar />
    </div>
  );
}
