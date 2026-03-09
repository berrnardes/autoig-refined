# Project Structure

```
src/
├── app/                  # Next.js App Router (pages, layouts, routes)
│   ├── layout.tsx        # Root layout (Geist + JetBrains Mono fonts, mono default)
│   ├── page.tsx          # Home page
│   ├── globals.css       # Tailwind imports, CSS variables, theme tokens (light/dark)
│   └── favicon.ico
├── components/
│   └── ui/               # shadcn/ui components (generated via shadcn CLI)
│       └── button.tsx    # Example: uses Base UI primitives + CVA variants
├── lib/
│   └── utils.ts          # Shared utilities (cn helper)
public/                   # Static assets (SVGs, images)
```

## Conventions

- shadcn components go in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- Shared utilities go in `src/lib/`
- Custom hooks should go in `src/hooks/` (alias configured but dir not yet created)
- Use the `@/` path alias for all imports from `src/`
- Use the `cn()` helper for conditional/merged Tailwind classes
- Components use `"use client"` directive only when client interactivity is needed
- Default font is JetBrains Mono (monospace); Geist Sans/Mono available as CSS variables
- Dark mode uses `.dark` class strategy with oklch color tokens
