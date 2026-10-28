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

const CATEGORIES = [
  { id: "Textbooks", label: "Textbooks", icon: "📚" },
  { id: "Electronics", label: "Electronics", icon: "💻" },
  { id: "Cycles", label: "Cycles", icon: "🚲" },
  { id: "Hostel", label: "Hostel Gear", icon: "🛏️" },
  { id: "Lab Kits", label: "Lab Kits", icon: "🔬" },
  { id: "Other", label: "Other", icon: "📦" },
];

const CONDITION_PRESETS = ["Brand New", "Like New", "Gently Used", "Fair Condition"];
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

  // Close on ESC & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
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
        setError("Only images (JPG, PNG, WebP) or videos (MP4) are supported.");
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
      setError(`Added ${validNewMedia.length} files. Maximum ${MAX_SLOTS} media allowed.`);
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

  const handleApplyCondition = (cond: string) => {
    if (!description.trim()) {
      setDescription(`Condition: ${cond}. `);
    } else if (!description.toLowerCase().includes(cond.toLowerCase())) {
      setDescription((prev) => `Condition: ${cond}. ${prev.replace(/^Condition:\s*[^.]+\.\s*/i, "")}`);
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

      setUploadStatusText("Publishing listing to campus...");

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Outer Click Backdrop */}
      <div
        className="absolute inset-0"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Dialog Card: Centered & Elevated on all screen sizes */}
      <div role="dialog" aria-modal="true" aria-labelledby="post-item-title" className="relative w-full max-w-xl bg-[#0c0e15] border border-white/10 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.95)] z-10 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-scaleUp">
        
        {/* Modal header */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0c0e15]/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0">
              🏷️
            </div>
            <div className="min-w-0">
              <h2 id="post-item-title" className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Sell on Campus
              </h2>
              {sellerName && (
                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                  Seller: <strong className="text-emerald-400 font-medium">@{sellerName}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer active:scale-90 disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shrink-0 animate-fadeIn">
            <span className="shrink-0 text-sm">⚠️</span>
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*,video/*"
          multiple
          className="hidden"
        />

        {/* Scrollable Form Body: Streamlined Compact Heights */}
        <form
          id="post-item-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 space-y-3.5 overscroll-contain scrollbar-thin"
        >
          {/* Section 1: Compact Horizontal Media Strip (Saves 140px vertical space on mobile!) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                  Photos &amp; Videos
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  ({mediaList.length}/{MAX_SLOTS})
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {mediaList.length === 0 ? "First is cover" : "Tap slot to replace"}
              </span>
            </div>

            {/* Horizontal Scrollable Media Strip: Takes only 80px! */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-2 rounded-2xl border transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-950/20"
                  : "border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                {Array.from({ length: MAX_SLOTS }).map((_, slotIdx) => {
                  const mediaItem = mediaList[slotIdx];
                  const isCover = slotIdx === 0;

                  return (
                    <div
                      key={slotIdx}
                      className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden transition-all select-none ${
                        mediaItem
                          ? "bg-zinc-900 border border-white/20 shadow-sm"
                          : slotIdx === mediaList.length
                          ? "border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.1] cursor-pointer"
                          : "border border-dashed border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => {
                        if (!mediaItem && !isSubmitting) {
                          triggerUpload();
                        } else if (mediaItem && !isSubmitting) {
                          triggerUpload(slotIdx);
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
                              alt={`Item photo ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Cover Badge on Slot 1 */}
                          {isCover && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500 text-zinc-950 shadow-md">
                              Cover
                            </span>
                          )}

                          {/* Always-Visible Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia(slotIdx);
                            }}
                            disabled={isSubmitting}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/90 hover:bg-rose-600 text-zinc-200 hover:text-white border border-white/20 shadow-md flex items-center justify-center text-[9px] font-bold active:scale-90 transition-all cursor-pointer z-10"
                            title="Remove file"
                            aria-label="Remove photo"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        /* Empty Slot Box */
                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center select-none">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              slotIdx === mediaList.length
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.05] text-zinc-400"
                            }`}
                          >
                            +
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400 mt-1 font-medium">
                            {isCover ? "Cover" : `#${slotIdx + 1}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2">
                <span className="text-[11px] text-zinc-400">
                  {mediaList.length === 0
                    ? "Add clear photos to help buyers decide"
                    : `${MAX_SLOTS - mediaList.length} ${MAX_SLOTS - mediaList.length === 1 ? "slot" : "slots"} left · first photo is the cover`}
                </span>
                <button
                  type="button"
                  onClick={() => triggerUpload()}
                  disabled={isSubmitting || mediaList.length >= MAX_SLOTS}
                  className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {mediaList.length === 0 ? "+ Add media" : "+ Add more"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Title */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
              Item Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engineering Mathematics Book, Avon Cycle"
              maxLength={100}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-emerald-500/60 focus:bg-white/[0.06] text-white placeholder-zinc-500 text-base sm:text-sm font-medium outline-none transition-all shadow-inner"
            />
          </div>

          {/* Section 3: Category Pills (Single line scroll on mobile) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
              Category <span className="text-emerald-400">*</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20 border border-emerald-400"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Price & Negotiation Side-by-Side */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Price */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Price (₹) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full h-11 pl-8 pr-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-emerald-500/60 focus:bg-white/[0.06] text-white placeholder-zinc-500 text-base sm:text-sm font-mono font-bold outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Negotiation Toggle Button */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Flexibility
              </label>
              <button
                type="button"
                onClick={() => setBargainAvailable(!bargainAvailable)}
                className={`w-full h-11 px-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer active:scale-95 ${
                  bargainAvailable
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold"
                    : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="truncate text-xs font-semibold">
                  {bargainAvailable ? "🤝 Negotiable" : "🔒 Fixed Price"}
                </span>
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                    bargainAvailable ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {bargainAvailable ? "✓" : "–"}
                </span>
              </button>
            </div>
          </div>

          {/* Section 5: Campus Handover Location */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
              Handover Location <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={hostelName}
                onChange={(e) => setHostelName(e.target.value)}
                placeholder="Hostel / Block"
                maxLength={40}
                required
                className="w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-emerald-500/60 focus:bg-white/[0.06] text-white placeholder-zinc-500 text-base sm:text-sm outline-none transition-all shadow-inner font-medium"
              />
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="Room No"
                maxLength={25}
                required
                className="w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-emerald-500/60 focus:bg-white/[0.06] text-white placeholder-zinc-500 text-base sm:text-sm outline-none transition-all shadow-inner font-medium"
              />
            </div>
          </div>

          {/* Section 6: Note & Item Condition */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Condition &amp; Note <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
            </div>

            {/* Quick condition tags */}
            <div className="flex flex-wrap gap-1 pb-0.5">
              {CONDITION_PRESETS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => handleApplyCondition(cond)}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-300 border border-white/[0.06] text-[10px] font-mono transition-all cursor-pointer active:scale-95"
                >
                  + {cond}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Clean pages with notes, ready for pickup."
              className="w-full p-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-emerald-500/60 focus:bg-white/[0.06] text-white placeholder-zinc-500 text-base sm:text-sm outline-none transition-all resize-none shadow-inner"
            />
          </div>
        </form>

        {/* BOTTOM ACTION BAR: Elevated and Prominent */}
        <div className="border-t border-white/[0.08] p-3 sm:px-6 sm:py-3.5 flex items-center gap-2.5 shrink-0 bg-[#0c0e15]/98">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-1/3 sm:w-auto sm:px-5 h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="post-item-form"
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span className="truncate">{uploadStatusText || "Publishing..."}</span>
              </>
            ) : (
              <span>Publish Listing {price ? `(₹${price})` : ""} →</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
