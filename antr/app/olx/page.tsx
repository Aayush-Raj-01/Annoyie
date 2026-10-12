"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OlxRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/marketplace");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-400 font-mono text-xs">
      Redirecting to Marketplace...
    </div>
  );
}
