# Central coach rebuild review

The review traced the backend stack, canonical read/write paths, client recovery, page ownership, actions, understanding, check-ins, and the old web/native cutover. The backend services are reusable; the original frontend did not deliver the intended companion experience and is replaced rather than maintained alongside the rebuild.

## Findings and resolution

| Owning PR | Findings and changes |
| --- | --- |
| #1028 — foundations | Retain shared planner preparation/publication, final-schedule batch validation, and completion/collision semantics. |
| #1030 — conversations | Retain owner-locked durable lifecycle, atomic room/thread creation, versioned management, latest-human-message retry, and paginated storage reads. |
| #1031 — context | The canonical snapshot contains every persisted month. Restrict current sessions to this week so old rows cannot crowd current facts out of the prompt; derive selected windows from the same snapshot. Add explicit owned task selection independently of goal sessions. Retain timezone, period, ownership, and revision fences. |
| #1040 — turn transport | Strip obsolete frontend entry points and presentation from this middle PR. Retain persisted acceptance, generation stages, final publication, typed stream contracts, and authenticated run recovery. |
| #1041 — actions | Retain finite capabilities and canonical atomic writes, task concurrency, reviewed undo, and shared goal-draft contracts. Add owner-wide safe-field change history with timestamp/ID pagination. Move presentation controls to the rebuilt frontend PR. |
| #1042 — understanding/check-ins | Retain evidence-backed versioned summaries, forgotten-source suppression, scoped memory invalidation, canonical check-in facts, briefing freshness fences, and presentation dedupe. Prioritize selected task identity in bounded prompts. Keep reusable CheckInBody extraction; move coach-specific presentation out. |
| #1043 — production companion/cutover | Replace the floating launcher, route-based expansion, crowded chat, and duplicate web/native lifecycle presentation. Implement header entry, persistent companion-to-workspace expansion, rooms, dedicated understanding/check-in/change views, page registrations, and current facts while minimized. Keep shared recovery controllers and canonical action cards. Refresh XP/activity after coach completions. Preserve source pages and unsaved planner work across expansion. Remove legacy endpoints, panel/hooks, writers, tables, and obsolete tests in the coordinated cutover. |

The stack has one source of truth per concept: canonical storage for app facts, owned records for conversation history, explicit preferences for memory, source-backed summaries for understanding, and canonical services/transactions for mutations. Presentation does not own another schedule, progress calculator, briefing pipeline, or mutation engine.

## Source review limits

This is a source review and implementation, not a runtime verification result. Functional coverage was added as code for current-session boundaries, task selection, page-context composition, retained drafts during expansion, shared history lifecycle, and owner/tied-timestamp history pagination. Existing transport, lifecycle, ownership, SQL invariants, action, summary, and briefing coverage remains on the actual runtime surfaces. No verification suites or CI were run.

There is no deferred frontend cutover or compatibility wrapper. Request-bound AI execution and explicit retry remain the chosen backend model; a durable worker is outside this change. Production migrations, web deployment, and native minimum-version/store coordination remain release operations described in `central-coach-rollout.md`.

## Final stack review

The latest source review retained the planner publication extraction, owner-scoped durable lifecycle, context revision fences, atomic reviewed actions, source-backed understanding, and coordinated legacy migration. No second planner mutation engine or replacement backend is needed.

- **#1031:** Read one-off tasks for both the current week and the page's visible date window, plus open carryover tasks. A future or historical page must not omit its tasks or change today's/week's totals.
- **#1041:** Update the remaining SQL task-completion caller to pass its reviewed version. Add coverage for the canonical signature and rejected stale completion writes. This fixes the recorded database failure in #1041–#1043; smoke/aggregate failures were consequences of that job.
- **#1043:** Restart message pagination when a reconnect moves beyond the cached history window, preserving overlapping loaded history. Use the shared check-in controller and invitation claim for the coach-disabled surface; reload canonical facts after completions and remove the unused optimistic count updater. Keep native context consumers separate from the provider and place the lightweight check-in invitation with the header, eliminating the Expo transport import from the shared Screen accessibility surface. The recorded native failure came from that import, not the production Metro transport.

All changes are assigned to their owning PR and descendants are restacked. The current GitHub failures were read as diagnostics only. No tests, typechecks, lint, builds, browser checks, SQL suites, or CI reruns were performed, and the fixes are not claimed to be verified.
