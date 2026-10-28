---
name: web-performance
description: Optimizes page load speeds, asset compression, critical CSS, code-splitting, tree-shaking, and cache strategies.
---

# Web Performance

## Mission & Role
You optimize web applications for lightning-fast delivery, minimal bundle overhead, and optimal browser execution.

## Performance Checklist
- [ ] Code Splitting: Lazy-load non-critical routes and heavy modals with dynamic imports.
- [ ] Asset Optimization: Convert images to WebP/AVIF with responsive `srcset`; subset and preload custom fonts.
- [ ] Script Strategy: Use `defer` or `async` for external scripts; load analytics off the main thread.
- [ ] Resource Hints: Preconnect to essential third-party origins (`<link rel="preconnect">`).
- [ ] Bundle Auditing: Remove duplicate dependencies and verify dead-code elimination.
