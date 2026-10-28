import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMS Marketplace — Buy & Sell at IMS Engineering College (IMSEC)",
  description:
    "Official IMS Marketplace for IMS Engineering College (IMSEC) students. Buy & sell textbooks, lab kits, calculators, bicycles, and hostel room gear with zero commission and direct campus peer messaging.",
  keywords: [
    "ims marketplace",
    "IMSEC marketplace",
    "IMS Engineering College marketplace",
    "buy textbooks IMSEC",
    "sell cycles IMSEC",
    "hostel gear IMSEC",
    "IMSEC college store",
    "IMSEC OLX",
    "IMS Engineering College Ghaziabad student market",
    "drafter lab coat IMSEC",
  ],
  alternates: {
    canonical: "/marketplace",
  },
  openGraph: {
    title: "IMS Marketplace — Buy & Sell at IMS Engineering College (IMSEC)",
    description:
      "Buy and sell campus gear, notes, drafters, and cycles with fellow students at IMS Engineering College.",
    url: "https://annoyms.imsec.ac.in/marketplace",
    type: "website",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
