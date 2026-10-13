"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
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

export default function ImageZoomModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
}: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [pullDownY, setPullDownY] = useState(0);

  // Drag & touch tracking refs
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, distance: 0 });
  const hasMovedRef = useRef(false);
  const lastTapRef = useRef(0);

  // Sync index and reset transforms when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setPullDownY(0);
      setIsDragging(false);
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setPullDownY(0);
    setIsDragging(false);
  }, []);

  const handlePrev = useCallback(() => {
    resetTransform();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length, resetTransform]);

  const handleNext = useCallback(() => {
    resetTransform();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length, resetTransform]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        handlePrev();
      } else if (e.key === "ArrowRight" && images.length > 1) {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(Math.round((s + 0.25) * 100) / 100, 4));
      } else if (e.key === "-") {
        setScale((s) => {
          const next = Math.max(Math.round((s - 0.25) * 100) / 100, 0.4);
          if (next <= 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === "0") {
        resetTransform();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, images.length, resetTransform]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentUrl = images[currentIndex] || images[0];
  const isVideo = isVideoUrl(currentUrl);

  // Zoom control helpers
  const zoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((s) => Math.min(Math.round((s + 0.25) * 100) / 100, 4));
  };

  const zoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((s) => {
      const next = Math.max(Math.round((s - 0.25) * 100) / 100, 0.4);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const setScalePreset = (targetScale: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(targetScale);
    if (targetScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedRef.current) return;

    const now = Date.now();
    // Fast double tap or click toggle
    if (now - lastTapRef.current < 350) {
      if (scale !== 1) {
        resetTransform();
      } else {
        setScale(2.2);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single click toggle on desktop/tablets
      if (scale === 1) {
        setScale(2.2);
      } else {
        resetTransform();
      }
    }
  };

  // Mouse drag handlers for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1 || isVideo) return;
    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    setPosition({
      x: dragStartRef.current.posX + deltaX,
      y: dragStartRef.current.posY + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch handlers: pan when zoomed, pull-down to close when scale <= 1, pinch to zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isVideo) return;
    hasMovedRef.current = false;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        posX: position.x,
        posY: position.y,
        distance: 0,
      };
      if (scale > 1) {
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      // 2 fingers: pinch gesture start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.distance = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isVideo) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const deltaX = t.clientX - touchStartRef.current.x;
      const deltaY = t.clientY - touchStartRef.current.y;

      if (scale > 1 && isDragging) {
        if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
          hasMovedRef.current = true;
        }

        setPosition({
          x: touchStartRef.current.posX + deltaX,
          y: touchStartRef.current.posY + deltaY,
        });
      } else if (scale <= 1) {
        // Natural mobile pull-down to close gesture
        if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
          setPullDownY(deltaY);
        }
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom (allows shrinking down to 0.4 as well as zooming in)
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);

      if (touchStartRef.current.distance > 0) {
        const factor = distance / touchStartRef.current.distance;
        setScale((prev) => {
          const next = Math.min(Math.max(prev * factor, 0.4), 4);
          if (next <= 1) setPosition({ x: 0, y: 0 });
          return next;
        });
        hasMovedRef.current = true;
      }
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);

    // If pulling down on phone, close if pulled past threshold
    if (pullDownY > 75) {
      onClose();
      return;
    }
    setPullDownY(0);

    // If at scale <= 1, check for left/right swipe to switch images
    if (scale <= 1.05 && images.length > 1 && !hasMovedRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Horizontal swipe threshold: 45px
      if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 55) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  // Mouse Wheel zoom (supports zooming out down to 0.4 as well)
  const handleWheel = (e: React.WheelEvent) => {
    if (isVideo) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setScale((s) => Math.min(Math.round((s + 0.2) * 100) / 100, 4));
    } else {
      // Zoom out (shrink)
      setScale((s) => {
        const next = Math.max(Math.round((s - 0.2) * 100) / 100, 0.4);
        if (next <= 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-between bg-black/95 backdrop-blur-2xl select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Header Control Bar */}
      <div
        className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-zinc-950/85 border-b border-white/[0.08] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs sm:text-sm border border-emerald-500/30 shrink-0">
            🔍
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-md">
              {title || "Photo Preview"}
            </h3>
            {images.length > 1 && (
              <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-semibold block">
                {currentIndex + 1} of {images.length}
              </span>
            )}
          </div>
        </div>

        {/* Desktop / Tablet Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isVideo && (
            <div className="hidden sm:flex items-center bg-zinc-900 border border-white/10 rounded-full p-1 gap-1 shadow-inner">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= 0.4}
                className="w-8 h-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                title="Zoom out / Make smaller (−)"
              >
                −
              </button>

              {/* Quick Size Presets */}
              <button
                type="button"
                onClick={(e) => setScalePreset(0.5, e)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  scale === 0.5
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
                title="Small (50%)"
              >
                50%
              </button>

              <button
                type="button"
                onClick={resetTransform}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  scale === 1
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
                title="Fit (100%)"
              >
                100%
              </button>

              <button
                type="button"
                onClick={(e) => setScalePreset(2, e)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  scale === 2
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
                title="Zoomed (200%)"
              >
                200%
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 4}
                className="w-8 h-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                title="Zoom in (+)"
              >
                +
              </button>
            </div>
          )}

          {/* Current Scale Pill for Mobile */}
          {!isVideo && (
            <div className="sm:hidden px-2 py-1 rounded-full bg-zinc-900 border border-white/10 text-[10px] font-mono font-bold text-emerald-400">
              {Math.round(scale * 100)}%
            </div>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center text-sm font-mono transition-all cursor-pointer shadow-md active:scale-95 ml-1"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Center Image Canvas */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6 cursor-default"
        onClick={onClose}
        onWheel={handleWheel}
      >
        {/* Navigation Buttons for multiple files */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white flex items-center justify-center text-xl sm:text-2xl font-bold transition-all border border-white/15 backdrop-blur-md shadow-2xl cursor-pointer hover:scale-110 active:scale-95"
              title="Previous photo (←)"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white flex items-center justify-center text-xl sm:text-2xl font-bold transition-all border border-white/15 backdrop-blur-md shadow-2xl cursor-pointer hover:scale-110 active:scale-95"
              title="Next photo (→)"
            >
              ›
            </button>
          </>
        )}

        {/* Media Rendering with Pull-down and Pan transforms */}
        <div
          className="relative max-h-full max-w-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform:
              scale > 1
                ? `translate3d(${position.x}px, ${position.y}px, 0)`
                : `translate3d(0, ${pullDownY}px, 0)`,
            opacity: pullDownY > 0 ? Math.max(1 - pullDownY / 260, 0.4) : 1,
            transition: isDragging || pullDownY > 0 ? "none" : "transform 200ms ease-out, opacity 200ms ease-out",
          }}
        >
          {isVideo ? (
            <video
              key={currentUrl}
              src={currentUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[72vh] max-w-[92vw] rounded-xl shadow-2xl bg-black"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentUrl}
              src={currentUrl}
              alt={title || "Zoomed Photo"}
              onClick={handleImageClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging || pullDownY > 0 ? "none" : "transform 200ms ease-out",
              }}
              className={`max-h-[72vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl select-none touch-none ${
                scale > 1
                  ? isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : scale < 1
                  ? "cursor-zoom-in"
                  : "cursor-zoom-in"
              }`}
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* MOBILE-FRIENDLY THUMB BAR (Visible on Phones: Easy Thumb Controls) */}
      {!isVideo && (
        <div
          className="sm:hidden relative z-30 px-3 pb-2 pt-1 flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center bg-zinc-900/95 border border-white/15 rounded-2xl p-1 shadow-2xl backdrop-blur-xl gap-1">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.4}
              className="w-9 h-9 rounded-xl bg-zinc-800 text-white font-bold text-base flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Make Smaller (−)"
            >
              −
            </button>

            <button
              type="button"
              onClick={(e) => setScalePreset(0.5, e)}
              className={`px-2.5 h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all active:scale-95 ${
                scale === 0.5
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-extrabold"
                  : "text-zinc-300 hover:text-white bg-zinc-800/80"
              }`}
              title="Small (50%)"
            >
              Small
            </button>

            <button
              type="button"
              onClick={resetTransform}
              className={`px-2.5 h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all active:scale-95 ${
                scale === 1
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-extrabold"
                  : "text-zinc-300 hover:text-white bg-zinc-800/80"
              }`}
              title="Fit Screen (100%)"
            >
              Fit
            </button>

            <button
              type="button"
              onClick={(e) => setScalePreset(2, e)}
              className={`px-2.5 h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all active:scale-95 ${
                scale === 2
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-extrabold"
                  : "text-zinc-300 hover:text-white bg-zinc-800/80"
              }`}
              title="Zoom In (200%)"
            >
              2x
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 4}
              className="w-9 h-9 rounded-xl bg-zinc-800 text-white font-bold text-base flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom in (+)"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar: Thumbnails & Navigation Hint */}
      <div
        className="relative z-30 px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-950/85 border-t border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 sm:gap-2 text-center sm:text-left">
          <span className="text-emerald-400">💡</span>
          <span>
            {scale > 1
              ? "Drag to pan • Tap to reset"
              : scale < 1
              ? "Small preview • Tap to fit"
              : "Tap to zoom • Pinch to resize • Pull down to exit"}
          </span>
          <span className="hidden sm:inline text-zinc-600">• Esc to close</span>
        </div>

        {/* Thumbnails strip for multiple images */}
        {images.length > 1 && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full py-0.5">
            {images.map((url, idx) => {
              const isSelected = currentIndex === idx;
              const isVid = isVideoUrl(url);

              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => {
                    resetTransform();
                    setCurrentIndex(idx);
                  }}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative ${
                    isSelected
                      ? "border-emerald-400 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                  }`}
                  title={`View photo ${idx + 1}`}
                >
                  {isVid ? (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-xs text-emerald-400">
                      ▶
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
