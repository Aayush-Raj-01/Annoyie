"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { syncUserProfile, setAuthToken } from "../lib/auth";

export default function AuthenticationPage() {

  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup" | "verify-otp">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setotp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if(!cleanEmail || !password || !confirmPassword){
      setError("Please fill all the fields");
      return;
    }
    if(password.length < 8){
      setError("Password must be at least 8 characters long. :)");
      return;
    }
    if(!/\d/.test(password)){
      setError("Password does not contain any Numbers :)");
      return;
    }
    if(confirmPassword != password){
      setError("Password doesn't match :)");
      return;
    }

    setLoading(true);
    try{
      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: cleanEmail,
          password
        })
      });
      if(!res.ok){
        const errorText = await res.text();
        throw new Error(errorText || "failed to register");
      }
      localStorage.setItem("annoyms_pending",cleanEmail);
      setSuccess(`A 6-digit verification code has been sent to ${cleanEmail}`);
      setMode("verify-otp");
    }catch(err: any){
      setError(err.message || "SERVER IS DEAD")
    }finally{
      setLoading(false);
    }
    
  };

  const handleVerifyOtp = async(e: React.FormEvent)=>{
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanOtp = otp.trim();
    const cleanEmail =  email.trim().toLowerCase();

    if(cleanOtp.length != 6){
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try{
      const res = await fetch("http://localhost:8080/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      if(!res.ok){
        const errorText = await res.text();
        throw new Error(errorText || "SHAI SAI OTP DE BHAI");
      }
      setSuccess("Email Verified Yep !!!");

      setTimeout(() =>{
        router.push("/onboarding");
      },800);
    }catch (err:any){
      setError(err.message || "OTP Verfication Failed");
    }finally{
      setLoading(false);
    }
  };

  const handleSignIn = async(e:React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLocaleLowerCase();
    if(!cleanEmail || !password){
      setError("Please enter your email and password.")
      return;
    }
    setLoading(true);
    try{
      const res = await fetch("http://localhost:8080/auth/login",{
        method: "POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({email: cleanEmail, password}),
      });
      if(!res.ok){
        const errorText = await res.text();
        throw new Error(errorText || "Invaild email or password.");
      }
      const data = await res.json();
      if(data.token){
        setAuthToken(data.token);
        localStorage.setItem("annoyms_token", data.token);
        localStorage.setItem("annoyms_email", cleanEmail);
        const userProfile = await syncUserProfile(data.token);
        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          if (!userProfile?.anonymousName) {
            router.push("/onboarding");
          } else {
            router.push("/chats");
          }
        }, 600);
      }
    }catch(err:any){
      setError(err.message || "Invaild Email or Password");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Small Display Background: Focused on the bright right-side fluted streaks */}
      <div className="absolute inset-0 lg:hidden pointer-events-none z-0">
        <img
          src="/emerald-glass.jpg"
          alt="Emerald Glass Mobile Backdrop"
          className="w-full h-full object-cover object-right sm:object-[80%_center] opacity-45 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85 backdrop-blur-[1px]" />
      </div>

      {/* Desktop Background ambient lighting & cyber matrix */}
      <div className="hidden lg:block absolute top-0 left-0 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="hidden lg:block absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* LEFT COLUMN: Editorial & Authentication Forms */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col justify-between p-4 sm:p-10 lg:p-14 z-10 min-h-screen relative overflow-hidden">
        
        {/* Cyber Dot-Matrix Grid Background with Radial Mask */}
        <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:26px_26px] opacity-[0.14] pointer-events-none z-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,black_60%,transparent_100%)]" />

        {/* Faint Giant Background Watermark */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <span className="text-[17vw] font-black text-white/[0.02] font-mono tracking-tighter leading-none whitespace-nowrap">
            ANNOYOI
          </span>
        </div>

  

        {/* Center: Sign In / Auth Form Container */}
        <div className="my-auto w-full max-w-md mx-auto py-6 flex flex-col justify-center relative z-10">
          
          {/* Glassmorphic Cyber Halo Card */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/50 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden group">
            {/* Top Emerald Laser Glow Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]" />

            {/* Mobile Brandmark (Only shown on small screens) */}
            <div className="lg:hidden text-center mb-6">
              <h2 className="authtext ext-4xl sm:text-5xl font-bold text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] tracking-[0.65rem]">
                ANNOYOI
              </h2>
              <p className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase mt-1.5">
                EVEN WE DONT KNOW OUR USERS
              </p>
            </div>

            {/* Centered Tab Switcher with Animated Sliding Pill */}
          {mode !== "verify-otp" && (
            <div className="flex justify-center mb-6">
              <div className="relative flex w-72 p-1 bg-zinc-900/80 rounded-xl border border-white/10 backdrop-blur-md shadow-lg shadow-black/40">
                {/* Sliding active background pill */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    mode === "signin"
                      ? "left-1 bg-white shadow-md shadow-white/10"
                      : "left-[calc(50%+3px)] bg-emerald-500 shadow-md shadow-emerald-500/25"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`relative z-10 w-1/2 py-2 text-center text-xs font-mono uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                    mode === "signin"
                      ? "text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`relative z-10 w-1/2 py-2 text-center text-xs font-mono uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                    mode === "signup"
                      ? "text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* Status Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2 animate-fadeIn">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}

          {/* 1. Sign In Form (Smooth Transition) */}
          {mode === "signin" && (
            <form key="signin" onSubmit={handleSignIn} className="space-y-4 animate-form-switch">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400/50 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400/50 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-black text-xs font-bold font-mono tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          )}

          {/* 2. Sign Up Form (Smooth Transition) */}
          {mode === "signup" && (
            <form key="signup" onSubmit={handleSignUp} className="space-y-4 animate-form-switch">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu or name@gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400/50 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Password <span className="text-zinc-500 normal-case">(Min 8 chars, 1 number)</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400/50 transition-all font-mono"
                />
              </div>
              <div className="animate-form-switch">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400/50 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-black text-xs font-bold font-mono tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Generating OTP..." : "Register // Send 6-Digit Code"}
              </button>
            </form>
          )}

          {/* 3. OTP Verification Form (Smooth Transition) */}
          {mode === "verify-otp" && (
            <form key="verify-otp" onSubmit={handleVerifyOtp} className="space-y-4 animate-form-switch">
              <div className="text-center py-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block mb-1">
                  Verification Dispatched
                </span>
                <p className="text-xs text-zinc-400">
                  Enter code sent to <span className="text-white font-mono">{email}</span>
                </p>
              </div>
              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => setotp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full tracking-[0.6em] text-center font-mono text-2xl py-3.5 rounded-xl bg-white/[0.04] border border-emerald-500/50 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-black text-xs font-bold font-mono tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Verifying..." : "Confirm & Proceed"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="w-full text-xs font-mono text-zinc-500 hover:text-zinc-300 pt-1 text-center cursor-pointer"
              >
                &larr; Re-enter Email Address
              </button>
            </form>
          )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Full-Bleed Emerald Texture for Desktop (Hidden on mobile since mobile uses full backdrop) */}
      <div className="hidden lg:flex w-full lg:w-1/2 xl:w-5/12 min-h-[420px] lg:min-h-screen relative bg-black items-center justify-center overflow-hidden border-t lg:border-t-0 lg:border-l border-white/5">
        
        {/* The Exact Fluted Glass Artwork */}
        <img
          src="/emerald-glass.jpg"
          alt="HAOS Emerald Fluted Glass"
          className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none opacity-50"
        />

        {/* Subtle Dark Vignette & Edge Blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Center Cyber Brandmark */}
        <div className="relative z-10 text-center px-4">
          <h2 className="authtext text-4xl sm:text-6xl font-black tracking-[0.35em] text-white uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)] ">
            ANNOYOI
          </h2>
          <p className="text-[11px] font-mono tracking-widest text-zinc-300 uppercase mt-3 drop-shadow-md">
            EVEN WE DONT KNOW OUR USERS
          </p>
        </div>
      </div>
      <Navbar />
    </div>
  );
}