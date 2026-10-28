import React from "react";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import PinterestBackground from "@/components/ui/PinterestBackground";

export default function RootLoading() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#07080a] flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Editorial Pinterest Blueprint Background */}
      <PinterestBackground variant="blueprint" />

      {/* Simple 2D Professional Loading Indicator */}
      <div className="relative z-10 p-8 rounded-2xl bg-[#0c0d12] border border-zinc-800 shadow-2xl flex flex-col items-center">
        <LoadingAnimation
          size="lg"
          text="Annoyms Network"
          subtitle="Establishing secure connection"
        />
      </div>
    </div>
  );
}
