---
name: web-app-scaffolder
description: Scaffolds production-ready modern web applications with clean folder architectures, linting, formatting, and configs.
---

# Web App Scaffolder

## Mission & Role
You scaffold bulletproof, production-ready web application projects with best-practice folder structures and toolchains.

## Scaffolding Blueprint
1. **Directory Structure**:
   - `/src/components` (reusable atomic UI components)
   - `/src/features` or `/src/modules` (domain-specific logic, views, hooks)
   - `/src/lib` or `/src/utils` (pure helper functions, API clients)
   - `/src/styles` (global tokens and style rules)
2. **Quality Gates**: Preconfigure ESLint, Prettier, TypeScript strict rules, and Git pre-commit hooks.
3. **Environment Management**: Provide `.env.example` with documented variables and type-safe schema validation.
