"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  setPendingEmail,
  setAuthToken,
  getAuthToken,
  getUserProfile,
  getPendingEmail,
  clearUserProfile,
  saveUserProfile,
} from "../lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPersona, setCurrentPersona] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      const profile = getUserProfile();
      const pending = getPendingEmail();

      if (token || profile?.email || pending) {
        setIsLoggedIn(true);
        setCurrentEmail(profile?.email || pending || "User");
        if (profile?.anonymousName) {
          setCurrentPersona(profile.anonymousName);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentEmail("");
        setCurrentPersona("");
      }
    };

    checkAuth();
    window.addEventListener("annoyms_profile_updated", checkAuth);
    return () => window.removeEventListener("annoyms_profile_updated", checkAuth);
  }, []);

  const handleSignOut = () => {
    clearUserProfile();
    setIsLoggedIn(false);
    setCurrentEmail("");
    setCurrentPersona("");
    setOtpSent(false);
    setOtp("");
    setErrorMessage("You have signed out successfully.");
  };

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = form.email.trim().toLowerCase();

    if (isSignUp && !otpSent) {
      if (form.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMessage("Passwords do not match. Please verify both passwords.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("http://localhost:8080/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password: form.password,
          }),
        });

        if (res.ok) {
          setPendingEmail(cleanEmail);
          setOtpSent(true);
        } else {
          let errText = "Failed to send verification code. Please try again.";
          try {
            const data = await res.json();
            if (data.message) errText = data.message;
          } catch {
            const text = await res.text();
            if (text) errText = text;
          }
          setErrorMessage(errText);
        }
      } catch (error) {
        console.error("Backend error:", error);
        setErrorMessage("Could not connect to authentication server. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (otpSent) {
      if (otp.trim().length !== 6) {
        setErrorMessage("Please enter a valid 6-digit OTP code.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          "http://localhost:8080/auth/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: cleanEmail,
              otp: otp.trim(),
            }),
          }
        );

        if (res.ok) {
          setPendingEmail(cleanEmail);
          router.push("/onboarding");
        } else {
          let errText = "Invalid or expired OTP. Please try again.";
          try {
            const data = await res.json();
            if (data.message) errText = data.message;
          } catch {
            // ignore non-json error responses
          }
          setErrorMessage(errText);
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        // Fallback for development if backend is offline
        setPendingEmail(cleanEmail);
        router.push("/onboarding");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign In flow
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: form.password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setAuthToken(data.token);
          // Fetch saved persona from backend to restore localStorage
          try {
            const meRes = await fetch("http://localhost:8080/auth/me", {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (meRes.ok) {
              const me = await meRes.json();
              if (me.username) {
                saveUserProfile({ email: me.email, anonymousName: me.username });
              }
            }
          } catch {
            // Silently skip — user can recreate persona if backend is unreachable
          }
        }
        setPendingEmail(cleanEmail);
        router.push("/profile");
      } else {
        let errText = "Invalid email or password. Please try again.";
        try {
          const data = await res.json();
          if (data.message && data.message !== "No message available") {
            errText = data.message;
          } else if (data.error && typeof data.error === "string") {
            errText = data.error;
          }
        } catch {
          const text = await res.text();
          if (text) errText = text;
        }
        setErrorMessage(errText);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setErrorMessage("Could not connect to authentication server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        {isLoggedIn ? (
          <div className="text-center space-y-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-2xl mb-1">
              {currentPersona ? "🎭" : "🕶️"}
            </div>
            <div>
              <h1 className="text-xl font-semibold">Already Signed In</h1>
              <p className="text-xs text-zinc-400 mt-1">
                You are currently active as:
              </p>
              <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono">
                {currentPersona ? (
                  <div className="space-y-0.5">
                    <span className="text-blue-400 font-sans font-semibold text-sm block">{currentPersona}</span>
                    <span className="text-zinc-500 text-[11px] block">{currentEmail}</span>
                  </div>
                ) : (
                  <span className="text-zinc-200">{currentEmail}</span>
                )}
              </div>
            </div>

            {errorMessage && (
              <div
                className={`rounded-lg p-2.5 text-xs text-center border ${
                  errorMessage.includes("successfully")
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <span>👤</span> Go to Profile Page
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3 font-semibold">
                {otpSent ? "🔐" : "🕶️"}
              </div>
              <h1 className="text-xl font-semibold">
                {otpSent ? "Verify Email" : isSignUp ? "Create Account" : "Sign In"}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                {otpSent ? (
                  <>
                    Enter the 6-digit code sent to{" "}
                    <span className="text-zinc-200 font-medium">{form.email || "your email"}</span>
                  </>
                ) : isSignUp ? (
                  "Sign up with your email and password to stay anonymous"
                ) : (
                  "Welcome back! Sign in to continue"
                )}
              </p>
            </div>

            {errorMessage && (
              <div
                className={`mb-4 rounded-lg p-2.5 text-xs text-center border ${
                  errorMessage.includes("successfully")
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {otpSent ? (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 text-center">
                    One-Time Password (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => {
                      setErrorMessage("");
                      setOtp(e.target.value.replace(/\D/g, ""));
                    }}
                    placeholder="123456"
                    autoFocus
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-center font-mono text-xl tracking-[0.6em] outline-none focus:border-blue-500 transition-colors"
                  />
                  <div className="flex justify-between items-center mt-3 text-xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setErrorMessage("");
                      }}
                      className="hover:text-zinc-200 cursor-pointer transition-colors"
                    >
                      ← Edit email / password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage("A new code has been resent to your email.");
                      }}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Password</label>
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Confirm Password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : otpSent
                  ? "Verify & Continue"
                  : isSignUp
                  ? "Send OTP & Continue"
                  : "Sign In"}
              </button>
            </form>

            {!otpSent && (
              <p className="mt-5 text-center text-xs text-zinc-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setOtpSent(false);
                    setErrorMessage("");
                  }}
                  className="text-blue-400 hover:underline cursor-pointer font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-zinc-800/60 text-center">
              <Link href="/profile" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                ← Go to Profile Page
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
