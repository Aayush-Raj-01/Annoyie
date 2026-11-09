"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import PinterestBackground from "@/components/ui/PinterestBackground";

interface UserDetail {
  id: number;
  username: string;
  email: string;
  studentYear?: number;
  verified: boolean;
  tag?: string;
  avatarUrl?: string;
  blocked?: boolean;
  active?: boolean;
  lastActive?: number;
}

interface AdminPost {
  id: number;
  mediaUrl: string;
  mediaType?: string;
  caption?: string;
  createdAt?: string;
  uploaderId?: number;
  uploaderUsername?: string;
  uploaderAvatarUrl?: string;
  uploaderTag?: string;
}

interface AdminMarketplaceListing {
  id: number;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  mediaUrls?: string[];
  createdAt?: string;
  sellerProfileId?: number;
  sellerDisplayName?: string;
  sellerProfileImage?: string;
  sellerPhoneNumber?: string;
  sellerUserId?: number;
  bargainAvailable?: boolean;
  hostelName?: string;
  roomNo?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  blockedUsers?: number;
  connectedSessions: number;
  activeUsernames: string[];
  activeUsersList?: UserDetail[];
  recentUsers: UserDetail[];
  totalPosts?: number;
  totalMarketplaceListings?: number;
  serverTime: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AnnoyoiAdminPage() {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("annoyoi_admin_auth") === "true";
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Active Admin Section Navigation Tab
  const [activeSection, setActiveSection] = useState<"users" | "posts" | "marketplace">("users");

  // Dashboard Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [postsList, setPostsList] = useState<AdminPost[]>([]);
  const [marketplaceList, setMarketplaceList] = useState<AdminMarketplaceListing[]>([]);

  const [isFetchingData, setIsFetchingData] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  // Users Filter State
  const [searchFilter, setSearchFilter] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "blocked">("all");
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  // Posts Moderation State
  const [postsSearch, setPostsSearch] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  // Marketplace Moderation State
  const [marketplaceSearch, setMarketplaceSearch] = useState("");
  const [marketplaceCategoryFilter, setMarketplaceCategoryFilter] = useState("all");
  const [deletingListingId, setDeletingListingId] = useState<number | null>(null);

  // Confirmation Delete Modal
  const [itemToDelete, setItemToDelete] = useState<{
    type: "post" | "marketplace";
    id: number;
    title: string;
  } | null>(null);

  // Check rate limit status on mount
  useEffect(() => {
    if (isAuthenticated) return;
    fetch(`${API_BASE}/api/annoyoiadmin/rate-limit-status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.locked && d.remainingSeconds > 0) {
          setLockoutSeconds(d.remainingSeconds);
        } else if (typeof d.remainingAttempts === "number" && d.remainingAttempts < 3) {
          setRemainingAttempts(d.remainingAttempts);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Real-time countdown timer for 10-minute lockout
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setErrorMsg(null);
          setRemainingAttempts(3);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatLockoutTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds !== null && lockoutSeconds > 0) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/annoyoiadmin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-User": usernameInput.trim(),
          "X-Admin-Pass": passwordInput,
        },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.locked || res.status === 429) {
          setLockoutSeconds(data?.remainingSeconds || 600);
          setRemainingAttempts(0);
          throw new Error(data?.error || "This IP is locked out for 10 minutes due to 3 failed attempts.");
        }
        if (typeof data?.remainingAttempts === "number") {
          setRemainingAttempts(data.remainingAttempts);
        }
        throw new Error(data?.error || "Invalid admin username or password");
      }

      setLockoutSeconds(null);
      setRemainingAttempts(null);
      sessionStorage.setItem("annoyoi_admin_auth", "true");
      sessionStorage.setItem("annoyoi_admin_user", usernameInput.trim());
      sessionStorage.setItem("annoyoi_admin_pass", passwordInput);
      setIsAuthenticated(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("annoyoi_admin_auth");
    sessionStorage.removeItem("annoyoi_admin_user");
    sessionStorage.removeItem("annoyoi_admin_pass");
    setIsAuthenticated(false);
    setStats(null);
    setUsersList([]);
    setPostsList([]);
    setMarketplaceList([]);
  };

  const fetchDashboardData = useCallback(async () => {
    const adminUser = sessionStorage.getItem("annoyoi_admin_user") || "RASHMALAI";
    const adminPass = sessionStorage.getItem("annoyoi_admin_pass") || "123123@123AA";

    setIsFetchingData(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE}/api/annoyoiadmin/stats`, {
        headers: {
          "X-Admin-User": adminUser,
          "X-Admin-Pass": adminPass,
        },
      });

      if (statsRes.ok) {
        const statsData: AdminStats = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Users
      const usersRes = await fetch(`${API_BASE}/api/annoyoiadmin/users`, {
        headers: {
          "X-Admin-User": adminUser,
          "X-Admin-Pass": adminPass,
        },
      });

      if (usersRes.ok) {
        const usersData: UserDetail[] = await usersRes.json();
        setUsersList(usersData);
      }

      // 3. Fetch Posts (Gallery / Feed posts)
      try {
        const postsRes = await fetch(`${API_BASE}/api/annoyoiadmin/posts`, {
          headers: {
            "X-Admin-User": adminUser,
            "X-Admin-Pass": adminPass,
          },
        });
        if (postsRes.ok) {
          const postsData: AdminPost[] = await postsRes.json();
          setPostsList(postsData);
        }
      } catch (err) {
        console.warn("[ADMIN] Posts fetch error:", err);
      }

      // 4. Fetch Marketplace Listings
      try {
        const marketRes = await fetch(`${API_BASE}/api/annoyoiadmin/marketplace/listings`, {
          headers: {
            "X-Admin-User": adminUser,
            "X-Admin-Pass": adminPass,
          },
        });
        if (marketRes.ok) {
          const marketData: AdminMarketplaceListing[] = await marketRes.json();
          setMarketplaceList(marketData);
        }
      } catch (err) {
        console.warn("[ADMIN] Marketplace fetch error:", err);
      }

      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("[ADMIN] Data fetch failed:", err);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDashboardData();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 12000);

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, fetchDashboardData]);

  const handleToggleBlock = async (userId: number) => {
    const adminUser = sessionStorage.getItem("annoyoi_admin_user") || "RASHMALAI";
    const adminPass = sessionStorage.getItem("annoyoi_admin_pass") || "123123@123AA";

    setTogglingUserId(userId);
    setActionFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/api/annoyoiadmin/users/${userId}/toggle-block`, {
        method: "POST",
        headers: {
          "X-Admin-User": adminUser,
          "X-Admin-Pass": adminPass,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to update user block status");
      }

      const data = await res.json();
      const newBlockedState = Boolean(data.blocked);

      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, blocked: newBlockedState } : u))
      );

      setStats((prev) => {
        if (!prev) return prev;
        const currentBlockedCount = prev.blockedUsers || 0;
        return {
          ...prev,
          blockedUsers: newBlockedState
            ? currentBlockedCount + 1
            : Math.max(0, currentBlockedCount - 1),
          recentUsers: prev.recentUsers.map((u) =>
            u.id === userId ? { ...u, blocked: newBlockedState } : u
          ),
          activeUsersList: prev.activeUsersList?.map((u) =>
            u.id === userId ? { ...u, blocked: newBlockedState } : u
          ),
        };
      });

      setActionFeedback(data.message || (newBlockedState ? "User blocked" : "User unblocked"));
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle block status");
    } finally {
      setTogglingUserId(null);
    }
  };

  // Delete Any Post (Gallery Post)
  const handleDeletePost = async (postId: number) => {
    const adminUser = sessionStorage.getItem("annoyoi_admin_user") || "RASHMALAI";
    const adminPass = sessionStorage.getItem("annoyoi_admin_pass") || "123123@123AA";

    setDeletingPostId(postId);
    try {
      const res = await fetch(`${API_BASE}/api/annoyoiadmin/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-User": adminUser,
          "X-Admin-Pass": adminPass,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete post");
      }

      setPostsList((prev) => prev.filter((p) => p.id !== postId));
      setStats((prev) =>
        prev ? { ...prev, totalPosts: Math.max(0, (prev.totalPosts || prev.recentUsers.length) - 1) } : prev
      );

      setActionFeedback(`Post #${postId} has been permanently deleted.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeletingPostId(null);
      setItemToDelete(null);
    }
  };

  // Delete Any Marketplace Listing
  const handleDeleteMarketplaceListing = async (listingId: number) => {
    const adminUser = sessionStorage.getItem("annoyoi_admin_user") || "RASHMALAI";
    const adminPass = sessionStorage.getItem("annoyoi_admin_pass") || "123123@123AA";

    setDeletingListingId(listingId);
    try {
      const res = await fetch(`${API_BASE}/api/annoyoiadmin/marketplace/listings/${listingId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-User": adminUser,
          "X-Admin-Pass": adminPass,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete marketplace listing");
      }

      setMarketplaceList((prev) => prev.filter((item) => item.id !== listingId));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalMarketplaceListings: Math.max(0, (prev.totalMarketplaceListings || 1) - 1),
            }
          : prev
      );

      setActionFeedback(`Marketplace listing #${listingId} has been permanently deleted.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete marketplace listing");
    } finally {
      setDeletingListingId(null);
      setItemToDelete(null);
    }
  };

  // Active Users List
  const activeUsers = useMemo(() => {
    if (stats?.activeUsersList && stats.activeUsersList.length > 0) {
      return stats.activeUsersList;
    }
    return usersList.filter((u) => u.active);
  }, [stats?.activeUsersList, usersList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return usersList.filter((u) => {
      if (filterTab === "blocked" && !u.blocked) return false;
      if (filterTab === "active" && !u.active) return false;
      if (!q) return true;
      return (
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.tag && u.tag.toLowerCase().includes(q))
      );
    });
  }, [usersList, searchFilter, filterTab]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    const q = postsSearch.toLowerCase().trim();
    if (!q) return postsList;
    return postsList.filter((p) => {
      return (
        p.id.toString() === q ||
        (p.caption && p.caption.toLowerCase().includes(q)) ||
        (p.uploaderUsername && p.uploaderUsername.toLowerCase().includes(q)) ||
        (p.uploaderTag && p.uploaderTag.toLowerCase().includes(q))
      );
    });
  }, [postsList, postsSearch]);

  // Filtered Marketplace Listings
  const filteredMarketplace = useMemo(() => {
    const q = marketplaceSearch.toLowerCase().trim();
    return marketplaceList.filter((item) => {
      if (
        marketplaceCategoryFilter !== "all" &&
        item.category?.toLowerCase() !== marketplaceCategoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.id.toString() === q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.sellerDisplayName && item.sellerDisplayName.toLowerCase().includes(q)) ||
        (item.hostelName && item.hostelName.toLowerCase().includes(q))
      );
    });
  }, [marketplaceList, marketplaceSearch, marketplaceCategoryFilter]);

  // Available marketplace categories for filtering
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    marketplaceList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [marketplaceList]);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-white relative">
      <PinterestBackground />

      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#0d0e14]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm font-mono group-hover:scale-105 transition-transform">
              ⚡
            </span>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white">
              Annoyoi{" "}
              <span className="text-emerald-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Admin
              </span>
            </span>
          </Link>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Admin: <strong className="text-white">RASHMALAI</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-rose-500/15 text-zinc-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 relative z-10">
        {!isAuthenticated ? (
          /* LOGIN FORM SCREEN */
          <div className="max-w-md mx-auto mt-12 sm:mt-20">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121318]/90 border border-white/[0.08] shadow-2xl backdrop-blur-2xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  🛡️
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Admin Authentication</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter master credentials to access moderation and activity telemetry.
                </p>
              </div>

              {/* 10-Minute Lockout Alert with Live Countdown */}
              {lockoutSeconds !== null && lockoutSeconds > 0 ? (
                <div className="mb-5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between font-mono font-bold text-xs">
                    <span className="flex items-center gap-1.5 text-rose-200">
                      <span>🔒</span>
                      <span>IP TIMEOUT ENFORCED</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 text-white font-mono font-bold text-xs border border-rose-500/40">
                      {formatLockoutTime(lockoutSeconds)}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    Limit of <strong>3 tries</strong> reached for this IP address. Access has been temporarily suspended for{" "}
                    <strong>10 minutes</strong>.
                  </p>
                </div>
              ) : (
                <>
                  {/* Warning on Failed Attempts */}
                  {remainingAttempts !== null && remainingAttempts < 3 && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>Failed attempt</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 font-bold border border-amber-500/30">
                        {remainingAttempts} try left before 10m lock
                      </span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
                      {errorMsg}
                    </div>
                  )}
                </>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5 font-mono">
                    ADMIN USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(lockoutSeconds && lockoutSeconds > 0)}
                    placeholder="Enter admin username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5 font-mono">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    disabled={Boolean(lockoutSeconds && lockoutSeconds > 0)}
                    placeholder="Enter admin password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={Boolean(isLoading || (lockoutSeconds && lockoutSeconds > 0))}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {lockoutSeconds && lockoutSeconds > 0
                    ? `🔒 Locked Out (${formatLockoutTime(lockoutSeconds)})`
                    : isLoading
                    ? "Authenticating..."
                    : "Sign In to Admin Console"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Master Control &amp; Moderation
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage student profiles, real-time feed posts, and campus marketplace listings
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    autoRefresh
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : "bg-white/[0.03] text-zinc-400 border-white/10"
                  }`}
                  title="Toggle 12-second auto refresh"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-400" : "bg-zinc-500"}`} />
                  <span>Auto-Refresh: {autoRefresh ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={fetchDashboardData}
                  disabled={isFetchingData}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span className={isFetchingData ? "animate-spin" : ""}>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Action Feedback Banner */}
            {actionFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>{actionFeedback}</span>
                </span>
                <button
                  onClick={() => setActionFeedback(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 6 Comprehensive KPI Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Users */}
              <div className="p-4 rounded-2xl bg-[#121318]/90 border border-white/[0.07] backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                    Users
                  </span>
                  <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-xs border border-sky-500/20">
                    👥
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
                    {stats ? stats.totalUsers : usersList.length || "--"}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Accounts</div>
                </div>
              </div>

              {/* Active Now */}
              <div className="p-4 rounded-2xl bg-[#121318]/90 border border-emerald-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                    ⚡
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 tracking-tight font-mono">
                    {stats ? stats.activeUsers : activeUsers.length}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">Live on site</div>
                </div>
              </div>

              {/* Feed Posts */}
              <div className="p-4 rounded-2xl bg-[#121318]/90 border border-white/[0.07] backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                    Feed Posts
                  </span>
                  <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs border border-pink-500/20">
                    📸
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-extrabold text-pink-300 tracking-tight font-mono">
                    {stats?.totalPosts !== undefined ? stats.totalPosts : postsList.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Gallery &amp; feeds</div>
                </div>
              </div>

              {/* Marketplace Ads */}
              <div className="p-4 rounded-2xl bg-[#121318]/90 border border-white/[0.07] backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                    Marketplace
                  </span>
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                    🛍️
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 tracking-tight font-mono">
                    {stats?.totalMarketplaceListings !== undefined
                      ? stats.totalMarketplaceListings
                      : marketplaceList.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Campus listings</div>
                </div>
              </div>

              {/* Verified Students */}
              <div className="p-4 rounded-2xl bg-[#121318]/90 border border-white/[0.07] backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                    Verified
                  </span>
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                    🎓
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
                    {stats ? stats.verifiedUsers : "--"}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">@imsec.ac.in</div>
                </div>
              </div>

              {/* Blocked Users */}
              <div className="p-4 rounded-2xl bg-[#121318]/90 border border-rose-500/20 backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-wider">
                    Blocked
                  </span>
                  <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20">
                    🚫
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-extrabold text-rose-300 tracking-tight font-mono">
                    {stats && typeof stats.blockedUsers === "number"
                      ? stats.blockedUsers
                      : usersList.filter((u) => u.blocked).length}
                  </div>
                  <div className="text-[10px] text-rose-400/80 mt-0.5">Suspended</div>
                </div>
              </div>
            </div>

            {/* Admin Section Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setActiveSection("users")}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "users"
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>👥 Users &amp; Telemetry</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/20">
                  {usersList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("posts")}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "posts"
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>📸 Feed Posts Moderation</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/20">
                  {postsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("marketplace")}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "marketplace"
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>🛍️ Marketplace Moderation</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/20">
                  {marketplaceList.length}
                </span>
              </button>
            </div>

            {/* SECTION 1: USERS & TELEMETRY */}
            {activeSection === "users" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Currently Active Users Section */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#121318]/90 border border-emerald-500/20 shadow-xl backdrop-blur-md space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          <span>Currently Active Users</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30">
                            {activeUsers.length} Online
                          </span>
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Users currently connected and browsing on the Annoyoi website
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500">Real-time telemetry</div>
                  </div>

                  {activeUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeUsers.map((user) => (
                        <div
                          key={`active-user-${user.id}`}
                          className="p-3.5 rounded-2xl bg-white/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-emerald-500/40 flex items-center justify-center font-bold text-sm text-emerald-300">
                                {user.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                  (user.username.slice(0, 2) || "AN").toUpperCase()
                                )}
                              </div>
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#121318]"
                                title="Online Now"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-white group-hover:text-emerald-300 truncate">
                                  @{user.username}
                                </span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                                  Yr {user.studentYear ?? 1}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate font-mono">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Active now
                                </span>
                                {user.tag && (
                                  <span className="text-[9px] text-zinc-500 font-mono">
                                    • {user.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(user.id)}
                              disabled={togglingUserId === user.id}
                              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                user.blocked
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/[0.06]"
                              }`}
                              title={user.blocked ? "Unblock user" : "Block user"}
                            >
                              {user.blocked ? "✓" : "🚫"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] text-center">
                      <p className="text-xs text-zinc-400 font-medium">No users currently active on the website</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        When students open the website or chat, their live active status will appear here immediately.
                      </p>
                    </div>
                  )}
                </div>

                {/* Registered Users Directory */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#121318]/90 border border-white/[0.07] shadow-xl backdrop-blur-md space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">Registered Users Directory</h2>
                      <p className="text-xs text-zinc-400">
                        Manage student profiles, view live status, and enforce account suspension
                      </p>
                    </div>

                    <div className="w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Search username or email..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 font-mono"
                      />
                    </div>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setFilterTab("all")}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                        filterTab === "all"
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      All Users ({usersList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab("active")}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        filterTab === "active"
                          ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                          : "bg-white/[0.04] text-emerald-400 hover:text-white hover:bg-emerald-500/10"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Active Now ({usersList.filter((u) => u.active).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab("blocked")}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        filterTab === "blocked"
                          ? "bg-rose-500 text-white font-bold shadow-sm"
                          : "bg-white/[0.04] text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10"
                      }`}
                    >
                      <span>⛔ Blocked ({usersList.filter((u) => u.blocked).length})</span>
                    </button>
                  </div>

                  {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-zinc-400 font-mono uppercase text-[10px]">
                            <th className="py-2.5 px-3">ID</th>
                            <th className="py-2.5 px-3">Username</th>
                            <th className="py-2.5 px-3">Email</th>
                            <th className="py-2.5 px-3">Academic Year</th>
                            <th className="py-2.5 px-3">Live Presence</th>
                            <th className="py-2.5 px-3">Account Status</th>
                            <th className="py-2.5 px-3 text-right">Moderation Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-3 font-mono text-zinc-500">#{user.id}</td>
                              <td className="py-3 px-3 font-semibold text-white">
                                <div className="flex items-center gap-1.5">
                                  <span>@{user.username}</span>
                                  {user.active && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                                      title="Active now"
                                    ></span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                                {user.email}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                                  Yr {user.studentYear ?? 1}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {user.active ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold inline-flex items-center gap-1.5 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Online Now</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-500 border border-white/[0.04] font-mono text-[10px] inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                                    <span>Offline</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                {user.blocked ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[10px] font-bold inline-flex items-center gap-1">
                                    <span>🚫</span>
                                    <span>Blocked</span>
                                  </span>
                                ) : user.verified ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[10px]">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBlock(user.id)}
                                  disabled={togglingUserId === user.id}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                                    user.blocked
                                      ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 hover:border-rose-500/40"
                                  }`}
                                >
                                  {togglingUserId === user.id
                                    ? "Updating..."
                                    : user.blocked
                                    ? "✓ Unblock User"
                                    : "🚫 Block User"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                      {usersList.length === 0 ? "Loading users data..." : "No users match your criteria."}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: FEED POSTS MODERATION */}
            {activeSection === "posts" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-5 sm:p-6 rounded-3xl bg-[#121318]/90 border border-white/[0.07] shadow-xl backdrop-blur-md space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Feed &amp; Gallery Posts Moderation</span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono text-xs border border-pink-500/30">
                          {postsList.length} Total Posts
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Admin powers to permanently delete inappropriate or guideline-violating posts
                      </p>
                    </div>

                    <div className="w-full sm:w-72">
                      <input
                        type="text"
                        placeholder="Search caption, author, or ID..."
                        value={postsSearch}
                        onChange={(e) => setPostsSearch(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/40 font-mono"
                      />
                    </div>
                  </div>

                  {/* Posts Grid */}
                  {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPosts.map((post) => (
                        <div
                          key={`admin-post-${post.id}`}
                          className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-pink-500/40 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Media thumbnail container */}
                            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black/60 border border-white/[0.06] mb-3">
                              {post.mediaType === "video" ? (
                                <video
                                  src={post.mediaUrl}
                                  controls
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={post.mediaUrl}
                                  alt={post.caption || `Post #${post.id}`}
                                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600";
                                  }}
                                />
                              )}
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/10">
                                #{post.id}
                              </span>
                            </div>

                            {/* Caption */}
                            <p className="text-xs text-zinc-200 line-clamp-2 font-medium mb-2.5">
                              {post.caption || <span className="text-zinc-500 italic">No caption provided</span>}
                            </p>

                            {/* Author & Timestamp */}
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pb-2 border-b border-white/[0.04]">
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                  {post.uploaderAvatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={post.uploaderAvatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="w-full h-full flex items-center justify-center text-[9px] text-zinc-300 font-bold">
                                      {(post.uploaderUsername?.slice(0, 1) || "A").toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-zinc-300 font-semibold truncate">
                                  @{post.uploaderUsername || "Anonymous"}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 shrink-0">
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>

                          {/* Delete Action Button */}
                          <div className="mt-3 pt-2 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {post.mediaType?.toUpperCase() || "IMAGE"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setItemToDelete({
                                  type: "post",
                                  id: post.id,
                                  title: post.caption || `Post #${post.id} by @${post.uploaderUsername || "anon"}`,
                                })
                              }
                              disabled={deletingPostId === post.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <span>🗑️</span>
                              <span>Delete Post</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-zinc-500 font-mono rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                      {postsList.length === 0 ? "No posts found in database." : "No posts match your search query."}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3: MARKETPLACE MODERATION */}
            {activeSection === "marketplace" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-5 sm:p-6 rounded-3xl bg-[#121318]/90 border border-white/[0.07] shadow-xl backdrop-blur-md space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Marketplace Listings Moderation</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30">
                          {marketplaceList.length} Listings
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Permanently remove sold, prohibited, or fraudulent items from the campus shopping feed
                      </p>
                    </div>

                    <div className="w-full sm:w-72">
                      <input
                        type="text"
                        placeholder="Search product, seller, hostel, or ID..."
                        value={marketplaceSearch}
                        onChange={(e) => setMarketplaceSearch(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 font-mono"
                      />
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setMarketplaceCategoryFilter("all")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        marketplaceCategoryFilter === "all"
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      All ({marketplaceList.length})
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={`cat-filter-${cat}`}
                        type="button"
                        onClick={() => setMarketplaceCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer uppercase text-[11px] ${
                          marketplaceCategoryFilter.toLowerCase() === cat.toLowerCase()
                            ? "bg-emerald-500 text-zinc-950 font-bold"
                            : "bg-white/[0.04] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Marketplace Items Grid */}
                  {filteredMarketplace.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMarketplace.map((item) => {
                        const displayImage =
                          item.imageUrl ||
                          (item.mediaUrls && item.mediaUrls.length > 0 ? item.mediaUrls[0] : null);

                        return (
                          <div
                            key={`admin-market-${item.id}`}
                            className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                          >
                            <div>
                              {/* Product Thumbnail */}
                              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black/60 border border-white/[0.06] mb-3">
                                {displayImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={displayImage}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-600">
                                    📦
                                  </div>
                                )}

                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/10">
                                  #{item.id}
                                </span>

                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-zinc-950 font-mono text-[10px] font-bold uppercase tracking-wider">
                                  {item.category || "General"}
                                </span>

                                {item.bargainAvailable && (
                                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-500/80 backdrop-blur-md text-zinc-950 font-bold text-[9px] uppercase">
                                    Bargain OK
                                  </span>
                                )}
                              </div>

                              {/* Price & Title */}
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <div className="text-base font-extrabold text-emerald-400 font-mono">
                                  {item.price !== undefined && item.price > 0
                                    ? `₹${item.price.toLocaleString("en-IN")}`
                                    : "Free"}
                                </div>
                              </div>

                              <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                                {item.title}
                              </h3>

                              <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-3">
                                {item.description || "No description provided."}
                              </p>

                              {/* Seller & Hostel Info */}
                              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pb-2 border-b border-white/[0.04]">
                                <span className="text-zinc-300 font-semibold truncate">
                                  👤 {item.sellerDisplayName || "Student Seller"}
                                </span>
                                {(item.hostelName || item.roomNo) && (
                                  <span className="text-[10px] text-zinc-500 shrink-0">
                                    📍 {item.hostelName || ""} {item.roomNo ? `Room ${item.roomNo}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delete Action Button */}
                            <div className="mt-3 pt-2 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-500">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setItemToDelete({
                                    type: "marketplace",
                                    id: item.id,
                                    title: `${item.title} (₹${item.price ?? 0})`,
                                  })
                                }
                                disabled={deletingListingId === item.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <span>🗑️</span>
                                <span>Delete Listing</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-zinc-500 font-mono rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                      {marketplaceList.length === 0
                        ? "No marketplace listings found in database."
                        : "No listings match your search criteria."}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Refresh Timestamp */}
            {lastRefreshedAt && (
              <div className="text-[10px] text-zinc-500 font-mono text-right pt-2">
                Last updated at {lastRefreshedAt}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CONFIRMATION DELETE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#14161f] border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-lg border border-rose-500/30 shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete {itemToDelete.type === "post" ? "Feed Post" : "Marketplace Listing"}?
                </h3>
                <p className="text-xs text-zinc-400">
                  This action cannot be undone. The item will be permanently removed.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 font-mono">
              <span className="text-zinc-500">Target #{itemToDelete.id}:</span>{" "}
              <strong className="text-white block mt-0.5 truncate">{itemToDelete.title}</strong>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deletingPostId !== null || deletingListingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.type === "post") {
                    handleDeletePost(itemToDelete.id);
                  } else {
                    handleDeleteMarketplaceListing(itemToDelete.id);
                  }
                }}
                disabled={deletingPostId !== null || deletingListingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {(deletingPostId === itemToDelete.id || deletingListingId === itemToDelete.id) && (
                  <span className="animate-spin">⏳</span>
                )}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
