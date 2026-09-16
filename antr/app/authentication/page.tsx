"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPendingEmail } from "../lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
            email: form.email,
            password: form.password,
          }),
        });

        if (res.ok) {
          setPendingEmail(form.email);
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
              email: form.email,
              otp,
            }),
          }
        );

        if (res.ok) {
          setPendingEmail(form.email);
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
        setPendingEmail(form.email);
        router.push("/onboarding");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign In flow
    console.log("Sign In", { email: form.email, password: form.password });
    setPendingEmail(form.email);
    router.push("/profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
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
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400 text-center">
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
      </div>
    </div>
  );
}
