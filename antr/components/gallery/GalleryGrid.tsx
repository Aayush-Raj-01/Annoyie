"use client";

import React, { useState } from "react";
import { GalleryPost, deleteGalleryPhoto } from "@/lib/api/gallery";
import { UserProfile } from "@/app/lib/auth";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingAnimation from "@/components/ui/LoadingAnimation";

interface GalleryGridProps {
  posts: GalleryPost[];
  loading: boolean;
  currentUser: UserProfile | null;
  onPostDeleted?: (id: number) => void;
  onOpenUpload?: () => void;
  onRefresh?: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function GalleryGrid({
  posts,
  loading,
  currentUser,
  onPostDeleted,
  onOpenUpload,
}: GalleryGridProps) {
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<GalleryPost | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, post: GalleryPost) => {
    e.stopPropagation();
    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setDeletingId(postToDelete.id);
    try {
      const email = currentUser?.email;
      const username = currentUser?.anonymousName;
      const success = await deleteGalleryPhoto(postToDelete.id, email, username);
      if (success) {
        if (selectedPost?.id === postToDelete.id) {
          setSelectedPost(null);
        }
        if (onPostDeleted) {
          onPostDeleted(postToDelete.id);
        }
        setPostToDelete(null);
      }
    } catch (err) {
      console.error("Failed to delete photo:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="py-12 flex justify-center">
          <LoadingAnimation
            size="sm"
            text="Loading Moments"
            subtitle="Fetching campus photography"
          />
        </div>
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="break-inside-avoid rounded-2xl bg-zinc-900/60 border border-white/[0.05] relative overflow-hidden"
              style={{ height: `${220 + (idx % 3) * 60}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-28 text-center flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400">
          <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-200">No moments yet</p>
          <p className="text-xs text-zinc-400">Be the first to share a photo from campus</p>
        </div>
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            + Upload Photo
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Professional Masonry Columns */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
        {posts.map((post) => {
          const isOwner =
            currentUser &&
            ((post.uploaderId && currentUser.id === post.uploaderId) ||
              (post.uploaderUsername &&
                currentUser.anonymousName &&
                post.uploaderUsername.toLowerCase() ===
                  currentUser.anonymousName.toLowerCase()));

          return (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.08] hover:border-white/25 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl select-none"
            >
              <div className="relative w-full overflow-hidden bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrl}
                  alt={post.caption || "Campus Moment"}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-[1.025] transition-transform duration-300 ease-out"
                />

                {/* Top User Pill Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white shadow-md">
                    {post.uploaderAvatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={post.uploaderAvatarUrl}
                        alt=""
                        className="w-3.5 h-3.5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">
                        {(post.uploaderUsername || "A")[0]}
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-zinc-200 truncate max-w-[95px]">
                      {post.uploaderUsername || "Anonymous"}
                    </span>
                  </div>
                </div>

                {/* Top Right: Delete Button (if owner) */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, post)}
                    disabled={deletingId === post.id}
                    title="Delete photo"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/65 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors backdrop-blur-md border border-white/10 z-10 cursor-pointer shadow-md"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                {/* Bottom Overlay: Caption + Time */}
                <div className="absolute bottom-0 inset-x-0 p-3 pt-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col gap-1">
                  {post.caption && (
                    <p className="text-xs text-white/95 font-medium line-clamp-2 leading-snug drop-shadow-sm">
                      {post.caption}
                    </p>
                  )}
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Professional Fullscreen Lightbox Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col rounded-2xl bg-[#0d0f14] border border-white/10 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#12141a]/95">
              <div className="flex items-center gap-3">
                {selectedPost.uploaderAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedPost.uploaderAvatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/15"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center text-xs font-bold">
                    {(selectedPost.uploaderUsername || "A")[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedPost.uploaderUsername || "Anonymous"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {formatRelativeTime(selectedPost.createdAt)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentUser &&
                  ((selectedPost.uploaderId && currentUser.id === selectedPost.uploaderId) ||
                    (selectedPost.uploaderUsername &&
                      currentUser.anonymousName &&
                      selectedPost.uploaderUsername.toLowerCase() ===
                        currentUser.anonymousName.toLowerCase())) && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, selectedPost)}
                      disabled={deletingId === selectedPost.id}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  )}

                <a
                  href={selectedPost.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-white/[0.08]"
                >
                  Original ↗
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center text-sm border border-white/[0.08] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Photo Frame */}
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-3 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPost.mediaUrl}
                alt={selectedPost.caption || "Photo"}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl select-none"
              />
            </div>

            {/* Caption Footer */}
            {selectedPost.caption && (
              <div className="px-5 py-3.5 bg-[#12141a] border-t border-white/[0.08]">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {selectedPost.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!postToDelete}
        title="Delete Photo"
        description="Are you sure you want to delete this photo from the campus feed?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deletingId) setPostToDelete(null);
        }}
      />
    </>
  );
}
