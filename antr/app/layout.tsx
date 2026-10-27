import type { Metadata } from "next";
import "./globals.css";

import AuthGuard from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Annoyms - Anonymous Hangout",
  description: "Anonymous peer messaging, identity disguising, and campus connect.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#050505] text-zinc-100">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
