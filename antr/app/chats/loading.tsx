import React from "react";
import LoadingAnimation from "@/components/ui/LoadingAnimation";

export default function ChatsLoading() {
  return (
    <div className="h-[100dvh] w-full bg-[#050608] flex overflow-hidden">
      {/* Sidebar Skeleton (hidden on small screens if active, or shown on desktop) */}
      <div className="hidden md:flex w-80 lg:w-96 border-r border-white/[0.06] bg-[#07080c] flex-col p-4 space-y-4">
        {/* Brand header skeleton */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-24 h-3 bg-white/[0.08] rounded animate-pulse" />
              <div className="w-16 h-2 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] animate-pulse" />
        </div>

        {/* Tab pills skeleton */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl">
          <div className="h-7 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-7 rounded-lg bg-transparent" />
          <div className="h-7 rounded-lg bg-transparent" />
        </div>

        {/* Channel row skeletons */}
        <div className="flex-1 space-y-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-28 h-3 bg-white/[0.07] rounded animate-pulse" />
                <div className="w-40 h-2 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Stage Loading */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6 bg-[#090b10]">
        <LoadingAnimation
          size="lg"
          text="Syncing Campus Channels"
          subtitle="Connecting to secure real-time relay"
        />
      </div>
    </div>
  );
}
