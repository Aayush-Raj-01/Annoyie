"use client";

import React, { useState, useRef } from "react";
import { uploadGalleryPhoto, GalleryPost } from "@/lib/api/gallery";
import { UserProfile } from "@/app/lib/auth";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (post: GalleryPost) => void;
  currentUser: UserProfile | null;
}

export default function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit");
      return;
    }
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      handleFileSelect(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a photo");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const email = currentUser?.email || "";
      const username = currentUser?.anonymousName || "Anonymous";

      const createdPost = await uploadGalleryPhoto(file, caption, email, username);
      handleClearFile();
      setCaption("");
      onSuccess(createdPost);
      onClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Outer Click Backdrop */}
      <div
        className="absolute inset-0"
        onClick={!isUploading ? onClose : undefined}
      />

      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl z-10 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white">Upload photo</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
          />

          {/* Photo Drop Zone or Preview */}
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                isDragging
                  ? "border-zinc-400 bg-white/[0.04]"
                  : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 text-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs font-medium text-zinc-300">
                Choose a photo or drag & drop
              </p>
              <p className="text-[10px] text-zinc-500">
                JPEG, PNG, WEBP, GIF
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-h-64 flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-64 w-full object-contain bg-zinc-950"
              />
              <button
                type="button"
                onClick={handleClearFile}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[11px] backdrop-blur-md border border-white/10 transition-colors"
              >
                Change
              </button>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <textarea
              rows={2}
              maxLength={280}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption... (optional)"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-black text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isUploading ? "Uploading..." : "Post photo"}
          </button>
        </form>
      </div>
    </div>
  );
}
