"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isUserLoggedIn, getPendingEmail, syncTokenCookie, getUserProfile, getAuthToken } from "@/app/lib/auth";
import { connectSocket } from "@/lib/socket/chatClient";
import { apiUrl } from "@/lib/config/api";

import LoadingAnimation from "@/components/ui/LoadingAnimation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Initialize authorization state synchronously where possible
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true; // Let SSR complete; server-side middleware already guarded HTTP request
    }
    const loggedIn = isUserLoggedIn();
    const isAuthRoute =
      pathname === "/authentication" || pathname?.startsWith("/authentication/");
    const isOnboardingRoute =
      pathname === "/onboarding" || pathname?.startsWith("/onboarding/");
    const isBlockedRoute =
      pathname === "/blocked" || pathname?.startsWith("/blocked/");
    const hasPendingEmail = Boolean(getPendingEmail());

    if (isBlockedRoute) return true;

    if (!loggedIn) {
      return Boolean(isAuthRoute || (isOnboardingRoute && hasPendingEmail));
    }
    if (isAuthRoute) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    // Keep cookie synchronized with localStorage
    syncTokenCookie();

    const isBlockedRoute =
      pathname === "/blocked" || pathname?.startsWith("/blocked/");

    // Check if user is blocked
    const isUserBlocked =
      typeof window !== "undefined" &&
      (localStorage.getItem("annoyms_is_blocked") === "true" ||
        getUserProfile()?.blocked === true);

    if (isUserBlocked) {
      if (!isBlockedRoute) {
        setIsAuthorized(false);
        startTransition(() => {
          router.replace("/blocked");
        });
        return;
      }
      setIsAuthorized(true);
      return;
    }

    if (isBlockedRoute && !isUserBlocked) {
      // Not blocked, redirect away from /blocked
      setIsAuthorized(false);
      startTransition(() => {
        router.replace("/");
      });
      return;
    }

    const loggedIn = isUserLoggedIn();
    const hasPendingEmail = Boolean(getPendingEmail());

    const isAuthRoute =
      pathname === "/authentication" || pathname?.startsWith("/authentication/");
    const isOnboardingRoute =
      pathname === "/onboarding" || pathname?.startsWith("/onboarding/");

    // Only authentication, onboarding, and blocked are exempt
    const isPublicRoute = isAuthRoute || (isOnboardingRoute && hasPendingEmail) || isBlockedRoute;

    if (!loggedIn) {
      if (!isPublicRoute) {
        // User cannot access site: immediately push to authentication!
        setIsAuthorized(false);
        startTransition(() => {
          router.replace("/authentication");
        });
        return;
      }
      setIsAuthorized(true);
      return;
    }

    // User is logged in:
    // If they hit /authentication, redirect to home /
    if (isAuthRoute) {
      setIsAuthorized(false);
      startTransition(() => {
        router.replace("/");
      });
      return;
    }

    setIsAuthorized(true);
  }, [pathname, router]);

  // Listen to storage events and profile updates across tabs and within the app
  useEffect(() => {
    const handleAuthChange = () => {
      syncTokenCookie();
      const loggedIn = isUserLoggedIn();
      const isAuthRoute =
        pathname === "/authentication" || pathname?.startsWith("/authentication/");
      const isOnboardingRoute =
        pathname === "/onboarding" || pathname?.startsWith("/onboarding/");

      if (!loggedIn && !isAuthRoute && !(isOnboardingRoute && getPendingEmail())) {
        setIsAuthorized(false);
        router.replace("/authentication");
      }
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("annoyms_profile_updated", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("annoyms_profile_updated", handleAuthChange);
    };
  }, [pathname, router]);

  // Keep user connected & active while they are on the website
  useEffect(() => {
    if (!isUserLoggedIn()) return;

    // Connect socket so backend registers this session
    connectSocket();

    const pingHeartbeat = () => {
      const token = getAuthToken();
      if (!token) return;
      fetch(apiUrl("/api/presence/heartbeat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 25000);

    return () => {
      clearInterval(interval);
    };
  }, [pathname]);

  // Render a clean obsidian veil if unauthorized or redirecting
  if (!isAuthorized) {
    return (
      <LoadingAnimation
        fullScreen
        size="lg"
        text="Verifying Access"
        subtitle="Securing session credentials"
      />
    );
  }

  return <>{children}</>;
}
