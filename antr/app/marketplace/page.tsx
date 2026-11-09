"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile, UserProfile } from "@/app/lib/auth";
import PostItemModal from "@/components/marketplace/PostItemModal";
import ConfirmModal, { ConfirmVariant } from "@/components/ui/ConfirmModal";
import ToastNotification, { ToastVariant } from "@/components/ui/ToastNotification";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import OlxHeader from "@/components/marketplace/OlxHeader";
import OlxCategoryGrid, { OLX_CATEGORIES } from "@/components/marketplace/OlxCategoryGrid";
import OlxProductCard from "@/components/marketplace/OlxProductCard";
import OlxSellButton from "@/components/marketplace/OlxSellButton";
import OlxDrawer from "@/components/marketplace/OlxDrawer";
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
  subscribeMarketplaceBlockChange,
} from "@/lib/api/marketplaceBlock";

const SUB_FILTERS = [
  { id: "all", label: "All Items" },
  { id: "featured", label: "Featured" },
  { id: "bargain", label: "Negotiable" },
  { id: "mine", label: "My Listings" },
  { id: "wishlist", label: "Wishlist ❤️" },
];

const ITEMS_PER_PAGE = 12;
const WISHLIST_KEY = "annoyms_marketplace_wishlist";

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

  // OLX Filters & Search
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("nearby");
  const [selectedLocation, setSelectedLocation] = useState<string>("All Campus");
  const [subFilter, setSubFilter] = useState<"all" | "featured" | "bargain" | "mine" | "wishlist">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs, Drawers & Wishlist
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [blockedSellerIds, setBlockedSellerIds] = useState<Set<number>>(new Set());
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

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

  // Wishlist toggle handler
  const handleToggleFavorite = (listingId: number) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
        setToast({ message: "Removed from saved items", variant: "info" });
      } else {
        next.add(listingId);
        setToast({ message: "Saved to your wishlist!", variant: "success" });
      }
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Synchronize marketplace profile updates across tabs
  useEffect(() => {
    const unsubscribeProfile = subscribeMarketplaceProfileChange((updatedProfile) => {
      setMarketProfile(updatedProfile);
      if (updatedProfile?.id) {
        fetchMarketplaceUnreadCount(updatedProfile.id).then(setUnreadDmCount).catch(() => {});
      }
    });
    return unsubscribeProfile;
  }, []);

  // Initial Data Load
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

  // Blocked sellers listener
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

  const handleListingCreated = (newListing: MarketplaceListing) => {
    setListings((prev) => {
      if (prev.some((item) => item.id === newListing.id)) return prev;
      return [newListing, ...prev];
    });
    setToast({ message: `"${newListing.title}" posted to MarketPlace!`, variant: "success" });
  };

  const handleDeleteListing = (listingId: number, itemTitle: string, sellerUserId?: number | null) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Listing",
      description: `Are you sure you want to delete "${itemTitle}"? It will no longer be visible to campus buyers.`,
      confirmText: "Remove Ad",
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

  // OLX Category Matching Logic
  const activeCategoryObj = useMemo(() => {
    return OLX_CATEGORIES.find((c) => c.id === selectedCategoryId) || OLX_CATEGORIES[0];
  }, [selectedCategoryId]);

  // Filter listings based on category, location, search, and sub-filter
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (blockedSellerIds.has(item.sellerProfileId)) return false;

      // 1. Category Filter
      if (selectedCategoryId !== "nearby") {
        const matches = activeCategoryObj.filterMatch.some(
          (m) => item.category.toLowerCase().includes(m.toLowerCase())
        );
        if (!matches) return false;
      }

      // 2. Location Filter
      if (selectedLocation !== "All Campus") {
        const itemLoc = (item.hostelName || "").toLowerCase();
        const selectedLoc = selectedLocation.toLowerCase();
        if (
          !itemLoc.includes("all") &&
          !selectedLoc.includes(itemLoc) &&
          !itemLoc.includes(selectedLoc.replace(/[^a-z0-9]/g, ""))
        ) {
          const keywords = ["block a", "block b", "block c", "girls", "faculty"];
          const matchedKw = keywords.find((kw) => selectedLoc.includes(kw));
          if (matchedKw && !itemLoc.includes(matchedKw)) {
            return false;
          }
        }
      }

      // 3. Sub-filter
      if (subFilter === "bargain" && !item.bargainAvailable) {
        return false;
      }
      if (subFilter === "mine") {
        const isMine =
          (currentUser?.id && item.sellerUserId === currentUser.id) ||
          (marketProfile?.id && item.sellerProfileId === marketProfile.id);
        if (!isMine) return false;
      }
      if (subFilter === "wishlist") {
        if (!wishlistIds.has(item.id)) return false;
      }

      // 4. Search query
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matches =
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.hostelName || "").toLowerCase().includes(q) ||
          (item.roomNo || "").toLowerCase().includes(q) ||
          (item.category || "").toLowerCase().includes(q) ||
          (item.sellerDisplayName || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    listings,
    selectedCategoryId,
    activeCategoryObj,
    selectedLocation,
    subFilter,
    searchQuery,
    blockedSellerIds,
    currentUser,
    marketProfile,
    wishlistIds,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredListings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredListings, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, selectedLocation, subFilter, searchQuery]);

  return (
    <div className="min-h-[100dvh] bg-[#0A0C10] text-zinc-100 flex flex-col justify-between pb-32 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-white">
      {/* Toast Notification */}
      <ToastNotification
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />

      {/* Marketplace Header Bar */}
      <OlxHeader
        currentLocation={selectedLocation}
        onSelectLocation={(loc) => setSelectedLocation(loc)}
        unreadCount={unreadDmCount}
        onPostClick={handlePostItemClick}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 space-y-6">
        {/* ========================================================= */}
        {/* SEARCH BAR (Matching Reference Screenshot)                */}
        {/* ========================================================= */}
        <div className="w-full">
          <div className="relative group flex items-center">
            {/* Search Magnifying Glass Icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find Textbooks, Cycles, Laptops, Drafters and more..."
              className="w-full pl-12 pr-10 py-3 sm:py-3.5 rounded-2xl bg-[#141620] border-2 border-white/[0.08] focus:border-emerald-500 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 outline-none shadow-sm transition-all"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* "BROWSE POPULAR CATEGORIES" (3x3 Grid from Screenshot)     */}
        {/* ========================================================= */}
        <OlxCategoryGrid
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(catId) => {
            setSelectedCategoryId(catId);
            setSubFilter("all");
          }}
          onSeeAll={() => {
            setSelectedCategoryId("nearby");
            setSubFilter("all");
            setSearchQuery("");
          }}
        />

        {/* ========================================================= */}
        {/* "FRESH RECOMMENDATIONS" FEED SECTION                     */}
        {/* ========================================================= */}
        <section className="space-y-4 pt-2">
          {/* Header Row: Title & Sub-Filter Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Fresh recommendations
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                ({filteredListings.length})
              </span>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {SUB_FILTERS.map((f) => {
                const isActive = subFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSubFilter(f.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                        : "bg-white/[0.05] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08]"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Pill Alert (if a category is active) */}
          {selectedCategoryId !== "nearby" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <span>Showing: <strong>{activeCategoryObj.label}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedCategoryId("nearby")}
                className="ml-auto font-bold underline hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Product Feed Grid */}
          {isLoadingListings ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <LoadingAnimation
                size="lg"
                text="Loading Campus Marketplace"
                subtitle="Retrieving fresh recommendations"
              />
            </div>
          ) : paginatedListings.length === 0 ? (
            /* Empty State */
            <div className="py-20 px-6 rounded-3xl bg-[#13151f] border border-dashed border-white/[0.08] text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl text-zinc-400">
                📦
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold text-white">No recommendations found</div>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery || selectedCategoryId !== "nearby" || subFilter !== "all"
                    ? "No ads match your current filters. Try resetting your search or category."
                    : "No ads posted yet. Be the first to sell something on campus!"}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("nearby");
                    setSelectedLocation("All Campus");
                    setSubFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
                <button
                  type="button"
                  onClick={handlePostItemClick}
                  className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-all shadow-md shadow-emerald-500/30 cursor-pointer"
                >
                  + Post an Ad
                </button>
              </div>
            </div>
          ) : (
            /* OLX 2-Column Responsive Card Grid (Matching Reference Screenshot) */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {paginatedListings.map((listing) => {
                const isMine =
                  (currentUser?.id && listing.sellerUserId === currentUser.id) ||
                  (marketProfile?.id && listing.sellerProfileId === marketProfile.id);

                return (
                  <OlxProductCard
                    key={listing.id}
                    listing={listing}
                    isMine={Boolean(isMine)}
                    onDelete={handleDeleteListing}
                    isFavorite={wishlistIds.has(listing.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-8 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-3 text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/[0.04] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all font-semibold"
              >
                ← Prev
              </button>

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
                          ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/30"
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
                className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/[0.04] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all font-semibold"
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ========================================================= */}
      {/* THE ICONIC FLOATING "+ SELL" BUTTON (Matching Screenshot) */}
      {/* ========================================================= */}
      <OlxSellButton onClick={handlePostItemClick} />

      {/* OLX Side Navigation Drawer */}
      <OlxDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        marketProfile={marketProfile}
        unreadCount={unreadDmCount}
        onPostClick={handlePostItemClick}
        onFilterMine={() => setSubFilter("mine")}
        onFilterWishlist={() => setSubFilter("wishlist")}
      />

      {/* Modals & Dialogs */}
      {currentUser?.id && (
        <PostItemModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={handleListingCreated}
          userId={currentUser.id}
          sellerName={marketProfile?.displayName || currentUser.anonymousName}
        />
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Global Navigation Bar */}
      <Navbar />
    </div>
  );
}
