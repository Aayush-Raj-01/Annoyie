"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  createMarketplaceListing,
  uploadMarketplaceMedia,
  notifyMarketplaceListingChange,
  MarketplaceListing,
} from "@/lib/api/marketplace";

interface PostItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (listing: MarketplaceListing) => void;
  userId: number;
  sellerName?: string;
  userEmail?: string;
}

interface SelectedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

const CATEGORIES = ["Textbooks", "Electronics", "Cycles", "Hostel", "Lab Kits", "Other"];
const MAX_SLOTS = 6;

export default function PostItemModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  sellerName,
}: PostItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceSlotIndexRef = useRef<number | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Textbooks");
  const [price, setPrice] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [bargainAvailable, setBargainAvailable] = useState(true);
  const [description, setDescription] = useState("");

  // Media state (up to 6 slots)
  const [mediaList, setMediaList] = useState<SelectedMedia[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Clean up object URLs on unmount / change
  useEffect(() => {
    return () => {
      mediaList.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
  }, [mediaList]);

  if (!isOpen) return null;

  const handleFilesSelect = (files: FileList | File[], replaceIndex?: number | null) => {
    setError(null);
    const filesArray = Array.from(files);
    if (filesArray.length === 0) return;

    // Handle single slot replacement
    if (typeof replaceIndex === "number" && replaceIndex >= 0 && replaceIndex < mediaList.length) {
      const file = filesArray[0];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setError("Only images or videos are supported.");
        return;
      }
      if (file.size > 60 * 1024 * 1024) {
        setError("Selected file exceeds 60MB limit.");
        return;
      }

      const updated = [...mediaList];
      URL.revokeObjectURL(updated[replaceIndex].previewUrl);
      updated[replaceIndex] = {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
      };
      setMediaList(updated);
      return;
    }

    // Normal multi-file addition to slots
    const remainingSlots = MAX_SLOTS - mediaList.length;
    if (remainingSlots <= 0) {
      setError(`All ${MAX_SLOTS} media slots are full. Remove an item to add a new one.`);
      return;
    }

    const validNewMedia: SelectedMedia[] = [];

    for (const file of filesArray) {
      if (validNewMedia.length >= remainingSlots) break;

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        setError("Only images (JPG, PNG, WebP) or videos (MP4, WebM) are allowed.");
        continue;
      }

      if (file.size > 60 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 60MB limit.`);
        continue;
      }

      validNewMedia.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
      });
    }

    if (filesArray.length > remainingSlots) {
      setError(`Added ${validNewMedia.length} files. Maximum ${MAX_SLOTS} photos/videos allowed.`);
    }

    setMediaList((prev) => [...prev, ...validNewMedia]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelect(e.target.files, replaceSlotIndexRef.current);
    }
    replaceSlotIndexRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (slotIndex?: number) => {
    if (typeof slotIndex === "number" && slotIndex < mediaList.length) {
      replaceSlotIndexRef.current = slotIndex;
    } else {
      replaceSlotIndexRef.current = null;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter the item name");
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setError("Please enter a valid price (₹0 for free)");
      return;
    }

    if (!hostelName.trim() || !roomNo.trim()) {
      setError("Hostel and Room No are required for campus handover");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];

      if (mediaList.length > 0) {
        for (let i = 0; i < mediaList.length; i++) {
          const item = mediaList[i];
          setUploadStatusText(`Uploading media ${i + 1}/${mediaList.length}...`);
          const res = await uploadMarketplaceMedia(item.file);
          if (res?.url) {
            uploadedUrls.push(res.url);
          }
        }
      }

      setUploadStatusText("Publishing listing...");

      const createdListing = await createMarketplaceListing(userId, {
        title: title.trim(),
        category,
        price: numericPrice,
        description: description.trim(),
        imageUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        mediaUrls: uploadedUrls,
        bargainAvailable,
        hostelName: hostelName.trim(),
        roomNo: roomNo.trim(),
      });

      // Cleanup local state
      mediaList.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      setMediaList([]);
      setTitle("");
      setPrice("");
      setHostelName("");
      setRoomNo("");
      setBargainAvailable(true);
      setDescription("");
      setCategory("Textbooks");

      // Notify globally so all pages update reactively without reload
      notifyMarketplaceListingChange({ type: "created", listing: createdListing });

      onSuccess(createdListing);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish listing";
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadStatusText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Outer Click Backdrop */}
      <div
        className="absolute inset-0"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="relative w-full max-w-xl bg-[#090b10] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] z-10 animate-scaleUp max-h-[94vh] overflow-y-auto scrollbar-thin">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm">
              🏷️
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Sell on Campus</h2>
              {sellerName && (
                <span className="text-[11px] text-zinc-400">
                  Seller: <strong className="text-emerald-400 font-medium">{sellerName}</strong>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Multi-Part Media Upload Showcase (6 Dedicated Slots) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">Photos & Videos</span>
                {/* Visual Dot Progress */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i < mediaList.length
                          ? "bg-emerald-400 scale-110"
                          : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  ({mediaList.length}/{MAX_SLOTS})
                </span>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                  mediaList.length >= 4 && mediaList.length <= 6
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                {mediaList.length >= 4 ? "✓ 4-6 Media Ready" : "4-6 Photos recommended"}
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />

            {/* 6-Part Multi-Slot Visual Grid */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-2.5 rounded-2xl border transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-950/20"
                  : "border-white/[0.08] bg-zinc-900/40"
              }`}
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Array.from({ length: MAX_SLOTS }).map((_, slotIdx) => {
                  const mediaItem = mediaList[slotIdx];
                  const isCover = slotIdx === 0;

                  return (
                    <div
                      key={slotIdx}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all group ${
                        mediaItem
                          ? "bg-zinc-900 border border-white/15 shadow-sm"
                          : "border-2 border-dashed border-zinc-700/60 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-zinc-800/40 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!mediaItem && !isSubmitting) {
                          triggerUpload();
                        }
                      }}
                    >
                      {mediaItem ? (
                        <>
                          {mediaItem.type === "video" ? (
                            <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
                              <video
                                src={mediaItem.previewUrl}
                                className="w-full h-full object-cover opacity-85"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold pl-0.5">
                                  ▶
                                </span>
                              </div>
                              <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono bg-black/80 text-white font-bold">
                                VID
                              </span>
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaItem.previewUrl}
                              alt={`Slot ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Cover Badge on Slot 1 */}
                          {isCover && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500 text-zinc-950 shadow-md">
                              Cover
                            </span>
                          )}

                          {/* Hover Overlay with Remove / Replace buttons */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerUpload(slotIdx);
                              }}
                              disabled={isSubmitting}
                              className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-[10px] transition-colors"
                              title="Replace file"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMedia(slotIdx);
                              }}
                              disabled={isSubmitting}
                              className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] transition-colors"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Empty Slot Box */
                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center select-none">
                          <span className="w-5 h-5 rounded-full bg-white/[0.05] group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-zinc-400 flex items-center justify-center text-xs font-bold transition-colors">
                            +
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 mt-1">
                            {isCover ? "1. Cover" : `#${slotIdx + 1}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick-Action Bar */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400">
                <span className="hidden sm:inline">
                  Drag & drop multiple files
                </span>
                <button
                  type="button"
                  onClick={() => triggerUpload()}
                  disabled={isSubmitting || mediaList.length >= MAX_SLOTS}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium transition-colors cursor-pointer disabled:opacity-40 text-[11px] ml-auto flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Add {mediaList.length === 0 ? "Photos / Videos" : "More"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Streamlined Details Section ("Make Details Less") */}
          <div className="space-y-3 pt-1">
            {/* 1. Item Name */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling?"
                maxLength={100}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs sm:text-sm outline-none transition-all font-medium"
              />
            </div>

            {/* 2. Compact Price + Bargain Toggle (Side by Side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Price */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price (₹0 for free) *"
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs sm:text-sm font-mono outline-none transition-all"
                />
              </div>

              {/* Bargain Negotiable Toggle Button */}
              <button
                type="button"
                onClick={() => setBargainAvailable(!bargainAvailable)}
                className={`px-3 py-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                  bargainAvailable
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-zinc-200 text-zinc-900 "
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{bargainAvailable ? "🤝" : "🔒"}</span>
                  <span className="font-semibold">
                    {bargainAvailable ? "Bargain Negotiable" : "Fixed Price"}
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-80"></span>
              </button>
            </div>

            {/* 3. Category Pills */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-medium text-zinc-400 mr-1">Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    category === cat
                      ? "bg-zinc-200 text-zinc-900 font-bold "
                      : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 4. Campus Location: Hostel & Room (Inline Row) */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={hostelName}
                onChange={(e) => setHostelName(e.target.value)}
                placeholder="Hostel (e.g. Block 4) *"
                maxLength={40}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs outline-none transition-all"
              />
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="Room No (e.g. 302) *"
                maxLength={25}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs outline-none transition-all"
              />
            </div>

            {/* 5. Short Note (Optional) */}
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Short note / item condition (optional)..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>{uploadStatusText || "Publishing..."}</span>
                </>
              ) : (
                <span>Publish Item →</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
