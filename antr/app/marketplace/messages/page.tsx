"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile } from "@/app/lib/auth";
import ConfirmModal, { ConfirmVariant } from "@/components/ui/ConfirmModal";
import ToastNotification, { ToastVariant } from "@/components/ui/ToastNotification";
import {
  MarketplaceProfile,
  fetchMarketplaceProfile,
  getCachedMarketplaceProfile,
  subscribeMarketplaceProfileChange,
} from "@/lib/api/marketplace";
import {
  MarketplaceMessage,
  MarketplaceThread,
  fetchMarketplaceConversation,
  fetchMarketplaceThreads,
  sendMarketplaceMessage,
} from "@/lib/api/marketplaceChat";
import {
  MarketplaceBlockStatus,
  checkMarketplaceBlockStatus,
  blockMarketplaceProfile,
  unblockMarketplaceProfile,
  fetchBlockedMarketplaceProfiles,
  subscribeMarketplaceBlockChange,
} from "@/lib/api/marketplaceBlock";

function MarketplaceChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth & Profile
  const [myProfile, setMyProfile] = useState<MarketplaceProfile | null>(() => {
    const user = getUserProfile();
    return getCachedMarketplaceProfile(user?.id);
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Chat Data
  const [threads, setThreads] = useState<MarketplaceThread[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedPartnerInfo, setSelectedPartnerInfo] = useState<{
    displayName: string;
    profileImage?: string | null;
    listingId?: number | null;
    listingTitle?: string | null;
    listingPrice?: number | null;
  } | null>(null);

  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Blocking State
  const [blockStatus, setBlockStatus] = useState<MarketplaceBlockStatus>({
    isBlockedByMe: false,
    isBlockedByThem: false,
    isBlockedEitherWay: false,
  });
  const [isBlockingAction, setIsBlockingAction] = useState(false);
  const [blockedPartnerIds, setBlockedPartnerIds] = useState<Set<number>>(new Set());

  // Modern Dialog & Notification states
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: ConfirmVariant;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "warning",
    onConfirm: () => {},
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadThreads = useCallback(async (profileId: number) => {
    try {
      const data = await fetchMarketplaceThreads(profileId);
      setThreads(data);
    } catch (err) {
      console.warn("Failed to load threads:", err);
    }
  }, []);

  const loadBlockedList = useCallback(async (profileId: number) => {
    try {
      const list = await fetchBlockedMarketplaceProfiles(profileId);
      setBlockedPartnerIds(new Set(list.map((b) => b.blockedProfileId)));
    } catch (err) {
      console.warn("Failed to load blocked list:", err);
    }
  }, []);

  // Synchronize marketplace profile updates across tabs and other pages
  useEffect(() => {
    const unsub = subscribeMarketplaceProfileChange((p) => {
      setMyProfile(p);
      if (p?.id) {
        loadThreads(p.id);
        loadBlockedList(p.id);
      }
    });
    return unsub;
  }, [loadThreads, loadBlockedList]);

  // Subscribe to block events
  useEffect(() => {
    const unsub = subscribeMarketplaceBlockChange(() => {
      if (myProfile?.id) {
        loadBlockedList(myProfile.id);
      }
      if (myProfile?.id && selectedPartnerId) {
        checkMarketplaceBlockStatus(myProfile.id, selectedPartnerId).then(setBlockStatus);
      }
    });
    return unsub;
  }, [myProfile?.id, selectedPartnerId, loadBlockedList]);

  // 1. Initial Load: Authenticate and fetch marketplace profile
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        let user = getUserProfile();
        if (!user || !user.id) {
          user = await syncUserProfile();
        }

        if (!isMounted) return;

        const resolvedUserId = user?.id;
        if (resolvedUserId) {
          const cached = getCachedMarketplaceProfile(resolvedUserId);
          if (cached && isMounted) {
            setMyProfile(cached);
            loadThreads(cached.id);
            loadBlockedList(cached.id);
          }

          const profile = await fetchMarketplaceProfile(resolvedUserId);
          if (isMounted) {
            setMyProfile(profile);
            if (profile) {
              loadThreads(profile.id);
              loadBlockedList(profile.id);
            }
          }
        }
      } catch (err) {
        console.error("Error loading marketplace chat:", err);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, loadThreads, loadBlockedList]);

  // 2. Handle Query Params: if URL has ?with=123&name=...&listingId=...
  useEffect(() => {
    const withParam = searchParams.get("with");
    const nameParam = searchParams.get("name");
    const listingIdParam = searchParams.get("listingId");
    const listingTitleParam = searchParams.get("listingTitle");
    const listingPriceParam = searchParams.get("listingPrice");

    if (withParam) {
      const partnerId = parseInt(withParam, 10);
      if (!isNaN(partnerId)) {
        setSelectedPartnerId(partnerId);
        setSelectedPartnerInfo({
          displayName: nameParam || `Seller #${partnerId}`,
          listingId: listingIdParam ? parseInt(listingIdParam, 10) : null,
          listingTitle: listingTitleParam || null,
          listingPrice: listingPriceParam ? parseFloat(listingPriceParam) : null,
        });
      }
    }
  }, [searchParams]);

  // 3. Load conversation and block status when selectedPartnerId changes
  useEffect(() => {
    const partnerId = selectedPartnerId;
    if (!myProfile || partnerId == null) return;

    let isMounted = true;

    // Check block status
    checkMarketplaceBlockStatus(myProfile.id, partnerId)
      .then((status) => {
        if (isMounted) setBlockStatus(status);
      })
      .catch(() => {});

    async function loadConv() {
      setIsLoadingMessages(true);
      try {
        if (myProfile && partnerId != null) {
          const conv = await fetchMarketplaceConversation(myProfile.id, partnerId);
          if (isMounted) {
            setMessages(conv);
            scrollToBottom();
          }
        }
      } catch (err) {
        console.warn("Failed to load conversation:", err);
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    }

    loadConv();

    // 4. Polling for real-time messages every 3.5 seconds
    const interval = setInterval(async () => {
      if (myProfile && selectedPartnerId) {
        try {
          const updated = await fetchMarketplaceConversation(myProfile.id, selectedPartnerId);
          if (isMounted) {
            setMessages((prev) => {
              if (updated.length !== prev.length) {
                setTimeout(scrollToBottom, 50);
                return updated;
              }
              return prev;
            });
          }
        } catch {
          // ignore
        }
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [myProfile, selectedPartnerId, scrollToBottom]);

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || !myProfile || !selectedPartnerId || isSending) return;

    if (blockStatus.isBlockedEitherWay) {
      setToast({
        message: blockStatus.isBlockedByMe
          ? "You have blocked this user. Unblock them before sending messages."
          : "Cannot send message. Communication between these profiles is blocked.",
        variant: "warning",
      });
      return;
    }

    try {
      setIsSending(true);
      if (!textToSend) {
        setInputText("");
      }

      const sent = await sendMarketplaceMessage({
        senderProfileId: myProfile.id,
        receiverProfileId: selectedPartnerId,
        listingId: selectedPartnerInfo?.listingId || undefined,
        content: messageContent,
      });

      setMessages((prev) => [...prev, sent]);
      scrollToBottom();

      // Refresh threads list
      if (myProfile) {
        loadThreads(myProfile.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setToast({ message: msg, variant: "error" });
    } finally {
      setIsSending(false);
    }
  };

  // Block / Unblock action handler
  const handleToggleBlock = async () => {
    if (!myProfile || !selectedPartnerId) return;

    const partnerName = selectedPartnerInfo?.displayName || "this user";

    if (blockStatus.isBlockedByMe) {
      // Unblock
      try {
        setIsBlockingAction(true);
        await unblockMarketplaceProfile(myProfile.id, selectedPartnerId);
        setBlockStatus((prev) => ({
          ...prev,
          isBlockedByMe: false,
          isBlockedEitherWay: prev.isBlockedByThem,
        }));
        setBlockedPartnerIds((prev) => {
          const copy = new Set(prev);
          copy.delete(selectedPartnerId);
          return copy;
        });
        setToast({ message: `Unblocked ${partnerName}`, variant: "success" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to unblock user";
        setToast({ message: msg, variant: "error" });
      } finally {
        setIsBlockingAction(false);
      }
    } else {
      // Block Confirmation Modal
      setConfirmDialog({
        isOpen: true,
        title: `Block ${partnerName}?`,
        description: `Are you sure you want to block ${partnerName}? They will no longer be able to message you or see your listings.`,
        confirmText: "Block user",
        variant: "warning",
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          try {
            setIsBlockingAction(true);
            await blockMarketplaceProfile(myProfile.id, selectedPartnerId);
            setBlockStatus((prev) => ({
              ...prev,
              isBlockedByMe: true,
              isBlockedEitherWay: true,
            }));
            setBlockedPartnerIds((prev) => new Set(prev).add(selectedPartnerId));
            setToast({ message: `Blocked ${partnerName}`, variant: "success" });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to block user";
            setToast({ message: msg, variant: "error" });
          } finally {
            setIsBlockingAction(false);
          }
        },
      });
    }
  };

  // Quick prompt presets for campus trade
  const quickPrompts = [
    "Is this still available?",
    "Can you do a slight discount?",
    "Where can we meet on campus?",
    "I can pick it up today.",
  ];

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-100 flex items-center justify-center font-mono text-xs">
        Loading Marketplace Messages...
      </div>
    );
  }

  // If user does not have a marketplace profile yet
  if (!myProfile) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between pt-12 pb-28 px-4">
        <div className="max-w-md w-full mx-auto p-8 rounded-[2rem] bg-zinc-900/60 border border-white/10 text-center space-y-5 backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
            🏪
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Marketplace Profile Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Marketplace DMs are separate from anonymous chat so buyers and sellers know who they are trading with. Set up your
              seller profile to start chatting.
            </p>
          </div>
          <Link
            href="/marketplace/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <span>Activate Seller Profile</span>
            <span>→</span>
          </Link>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between pt-6 pb-28 px-2 sm:px-4 selection:bg-emerald-500/30">
      <div className="max-w-5xl w-full mx-auto space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between px-2 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Link
              href="/marketplace"
              className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-xs text-zinc-400 hover:text-white transition-colors"
              title="Back to Marketplace"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">💬</span>
                <h1 className="text-lg font-bold text-white">Marketplace DMs</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Buyer-Seller Chat
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/marketplace/profile"
              className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>🏪</span>
              <span>{myProfile.displayName}</span>
            </Link>
          </div>
        </div>

        {/* Main Chat Grid (Dual-Pane) */}
        <div className="p-1.5 rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#0c0c0e]/95 backdrop-blur-2xl grid grid-cols-1 md:grid-cols-12 min-h-[580px] h-[72vh] overflow-hidden">
            {/* Left Pane: Conversation Threads */}
            <div
              className={`md:col-span-4 border-r border-white/[0.08] flex flex-col h-full bg-zinc-950/40 ${
                selectedPartnerId ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Conversations ({threads.length})
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Marketplace Only</span>
              </div>

              {/* Threads list */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                {threads.length === 0 && !selectedPartnerId ? (
                  <div className="p-8 text-center space-y-2 text-zinc-500">
                    <div className="text-2xl">💬</div>
                    <div className="text-xs font-medium text-zinc-400">No active messages</div>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                      Click &quot;Message Seller&quot; on any campus listing to start a direct inquiry.
                    </p>
                  </div>
                ) : null}

                {threads.map((t) => {
                  const isSelected = selectedPartnerId === t.otherProfileId;
                  const isPartnerBlocked = blockedPartnerIds.has(t.otherProfileId);

                  return (
                    <button
                      key={t.otherProfileId}
                      type="button"
                      onClick={() => {
                        setSelectedPartnerId(t.otherProfileId);
                        setSelectedPartnerInfo({
                          displayName: t.otherDisplayName,
                          profileImage: t.otherProfileImage,
                          listingId: t.listingId,
                          listingTitle: t.listingTitle,
                          listingPrice: t.listingPrice,
                        });
                      }}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected ? "bg-emerald-500/10 border-l-2 border-emerald-400" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm overflow-hidden shrink-0">
                        {t.otherProfileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.otherProfileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          t.otherDisplayName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-semibold text-white truncate">{t.otherDisplayName}</span>
                            {isPartnerBlocked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                                Blocked
                              </span>
                            )}
                          </div>
                          {t.unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center">
                              {t.unreadCount}
                            </span>
                          )}
                        </div>
                        {t.listingTitle && (
                          <div className="text-[10px] text-emerald-400/80 truncate font-mono">
                            📦 {t.listingTitle}
                          </div>
                        )}
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{t.lastMessage}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Active Chat Window */}
            <div
              className={`md:col-span-8 flex flex-col h-full bg-[#09090b]/60 ${
                !selectedPartnerId ? "hidden md:flex items-center justify-center" : "flex"
              }`}
            >
              {!selectedPartnerId ? (
                <div className="text-center space-y-3 p-8 text-zinc-500">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl">
                    🛍️
                  </div>
                  <div className="text-sm font-semibold text-zinc-300">Select a conversation</div>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Chat with buyers and sellers about item condition, price offers, and campus handovers.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat Partner Header with Block/Unblock Action */}
                  <div className="p-3.5 px-4 border-b border-white/[0.08] flex items-center justify-between bg-zinc-950/60 backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile back button */}
                      <button
                        type="button"
                        onClick={() => setSelectedPartnerId(null)}
                        className="md:hidden text-zinc-400 hover:text-white text-xs font-mono pr-1"
                      >
                        ←
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs overflow-hidden shrink-0">
                        {selectedPartnerInfo?.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedPartnerInfo.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          selectedPartnerInfo?.displayName?.slice(0, 2).toUpperCase() || "MP"
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {selectedPartnerInfo?.displayName}
                          </span>
                          <span className="text-emerald-400 text-[10px]" title="Campus Verified">
                            ✓
                          </span>
                          {blockStatus.isBlockedByMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Blocked by you
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">Marketplace Seller</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Block / Unblock Button */}
                      <button
                        type="button"
                        onClick={handleToggleBlock}
                        disabled={isBlockingAction}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 ${
                          blockStatus.isBlockedByMe
                            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10"
                            : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        }`}
                        title={blockStatus.isBlockedByMe ? "Unblock this user" : "Block this user"}
                      >
                        <span>{blockStatus.isBlockedByMe ? "🔓" : "🚫"}</span>
                        <span>{blockStatus.isBlockedByMe ? "Unblock" : "Block"}</span>
                      </button>

                      <Link
                        href={`/marketplace/profile`}
                        className="text-[11px] font-mono text-zinc-400 hover:text-emerald-300 transition-colors hidden sm:inline"
                      >
                        Store Profile
                      </Link>
                    </div>
                  </div>

                  {/* Block Alert Banner (if user is blocked) */}
                  {blockStatus.isBlockedByMe && (
                    <div className="p-3 px-4 bg-rose-500/15 border-b border-rose-500/25 flex items-center justify-between gap-3 text-xs text-rose-200">
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400">🚫</span>
                        <span>You have blocked this user. Unblock them to send or receive marketplace messages.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleBlock}
                        disabled={isBlockingAction}
                        className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                      >
                        Unblock Now
                      </button>
                    </div>
                  )}

                  {!blockStatus.isBlockedByMe && blockStatus.isBlockedByThem && (
                    <div className="p-3 px-4 bg-zinc-900/90 border-b border-white/10 flex items-center gap-2 text-xs text-zinc-400">
                      <span>🔒</span>
                      <span>This user has blocked communication in the marketplace.</span>
                    </div>
                  )}

                  {/* Listing Context Bar (if chatting about an item) */}
                  {selectedPartnerInfo?.listingTitle && (
                    <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-emerald-400">📦</span>
                        <span className="text-zinc-300 truncate">
                          Regarding: <strong className="text-white">{selectedPartnerInfo.listingTitle}</strong>
                        </span>
                      </div>
                      {selectedPartnerInfo.listingPrice != null && (
                        <span className="font-mono font-bold text-emerald-400 shrink-0 ml-2">
                          ₹{selectedPartnerInfo.listingPrice}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10 space-y-2 text-zinc-500">
                        <div className="text-xl">👋</div>
                        <div className="text-xs text-zinc-400">Start the conversation</div>
                        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                          Ask about item availability, handover spot, or offer a price.
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderProfileId === myProfile.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                                isMe
                                  ? "bg-emerald-600 text-white rounded-br-xs"
                                  : "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-bl-xs"
                              }`}
                            >
                              {m.content}
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 mt-1 px-1">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Preset Chips (hidden when blocked) */}
                  {!blockStatus.isBlockedEitherWay && (
                    <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-white/[0.04] bg-zinc-950/40">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-[10px] text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-3 px-4 border-t border-white/[0.08] flex items-center gap-2 bg-zinc-950/70"
                  >
                    <input
                      type="text"
                      disabled={blockStatus.isBlockedEitherWay}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        blockStatus.isBlockedByMe
                          ? "Messaging disabled (User is blocked by you)"
                          : blockStatus.isBlockedByThem
                          ? "Messaging disabled (User blocked communication)"
                          : "Type message to seller/buyer..."
                      }
                      className="flex-1 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 focus:border-emerald-500 text-white placeholder-zinc-500 text-xs sm:text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending || blockStatus.isBlockedEitherWay}
                      className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0"
                    >
                      {isSending ? "..." : "Send"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Floating Toast Notification */}
      <ToastNotification
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />

      {/* Modern Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        variant={confirmDialog.variant}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <Navbar />
    </div>
  );
}

export default function MarketplaceChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] text-zinc-100 flex items-center justify-center font-mono text-xs">
          Loading...
        </div>
      }
    >
      <MarketplaceChatContent />
    </Suspense>
  );
}
