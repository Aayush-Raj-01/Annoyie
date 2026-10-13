"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import { getUserProfile, syncUserProfile, UserProfile } from "@/app/lib/auth";
import { MarketplaceProfile, fetchMarketplaceProfile } from "@/lib/api/marketplace";

interface ListingItem {
  id: number;
  title: string;
  category: string;
  price: number;
  sellerName: string;
  sellerPhoto?: string;
  hostel?: string;
  condition?: string;
  description: string;
  whatsapp?: string;
  timeAgo?: string;
}

const CATEGORIES = ["All", "Textbooks", "Electronics", "Cycles", "Hostel", "Lab Kits"];

export default function MarketplacePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [marketProfile, setMarketProfile] = useState<MarketplaceProfile | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      let user = getUserProfile();
      if (!user?.id) {
        user = await syncUserProfile();
      }
      if (user) {
        setCurrentUser(user);
        if (user.id) {
          const profile = await fetchMarketplaceProfile(user.id);
          setMarketProfile(profile);
        }
      }
    }
    load();
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between pt-8 pb-28 px-4 selection:bg-emerald-500/30">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Marketplace Header & Profile Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Campus Marketplace</h1>
            </div>
            <p className="text-xs text-zinc-400">
              Buy and sell directly with verified students on campus. Zero commission, peer-to-peer handovers.
            </p>
          </div>

          {/* Dedicated Marketplace Profile Banner Action */}
          <Link
            href="/marketplace/profile"
            className="group relative p-1 rounded-full bg-zinc-900/90 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-3 pr-4"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400 font-mono overflow-hidden">
              {marketProfile?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={marketProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                marketProfile?.displayName?.slice(0, 2).toUpperCase() || "🏪"
              )}
            </div>
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                {marketProfile ? "Seller Profile" : "Create Seller Profile"}
              </div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                {marketProfile?.displayName || "Setup Store →"}
              </div>
            </div>
          </Link>
        </div>

        {/* Seller Profile Quick Notice if not set up */}
        {!marketProfile && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/70 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3 shadow-[0_8px_32px_rgba(16,185,129,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                ✨
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Want to sell your books, cycle, or essentials?</div>
                <div className="text-[11px] text-zinc-400">
                  Set up your dedicated campus seller profile to publish listings and receive buyer inquiries.
                </div>
              </div>
            </div>
            <Link
              href="/marketplace/profile"
              className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Set Up Profile
            </Link>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, cycles, electronics, hostel gear..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-900/70 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-inner"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-zinc-950 font-bold shadow-md"
                    : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listing Cards Grid / Empty State */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Campus Listings ({filteredListings.length})
            </span>
            <Link
              href="/marketplace/profile"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
            >
              <span>Manage Your Seller Profile</span>
              <span>→</span>
            </Link>
          </div>

          {filteredListings.length === 0 ? (
            <div className="p-12 rounded-[2rem] bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-2xl">
                📦
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold text-white">No items posted yet</div>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Be the first to list textbooks, cycles, calculators, or hostel essentials on campus.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/marketplace/profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <span>Go to Seller Profile</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="p-1.5 rounded-[1.75rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 group"
                >
                  <div className="p-5 rounded-[calc(1.75rem-0.375rem)] bg-[#0c0c0e]/95 space-y-4 backdrop-blur-xl h-full flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                          {item.category}
                        </span>
                        <span className="text-base font-bold font-mono text-emerald-400">₹{item.price}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Seller & Contact Bar */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                          {item.sellerName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-white font-medium truncate block">{item.sellerName}</span>
                          {item.hostel && <span className="text-[10px] text-zinc-500 font-mono">{item.hostel}</span>}
                        </div>
                      </div>

                      {item.whatsapp && (
                        <a
                          href={`https://wa.me/${item.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hi ${item.sellerName}, is "${item.title}" still available on campus marketplace?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <span>💬 Chat</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
}
