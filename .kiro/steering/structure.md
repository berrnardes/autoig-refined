# Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/auth/[...all]/  # better-auth catch-all route handler
│   ├── dashboard/          # Authenticated dashboard page
│   ├── login/              # Login/signup page (client component)
│   ├── layout.tsx          # Root layout (JetBrains Mono font)
│   ├── page.tsx            # Landing page
│   └── globals.css         # Tailwind global styles
├── components/ui/          # shadcn/ui primitives (button, card, input, label)
├── db/
│   ├── index.ts            # Drizzle client + pg pool (exports `db`)
│   ├── schema.ts           # App tables: credits, scrapeCache, evaluations, creditTransactions
│   └── auth-schema.ts      # Auth tables: user, session, account, verification
├── lib/
│   ├── auth/
│   │   ├── index.ts        # Server-side better-auth instance
│   │   └── client.ts       # Client-side auth (signIn, signUp, signOut, useSession)
│   ├── guide-pdf-document.tsx  # React PDF template for guide output
│   ├── utils.ts            # cn() helper for Tailwind class merging
│   └── validators.ts       # Zod schemas for all domain types
├── services/
│   ├── scrape-service.ts      # Apify Instagram scraper with 24h cache
│   ├── competitor-service.ts  # Multi-profile scraping + aggregation
│   ├── guide-service.ts       # LLM guide generation + regeneration + PDF export
│   └── judge-service.ts       # LLM quality evaluation (scoring + feedback)
├── types/
│   └── index.ts            # Shared TypeScript interfaces (ProfileData, GuideContent, etc.)
└── proxy.ts                # Middleware for auth-gating dashboard + API routes
drizzle/                    # Generated SQL migrations
```

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Services are stateless modules exporting functions or singleton objects (not classes with state)
- Custom error classes per service (e.g. `ScrapeServiceError`) with typed `code` field
- Database schemas split: `schema.ts` for app domain, `auth-schema.ts` for auth (both registered in drizzle config)
- Zod schemas in `validators.ts` mirror TypeScript interfaces in `types/index.ts`
- Client components marked with `"use client"` directive
- UI components live in `src/components/ui/` and follow shadcn patterns
