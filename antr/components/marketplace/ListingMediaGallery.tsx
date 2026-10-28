"use client";

import React, { useState } from "react";
import ImageZoomModal from "./ImageZoomModal";

interface ListingMediaGalleryProps {
  mediaUrls?: string[];
  imageUrl?: string | null;
  title: string;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".mkv") ||
    lower.includes("/video/")
  );
}

export default function ListingMediaGallery({
  mediaUrls,
  imageUrl,
  title,
}: ListingMediaGalleryProps) {
  // Normalize items array
  const allMedia: string[] = [];
  if (mediaUrls && mediaUrls.length > 0) {
    mediaUrls.forEach((u) => {
      if (u && u.trim() && !allMedia.includes(u.trim())) {
        allMedia.push(u.trim());
      }
    });
  } else if (imageUrl && imageUrl.trim()) {
    allMedia.push(imageUrl.trim());
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (allMedia.length === 0) {
    return null;
  }

  const currentUrl = allMedia[currentIndex] || allMedia[0];
  const isVideo = isVideoUrl(currentUrl);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0));
  };

  const handleSelectDot = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex(index);
  };

  return (
    <>
      <div className="relative w-full h-48 sm:h-52 rounded-xl overflow-hidden bg-zinc-950 border border-white/5 group select-none">
        {/* Media Content */}
        {isVideo ? (
          <video
            key={currentUrl}
            src={currentUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={currentUrl}
            src={currentUrl}
            alt={`${title} - photo ${currentIndex + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsZoomOpen(true);
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
            loading="lazy"
          />
        )}

        {/* Zoom Quick Badge */}
        {!isVideo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsZoomOpen(true);
            }}
            className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white border border-white/15 backdrop-blur-md text-[10px] font-mono flex items-center gap-1.5 shadow-lg transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105"
            title="Click photo to zoom"
          >
            <span>🔍</span>
            <span className="font-semibold text-emerald-400">Zoom</span>
          </button>
        )}

      {/* Media Type & Counter Badge */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
        {isVideo && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1 shadow-md">
            <span>▶</span>
            <span>VIDEO</span>
          </span>
        )}
        {allMedia.length > 1 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/75 text-white border border-white/10 backdrop-blur-md shadow-md">
            {currentIndex + 1}/{allMedia.length}
          </span>
        )}
      </div>

      {/* Navigation Arrows for multiple files */}
      {allMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center text-xs font-bold transition-all border border-white/15 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-md cursor-pointer z-10 hover:scale-110 active:scale-95"
            title="Previous media"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center text-xs font-bold transition-all border border-white/15 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-md cursor-pointer z-10 hover:scale-110 active:scale-95"
            title="Next media"
          >
            ›
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md z-10 border border-white/10">
            {allMedia.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={(e) => handleSelectDot(e, idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-4 h-1.5 bg-emerald-400"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
                title={`View slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>

      {/* Fullscreen Interactive Lightbox Zoom Modal */}
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        images={allMedia}
        initialIndex={currentIndex}
        title={title}
      />
    </>
  );
}
