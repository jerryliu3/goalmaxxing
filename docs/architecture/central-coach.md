# Central coach: implemented architecture

The coach has one persistent controller per signed-in account, a quiet header entry, a companion pane, and an expanded rooms workspace. Expansion changes presentation state; it never navigates away from the owning page. Direct `/coach` and `/coach/:topicId/:threadId` links open the same surface. The isolated `/prototype/coach` remains a design reference with sample data, not a production backend client.

## Presentation and ownership

`CoachProvider` owns the controller only. `AppShell` places `CoachHeader` in the header and `CoachSurface` under the application's XP, Duo, and public-profile providers. Page content stays mounted inside `CoachPageFrame`; expansion makes covered content inert. The header stays accessible, and Escape contracts the workspace before minimizing the companion. Cmd/Ctrl J toggles visibility. Mobile web uses the same surface as a sheet; native uses its screen header and an expandable modal, with the same shared conversation, check-in, history, and fact-summary modules.

Conversation, Rooms, Understanding, Check-in, and Changes are views of the same coach. Rooms contain independent conversations and intentions. Understanding shows source-backed summaries, explicit preferences, and linked goals. Changes reads proposal history across rooms and uses the same reviewed action controls as conversation messages. There is no floating launcher, second coach renderer, planner-owned conversation lifecycle, or automatic mutation of local planner drafts.

`useCoachController` composes shared durable conversation and check-in state with platform presentation, current facts, and history. Leaf components own presentation and temporary form state. The controller retains per-thread input drafts, in-flight response identities, selected room, and web conversation scroll positions while minimizing or changing pages.

## Context

Page owners publish typed identifiers through `useCoachPageContext`; registration is scoped to pathname and component identity. Priority allows a goal editor to override the underlying calendar selection. Unmounting an editor restores the underlying page registration. Planner draft protection remains true while any active registration owns unsaved planner work. Progress publishes the user's own goal/date selection and identifies Duo scope without sending partner facts.

The server resolves these identifiers against owned canonical data. It reads profile timezone and week start, goals, persisted planner sessions, completions, and one-off tasks. Today and this week always refer to the current local calendar period, independently of the page's selected date. Current sessions are limited to this week; selected sessions and one-off tasks cover the visible window. Inaccessible selections are removed. Open carryover tasks and explicitly selected owned tasks remain available. Display totals combine goal sessions and one-off tasks without counting off-plan goal completions as scheduled work.

Facts refresh even while the companion is minimized, through canonical cache invalidation, context-version realtime events, foreground/reconnect, and a one-minute foreground refresh. Each new turn reads authoritative context again. Revision checks during loading and inside final publication prevent mixed snapshots; old replies retain their original snapshot attribution. Saved preferences and summaries never become authoritative progress data.

## Conversation and generation

`/api/coach/*` authenticates the owner and enforces `COACH_ENABLED`. Topics, threads, messages, runs, actions, and memories have canonical database ownership. A new topic includes its first thread atomically. Versioned management controls rename, archive, restore, and delete. The default room cannot be archived or deleted.

A turn accepts a unique request ID, expected thread version, user message, page identifiers, and optional exact check-in reference. Database functions serialize lifecycle and action writes using the existing owner lock. Accepted messages and runs are durable before generation begins. The shared transport streams acceptance and generation stages; the final reply and reviewed proposals are fetched from persisted state. This is request-bound generation, not a background job system or token-by-token text stream.

Acceptance is recorded locally even if recovery reads disconnect. Ambiguous sends preserve their request identity; reconnect reads durable state rather than starting another model request. Cancellation releases the composer. Runs have deadlines and explicit retry; retry uses the latest saved human message and check-in reference. Deleting a selected thread returns to the surviving home conversation. Account changes remount the controller and clear private client state.

The existing Gemini adapter, quota policy, structured response validation, and bounded prompt assembly are reused. Selected work is prioritized within the prompt bounds, and omitted counts remain explicit.

## Canonical actions

The coach prepares a finite set of typed proposals: schedule adjustments, completions, task changes, goal creation with optional linking, and explicit planner preferences. API/service code owns validation, authorization, preparation, and orchestration. Existing planner, task, goal, and completion services own domain behavior; hardened database functions enforce canonical invariants and atomic receipts. No model response writes directly to domain tables.

Apply checks the current canonical schedule digest or task version and uses a stable idempotency ID. Unsaved planner drafts must be saved or discarded first. Stale proposals can be refreshed; dismiss does not mutate the plan. Safe undo is a new reviewed proposal against the post-change state. Completions and goal creation do not advertise undo. Successful writes invalidate the existing domain caches; completion actions also refresh XP and activity.

The history endpoint exposes safe review fields only, scoped to the owner, with timestamp-and-ID pagination. It does not expose executable commands or create another mutation surface.

## Understanding and check-ins

Summaries derive from human evidence across a topic and are fenced by the version captured when the turn was accepted. Preferences are explicitly confirmed or manually entered and can be edited or forgotten. Forgotten sources remain suppressed. Confirmed preferences survive deletion of their source conversation; deleting a room removes its scoped preferences. Global preferences remain global.

The coach-disabled web check-in uses the same invitation and generation controllers, with canonical facts reloaded after completions. Check-ins reuse `user_digests`, `/api/digest/*`, period rules, deterministic rows, and canonical completion controls. The header offers Open/Skip without generating AI or obscuring the page. Presenting the offer claims the day's presentation once across devices. Opening Check-in generates the briefing; failure leaves computed rows usable. Recap and Next retain their meanings, with monthly-first, weekly-next, and daily-otherwise cadence. The current cadence is shown rather than inventing daily/weekly history views unsupported by the backend. Settings replay opens this same surface.

“Talk this through” seeds the selected conversation with the exact check-in reference and preserves an existing unfinished draft. Planning changes remain explicit reviewed proposals.

## Delivery

The stack preserves planner foundations, durable conversations, context, turn transport, atomic actions, and understanding/check-ins, then removes legacy writers and builds the production frontend. See `central-coach-review.md` for findings and `central-coach-rollout.md` for migration and native release coordination.

Coverage is written for the real shared controllers, selected context, presentation ownership, history pagination, and canonical writes. No tests, typecheck, lint, browser checks, build, SQL suites, or CI were run during this rebuild. Deployment, production migrations, and native store release are separate operations.
