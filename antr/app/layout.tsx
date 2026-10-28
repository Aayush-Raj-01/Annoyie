import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGuard from "@/components/auth/AuthGuard";
import AppNotificationBanner from "@/components/chat/ChatNotificationBanner";

export const viewport: Viewport = {
  themeColor: "#121316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://annoyms.imsec.ac.in"),
  title: {
    default: "Annoyoi /IMSEC — Exclusive IMS Engineering College Marketplace & Chat App",
    template: "%s | Annoyoi /IMSEC",
  },
  description:
    "Official IMS Engineering College student platform. Exclusive anonymous campus chatting app, peer-to-peer student marketplace, buy/sell textbooks, bicycles & hostel gear for IMSEC students with verified @imsec.ac.in access.",
  keywords: [
    "IMSEC",
    "IMS Engineering College",
    "ims marketplace",
    "ims exclusive chating app",
    "IMSEC chat app",
    "IMSEC marketplace",
    "IMS Engineering College Ghaziabad",
    "IMS Engineering College student portal",
    "Annoyoi /IMSEC",
    "Annoyoi",
    "Annoyms IMSEC",
    "IMSEC anonymous chat",
    "buy sell textbooks IMSEC",
    "IMSEC hostel gear",
    "IMSEC bicycle exchange",
    "imsec.ac.in",
    "IMS campus store",
    "IMS peer messenger",
    "AKTU IMSEC student network",
  ],
  authors: [{ name: "Annoyoi /IMSEC Team" }],
  creator: "Annoyoi /IMSEC",
  publisher: "IMS Engineering College Student Network",
  category: "Campus Community & E-Commerce",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Annoyoi /IMSEC — Exclusive IMS Engineering College Marketplace & Chat App",
    description:
      "Connect anonymously with fellow IMS Engineering College students, trade hostel items & textbooks on the IMSEC marketplace, and join cohort discussion rooms.",
    url: "https://annoyms.imsec.ac.in",
    siteName: "Annoyoi /IMSEC",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Annoyoi /IMSEC — Exclusive IMS Engineering College Marketplace & Chat App",
    description:
      "Exclusive anonymous chatting app and student marketplace for IMS Engineering College (IMSEC) students.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const structuredSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollegeOrUniversity",
      "@id": "https://imsec.ac.in/#college",
      name: "IMS Engineering College",
      alternateName: ["IMSEC", "IMSEC Ghaziabad"],
      url: "https://imsec.ac.in",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ghaziabad",
        addressRegion: "Uttar Pradesh",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://annoyms.imsec.ac.in/#app",
      name: "Annoyoi /IMSEC",
      alternateName: [
        "IMS Marketplace",
        "IMS Exclusive Chatting App",
        "IMSEC Marketplace",
        "IMSEC Chat",
      ],
      url: "https://annoyms.imsec.ac.in",
      applicationCategory: "SocialNetworkingApplication, ShoppingApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "Exclusive student platform for IMS Engineering College (IMSEC). Features real-time peer-to-peer campus marketplace and private anonymous cohort chat rooms.",
      provider: {
        "@id": "https://imsec.ac.in/#college",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#050505] text-zinc-100">
        <AppNotificationBanner />
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
