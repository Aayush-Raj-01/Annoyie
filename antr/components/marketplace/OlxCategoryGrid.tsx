"use client";

import React from "react";

export interface OlxCategory {
  id: string;
  label: string;
  bgHex: string;
  icon: React.ReactNode;
  filterMatch: string[]; // matching category strings in listings
}

export const OLX_CATEGORIES: OlxCategory[] = [
  {
    id: "nearby",
    label: "CAMPUS DEALS",
    bgHex: "#A7F3D0", // Pastel Emerald-Mint
    filterMatch: ["all"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#065f46]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
      </svg>
    ),
  },
  {
    id: "textbooks",
    label: "TEXTBOOKS & NOTES",
    bgHex: "#BAE6FD", // Soft Sky-Blue
    filterMatch: ["Textbooks", "Books", "Notes"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#0c4a6e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "cycles",
    label: "CAMPUS CYCLES",
    bgHex: "#2DD4BF", // Mint / Teal
    filterMatch: ["Cycles", "Bikes", "Bicycles", "Cars", "Mobility"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#134e4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h2m-2 0l-4 7h-4l3-6h-3M9 13l-3.5 4.5m13-4.5l-4-4" />
      </svg>
    ),
  },
  {
    id: "hostel",
    label: "HOSTEL & ROOM",
    bgHex: "#FDE047", // Pastel Sun-Yellow
    filterMatch: ["Hostel", "Hostel Gear", "Properties", "Room Gear"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#78350f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* Bed & Hostel Room Icon */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10V6a1 1 0 011-1h4a1 1 0 011 1v4M3 14h18M3 18v3m18-3v3M3 14V9a2 2 0 012-2h14a2 2 0 012 2v5" />
        <circle cx="7" cy="11" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "electronics",
    label: "ELECTRONICS & TECH",
    bgHex: "#C4B5FD", // Lavender
    filterMatch: ["Electronics", "Appliances", "Laptops", "Audio"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#312e81]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* Laptop icon */}
        <rect x="3" y="4" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 19h20M9 16h6" />
      </svg>
    ),
  },
  {
    id: "mobiles",
    label: "MOBILES & GADGETS",
    bgHex: "#FCD34D", // Tan / Gold
    filterMatch: ["Mobiles", "Electronics", "Phones", "Gadgets"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#713f12]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="6" y="2" width="12" height="20" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="11.5" y1="18" x2="12.5" y2="18" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "labkits",
    label: "LAB KITS & DRAFTERS",
    bgHex: "#FCA5A5", // Pastel Coral
    filterMatch: ["Lab Kits", "Drafters", "Tools", "Engineering"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#881337]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* Engineering Compass / Drafter & Tools Icon */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 0l-5 14m5-14l5 14M7 16h10" />
        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "furniture",
    label: "DESKS & CHAIRS",
    bgHex: "#FDA4AF", // Coral Pink
    filterMatch: ["Furniture", "Hostel Gear", "Chairs", "Desks"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#881337]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* Study Chair & Table Icon */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 10V4a1 1 0 011-1h6a1 1 0 011 1v6M4 14h12a2 2 0 002-2v-2H2v2a2 2 0 002 2zm2 0v6m8-6v6" />
      </svg>
    ),
  },
  {
    id: "gigs",
    label: "GIGS & PROJECTS",
    bgHex: "#5EEAD4", // Light Cyan
    filterMatch: ["Jobs", "Gigs", "Internships", "Sports", "Hobbies", "Other"],
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#164e63]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* Graduation Cap / Projects icon */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13.18v4c0 2.21 3.13 4 7 4s7-1.79 7-4v-4" />
      </svg>
    ),
  },
];

interface OlxCategoryGridProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onSeeAll?: () => void;
  className?: string;
}

export default function OlxCategoryGrid({
  selectedCategoryId,
  onSelectCategory,
  onSeeAll,
  className = "",
}: OlxCategoryGridProps) {
  return (
    <section className={`w-full py-2 select-none ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
            Browse campus categories
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hidden xs:inline">
            Campus verified
          </span>
        </div>

        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider transition-colors cursor-pointer"
          >
            SEE ALL
          </button>
        )}
      </div>

      {/* Mobile: Horizontal scrollable carousel row; Tablet & Desktop: Responsive Grid */}
      <div className="flex sm:grid sm:grid-cols-5 lg:grid-cols-9 items-start gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible scrollbar-none pb-1.5 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
        {OLX_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center text-center shrink-0 w-[68px] sm:w-auto group cursor-pointer focus:outline-none"
            >
              {/* Circular Avatar with Pastel Fill */}
              <div
                style={{ backgroundColor: cat.bgHex }}
                className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-15 lg:h-15 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm group-hover:scale-105 active:scale-95 ${
                  isSelected
                    ? "ring-3 sm:ring-4 ring-emerald-500 ring-offset-2 ring-offset-[#0a0c10] scale-105 shadow-emerald-500/40"
                    : "group-hover:shadow-md"
                }`}
              >
                {cat.icon}
              </div>

              {/* Uppercase College-Specific Category Label */}
              <span
                className={`mt-1.5 text-[9px] sm:text-[10px] lg:text-[10.5px] font-bold tracking-tight uppercase leading-tight line-clamp-2 px-0.5 transition-colors ${
                  isSelected
                    ? "text-emerald-400 font-extrabold"
                    : "text-zinc-400 group-hover:text-white"
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
