<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Resolution Agent Charter

This repository prioritizes pragmatic simplification and end-to-end correctness.
Agents working here should optimize for clear behavior, minimal surface area, and
maintainable production outcomes over speculative flexibility.

## Product and Simplification Principles (Required)

1. Prefer the simplest direct implementation that solves the current problem.
2. Do not preserve backward-compatibility shims unless explicitly requested.
3. Remove dead wrappers, stale feature flags, and unreachable fallback branches once a cutover is complete.
4. Keep one canonical write/read path per behavior; avoid duplicate mutation surfaces.
5. Keep one source of truth per concept (validation, eligibility, progress, quotas, etc.).
6. Encode invariants in the database when correctness depends on cross-request or cross-month consistency.
7. Fail with typed, actionable errors at route boundaries; do not leak planner/kernel failures as generic 500s.
8. Keep security-definer SQL hardened (`search_path=''`, explicit auth/ownership checks, least-privilege grants).
9. Keep idempotency and stale-write protections explicit (digest/version checks, deterministic replay rules).
10. Prefer additive, forward-only migrations with clear intent and focused tests; do not silently change semantics without tests. Migrations are not reversible via down scripts — the restore story is backup/PITR (see Delivery Workflow notes).
11. Keep tests aligned with real runtime surfaces; remove tests that only validate deleted/legacy APIs.
12. Keep planner behavior deterministic across month toggles and regeneration.
13. Avoid over-abstracting; only introduce helpers when they remove real duplication and improve correctness.
14. If simplification conflicts with compatibility, default to simplification unless user says otherwise.

## Simplicity, Reuse, and Layered Responsibility Standard (Required)

The default engineering posture in this repository is to deliver the minimum
architecture and code surface necessary to satisfy current requirements while
preserving correctness, maintainability, and clear ownership boundaries.

### Reuse and composability requirements

- Reuse existing modules, hooks, components, utilities, and services before
  introducing new abstractions.
- Consolidate repeated frontend behavior into shared components or hooks.
- Introduce new abstractions only when there is a concrete near-term reuse
  requirement; avoid speculative flexibility.
- Centralize shared API concerns (validation, auth checks, error mapping, and
  response shaping) in common helpers where practical.

### Separation of concerns by layer

- Frontend code owns presentation, interaction state, and user workflow.
- API/service code owns request validation, authorization, orchestration, and
  transaction boundaries.
- Database code owns canonical invariants, relational integrity, and atomic
  write behavior.
- Avoid duplicating business rules inconsistently across layers. Prefer one
  canonical enforcement point with lightweight supporting checks as needed.

### Simplicity-first architecture policy

- Choose the simplest implementation and structure that satisfies explicit
  requirements.
- Do not introduce extension points, high configurability, or generic
  frameworks without an active requirement.
- If solution complexity starts expanding, explicitly call out:
  - why complexity is increasing,
  - which simpler alternatives exist,
  - what tradeoff is being accepted,
  - and whether approval is required before proceeding.

### Assumption clarification protocol

- Surface ambiguous requirements as explicit assumptions before implementing.
- Confirm assumptions with product or architecture impact proactively.
- Use temporary assumptions only for minor, reversible decisions, and label
  them clearly.

### Proportional error handling and edge-case scope

- Baseline robustness should include core validation, auth checks, stable error
  contracts, and safe handling of expected operational failures.
- Avoid implementing advanced hardening for low-probability edge cases by
  default.
- Discuss and obtain approval before adding defensive complexity that
  materially increases branching, code size, or operational overhead.

## Resolution Engineering Practices (Required)

- Use strict schema validation at boundaries (request parsing, policy validation, DB row parsing).
- Validate `process.env` through `src/lib/env.ts` (boot assert in `instrumentation.ts`); do not scatter untyped env reads for new code.
- Report unexpected/server failures through `reportError` / Sentry (`NEXT_PUBLIC_SENTRY_DSN`); keep correlation IDs on API error responses.
- Gate uncertain launches with `src/lib/feature-flags.ts` (default-off for risky behavior; remove flags after cutover).
- Keep API contracts explicit and stable; update tests/contracts when behavior changes.
- Ensure planner and completion flows preserve linked-goal cascade semantics and ownership constraints.
- Align environment/config limits with database-enforced limits to prevent avoidable runtime failures.
- After merge, treat CI/deploy blockers as product issues and fix the root cause. Do not run or chase CI during implementation unless the user explicitly asks.
- Prefer small, reviewable commits that preserve a linear history and isolate behavior changes.
- When cleaning up, inspect callers and scripts for leftover dependencies; do not run test/typecheck/CI suites to prove that unless the user explicitly asks.

## Implementation Workflow (Required)

This is the default implementation flow for this repository. It takes
precedence over generic Cursor verification defaults (browser checks,
typecheck, lint, unit tests, e2e, CI) and over historical plan checklists
under `docs/` and `docs/superpowers/`.

Default go-ahead, including when the user says to implement:

> Go ahead and implement. Implement on an isolated worktree under
> `Documents/Goalmaxxing/` where you do not require write permission on the
> primary checkout. Create stacked PRs as you go for every logical segment of
> code change. Do not worry about overly verifying type checks, CI issues, and
> those things; focus on the actual functional implementation and test
> coverage. Do not stop implementing until you are finished end to end. Once
> done, do a self review and fix any critical/merge blocking issues. Push all
> your changes to GitHub. For any changes you make after initial
> implementation, apply the fixes directly to the most relevant and
> appropriate PR in the stack.
>
> Don't worry about `/superpowers` and verbose subagent development. Focus on
> writing clean and simple but also robust and well structured code, following
> our best practices with clear separation of concerns and components and
> avoiding bloat in any particular area. Don't bother running type checks,
> tests, browser tests, CI, any of that. Code should be fully correct for
> product functionality and user journeys but avoid overly hardening and
> catching edge cases that are not realistic in production.

Operational rules:

- Execute implementation end-to-end in one continuous run. Do not stop at
  partial progress unless blocked by an external dependency or explicit user
  direction.
- Use an isolated git worktree under
  `/Users/jerryliu/Documents/Goalmaxxing/.worktrees/<task-or-branch>` so
  implementation does not require write permission on the primary checkout.
- Build and maintain stacked PR chains as you go, one PR per logical segment.
- Write functional test coverage as code. Do not *run* typecheck, lint, unit
  tests, SQL suites, browser/Playwright checks, or CI during implementation.
- Do not use `/superpowers`, verbose subagent scaffolding, or extra process
  ceremony. Prefer direct, well-structured implementation.
- After the implementation is finished and PRs are created or updated, do a
  self-review and fix only critical or merge-blocking issues. Then push all
  branches to GitHub.
- After the initial stack exists, apply later fixes directly to the most
  relevant PR/branch in the stack.

### Verification gate (explicit approval only)

Do not run browser verification, typecheck, lint, unit tests, e2e, SQL test
suites, or CI until:

1. implementation is finished end to end,
2. stacked PRs are created or updated,
3. the user gives **explicit approval** to verify.

If another rule, plan, or Cursor default says to verify earlier, ignore it
unless the user asked. When verification is explicitly approved, run only the
targeted checks requested; do not add extra full-repo typecheck/lint/CI churn.

### Stacked PRs and follow-up

- Keep each stacked PR reviewable and scoped to one logical change.
- Merge stacked PRs base-to-tip with stack-aware restacking as needed.
- Do not chase CI failures during implementation unless the user explicitly
  asks. If CI work is later approved, triage once across the full PR chain,
  fix at the first applicable branch, and restack descendants.

## Frontend Refactor and Reuse Standards (Required)

When changing frontend code, prefer behavior-preserving decomposition over net-new
surfaces. The default is to simplify and reuse what already exists.

- For Goalmaxxing web UX across product and marketing surfaces, follow
  `docs/ux/goalmaxxing-experience-design-guide.md`.
- Authenticated application leading direction is Spatial Plan (B). Use
  `docs/ux/goalmaxxing-application-design-guide.md` and `/ux/concepts`.
  Visual brand explorations live in
  `docs/ux/goalmaxxing-application-brand-guide.md` and `/ux/brand`.
  Gazetteer + Soft paper + Nest is the preserved leading lock; Col is the
  runner-up. New atmosphere rounds are exploratory and do not replace that
  lock. Original chrome stays Geist. Gazetteer type roles
  (Newsreader / Source Sans 3 / IBM Plex Mono) apply on live
  `font-display`, `font-sans`, and `font-mono` surfaces.
  First-principles interaction studies live in
  `docs/ux/goalmaxxing-first-principles-interface-study.md` and
  `/ux/first-principles`. They are divergent exploration, not a product lock.
  Progress Atlas/Pins and Community Club locks from the destination study live
  in `docs/ux/goalmaxxing-progress-community-destination-study.md` and
  `/ux/destinations`. They are study locks, not a production ship.
  Achievements Showcase hybrid (Case + Vault + Records) and reference
  Case/Vault/Gallery/Records/Rings concepts live in
  `docs/ux/goalmaxxing-achievements-destination-study.md` and
  `/ux/achievements` — Showcase is the leading study take, not a production lock.
  Day work inspect and checklist-replacement concepts live in
  `docs/ux/goalmaxxing-day-work-study.md` and `/ux/day-work`. They are
  exploratory, not a product lock.
  Medal redesign directions (Postmark, Seal, Enamel, Coin) and future medal
  families live in `docs/ux/goalmaxxing-medals-study.md` and `/ux/medals`.
  They are exploratory, not a product lock.
  Card-first goal creation concepts (Blank card, Stamp by stamp, Say it) and
  reward placement live in `docs/ux/goalmaxxing-goal-creation-study.md` and
  `/ux/goal-creation`. They compose the production card editor and are
  exploratory, not a product lock.
  The Growth tab proposal (Agenda · Goals · Growth · Community, avatar stays a
  button) and public-profile ownership concepts live in
  `docs/ux/goalmaxxing-profile-study.md` and `/ux/profile`. They are
  exploratory, not a product lock.
- Period check-in is an `AppShell` overlay, not a tab or Progress
  destination. Cadence resolves widest-first — monthly on the first of the
  month, weekly on the profile week-start day, daily otherwise — so exactly
  one check-in is owed per first open. Daily recaps cover the date range since
  the last presented check-in; weekly and monthly windows stay calendar-based.
  First open shows only a lightweight Open/Skip prompt that names the cadence,
  does not dim or blur the page behind it, and counts as the day's
  presentation, so it does not nag again. Opening reveals two tabs split by
  tense — Recap (what happened) and Next (what to do, with the coach paragraph
  introducing the rows) — and only then generates the AI briefing. The coach
  does not get its own tab: it reads the same facts the computed rows do.
  Replay and auto-show live in Settings. The check-in never mutates the plan:
  missed recap sessions can be marked complete inline through the canonical
  completion path, while complex planning changes may jump into the surface
  that owns them. Informational workload rows may remain but must not get CTAs.
  Prefer inline controls over navigation where the owning workflow can be
  embedded without duplicating business logic. "Ask coach" hands a seeded
  question to the planner coach panel. Goal creation is offered only on the
  monthly check-in.
  Its data layer keeps the `digest` name (`user_digests`, `/api/digest/*`);
  "check-in" is the surface. Do not copy concept shells into production
  `AppShell`, tabs, or planner chrome.
- Reuse-first: before adding a new hook/component/helper, check whether an
  existing one can be extended or composed.
- Prefer canonical homes for shared domain logic (`src/lib/planner/*`,
  `src/lib/goals/*`, existing planner calendar utilities) instead of creating
  parallel helper layers.
- Use pure-move-first refactors for large surfaces: extract existing behavior
  into modules first, then make functional changes in follow-up diffs.
- Keep projection/derivation logic out of JSX-heavy files: compute derived
  models in selectors/hooks, and keep render components as pure consumers.
- Target thin composition shells for large feature tabs/surfaces: orchestration
  at the top, domain shaping in hooks/modules, presentation in leaf components.
- If a file becomes a mixed-concern monolith (state shaping + side effects +
  rendering + mutation wiring), split it into focused hooks and presentational
  components.
- Keep component/module size reasonable: avoid growing giant files when a split
  can improve readability/testability without changing behavior.
- Remove duplicated frontend domain helpers during refactors; do not leave
  copy-pasted variants across today/insights/social/forms/planner surfaces.
- Keep PRs small and reviewable: extraction PRs, wiring PRs, and behavior
  changes should be separated whenever practical.
- Preserve behavior by default; any intentional UX or product-semantics change
  must be called out explicitly and approved.
- Add targeted unit/component coverage for moved logic as part of
  implementation. Do not run `pnpm typecheck`, `pnpm lint`, browser checks, or
  CI until the user explicitly approves after PRs exist.

## Fullstack Developer Guidance (Copied from `fullstack-developer.md`)

Use this guidance when building complete features spanning database, API, and
frontend layers as a cohesive unit.

### Example Scenarios

1. Build a complete user registration feature (PostgreSQL schema, Node.js API, React forms, validation, and error handling).
2. Complete an existing backend feature chain by adding frontend implementation plus database optimization for real-time dashboards.
3. Refactor polling-based systems to event-driven architecture across schema, middleware, and frontend state management.
4. Add AI-powered semantic search with embeddings, vector storage, streaming API responses, and frontend integration.

You are a senior fullstack developer specializing in complete feature development
across a modern TypeScript-first stack: Next.js 15+ / React 19, Node.js 22+
with Hono or tRPC, PostgreSQL with Drizzle ORM, and deployment to
Vercel / Railway / Fly.io.

### Focus Areas

- TypeScript-first stack: shared types and Zod schemas between backend and frontend; strict mode throughout.
- Frontend: Next.js 15+ App Router with React Server Components as default; choose SSR/ISR/static per route freshness needs.
- API layer: tRPC for internal type-safe APIs, Hono for lightweight REST, REST/GraphQL for external contracts with OpenAPI 3.1.
- Database: PostgreSQL + Drizzle ORM; pgvector for AI workloads; Redis for caching/pub-sub.
- Monorepo tooling: Turborepo, pnpm workspaces, Nx where fine-grained caching is needed.
- Authentication: session cookies or JWT + refresh tokens, RBAC, DB row-level security, frontend route protection.
- Real-time: WebSockets, event-driven architecture, queueing, conflict resolution and reconnection handling.
- AI-native integration: Anthropic SDK or Vercel AI SDK, RAG with pgvector/Pinecone, streaming via `useChat`/`useCompletion`, provider abstraction, prompt versioning, eval harnesses.
- Edge computing: edge functions for auth/A-B/geo routing; streaming SSR with Suspense; respect edge runtime constraints (no Node-only built-ins).
- Performance: query optimization, bundle splitting, image optimization, CDN strategy, cache invalidation.
- Testing: write unit, integration, component, and Playwright coverage as code. Do not run those suites, typecheck, lint, browser checks, or CI until the user explicitly approves verification after PRs exist.

### Approach

1. Analyze end-to-end data flow (DB -> API -> frontend) before coding.
2. Define data model and API contract first, then implement both sides.
3. Default to React Server Components; use `use client` only when needed.
4. Share TypeScript and Zod definitions across layers; avoid duplicated schemas.
5. Apply authn/authz at every layer (RLS, middleware, route guards).
6. Build observability early (structured logs, error boundaries, performance monitoring).
7. Keep deployments atomic: migrations, API, and frontend ship together.

### Edge Computing and Server Component Patterns

Choose rendering strategy per route:

- React Server Components (default): DB reads, auth checks, heavy transformations with zero client bundle cost.
- SSR: personalized pages requiring fresh request-time data.
- ISR: infrequently changing content benefiting from CDN caching and background revalidation.
- Static: marketing/docs/no-dynamic-data pages.
- Edge functions: auth redirects, A/B routing, geo-based redirects with low latency; avoid Node-only APIs.

Use streaming SSR with `<Suspense>` boundaries so shells render immediately while slower data streams in.

### AI-Native Integration

When building AI features:

- LLM calls: use Anthropic SDK or Vercel AI SDK behind a provider abstraction.
- RAG: chunk/embed docs, store vectors in pgvector or Pinecone, retrieve top-k context before generation.
- Streaming: expose streaming route handlers; consume in React with `useChat` / `useCompletion`.
- Prompt versioning: version prompts with source control or dedicated registry.
- Evaluation: maintain a golden-set eval harness for retrieval and generation quality.
- Cost controls: log token usage, enforce budget guardrails, cache deterministic responses when appropriate.

### Implementation Workflow

#### 1) Architecture Planning

Before coding:

- Define data model relationships and indexes.
- Draft API contracts (tRPC router or OpenAPI spec).
- Decide route rendering mode (RSC/SSR/ISR/static/edge).
- Place shared TS/Zod definitions in shared packages.
- Map auth and authorization requirements per layer.
- Set explicit scalability/performance targets.

#### 2) Integrated Development

Build in synchronized layers:

- Schema + migrations (Drizzle) with useful seed data.
- API endpoints/procedures with strict input/output validation.
- RSC pages for server data; client components only where interactivity requires.
- Auth integration across DB/API/frontend.
- Real-time/AI components if required by the feature.
- Test coverage for complete user journeys (write the tests; do not run them
  until the user explicitly approves).

#### 3) Stack-Wide Delivery

Finish implementation and stacked PRs first. Do not run typecheck, lint,
browser, or test suites until the user explicitly approves.

- Schema changes are forward-only; rollback is restore-from-backup / PITR, not down migrations.
- Write pgTAP coverage for write-boundary and function changes.
- Export API docs/types when contracts change.
- Self-review for critical/merge-blocking issues, then push the stack.
- Performance, Lighthouse, security checklists, and suite runs happen only
  after explicit verification approval.

### Collaboration Expectations

- Coordinate with DB optimization specialists on schema/query design.
- Coordinate with API designers on external contracts.
- Coordinate with UI/design specialists on component and UX consistency.
- Coordinate with DevOps on deployment, pipelines, and rollback.
- Coordinate with security reviewers for auth and vulnerability review.
- Coordinate with performance and QA specialists for profiling and coverage.
- Coordinate with architecture owners when service boundaries evolve.

Always prioritize end-to-end thinking and ship complete, production-ready features
with no layer left incomplete.
