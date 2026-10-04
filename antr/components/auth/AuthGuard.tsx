"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isUserLoggedIn, getPendingEmail, syncTokenCookie } from "@/app/lib/auth";

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
    const hasPendingEmail = Boolean(getPendingEmail());

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

    const loggedIn = isUserLoggedIn();
    const hasPendingEmail = Boolean(getPendingEmail());

    const isAuthRoute =
      pathname === "/authentication" || pathname?.startsWith("/authentication/");
    const isOnboardingRoute =
      pathname === "/onboarding" || pathname?.startsWith("/onboarding/");

    // Only authentication and verified onboarding are public routes
    const isPublicRoute = isAuthRoute || (isOnboardingRoute && hasPendingEmail);

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

  // Render a clean pitch-black veil if unauthorized or redirecting
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
