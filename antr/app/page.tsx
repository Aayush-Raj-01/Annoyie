import React from "react";
import Link from "next/link";
import Navbar from "./components/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl shadow-xl shadow-blue-500/20">
          🕶️
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome to <span className="text-blue-500">Annoyms</span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The ultimate anonymous hangout. Sign up with just your email and password, verify with OTP, and build your anonymous persona with coder or non-coder tags.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/authentication"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            Get Started (Sign Up)
          </Link>
          <Link
            href="/chats"
            className="px-6 py-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium transition-all"
          >
            Explore Chats
          </Link>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
