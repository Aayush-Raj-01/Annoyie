import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl">
      <div className="flex items-center gap-5 text-xs font-medium text-zinc-400">
        <Link href="/" className="hover:text-zinc-100 transition-colors">
          Home
        </Link>
        <Link href="/chats" className="hover:text-zinc-100 transition-colors">
          Chats
        </Link>
        <Link href="/olx" className="hover:text-zinc-100 transition-colors">
          MarketPlace
        </Link>
        <Link href="/profile" className="hover:text-zinc-100 transition-colors">
          Profile
        </Link>
      </div>
    </nav>
  );
}
