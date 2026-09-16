"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/navbar";
import { getUserProfile, UserProfile } from "../lib/auth";

export default function ChatsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<
    { id: string; sender: string; isMe: boolean; text: string; tag?: string; time: string }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const activeProfile = getUserProfile();
    setProfile(activeProfile);

    // Initial placeholder messages to demonstrate identity in chat
    setMessages([
      {
        id: "1",
        sender: "GhostCoder_77",
        isMe: false,
        text: "Hey everyone! Anyone working on Next.js or React fullstack stuff today?",
        tag: "Coder",
        time: "10:14 PM",
      },
      {
        id: "2",
        sender: "CoffeeEnthusiast",
        isMe: false,
        text: "Just chilling here! Love the anonymous vibe.",
        tag: "Non-coder",
        time: "10:15 PM",
      },
    ]);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName = profile?.anonymousName || "Anonymous User";
    const userTag = profile?.hobbies?.[0] || "Coder";

    const newMessage = {
      id: Date.now().toString(),
      sender: senderName,
      isMe: true,
      text: inputMessage.trim(),
      tag: userTag,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-24">
      {/* Top Header with Identity Persona */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg">
              💬
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Anonymous Public Lounge</h1>
              <p className="text-[11px] text-zinc-400">Encrypted • Anonymous • Realtime</p>
            </div>
          </div>

          {/* Active User Badge */}
          {profile ? (
            <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/60 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-zinc-200">
                {profile.anonymousName}
              </span>
              {profile.hobbies?.[0] && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">
                  {profile.hobbies[0]}
                </span>
              )}
            </div>
          ) : (
            <Link
              href="/onboarding"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1 rounded-full transition-colors"
            >
              Set Persona
            </Link>
          )}
        </div>
      </header>

      {/* Main Chat Feed */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
        {/* Intro banner */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center text-xs text-zinc-400">
          🔒 Messages you send will display your anonymous username:{" "}
          <span className="text-blue-400 font-medium">
            {profile?.anonymousName || "Anonymous"}
          </span>
          {profile?.hobbies && profile.hobbies.length > 0 && (
            <span> and tag ({profile.hobbies.join(", ")})</span>
          )}
          .
        </div>

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-xs font-semibold text-zinc-300">{msg.sender}</span>
              {msg.tag && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                  {msg.tag}
                </span>
              )}
              <span className="text-[10px] text-zinc-500">{msg.time}</span>
            </div>
            <div
              className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.isMe
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </main>

      {/* Message Input Box */}
      <div className="sticky bottom-20 z-10 max-w-2xl w-full mx-auto px-4">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 shadow-xl"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Chat as ${profile?.anonymousName || "Anonymous"}...`}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>

      <Navbar />
    </div>
  );
}
