# Tech Stack

## Framework & Runtime

- Next.js 16 (App Router, React 19, RSC enabled)
- TypeScript (strict mode)

## Database

- PostgreSQL via `pg` driver
- Drizzle ORM for schema definition and queries
- Migrations in `drizzle/` directory

## Authentication

- better-auth with email/password
- Drizzle adapter, Next.js cookie plugin
- Auth schema separate from app schema (`auth-schema.ts`)

## AI / LLM

- LangChain (`@langchain/core`, `@langchain/openai`) with `gpt-4.1-mini`
- Structured output via Zod schemas for type-safe LLM responses

## External Services

- Apify (`apify-client`) for Instagram scraping
- Mercado Pago (Pix) for credit-based payments
- OpenAI for guide generation and quality judging

## UI

- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- shadcn/ui components (base-lyra style, Phosphor icons)
- `class-variance-authority` + `clsx` + `tailwind-merge` for class composition
- `@react-pdf/renderer` for PDF generation

## Validation

- Zod v4 for runtime validation (validators in `src/lib/validators.ts`)

## Testing

- Vitest (node environment, globals enabled)
- fast-check for property-based testing
- Path alias `@/` resolved in vitest config

## Common Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx vitest --run` — run tests once
- `npx drizzle-kit generate` — generate migration from schema changes
- `npx drizzle-kit migrate` — apply migrations
- `npx drizzle-kit push` — push schema directly (dev only)
