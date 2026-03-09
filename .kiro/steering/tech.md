# Tech Stack & Build System

## Core

- Next.js 16 (App Router, React Server Components enabled)
- React 19, TypeScript 5 (strict mode)
- Node.js with npm as package manager

## Styling

- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- shadcn/ui (base-lyra style, CSS variables, neutral base color)
- `tw-animate-css` for animations
- `class-variance-authority` for component variants
- `clsx` + `tailwind-merge` via `cn()` utility in `src/lib/utils.ts`

## UI Components

- Base UI (`@base-ui/react`) as the headless primitive layer under shadcn
- Phosphor Icons (`@phosphor-icons/react`)

## Planned / In-Spec (not yet installed)

- better-auth for authentication
- Drizzle ORM + PostgreSQL for database
- Stripe for payments (BRL credits)
- Apify (`apify/instagram-profile-scraper`) for Instagram data
- LangChain for AI agent and LLM Judge
- TanStack React Query + Axios for data fetching

## Common Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## TypeScript Config

- Path alias: `@/*` maps to `./src/*`
- Target: ES2017, module: ESNext, bundler resolution
- Strict mode enabled
