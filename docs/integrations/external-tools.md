# Goalmaxxing external account tools

Goalmaxxing exposes one set of deterministic account operations through:

- **MCP:** `https://YOUR_APP_ORIGIN/api/mcp`
- **HTTP API:** `https://YOUR_APP_ORIGIN/api/v1`
- **OpenAPI 3.1:** `https://YOUR_APP_ORIGIN/api/v1/openapi.json`
- **Public guide:** `https://YOUR_APP_ORIGIN/developers`

`YOUR_APP_ORIGIN` is a documentation placeholder for the deployed Goalmaxxing
site origin, such as `https://goals.example.com`; it is not an environment
variable. Configure the actual environment variable `NEXT_PUBLIC_APP_URL` with
that same origin.

The assistant supplies reasoning, coaching, parsing, and its other connected
services. These operations never call Goalmaxxing's LLM, consume its AI quota,
or generate AI briefings. Goalmaxxing still incurs normal hosting/database costs.
Host subscriptions, tool permissions and API billing are controlled by the host.
There is no background agent or subscription-to-API billing conversion here.

## Deployment

1. Apply the additive `20261004120000_external_app_connections.sql` and
   `20261004123000_external_idempotent_mutations.sql` migrations with your normal
   deployment workflow. Do not enable the feature before migrations are live.
2. In Supabase Authentication → OAuth Server, enable OAuth 2.1. Configure the
   authorization path `/oauth/consent` and Site URL to your app's public origin.
   Enable dynamic client registration for clients that require it, or pre-register
   clients and provide their client IDs in each host's setup. Use asymmetric
   signing keys when requesting `openid`. Hosted settings are separate from the
   local `supabase/config.toml` settings.
3. Set `NEXT_PUBLIC_APP_URL` to the stable public HTTPS app origin. Existing
   Supabase public credentials and server credentials are used; no new LLM key
   is required. Canonical planner writes continue to require existing server
   Supabase credentials. Local development may use localhost and a public tunnel
   configured consistently as the app origin.
4. Set `EXTERNAL_TOOLS_ENABLED=true` on the server. It defaults to false and is
   independent of health/device integration flags. Reverting the flag blocks
   both external transports. OAuth tokens are also denied on legacy account API
   routes, including parsing, coaching, and digest-generation endpoints.
5. After the PR stack exists and verification is explicitly approved, exercise
   consent, denial, reconnection, disconnection, two-account isolation, pagination,
   retry receipts, stale goal edits, linked completion, and preview/publish in
   the target clients. This implementation does not run that verification itself.

## Connect an assistant

For a remote MCP-capable host, add `https://YOUR_APP_ORIGIN/api/mcp` as its
remote MCP server and choose OAuth when prompted. Sign in to Goalmaxxing and
approve the account connection; then enable the Goalmaxxing tools in that host's
agent or conversation. The host stores tokens and refreshes them; do not paste
passwords, refresh tokens, or service-role keys into conversations. Disconnect
from Goalmaxxing Settings → Integrations.

- ChatGPT: add the server through developer-mode custom plugin/app setup, where
  your account and workspace allow it. Public directory distribution requires a
  separate provider submission; this code does not publish a directory listing.
- Claude: add a custom remote connector with the MCP URL and OAuth. Supply a
  pre-registered OAuth client if your deployment does not enable dynamic registration.
- Gemini CLI: configure a remote HTTP MCP server and authenticate it through the
  CLI's OAuth workflow. Gemini API integrations can use the same server with the
  caller's own model/API billing. Consumer Gemini app support is host-dependent.
- Instinct and Muse: use their browser agents with the existing Goalmaxxing web
  workflows. No dedicated connector or automated browser adapter is included.
  Existing AI features in the web app retain their existing usage behavior.

MCP uses the official TypeScript SDK, stateless Streamable HTTP and JSON responses.
POST requires MCP's usual Accept header for both `application/json` and
`text/event-stream`. GET and DELETE return 405 after authentication because no
unsolicited SSE stream or server session is maintained. Every HTTP request
validates credentials and binds a fresh server instance to one account.
Cross-origin browser requests are rejected; cloud/native clients ordinarily omit
Origin. There is no wildcard CORS or API credential in a URL.

## OAuth and authorization

Protected resource metadata is available at:

- `/.well-known/oauth-protected-resource` (MCP default)
- `/.well-known/oauth-protected-resource/api/mcp`
- `/.well-known/oauth-protected-resource/api/v1`

Metadata advertises the configured app resource URL and Supabase Auth issuer
`https://PROJECT.supabase.co/auth/v1`. Supabase publishes authorization-server
discovery at `https://PROJECT.supabase.co/.well-known/oauth-authorization-server/auth/v1`.
Clients use authorization code + S256 PKCE, request `openid`, and supply the
resource URL as specified by their MCP authorization flow. Supabase owns client
registration, authorization-code issuance, token exchange, and refresh rotation.

**Permission boundary:** this release grants existing authenticated Supabase
account access, not fine-grained `goals:read`/`goals:write` database scopes. The
consent screen explicitly grants account data read/write access. The exposed
operation registry is focused on the user's own goals, progress, completions,
tasks and plans. Ordinary Supabase RLS and canonical RPC ownership checks remain
in force. Never represent a host tool toggle as a database permission boundary.
If a deployment needs read-only or strictly tool-scoped credentials, add real
client-aware database policies and RPC restrictions before advertising them.

OAuth clients must also have a non-revoked `external_app_connections` record.
Approval creates that record before issuing the authorization code. Revoking
it immediately blocks the two external API transports, even for an unexpired
access token. Settings also revokes the Supabase OAuth grant and refresh sessions.
JWTs used directly against Supabase retain the provider's normal expiry behavior;
API disconnection is not a promise to instantly invalidate a stateless JWT on
all Supabase surfaces. Reconnecting records a new activation time, so older
access JWTs cannot regain external API access. First-party authenticated bearer sessions can call the
HTTP API for development; cookies alone and service-role credentials cannot.

## HTTP contract

Send `Authorization: Bearer ACCESS_TOKEN`. Writes require `Content-Type:
application/json`. Success returns `schemaVersion: "1"`, operation fields and
`correlationId`. Creation returns HTTP 201; other successes return 200. Errors
contain `code`, `message`, `correlationId`, and optional `details`. 401 includes
`WWW-Authenticate` with resource discovery; 429 includes `Retry-After`.

Requests are strict: unknown fields, duplicate query parameters, malformed dates,
and IDs supplied both in the URL and body are rejected. JSON bodies are bounded
at 256 KiB and canonical routes keep their existing tighter limits. A process-local
120 requests/minute/account limiter is an operational guard, not a global quota.

| HTTP | Path under `/api/v1` | MCP tool |
| --- | --- | --- |
| GET | `/account` | `get_account` |
| GET | `/goals` | `list_goals` |
| GET | `/goals/{goalId}` | `get_goal` |
| POST | `/goals` | `create_goal` |
| PUT | `/goals/{goalId}` | `update_goal` |
| PUT | `/goals/{goalId}/archive` | `set_goal_archived` |
| PUT | `/goals/{goalId}/link` | `set_goal_link` |
| GET | `/progress` | `get_progress` |
| GET | `/planner` | `get_plan` |
| POST | `/planner/preview` | `preview_plan` |
| POST | `/planner/publish` | `publish_plan` |
| PUT | `/completions` | `set_completion` |
| GET | `/tasks` | `list_tasks` |
| POST | `/tasks` | `create_task` |
| PUT | `/tasks/{taskId}/schedule` | `set_task_schedule` |
| PUT | `/tasks/{taskId}/completion` | `set_task_completion` |

MCP input fields match HTTP input, with `goalId`/`taskId` added for URL parameters.
Use OpenAPI or tools/list for the exact schemas, defaults, descriptions and bounds.

### Read account and goals

```sh
curl "$GOALMAXXING_ORIGIN/api/v1/account" \
  -H "Authorization: Bearer $GOALMAXXING_ACCESS_TOKEN"
curl "$GOALMAXXING_ORIGIN/api/v1/goals?limit=50&includeArchived=false" \
  -H "Authorization: Bearer $GOALMAXXING_ACCESS_TOKEN"
```

`/account` supplies the current date in the user's timezone. Goal rows use the
canonical snake_case database fields. `/goals` returns `goals` and `nextCursor`;
pass it as `after` until null. The default list excludes archived/deleted goals.

### Create and replace a goal

```json
{
  "requestId": "f4444444-4444-4444-8444-444444444444",
  "goal": {
    "title": "Run three times a week",
    "frequencyType": "recurring",
    "recurrenceInterval": "weekly",
    "targetBasis": "period",
    "targetCount": 3,
    "startDate": "2026-10-05",
    "category": "Health",
    "isPrivate": true
  }
}
```

POST `/goals` returns the canonical goal. `requestId` is a caller-generated UUID
and becomes the new goal ID. Retry the exact same input with the same UUID.
Receipts are persisted transactionally per user; changing input with the same
UUID yields `409 idempotency_conflict`. Receipts live until account deletion.

PUT `/goals/{goalId}` accepts `requestId`, `expectedUpdatedAt` and a **complete**
`goal` definition. Read `/goals/{goalId}` first, convert snake_case fields to the
camelCase definition, preserve unchanged values, and provide its exact
`updated_at`. Omitting optional fields applies the creation-schema defaults;
this is full replacement, not a partial patch. Database immutable fields
(frequency, cadence, target basis, start date) cannot be changed. A stale edit
returns `409 stale_goal`; read again and get user approval for the new edit.
Archiving and link changes use the same retry and version requirements.

`fixed_milestones` requires targetCount and a null recurrenceInterval. Optional
milestoneNames must match the count; its canonical target basis is lifetime.
Recurring lifetime goals require targetCount. The existing database enforces
capacity/target rules, team membership, and completion-history constraints.

### Record completion

PUT `/completions`:

```json
{
  "goalId": "f4444444-4444-4444-8444-444444444444",
  "date": "2026-10-05",
  "desiredFactState": "present"
}
```

Use `absent` to undo a completion. Future or out-of-lifetime facts are rejected.
This uses the same completion path as the web app, including linked cascades,
planner allocation and XP. When acting on a particular saved session, include
`plannerItemExpectation: { itemId, expectedDigest }` from the latest plan.
Do not synthesize a unit key or bypass the canonical completion route.

### Inspect progress and tasks

GET `/progress` returns canonical computed progress. Optional `viewDate` requests
checklist date facts; alternatively provide both `factsFrom` and `factsTo` for a
bounded history window. The authenticated user's profile supplies timezone and
today. GET `/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD` lists bounded calendar tasks.
POST `/tasks` takes `{ requestId, title, scheduledDate, scheduledTime? }` and uses
durable replay. Task schedule/completion PUTs take `{ scheduledDate }` or
`{ completed }`; they set desired state rather than toggle it.

### Preview and publish planning changes

1. GET `/planner?scopeMonth=YYYY-MM` to read saved plan, preferences and digest.
   Optionally supply both visible dates. GET does not prepare or publish a plan.
2. POST `/planner/preview` with `startDate`, `endDate`, optional `policy`, and
   `draftCommands`. Use `solveIntent: "stable"` for a publishable preview.
   `move_item` commands specify stable command ID, sequence, goalId, unitKey,
   sourceDate and scheduledDate. Time edits use `set_item_time_override` or
   `clear_item_time_override`. Schemas and eligibility rules are shared with
   the existing planner.
3. Stable, publishable previews include a ready-to-submit `publishRequest`,
   built with the same helper as the web planner. Other previews return null.
   Show the computed diff and any required confirmations to the user.
4. After approval, POST the exact returned `publishRequest` to `/planner/publish`.
   It carries the approved window, expectedDigest, previewHash, confirmationHash,
   policy, eligibility and preservation settings, and draftCommands. The server
   computes the existing confirmation hash; do not fabricate or alter it.
5. On a stale digest/hash or an unplaceable edit, refresh context, preview again,
   and ask for renewed approval. A proposal generated with `replan` must be
   converted to pinned draft commands and re-previewed as stable before saving.

There is deliberately no arbitrary database query, account deletion, health
write, social mutation, goal parser, coach chat or AI generation tool.

## Implementation and coverage

`src/lib/external-tools/catalog.ts` defines REST/MCP operation metadata and
`schemas.ts` the shared strict contracts. `operations.ts` owns dispatch; both
transports execute it. Canonical planner/completion/task route handlers remain
responsible for their existing workflows. Only goal/task retry receipts add a
new transaction wrapper around existing database RPCs.

Functional coverage is checked in alongside auth, HTTP, operations and MCP,
with pgTAP coverage under `supabase/tests/database/external_account_mutations.test.sql`.
No suite, typecheck, lint, browser verification, or CI is run during implementation.
