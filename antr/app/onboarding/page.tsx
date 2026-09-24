"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/navbar";
import { getPendingEmail, getUserProfile, saveUserProfile, uploadAvatarImage } from "../lib/auth";

const GENDER_OPTIONS = [
  { label: "Male", icon: "♂" },
  { label: "Female", icon: "♀" },
];

const HOBBY_TAGS = [
  { tag: "Coder" as const, icon: "💻", desc: "Builds, scripts & debugs" },
  { tag: "Bookworm" as const, icon: "🧠", desc: "Have good grades" },
  { tag: "Creative" as const, icon: "🎨", desc: "Exploring Creativity Through Art" },
  { tag: "Sports" as const, icon: "🏃", desc: "Fitness & athletics" },
];

type HobbyTag = (typeof HOBBY_TAGS)[number]["tag"];

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  // Lazy state initialization to prevent cascading renders
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    const existing = getUserProfile();
    const pending = getPendingEmail();
    return existing?.email || pending || "operative@annoyms.local";
  });

  const [anonymousName, setAnonymousName] = useState(() => {
    if (typeof window === "undefined") return "";
    return getUserProfile()?.anonymousName || "";
  });

  const [gender, setGender] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return getUserProfile()?.gender || "";
  });

  const [selectedHobbies, setSelectedHobbies] = useState<HobbyTag[]>(() => {
    if (typeof window === "undefined") return ["Coder"];
    const existing = getUserProfile()?.hobbies as HobbyTag[] | undefined;
    return existing && existing.length > 0 ? [existing[0]] : ["Coder"];
  });

  const [bio, setBio] = useState(() => {
    if (typeof window === "undefined") return "";
    return getUserProfile()?.bio || "";
  });

  // Profile Picture state (< 5MB)
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return getUserProfile()?.avatarUrl || "";
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Sync if profile was updated elsewhere
    const handleUpdate = () => {
      const p = getUserProfile();
      if (p) {
        if (p.email) setEmail(p.email);
        if (p.anonymousName) setAnonymousName(p.anonymousName);
        if (p.gender) setGender(p.gender);
        if (p.hobbies?.length) setSelectedHobbies(p.hobbies as HobbyTag[]);
        if (p.bio) setBio(p.bio);
        if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
      }
    };
    window.addEventListener("annoyms_profile_updated", handleUpdate);
    return () => window.removeEventListener("annoyms_profile_updated", handleUpdate);
  }, []);

  // Auto-expand bio textarea height as user types or when bio changes
  useEffect(() => {
    if (bioRef.current) {
      bioRef.current.style.height = "auto";
      bioRef.current.style.height = `${bioRef.current.scrollHeight}px`;
    }
  }, [bio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5MB size limit validation (5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5MB limit. Please choose a smaller image.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError("");
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const selectHobby = (tag: HobbyTag) => {
    setError("");
    setSelectedHobbies([tag]);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonymousName.trim()) {
      setError("Please choose a username.");
      return;
    }

    if (selectedHobbies.length === 0) {
      setError("Please select your specialization.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload profile picture if a new file was chosen
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadAvatarImage(avatarFile, email);
          setAvatarUrl(finalAvatarUrl);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : "Failed to upload profile picture";
          setError(msg);
          setIsSaving(false);
          return;
        }
      }

      // Save locally to storage for persistence across profile & chats
      saveUserProfile({
        email,
        anonymousName: anonymousName.trim(),
        gender: gender || undefined,
        hobbies: selectedHobbies,
        bio: bio.trim(),
        avatarUrl: finalAvatarUrl || undefined,
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
            tag: selectedHobbies.join(","),
            avatarUrl: finalAvatarUrl || null,
          }),
        });
      } catch (beError) {
        console.warn("Backend profile sync skipped:", beError);
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

  const activeAvatarPreview = previewUrl || avatarUrl;

  return (
    <div className="min-h-screen w-full bg-[#030504] text-zinc-100 flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200 py-12 px-4 sm:px-6">
      {/* Emerald Vortex Artwork Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/vortex-bg.jpg"
          alt="Emerald Vortex Atmosphere"
          fill
          priority
          className="object-cover object-center select-none scale-105 opacity-50 sm:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030504]/50 via-transparent to-[#030504]/80" />
      </div>

      {/* Subtle Ambient Glows */}
      <div className="hidden lg:block absolute -top-32 left-1/3 w-[600px] h-[400px] bg-emerald-900/15 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="hidden lg:block absolute bottom-0 right-1/4 w-[450px] h-[350px] bg-teal-950/20 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Giant "PROFILE" Background Watermark Typography */}
      <div className="absolute top-12 sm:top-16 lg:top-20 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 w-full text-center overflow-hidden flex items-center justify-center">
        <span className=" text-[17vw] lg:text-[19vw] xl:text-[250px] font-black tracking-[0.14em] uppercase font-sans leading-none whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-white/[0.08] via-white/[0.035] to-transparent">
          PROFILE
        </span>
      </div>

      {/* Clean Editorial Canvas (Expansive 2-Column on PC) */}
      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-7 pb-16">
        
        {/* Header (Clean, Refined Typography) */}
        <div className="text-center space-y-2">

          <h1 className="onboardingheading text-5xl sm:text-6xl lg:text-8xl font-semibold tracking-tight text-zinc-100/60">
            CUSTOMIZE YOUR PROFILE
          </h1>
        </div>

        {/* Status / Error Alert */}
        {error && (
          <div className="max-w-xl mx-auto p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 items-start">
          
          {/* LEFT COLUMN: Very Large Profile Avatar & Username */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-5 p-6 sm:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-900/90 shadow-black/40">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
            />

            {/* Very Large Circular Avatar */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
              title="Click to choose profile picture"
            >
              <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-60 lg:h-60 rounded-full overflow-hidden bg-zinc-900/90 border-2 border-zinc-800 group-hover:border-emerald-700/60 shadow-2xl shadow-black transition-all flex items-center justify-center relative group-hover:shadow-[0_0_35px_rgba(16,185,129,0.18)]">
                {activeAvatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeAvatarPreview}
                    alt="Persona Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl sm:text-7xl select-none opacity-80 group-hover:scale-150 transition-transform">
                    🐵
                  </span>
                )}

                {/* Camera Hover Overlay */}
                <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-zinc-200">
                  <span className="text-xs font-medium mt-1 text-zinc-200">
                    Change Image
                  </span>
                </div>
              </div>

            </div>

            <div className="text-center space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {activeAvatarPreview ? "Replace avatar photo" : "Upload avatar photo"}
              </button>
              <p className="text-[11px] text-zinc-500 text">
                Be Creative
              </p>
            </div>

            {/* Username Input */}
            <div className="w-full space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <label className="onboardtext font-medium text-zinc-300 tracking-wide">
                  Username <span className="text-emerald-400">*</span>
                </label>
              </div>
              <input
                type="text"
                required
                value={anonymousName}
                onChange={(e) => {
                  setAnonymousName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. CyberPhantom_404"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
              />
              <p className="text-[11px] text-zinc-500">
                Your New Identity
              </p>
            </div>

          
          </div>

          {/* RIGHT COLUMN: Specialization, Gender, Bio & Action Button */}
          <div className="lg:col-span-7 flex flex-col space-y-6 p-6 sm:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-900/80 shadow-xl shadow-black/40">
            {/* Specialization Selection (Single-Choice) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="onboardtext font-medium text-zinc-300 text-xs block tracking-wide">
                  Specialization <span className="text-emerald-400">*</span>
                </label>
                <span className="text-zinc-500 text-[11px]">Select 1 specialization</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOBBY_TAGS.map((item) => {
                  const isSelected = selectedHobbies.includes(item.tag);
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => selectHobby(item.tag)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/40 text-zinc-100 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                          : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{item.icon}</span>
                          <span className="onboardtext text-sm font-medium text-zinc-100">{item.tag}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 pl-8 leading-snug">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Preference */}
            <div className="space-y-2">
              <label className="onboardtext font-medium text-zinc-300 text-xs block tracking-wide">
                Gender <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map((opt) => {
                  const isSelected = gender === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setGender(isSelected ? "" : opt.label)}
                      className={`py-2.5 px-4 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span className="onboardtext">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio / Motto */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="onboardtext font-medium text-zinc-300 tracking-wide">
                  Bio <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <span className="text-zinc-500 text-[11px]">{bio.length}/120</span>
              </div>
              <textarea
                ref={bioRef}
                rows={1}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                maxLength={120}
                placeholder="Instagram mai tho bhot bada sa likha hai"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none min-h-[46px] overflow-hidden leading-relaxed"
              />
            </div>

            {/* Professional High-Craft CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.18)] hover:shadow-[0_0_25px_rgba(16,185,129,0.28)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="onboardtext">{isSaving ? "Saving profile..." : "Save and Continue"}</span>
                <span>→</span>
              </button>
            </div>

            {/* Minimal Footer Link */}
            <div className="text-center pt-1">
              <Link
                href="/profile"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Back to profile
              </Link>
            </div>
          </div>
        </form>
      </div>

      <Navbar />
    </div>
  );
}
