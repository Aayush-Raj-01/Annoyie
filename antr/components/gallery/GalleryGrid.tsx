"use client";

import React, { useState } from "react";
import { GalleryPost, deleteGalleryPhoto } from "@/lib/api/gallery";
import { UserProfile } from "@/app/lib/auth";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, post: GalleryPost) => {
    e.stopPropagation();
    if (!confirm("Delete this photo?")) return;

    setDeletingId(post.id);
    try {
      const email = currentUser?.email;
      const username = currentUser?.anonymousName;
      const success = await deleteGalleryPhoto(post.id, email, username);
      if (success) {
        if (selectedPost?.id === post.id) {
          setSelectedPost(null);
        }
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      }
    } catch (err) {
      console.error("Failed to delete photo:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3.5 space-y-3.5">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="break-inside-avoid rounded-2xl bg-zinc-900/40 border border-white/[0.04] overflow-hidden animate-pulse"
            style={{ height: `${200 + (idx % 4) * 55}px` }}
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-28 text-center flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-300">No photos yet</p>
          <p className="text-xs text-zinc-500">
            Be the first to add a photo to the stream
          </p>
        </div>
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Upload photo
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Editorial Masonry Grid */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3.5 space-y-3.5">
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
              className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.06] hover:border-white/20 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl select-none"
            >
              {/* Media Image */}
              <div className="relative w-full overflow-hidden bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrl}
                  alt={post.caption || "Photo"}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />

                {/* Subtle dark gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3" />

                {/* Top overlay action (Owner delete button & timestamp) */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, post)}
                      disabled={deletingId === post.id}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-600/90 text-zinc-300 hover:text-white transition-colors backdrop-blur-md border border-white/10 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-zinc-400">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>

                {/* Bottom caption overlay (if present) */}
                {post.caption && (
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <p className="text-xs text-white/90 font-medium line-clamp-2 leading-snug drop-shadow-sm">
                      {post.caption}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cinematic Fullscreen Lightbox Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setSelectedPost(null)}
        >
          {/* Inner Lightbox Container */}
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Minimal Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-zinc-950/80">
              <span className="text-xs text-zinc-400">
                {formatRelativeTime(selectedPost.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPost.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Original ↗
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* High-Res Image Canvas */}
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPost.mediaUrl}
                alt={selectedPost.caption || "Full resolution photo"}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg select-none"
              />
            </div>

            {/* Lightbox Caption (if present) */}
            {selectedPost.caption && (
              <div className="px-5 py-3.5 bg-zinc-950 border-t border-white/[0.08]">
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {selectedPost.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
