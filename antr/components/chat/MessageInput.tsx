"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import MediaPicker from "./MediaPicker";
import UserAvatar from "./UserAvatar";

export interface MentionMember {
  id?: number;
  username: string;
  avatarUrl?: string;
  studentYear?: number;
}

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  isBlocked?: boolean;
  isLoggedIn?: boolean;
  isYearRestricted?: boolean;
  requiredYear?: number;
  placeholder?: string;
  senderName: string;
  roomMembers?: MentionMember[];
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  isBlocked = false,
  isLoggedIn = true,
  isYearRestricted = false,
  requiredYear,
  placeholder = "Type a message...",
  senderName: _senderName,
  roomMembers = [],
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"stickers" | "gifs" | "emojis">("stickers");

  // Mention State
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const lastSendTimeRef = useRef(0);

  useEffect(() => {
    if (!isBlocked && isLoggedIn) {
      inputRef.current?.focus();
    }
  }, [isBlocked, isLoggedIn]);

  // Close mention popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionPopoverRef.current &&
        !mentionPopoverRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMentionPicker(false);
      }
    };
    if (showMentionPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMentionPicker]);

  const isActuallyDisabled = disabled || isBlocked || !isLoggedIn;

  // Filter room members based on mentionQuery
  const filteredMembers = React.useMemo(() => {
    if (!roomMembers || roomMembers.length === 0) return [];
    const q = mentionQuery.toLowerCase().trim();
    if (!q) return roomMembers.slice(0, 8);
    return roomMembers
      .filter((m) => m.username.toLowerCase().includes(q))
      .slice(0, 8);
  }, [roomMembers, mentionQuery]);

  const checkMentionTrigger = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex !== -1) {
      // Must be at start or preceded by whitespace
      if (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1])) {
        const query = textBeforeCursor.slice(atIndex + 1);
        if (!query.includes(" ")) {
          setMentionQuery(query);
          setShowMentionPicker(true);
          setSelectedMentionIndex(0);
          return;
        }
      }
    }
    setShowMentionPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart ?? val.length;
    checkMentionTrigger(val, cursor);
  };

  const handleSelectMention = (member: MentionMember) => {
    const cursor = inputRef.current?.selectionStart ?? content.length;
    const textBefore = content.slice(0, cursor);
    const atIndex = textBefore.lastIndexOf("@");
    if (atIndex !== -1) {
      const prefix = textBefore.slice(0, atIndex);
      const suffix = content.slice(cursor);
      const space = suffix.startsWith(" ") ? "" : " ";
      const newText = `${prefix}@${member.username}${space}${suffix}`;
      setContent(newText);
      setShowMentionPicker(false);
      setTimeout(() => {
        if (inputRef.current) {
          const newCursor = atIndex + member.username.length + 1 + space.length;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 10);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = content.trim();
    if (!text || isActuallyDisabled) return;

    // De-bounce rapid submissions
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSendTimeRef.current < 400) {
      return;
    }
    isSubmittingRef.current = true;
    lastSendTimeRef.current = now;

    setContent("");
    setShowMediaPicker(false);
    setShowMentionPicker(false);

    try {
      onSendMessage(text);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionPicker && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const target = filteredMembers[selectedMentionIndex];
        if (target) {
          handleSelectMention(target);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionPicker(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectMedia = (mediaToken: string) => {
    if (isActuallyDisabled) return;
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSendTimeRef.current < 400) return;
    isSubmittingRef.current = true;
    lastSendTimeRef.current = now;
    setShowMediaPicker(false);
    try {
      onSendMessage(mediaToken);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 300);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    if (isActuallyDisabled) return;
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const openPickerWithTab = (tab: "stickers" | "gifs" | "emojis") => {
    if (isActuallyDisabled) return;
    if (showMediaPicker && pickerTab === tab) {
      setShowMediaPicker(false);
    } else {
      setPickerTab(tab);
      setShowMediaPicker(true);
      setShowMentionPicker(false);
    }
  };

  const triggerMentionButton = () => {
    if (isActuallyDisabled) return;
    setShowMediaPicker(false);
    const cursor = inputRef.current?.selectionStart ?? content.length;
    const textBefore = content.slice(0, cursor);
    const textAfter = content.slice(cursor);
    const needsSpace = textBefore.length > 0 && !textBefore.endsWith(" ");
    const inserted = needsSpace ? " @" : "@";
    const newText = `${textBefore}${inserted}${textAfter}`;
    setContent(newText);
    setMentionQuery("");
    setShowMentionPicker(true);
    setSelectedMentionIndex(0);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = cursor + inserted.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  // If user is not logged in, render locked banner
  if (!isLoggedIn) {
    return (
      <div className="relative border-t border-white/[0.06] bg-[#090b10]/95 backdrop-blur-xl px-3 pt-2.5 pb-20 sm:px-6 sm:pt-2.5 sm:pb-20 z-20">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-zinc-900/80 border border-white/[0.08] rounded-2xl shadow-xl shadow-black/40">
          <div className="flex items-center gap-3 min-w-0 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
              🔒
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                Log in to chat
              </p>
              <p className="text-[11px] text-zinc-400">
                You must be signed in with an account to send messages in channels and direct messages.
              </p>
            </div>
          </div>

          <Link
            href="/authentication"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Sign In to Chat</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // If room is restricted to a different academic year, render locked banner
  if (isYearRestricted) {
    const yrSuffix = requiredYear === 1 ? "st" : requiredYear === 2 ? "nd" : requiredYear === 3 ? "rd" : "th";
    return (
      <div className="relative border-t border-white/[0.06] bg-[#090b10]/95 backdrop-blur-xl px-3 pt-2.5 pb-20 sm:px-6 sm:pt-2.5 sm:pb-20 z-20">
        <div className="w-full flex items-center justify-between gap-3 p-3.5 bg-zinc-900/60 border border-white/[0.08] rounded-2xl text-xs text-zinc-400 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-sm shrink-0">
              🔒
            </span>
            <span className="truncate">
              This group is exclusively for <strong className="text-zinc-200">{requiredYear}{yrSuffix} Year</strong> students.
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 shrink-0">Locked</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-t border-white/[0.06] bg-[#090b10]/95 backdrop-blur-xl px-3 pt-2.5 pb-20 sm:px-6 sm:pt-2.5 sm:pb-20 z-20">
      {/* Tabbed Sticker / GIF / Emoji Picker Drawer */}
      {!isActuallyDisabled && (
        <MediaPicker
          isOpen={showMediaPicker}
          initialTab={pickerTab}
          onClose={() => setShowMediaPicker(false)}
          onSelectMedia={handleSelectMedia}
          onSelectEmoji={handleSelectEmoji}
        />
      )}

      {/* Floating Tag/Mention Autocomplete Popover */}
      {showMentionPicker && !isActuallyDisabled && (
        <div className="w-full relative">
          <div
            ref={mentionPopoverRef}
            className="absolute bottom-3 left-0 w-72 max-w-[90vw] p-1.5 rounded-2xl bg-[#0e111a]/95 border border-white/10 backdrop-blur-xl shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="px-2.5 py-1 text-[10px] font-mono font-semibold text-zinc-400 flex items-center justify-between border-b border-white/[0.06] mb-1">
              <span>TAG MEMBER</span>
              <span className="text-emerald-400 font-bold">@mention</span>
            </div>
            {filteredMembers.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
                {filteredMembers.map((member, idx) => {
                  const isSelected = idx === selectedMentionIndex;
                  return (
                    <button
                      key={member.username}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectMention(member)}
                      className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/20 text-white border border-emerald-500/30"
                          : "hover:bg-white/[0.06] text-zinc-300"
                      }`}
                    >
                      <UserAvatar src={member.avatarUrl} name={member.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          <span className="text-emerald-400">@</span>
                          <span>{member.username}</span>
                        </div>
                        {member.studentYear && (
                          <div className="text-[10px] font-mono text-zinc-500">
                            Year {member.studentYear}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                          ↵ Tab
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-3 text-center text-xs text-zinc-400">
                {mentionQuery ? (
                  <span>No member matching &ldquo;@{mentionQuery}&rdquo;</span>
                ) : (
                  <span>No other members in cohort yet</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        {/* Unified Floating Pill Capsule */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#12151e]/90 rounded-2xl shadow-xl shadow-black/40 transition-all ${
            isBlocked
              ? "border border-rose-500/20 bg-rose-950/10"
              : "hover:bg-[#12151e] border border-white/[0.08] focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10"
          }`}
        >
          {/* Quick Media Action: Emojis */}
          <button
            type="button"
            disabled={isActuallyDisabled}
            onClick={() => openPickerWithTab("emojis")}
            className={`p-2 rounded-xl text-base transition-all duration-150 flex items-center justify-center ${
              isActuallyDisabled
                ? "opacity-30 cursor-not-allowed text-zinc-500"
                : showMediaPicker && pickerTab === "emojis"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] cursor-pointer"
            }`}
            title="Insert Emojis"
          >
            😀
          </button>

          {/* Quick Media Action: GIFs */}
          <button
            type="button"
            disabled={isActuallyDisabled}
            onClick={() => openPickerWithTab("gifs")}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1 ${
              isActuallyDisabled
                ? "opacity-30 cursor-not-allowed text-zinc-500"
                : showMediaPicker && (pickerTab === "gifs" || pickerTab === "stickers")
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] cursor-pointer"
            }`}
            title="GIPHY GIFs & Stickers"
          >
            <span className="text-sm">🎬</span>
            <span className="hidden sm:inline text-[11px] font-mono font-bold tracking-tight">GIF</span>
          </button>


          {/* Seamless Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isActuallyDisabled}
            placeholder={
              isBlocked
                ? "You have blocked this user. Unblock them to chat."
                : disabled
                ? "Connecting to chat room..."
                : `${placeholder} (use @ to tag)`
            }
            className={`flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm px-2 py-1 font-sans focus:ring-0 ${
              isBlocked
                ? "text-rose-300/70 placeholder-rose-400/50 cursor-not-allowed italic"
                : "text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isActuallyDisabled || !content.trim()}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
            title="Send message"
          >
            <span className="hidden sm:inline">Send</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
