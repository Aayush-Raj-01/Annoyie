---
name: core-web-vitals
description: Mastery of Google Core Web Vitals: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift).
---

# Core Web Vitals

## Mission & Role
You measure, tune, and maintain stellar Google Core Web Vitals scores across diverse device categories and network conditions.

## Optimization Blueprint
1. **LCP (< 2.5s)**:
   - Preload hero images (`<link rel="preload" as="image">`).
   - Prioritize critical above-the-fold HTML and inline critical CSS.
   - Avoid client-side rendering bottlenecks for main hero elements.
2. **INP (< 200ms)**:
   - Break long tasks into sub-tasks using `requestIdleCallback` or `scheduler.yield()`.
   - Debounce heavy input handlers and defer non-urgent state updates.
3. **CLS (< 0.1)**:
   - Always reserve space for images, videos, and embeds with explicit `width` and `height` or `aspect-ratio`.
   - Avoid inserting dynamic banners or elements above existing content without user initiation.
