# Central coach delivery

The stack implements the companion, topic workspace, persistent conversation lifecycle, header entry, in-place expansion, live context, reviewed actions, memories, and integrated check-ins. `COACH_ENABLED` defaults to false. New history has one server writer; legacy calendar coaching no longer owns conversations.

## Release order

1. Merge PRs base to tip. Apply all forward-only migrations in the same release before enabling the coach. The migrations introduce owner reads, service-authored conversation/action records, task version checks, atomic action receipts, briefing leases, and presentation dedupe.
2. Release native version **1.1.0** with the global companion and versioned task calls. Set `MOBILE_MIN_SUPPORTED_APP_VERSION=1.1.0` with the backend cutover so distributed 1.0.0 clients see the existing upgrade screen. The source version is bumped in this stack; store submission and deployment are separate release operations.
3. Deploy the web/API stack. Set `COACH_ENABLED=true` for the intended rollout and retain `DIGEST_ENABLED=true` for check-ins. The existing `CALENDAR_COACH_DAILY_LIMIT`, provider settings, and planner_coach quota bucket also govern central conversations; they are deliberately reused.
4. Saved legacy conversations migrate idempotently to My week. Proposal metadata remains historical and cannot execute. Unsaved browser-only transcripts are not automatically imported across account identities. The cutover checks migrated transcripts before dropping the replaced tables. Restore uses backup/PITR.
5. Legacy HTTP routes are removed with the cutover. The existing minimum-version gate handles unsupported native clients; there is no second coach API or deferred storage cleanup.

## Operational behavior

Expansion preserves the source page and its unsaved work; direct coach links open the same surface. Closing/minimizing and app navigation preserve controller state and saved run identity. Closing the browser can end request-bound execution. Runs have deadlines; reconnect fetches their persisted state and never silently starts another model request. Retry reuses the latest accepted user message and its saved check-in reference. Web and native share the same conversation and check-in controllers, including accepted-run recovery, per-thread drafts, cancellation, and generation deduplication.

Every turn reads authoritative today/week facts and page identifiers. Realtime versions, local cache events, focus/reconnect, and foreground polling refresh the fact strip even while minimized. Apply additionally checks canonical schedule digests or task updated_at values in the mutation transaction. A saved/visible reply names its source snapshot. Data changing during generation returns an actionable retry instead of a mixed answer.

Session moves, completions, tasks, goal creation with an optional link, and explicit rest-day preferences use existing canonical rules. Safe schedule/task/preference undo is a new reviewed action against the post-change state. Completions and goal creation do not advertise undo; normal app controls remain available. Unsaved planner drafts must be resolved before Apply.

Memory is explicitly confirmed or manually entered. Editing/forgetting invalidates derived summaries and excludes its old source from future preference extraction. Topic summaries use human source IDs across the topic and the version captured when a turn was accepted. Preference edits invalidate only the relevant topic unless global. Confirmed preferences survive source-conversation deletion; topic deletion removes scoped preferences. Current statistics never become remembered facts.

Check-in generation is deliberate. Publication is fenced against the current context revision inside the database transaction. Its paragraph is bound to a facts digest; changed facts clear the paragraph until a deliberate refresh. An AI failure leaves deterministic rows available. An exact offer ID/local date claims at most one invitation across devices, while Settings replay remains available.

## Verification status

Functional contract, transport, ownership, concurrency, and summary/check-in coverage is written in the stack. Per the implementation instructions, tests, typecheck, lint, browser checks, SQL suites, and CI were not run. Those require explicit approval after the PR stack exists.
