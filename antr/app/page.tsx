"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./components/navbar";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import UploadModal from "@/components/gallery/UploadModal";
import { fetchRandomGalleryFeed, GalleryPost } from "@/lib/api/gallery";
import { getUserProfile, syncUserProfile, UserProfile } from "./lib/auth";
import { connectSocket, subscribeToGallery } from "@/lib/socket/chatClient";
import ToastNotification from "@/components/ui/ToastNotification";
import PinterestBackground from "@/components/ui/PinterestBackground";

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
      // Deduplicate loaded feed items
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
        setTimeout(() => setIsShuffling(false), 350);
      }
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Real-time synchronization: listen for photo uploads and deletions from other users via WebSocket
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
    setToast("Photo added");
    setTimeout(() => setToast(null), 3000);
  };

  const handlePostDeleted = (id: number) => {
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    setToast("Photo removed");
    setTimeout(() => setToast(null), 2500);
  };

  const displayedPosts = posts
    .filter(
      (post, idx, self) =>
        idx ===
        self.findIndex(
          (p) =>
            (p.id && post.id && String(p.id) === String(post.id)) ||
            (p.mediaUrl && post.mediaUrl && p.mediaUrl === post.mediaUrl)
        )
    )
    .filter((post) => {
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
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col relative font-sans selection:bg-white/20 selection:text-white pb-32">
      {/* Editorial Pinterest Dots Canvas */}
      <PinterestBackground variant="dots" />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast */}
        <ToastNotification message={toast} onClose={() => setToast(null)} />

        {/* Minimal Clean Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 sm:py-8 border-b border-white/[0.06] mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-widest text-white uppercase font-mono truncate">
                ANNOYOI /IMSEC
              </h1>
              <span className="text-zinc-600 font-mono text-xs hidden sm:inline">•</span>
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Campus Feed</span>
            </div>

            {/* Subtle Filter Toggle */}
            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-lg bg-zinc-900/70 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  filterMode === "all"
                    ? "bg-white/10 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("mine")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  filterMode === "mine"
                    ? "bg-white/10 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                My uploads
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadFeed(true)}
              disabled={loading || isShuffling}
              title="Shuffle feed"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-40"
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
                  strokeWidth={1.75}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Shuffle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-medium transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              + Upload
            </button>
          </div>
        </div>

        {/* Photography Grid */}
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
