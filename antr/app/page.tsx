"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./components/navbar";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import UploadModal from "@/components/gallery/UploadModal";
import { fetchRandomGalleryFeed, GalleryPost } from "@/lib/api/gallery";
import { getUserProfile, syncUserProfile, UserProfile } from "./lib/auth";
import { connectSocket, subscribeToGallery } from "@/lib/socket/chatClient";
import ToastNotification from "@/components/ui/ToastNotification";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getUserProfile();
  });
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "mine">("all");
  const [toast, setToast] = useState<string | null>(null);

  // Sync profile silently for ownership check
  useEffect(() => {
    let isMounted = true;
    const initUser = async () => {
      let p = getUserProfile();
      if (!p || !p.id) {
        const synced = await syncUserProfile();
        if (synced && isMounted) {
          p = synced;
        }
      }
      if (isMounted && p) {
        setCurrentUser(p);
      }
    };
    initUser();

    const handleProfileUpdate = () => {
      setCurrentUser(getUserProfile());
    };
    window.addEventListener("annoyms_profile_updated", handleProfileUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("annoyms_profile_updated", handleProfileUpdate);
    };
  }, []);

  // Fetch randomized latest posts
  const loadFeed = useCallback(async (showShuffleSpinner = false) => {
    if (showShuffleSpinner) {
      setIsShuffling(true);
    } else {
      setLoading(true);
    }

    try {
      const feed = await fetchRandomGalleryFeed(48);
      const uniqueFeed = feed.filter(
        (post, idx, self) =>
          idx ===
          self.findIndex(
            (p) =>
              (p.id && post.id && String(p.id) === String(post.id)) ||
              (p.mediaUrl && post.mediaUrl && p.mediaUrl === post.mediaUrl)
          )
      );
      setPosts(uniqueFeed);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
      if (showShuffleSpinner) {
        setTimeout(() => setIsShuffling(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // WebSocket real-time updates
  useEffect(() => {
    connectSocket();

    const unsubscribe = subscribeToGallery(
      (newPost: GalleryPost) => {
        setPosts((prev) => {
          if (
            prev.some(
              (p) =>
                (p.id && newPost.id && String(p.id) === String(newPost.id)) ||
                (p.mediaUrl && newPost.mediaUrl && p.mediaUrl === newPost.mediaUrl)
            )
          ) {
            return prev;
          }
          return [newPost, ...prev];
        });
      },
      (deleteInfo: { id: number }) => {
        setPosts((prev) => prev.filter((p) => String(p.id) !== String(deleteInfo.id)));
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUploadSuccess = (newPost: GalleryPost) => {
    setPosts((prev) => {
      if (
        prev.some(
          (p) =>
            (p.id && newPost.id && String(p.id) === String(newPost.id)) ||
            (p.mediaUrl && newPost.mediaUrl && p.mediaUrl === newPost.mediaUrl)
        )
      ) {
        return prev;
      }
      return [newPost, ...prev];
    });
    setToast("Photo shared");
    setTimeout(() => setToast(null), 2500);
  };

  const handlePostDeleted = (id: number) => {
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    setToast("Photo removed");
    setTimeout(() => setToast(null), 2000);
  };

  const displayedPosts = posts.filter((post) => {
    if (filterMode === "mine") {
      if (!currentUser) return false;
      const isIdMatch = post.uploaderId && currentUser.id === post.uploaderId;
      const isNameMatch =
        post.uploaderUsername &&
        currentUser.anonymousName &&
        post.uploaderUsername.toLowerCase() === currentUser.anonymousName.toLowerCase();
      return Boolean(isIdMatch || isNameMatch);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col relative font-sans selection:bg-white/20 selection:text-white pb-32">
      {/* Subtle Dark Ambient Vignette */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.08),transparent)]" />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <ToastNotification message={toast} onClose={() => setToast(null)} />

        {/* Professional Header */}
        <div className="pt-6 sm:pt-10 pb-5 sm:pb-7 border-b border-white/[0.08] mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Campus Moments
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Photography and everyday life from across campus
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Segmented Filter */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                    filterMode === "all"
                      ? "bg-white/[0.12] text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All Moments
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("mine")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                    filterMode === "mine"
                      ? "bg-white/[0.12] text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  My Uploads
                </button>
              </div>

              {/* Shuffle button */}
              <button
                type="button"
                onClick={() => loadFeed(true)}
                disabled={loading || isShuffling}
                title="Shuffle moments"
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <svg
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${
                    isShuffling ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">Shuffle</span>
              </button>

              {/* Upload button */}
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        <GalleryGrid
          posts={displayedPosts}
          loading={loading}
          currentUser={currentUser}
          onPostDeleted={handlePostDeleted}
          onOpenUpload={() => setIsUploadOpen(true)}
          onRefresh={() => loadFeed(true)}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        currentUser={currentUser}
      />

      {/* Floating Bottom Navbar */}
      <Navbar />
    </div>
  );
}
