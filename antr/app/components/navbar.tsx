"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isUserLoggedIn } from "../lib/auth";
import { useChatStore } from "@/store/chatStore";

export default function Navbar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const isMobileChatOpen = useChatStore((state) => state.isMobileChatOpen);

  useEffect(() => {
    setLoggedIn(isUserLoggedIn());
    const onUpdate = () => setLoggedIn(isUserLoggedIn());
    window.addEventListener("annoyms_profile_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("annoyms_profile_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  // Do not show navbar if user is not logged in or is on the authentication/onboarding pages
  if (!loggedIn || pathname === "/authentication" || pathname === "/onboarding") {
    return null;
  }

  const isMarketplace = pathname?.startsWith("/marketplace");

  const navItems = [
    {
      href: "/",
      label: "Home",
      isActive: pathname === "/",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/chats",
      label: "Chats",
      isActive: pathname === "/chats" || pathname?.startsWith("/chats/"),
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      href: "/marketplace",
      label: "MarketPlace",
      isActive: pathname === "/marketplace",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      href: isMarketplace ? "/marketplace/profile" : "/profile",
      label: isMarketplace ? "Seller Desk" : "Profile",
      isActive: isMarketplace
        ? pathname === "/marketplace/profile"
        : (pathname === "/profile" || pathname?.startsWith("/profile/")),
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  // When active mobile chat is open, hide navbar on small viewports so keyboard and message input have full screen
  const isChatHidden = isMobileChatOpen && pathname?.startsWith("/chats");

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto bottom-3 sm:bottom-6 mb-[env(safe-area-inset-bottom)] max-w-[calc(100vw-1.25rem)] sm:max-w-none ${
        isChatHidden ? "hidden md:block" : "block"
      }`}
    >
      {/* Outer shell (Tactile floating dock matching reference image) */}
      <div className="p-1.5 rounded-full bg-[#16171b]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5">
          {navItems.map((item) => {
            const isActive = item.isActive;
            const isChatTab = item.href === "/chats";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none shrink-0 ${
                  isActive
                    ? isChatTab
                      ? "bg-[#ff4d4f]/20 text-white border border-[#ff4d4f]/30 shadow-sm"
                      : "bg-white/[0.12] text-white border border-white/10 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <span className={`transition-transform duration-200 ${
                  isActive
                    ? isChatTab
                      ? "text-[#ff4d4f] scale-105"
                      : "text-emerald-400 scale-105"
                    : "text-zinc-400"
                }`}>
                  {item.icon}
                </span>
                <span className="text-[11px] sm:text-xs tracking-tight font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
