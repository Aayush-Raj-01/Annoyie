import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMS Exclusive Chatting App — Anonymous Peer Messenger (IMSEC)",
  description:
    "Exclusive anonymous chatting app for IMS Engineering College (IMSEC) students. Join cohort rooms, batch discussions, and private encrypted peer DMs without revealing your identity.",
  keywords: [
    "ims exclusive chating app",
    "IMSEC chat app",
    "IMS Engineering College chat",
    "IMSEC anonymous messaging",
    "IMSEC student discussions",
    "IMSEC batch chat",
    "IMS peer messenger",
    "IMSEC hostel chat",
    "IMS Engineering College community app",
  ],
  alternates: {
    canonical: "/chats",
  },
  openGraph: {
    title: "IMS Exclusive Chatting App — Anonymous Peer Messenger (IMSEC)",
    description:
      "Real-time anonymous discussions and direct messages exclusively for verified IMS Engineering College students.",
    url: "https://annoyms.imsec.ac.in/chats",
    type: "website",
  },
};

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
