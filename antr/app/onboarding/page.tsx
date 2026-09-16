"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPendingEmail, getUserProfile, saveUserProfile } from "../lib/auth";

const RANDOM_USERNAMES = [
  "ShadowCoder",
  "CyberPhantom",
  "SilentEcho",
  "NeonSpecter",
  "GhostByte",
  "ZeroTrace",
  "CrypticFox",
  "MidnightFalcon",
  "VelvetGlitch",
  "IronCipher",
  "QuantumVortex",
  "DarkDrifter",
];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const HOBBY_TAGS = ["Coder", "Non-coder"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [selectedHobbies, setSelectedHobbies] = useState<("Coder" | "Non-coder")[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if there is a pending email or existing profile
    const existing = getUserProfile();
    const pending = getPendingEmail();
    const activeEmail = existing?.email || pending || "user@annoyms.local";
    setEmail(activeEmail);

    if (existing?.anonymousName) {
      setAnonymousName(existing.anonymousName);
    }
    if (existing?.gender) {
      setGender(existing.gender);
    }
    if (existing?.hobbies && existing.hobbies.length > 0) {
      setSelectedHobbies(existing.hobbies);
    }
  }, []);

  const handleRandomizeName = () => {
    const randomPick =
      RANDOM_USERNAMES[Math.floor(Math.random() * RANDOM_USERNAMES.length)] +
      "_" +
      Math.floor(100 + Math.random() * 900);
    setAnonymousName(randomPick);
    setError("");
  };

  const toggleHobby = (tag: "Coder" | "Non-coder") => {
    setError("");
    setSelectedHobbies((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonymousName.trim()) {
      setError("Please choose or generate an Anonymous Username.");
      return;
    }

    if (selectedHobbies.length === 0) {
      setError("Please select at least one tag (Coder or Non-coder).");
      return;
    }

    setIsSaving(true);

    try {
      // Save locally to storage for persistence across profile & chats
      saveUserProfile({
        email,
        anonymousName: anonymousName.trim(),
        gender: gender || undefined,
        hobbies: selectedHobbies,
      });

      // Also notify backend if reachable
      try {
        await fetch("http://localhost:8080/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username: anonymousName.trim(),
            anonymousName: anonymousName.trim(),
            gender: gender || null,
            hobbies: selectedHobbies,
          }),
        });
      } catch (beError) {
        console.warn("Backend profile sync skipped (offline or not configured):", beError);
      }

      // Route directly to user profile
      router.push("/profile");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md p-7 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xl mb-3 shadow-lg shadow-blue-500/20">
            🎭
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Anonymous Persona</h1>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Your verification was successful! Set up your anonymous identity to start chatting.
          </p>
          {email && (
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-400 font-mono">
              Verified: <span className="text-zinc-200">{email}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Anonymous Username */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Anonymous Username <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleRandomizeName}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>🎲</span> Randomize
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={anonymousName}
                onChange={(e) => {
                  setAnonymousName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. GhostCoder_99"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              This is the secret username shown to other users in chats and your public profile.
            </p>
          </div>

          {/* Gender (Optional) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Gender
              </label>
              <span className="text-[11px] text-zinc-500 font-normal">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = gender === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGender(isSelected ? "" : opt)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hobby Tags */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Hobby Tags <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500 font-normal">Select tags</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {HOBBY_TAGS.map((tag) => {
                const isSelected = selectedHobbies.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleHobby(tag)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/10"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span>{tag === "Coder" ? "💻" : "☕"}</span>
                    <span>{tag}</span>
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Displayed as identity badges in your chat rooms and on your profile.
            </p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving Persona..." : "Save Profile & Enter Annoyms →"}
          </button>
        </form>
      </div>
    </div>
  );
}
