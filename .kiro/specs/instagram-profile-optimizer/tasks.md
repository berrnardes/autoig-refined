# Implementation Plan: Instagram Profile Optimizer

## Overview

Incremental implementation of the Instagram Profile Optimizer, starting with data layer and auth, then building services bottom-up (scraping → competitor analysis → guide generation → judge → evaluation orchestration → credits/Stripe), followed by API routes and client UI. Each service is wired into the next layer as it's built, ensuring no orphaned code.

## Tasks

- [x] 1. Set up project structure, data models, and shared types
  - [x] 1.1 Initialize Next.js project with TypeScript, install dependencies (drizzle-orm, pg, better-auth, axios, langchain, stripe, zod, @react-pdf/renderer or puppeteer, fast-check, vitest)
    - Configure `tsconfig.json`, `drizzle.config.ts`, and environment variable placeholders (`.env.example`)
    - _Requirements: All_

  - [x] 1.2 Create Drizzle schema and TypeScript interfaces
    - Create `src/db/schema.ts` with `credits`, `scrape_cache`, `evaluations`, and `credit_transactions` tables as defined in the design
    - Create `src/types/index.ts` with `ProfileData`, `PostData`, `CompetitorData`, `GuideContent`, and `Evaluation` interfaces
    - Create `src/db/index.ts` to export the Drizzle client instance
    - _Requirements: 2.6, 3.2, 4.3, 6.1, 7.1, 8.2_

  - [x] 1.3 Create Zod validation schemas
    - Create `src/lib/validators.ts` with `createEvaluationSchema` (username regex + competitors array 1-5), `profileDataSchema`, and `guideContentSchema`
    - _Requirements: 2.5, 3.3, 4.3, 5.2_

- [x] 2. Implement authentication module
  - [x] 2.1 Configure better-auth with Drizzle adapter
    - Check better-auth MCP for implementation
    - Create `src/lib/auth/index.ts` with `betterAuth` config using `drizzleAdapter`
    - Create `src/lib/auth/client.ts` for client-side auth helpers
    - _Requirements: 1.1_

  - [x] 2.2 Create auth middleware for protected routes
    - Create `src/middleware.ts` that protects `/dashboard/**` and `/api/**` routes (excluding `/api/auth/**` and `/api/webhooks/**`)
    - Redirect unauthenticated users to `/login`
    - _Requirements: 1.2, 1.4_

  - [x] 2.3 Build login/signup page
    - Create `src/app/login/page.tsx` with email/password form supporting both sign-up and login modes
    - Display uniform error messages on invalid credentials (do not reveal whether email or password was wrong)
    - On success, redirect to `/dashboard`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]\* 2.4 Write property tests for auth error handling
    - **Property 1: Invalid credentials produce uniform error messages**
    - **Validates: Requirements 1.3**

  - [ ]\* 2.5 Write property test for protected route redirect
    - **Property 2: Protected route redirect**
    - **Validates: Requirements 1.4**

- [x] 3. Checkpoint - Auth module
  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. Implement Scrape Service with caching
  - [x] 4.1 Implement scrape service core logic
    - Check apify MCP server before implementation
    - Create `src/services/scrape-service.ts` implementing the `ScrapeService` interface
    - Implement cache-first lookup: query `scrape_cache` table, return cached data if < 24h old
    - On cache miss or `forceRefresh=true`, call Apify `apify/instagram-profile-scraper` actor via axios
    - Normalize Apify response into `ProfileData` schema, validate with Zod
    - Store/update cache entry in `scrape_cache` table
    - Handle invalid/non-existent usernames with descriptive error messages
    - Handle Apify API errors with retry logic (exponential backoff, max 3 attempts)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4_

  - [ ]\* 4.2 Write property test for scrape cache round trip
    - **Property 3: Scrape cache round trip**
    - **Validates: Requirements 2.2, 3.5, 7.1, 7.4**

  - [ ]\* 4.3 Write property test for cache freshness resolution
    - **Property 4: Cache freshness resolution**
    - **Validates: Requirements 2.4, 7.2**

  - [ ]\* 4.4 Write property test for force refresh bypass
    - **Property 5: Force refresh bypasses cache**
    - **Validates: Requirements 7.3**

  - [ ]\* 4.5 Write property test for invalid username error handling
    - **Property 6: Invalid username error handling**
    - **Validates: Requirements 2.5**

  - [ ]\* 4.6 Write property test for ProfileData structural completeness
    - **Property 7: ProfileData structural completeness**
    - **Validates: Requirements 2.6**

- [ ] 5. Implement Competitor Analyzer Service
  - [ ] 5.1 Implement competitor analyzer core logic
    - Create `src/services/competitor-service.ts` implementing the `CompetitorService` interface
    - Validate 1-5 usernames input, reject 0 or >5 with validation error
    - Call `ScrapeService.scrapeProfile()` for each competitor using `Promise.allSettled`
    - Aggregate successful results into `CompetitorData` (compute averages for followers, engagement rate, posting frequency; collect common hashtags, bio patterns, content type mix)
    - Return failed usernames in `failedUsernames` array
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]\* 5.2 Write property test for competitor aggregation correctness
    - **Property 8: Competitor aggregation correctness**
    - **Validates: Requirements 3.2**

  - [ ]\* 5.3 Write property test for competitor count validation
    - **Property 9: Competitor count validation**
    - **Validates: Requirements 3.3**

  - [ ]\* 5.4 Write property test for partial competitor failure handling
    - **Property 10: Partial competitor failure handling**
    - **Validates: Requirements 3.4**

- [ ] 6. Checkpoint - Scraping services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Guide Generation Service
  - [ ] 7.1 Implement guide generation with LangChain
    - Create `src/services/guide-service.ts` implementing the `GuideService` interface
    - Build LangChain prompt chain that compares user's `ProfileData` against `CompetitorData`
    - Evaluate: bio clarity/positioning, content strategy, posting consistency, value proposition, highlights/links usage
    - Output structured `GuideContent` (summary, weaknesses, recommendations for each criterion, prioritized task list)
    - Implement `regenerateGuide()` that accepts feedback string for improved output
    - Validate LLM output with Zod `guideContentSchema`; retry once on parse failure with stricter prompt
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 7.2 Implement PDF generation
    - Add `generatePdf()` method that converts `GuideContent` to a formatted PDF `Buffer`
    - Verify output starts with PDF magic bytes (`%PDF`)
    - _Requirements: 4.4_

  - [ ]\* 7.3 Write property test for guide structural completeness
    - **Property 11: Guide structural completeness**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]\* 7.4 Write property test for PDF generation
    - **Property 12: PDF generation produces valid output**
    - **Validates: Requirements 4.4**

- [ ] 8. Implement LLM Judge Service
  - [ ] 8.1 Implement judge service core logic
    - Create `src/services/judge-service.ts` implementing the `JudgeService` interface
    - Use a separate LLM call (independent model instance) to evaluate guide completeness, actionability, and relevance
    - Return score (integer 0-100) and structured feedback string
    - Validate score is within [0, 100] range; parse with Zod
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ]\* 8.2 Write property test for judge score range invariant
    - **Property 14: Judge score range invariant**
    - **Validates: Requirements 5.2**

- [ ] 9. Implement Credit Service with Stripe integration
  - [ ] 9.1 Implement credit service core logic
    - Create `src/services/credit-service.ts` implementing the `CreditService` interface
    - Implement `getBalance()`, `deductCredit()` (with `SELECT ... FOR UPDATE` row-level locking in a transaction), and `refundCredit()`
    - Record all credit changes in `credit_transactions` table
    - _Requirements: 6.1, 6.2, 6.6, 6.7, 6.8_

  - [ ] 9.2 Implement Stripe checkout and webhook handling
    - Implement `createCheckoutSession()` that creates a Stripe Checkout Session for credit purchase (price: R$ 5.00 BRL per credit)
    - Implement `handleWebhook()` for `checkout.session.completed` events: add purchased credits to user balance (idempotent - check if credits already added)
    - Handle failed payments by returning descriptive error, adding zero credits
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]\* 9.3 Write property test for credit deduction per evaluation
    - **Property 17: Credit deduction is exactly one per evaluation**
    - **Validates: Requirements 6.1, 6.8**

  - [ ]\* 9.4 Write property test for Stripe event handling
    - **Property 18: Credit balance reflects Stripe events**
    - **Validates: Requirements 6.4, 6.5**

  - [ ]\* 9.5 Write property test for insufficient credits blocking
    - **Property 19: Insufficient credits blocks evaluation**
    - **Validates: Requirements 6.6, 6.7**

- [ ] 10. Checkpoint - Core services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Evaluation Service (orchestrator)
  - [ ] 11.1 Implement evaluation orchestration pipeline
    - Create `src/services/evaluation-service.ts` implementing the `EvaluationService` interface
    - Orchestrate full pipeline: verify credit -> deduct credit -> scrape user profile -> scrape competitors -> generate guide -> judge guide -> store result
    - Update evaluation `status` field through each stage (`pending` -> `scraping` -> `analyzing` -> `generating` -> `judging` -> `completed`)
    - If judge score < 60, call `regenerateGuide()` once with judge feedback, then re-judge; store final result regardless of second score
    - On any failure after credit deduction, call `CreditService.refundCredit()` and set status to `"failed"`
    - Implement `getEvaluation()` and `listEvaluations()` (reverse chronological order)
    - _Requirements: 4.1, 4.5, 5.3, 5.5, 6.1, 6.8, 8.2, 8.4_

  - [ ]\* 11.2 Write property test for failed evaluation credit refund
    - **Property 13: Failed evaluation triggers credit refund**
    - **Validates: Requirements 4.5**

  - [ ]\* 11.3 Write property test for low score regeneration
    - **Property 15: Low score triggers regeneration**
    - **Validates: Requirements 5.3**

  - [ ]\* 11.4 Write property test for score persistence
    - **Property 16: Score persistence**
    - **Validates: Requirements 5.5**

  - [ ]\* 11.5 Write property test for evaluation history ordering
    - **Property 20: Evaluation history ordering and completeness**
    - **Validates: Requirements 8.2, 8.4**

- [ ] 12. Implement API routes
  - [ ] 12.1 Create evaluation API routes
    - Create `src/app/api/evaluations/route.ts` with POST (create evaluation) and GET (list evaluations) handlers
    - Create `src/app/api/evaluations/[id]/route.ts` with GET handler for evaluation details
    - Create `src/app/api/evaluations/[id]/pdf/route.ts` with GET handler that returns PDF download
    - Validate inputs with Zod schemas, return appropriate error responses
    - All routes require authentication (enforced by middleware)
    - _Requirements: 4.4, 8.2, 8.3_

  - [ ] 12.2 Create credit API routes
    - Create `src/app/api/credits/balance/route.ts` with GET handler returning user's credit balance
    - Create `src/app/api/credits/checkout/route.ts` with POST handler creating Stripe checkout session
    - _Requirements: 6.3, 8.1_

  - [ ] 12.3 Create Stripe webhook route
    - Create `src/app/api/webhooks/stripe/route.ts` with POST handler for Stripe webhook events
    - Verify Stripe webhook signature, delegate to `CreditService.handleWebhook()`
    - _Requirements: 6.4_

  - [ ]\* 12.4 Write property test for past evaluation PDF download
    - **Property 21: Past evaluation PDF download**
    - **Validates: Requirements 8.3**

- [ ] 13. Checkpoint - API layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Build client UI pages
  - [ ] 14.1 Set up TanStack React Query and Axios client
    - Create `src/lib/api-client.ts` with axios instance (base URL, auth interceptor)
    - Create `src/lib/query-client.ts` with TanStack Query provider setup
    - Create custom hooks: `useCredits()`, `useEvaluations()`, `useEvaluation(id)`, `useCreateEvaluation()`
    - Wrap app layout with QueryClientProvider
    - _Requirements: 8.1, 8.2_

  - [ ] 14.2 Build dashboard page
    - Create `src/app/dashboard/page.tsx` displaying current credit balance and evaluation history list
    - Show evaluations in reverse chronological order with date and quality score
    - Each evaluation links to `/dashboard/evaluations/[id]`
    - Include "New Evaluation" button linking to `/dashboard/evaluate`
    - Include "Buy Credits" button
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 14.3 Build multistep evaluation form
    - Create `src/app/dashboard/evaluate/page.tsx` with 3-step form managed by React state
    - Step 1: Your Profile - Instagram username input with `@` prefix display, validation (1-30 chars, `/^[a-zA-Z0-9._]+$/`)
    - Step 2: Competitor Profiles - Dynamic list of 1-5 competitor username fields with add/remove buttons
    - Step 3: Review and Confirm - Summary display, credit cost (1 credit), current balance, "Start Evaluation" or "Buy Credits" button
    - Step progress indicator ("Step X of 3"), Back/Next navigation preserving form state
    - On submit: POST to `/api/evaluations`, show loading state, redirect to evaluation detail page on success
    - _Requirements: 2.1, 3.1, 3.3, 6.6, 6.7_

  - [ ] 14.4 Build evaluation detail page
    - Create `src/app/dashboard/evaluations/[id]/page.tsx` showing evaluation status, quality score, guide content, and PDF download button
    - Poll for status updates while evaluation is in progress (pending/scraping/analyzing/generating/judging)
    - Display guide content sections: summary, weaknesses, recommendations, task list
    - "Download PDF" button triggers GET `/api/evaluations/[id]/pdf`
    - _Requirements: 4.3, 4.4, 8.3_

- [ ] 15. Final checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with \* are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All external services (Apify, LLM, Stripe) should be mocked in tests
- Test framework: Vitest + fast-check with minimum 100 iterations per property test
