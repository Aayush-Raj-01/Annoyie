"use client";

import React, { useEffect, useState } from "react";
import QueryProvider from "@/components/providers/QueryProvider";
import ChatContainer from "@/components/chat/ChatContainer";
import { getUserProfile, syncUserProfile, UserProfile } from "../lib/auth";

export default function ChatsPage() {
  const [user, setUser] = useState<{ anonymousName: string; tag?: string }>({
    anonymousName: "Anonymous",
  });

  useEffect(() => {
    let isMounted = true;

    const applyProfile = (profile: UserProfile | null) => {
      if (profile && profile.anonymousName) {
        setUser({
          anonymousName: profile.anonymousName,
          tag: profile.hobbies?.[0] || undefined,
        });
        return true;
      }
      return false;
    };

    const init = async () => {
      let profile = getUserProfile();
      if (!profile) {
        profile = await syncUserProfile();
      }

      if (!isMounted) return;

      if (!applyProfile(profile)) {
        // Generate a temporary anonymous pseudonym if user has not gone through onboarding yet
        const randomId = Math.floor(1000 + Math.random() * 9000);
        setUser({
          anonymousName: `Guest_${randomId}`,
        });
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
  }, []);

  return (
    <QueryProvider>
      <ChatContainer currentUser={user} />
    </QueryProvider>
  );
}
