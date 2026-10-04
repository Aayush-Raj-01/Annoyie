"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QueryProvider from "@/components/providers/QueryProvider";
import ChatContainer from "@/components/chat/ChatContainer";
import Navbar from "../components/navbar";
import { getUserProfile, syncUserProfile, isUserLoggedIn, UserProfile } from "../lib/auth";
import { searchUsers } from "@/lib/api/users";
import { useChatStore } from "@/store/chatStore";

export default function ChatsPage() {
  const router = useRouter();
  const setCurrentUserId = useChatStore((state) => state.setCurrentUserId);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return isUserLoggedIn();
  });

  const [user, setUser] = useState<{
    id?: number;
    anonymousName: string;
    tag?: string;
    email?: string;
    avatarUrl?: string;
    studentYear?: number;
  }>(() => {
    if (typeof window === "undefined") {
      return { anonymousName: "Anonymous" };
    }
    const stored = getUserProfile();
    if (stored && stored.anonymousName && !stored.anonymousName.startsWith("Guest_")) {
      return {
        id: stored.id,
        anonymousName: stored.anonymousName,
        tag: stored.hobbies?.[0] || undefined,
        email: stored.email || undefined,
        avatarUrl: stored.avatarUrl || undefined,
        studentYear: stored.studentYear,
      };
    }
    return { anonymousName: "Anonymous" };
  });

  useEffect(() => {
    let isMounted = true;

    const applyProfile = (profile: UserProfile | null) => {
      const loggedIn = Boolean(profile && profile.anonymousName && !profile.anonymousName.startsWith("Guest_"));
      setIsLoggedIn(loggedIn);

      if (loggedIn && profile) {
        setUser({
          id: profile.id,
          anonymousName: profile.anonymousName,
          tag: profile.hobbies?.[0] || undefined,
          email: profile.email || undefined,
          avatarUrl: profile.avatarUrl || undefined,
          studentYear: profile.studentYear,
        });
        if (profile.id) {
          setCurrentUserId(profile.id);
        }
        return true;
      }
      return false;
    };

    const init = async () => {
      let profile = getUserProfile();

      // If profile is missing or missing DB id, attempt to sync with backend
      if (!profile || !profile.id) {
        const synced = await syncUserProfile();
        if (synced) {
          profile = synced;
        }
      }

      // Fallback: If profile still lacks DB id, search by username to find their ID
      if (profile && !profile.id && profile.anonymousName && !profile.anonymousName.startsWith("Guest_")) {
        try {
          const results = await searchUsers(profile.anonymousName);
          const match = results.find(
            (u) => u.username.toLowerCase() === profile!.anonymousName.toLowerCase()
          );
          if (match) {
            profile.id = match.id;
            setCurrentUserId(match.id);
            try {
              localStorage.setItem("annoyms_user_profile", JSON.stringify(profile));
            } catch {}
          }
        } catch (err) {
          console.warn("Could not auto-resolve current user ID:", err);
        }
      }

      if (!isMounted) return;

      if (!applyProfile(profile)) {
        setIsLoggedIn(false);
        setUser({
          anonymousName: "Guest",
        });
        router.replace("/authentication");
      }
    };

    init();

    const handleProfileUpdate = () => {
      applyProfile(getUserProfile());
    };
    window.addEventListener("annoyms_profile_updated", handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("annoyms_profile_updated", handleProfileUpdate);
    };
  }, [setCurrentUserId]);

  return (
    <QueryProvider>
      <ChatContainer currentUser={user} isLoggedIn={isLoggedIn} />
      <Navbar />
    </QueryProvider>
  );
}
