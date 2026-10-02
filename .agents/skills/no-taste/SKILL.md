---
name: no-taste
description: >
  Anti-slop frontend and visual taste engine. Eliminates generic "no-taste" AI designs
  by enforcing high-end aesthetic judgment, curated typography, intentional layout variance,
  calibrated motion, and bespoke design systems. Use whenever the user asks for
  "no-taste", "taste", "anti-slop", "clean aesthetics", "premium UI", or complains about
  generic AI-looking designs and cookie-cutter layouts.
argument-hint: "[audit|apply|presets]"
license: MIT
---

# No-Taste: Anti-Slop Frontend & Taste Engine

A curated, battle-tested standard to eliminate generic "no-taste" AI slop from web apps, landing pages, and components.

## Core Philosophy: The Anti-Default Discipline

Most AI coding agents produce "no-taste" UI because they gravitate toward the exact same predictable defaults:
1. **The AI Gradient**: Violet-to-fuchsia or cyan-to-purple radial mesh over `slate-950`.
2. **The 3-Card Bento**: Three identical boxes with identical icons, identical padding, and identical rounded corners.
3. **Typography Apathy**: Defaulting blindly to `Inter`, `Roboto`, or system fonts without weight contrast or letter-spacing tuning.
4. **Vague Spacing**: Uniform 16px/24px padding everywhere, lacking rhythm, breathing room, or intentional asymmetry.
5. **Dull Glassmorphism**: `backdrop-blur-md bg-white/5 border border-white/10` plastered indiscriminately.

**No-Taste blocks these lazy defaults and forces deliberate, opinionated design.**

---

## 1. The Three Dials

Before generating or refactoring any interface, calibrate the 3 dials:

| Dial | Range | Meaning | Recommended Baseline |
|---|---|---|---|
| **`DESIGN_VARIANCE`** | 1 (Rigid/Symmetric) – 10 (Artsy/Chaos) | Layout asymmetry, broken grids, unexpected scale shifts | **8** |
| **`MOTION_INTENSITY`** | 1 (Static) – 10 (Cinematic/Physics) | Micro-interactions, hover physics, scroll-driven reveals | **6** |
| **`VISUAL_DENSITY`** | 1 (Airy/Art Gallery) – 10 (Cockpit/Data Dense) | Whitespace ratio, line-height, compact vs expansive | **4** |

### Dial Presets
- **Minimalist / Editorial**: Variance 5 | Motion 3 | Density 2
- **Tech / Developer Tool (Linear / Raycast style)**: Variance 6 | Motion 5 | Density 5
- **High-End Consumer / Brand (Apple / Teenage Engineering)**: Variance 8 | Motion 6 | Density 3
- **Awwwards / Experimental**: Variance 10 | Motion 8 | Density 3

---

## 2. The Design Read (Room Inference)

Before touching code or styling, declare a **one-line Design Read**:
> *"Reading this as: `<product kind>` for `<audience>`, with a `<vibe>` language, leaning toward `<design system / aesthetic>`."*

### Signals to Scan
1. **Audience**: Engineering team vs. consumer vs. executive vs. student.
2. **Product Nature**: Focused utility vs. expressive social platform vs. high-trust finance.
3. **Existing DNA**: Existing fonts, brand colors, textures, and asset styles (e.g. emerald vortex, custom display fonts).

---

## 3. Aesthetic Execution Rules

### A. Typography with Intention
- Combine a distinct display typeface (character, warmth, or sharp tech) with a clean, high-legibility body typeface.
- Use tight tracking (`tracking-tight` / `-0.02em` to `-0.04em`) on large headlines (`text-4xl` and above).
- Give body copy breathing room (`leading-relaxed` or `leading-loose`).

### B. Color & Light
- Avoid pure hex primaries (`#ff0000`, `#0000ff`). Use tailored palettes with nuanced undertones (e.g., emerald with deep forest-black shadows, warm amber accents).
- Keep contrast ratios WCAG AA compliant while maintaining atmosphere.
- If using dark mode, use layered surface tints (e.g. `bg-[#0a0f0d]`, `border-emerald-500/20`) rather than flat `#000000`.

### C. Layout Hierarchy & Asymmetry
- Hero sections should have a dominant anchor: an oversized focal element, dramatic type contrast, or purposeful offset columns.
- Avoid repetitive card grids; introduce focal cards, full-width banners, or staggered horizontal flows.

### D. Motion & Micro-interactions
- Every interactive element should provide subtle, tactile feedback:
  - Spring-like easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Hover states that subtly shift transform (`scale-[1.02]`, `translate-y-[-1px]`), border glow, or shadow intensity.
  - Smooth expansion and dynamic resizing for responsive inputs.

---

## 4. Companion Skills in This Workspace
This workspace has the full suite of complementary taste skills installed in `.agents/skills/`:
- **`design-taste-frontend`**: Anti-slop frontend engineering for landing pages, portfolios, and redesigns.
- **`high-end-visual-design`**: Agency-grade styling tokens, typography, shadows, and animations.
- **`redesign-existing-projects`**: Auditing and upgrading existing websites to premium quality.
- **`taste`**: Reverse-engineering design DNA and design tokens from any reference URL.
