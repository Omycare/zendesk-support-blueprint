# OmyCare Support Blueprint 1.0

French/English Zendesk discovery portal and shared implementation tracker. Built for Stephanie (`stephanie@omycare.fr`). See `docs/BLUEPRINT.md` for the complete Spanish handover.

## Delivered functionality

- Fourteen guided stages; examples, spreadsheet-style paste, previews inspired by Zendesk Support, conditional forms, nested dropdowns, view folders, macros, routing and simplified SLA comparison.
- Read-only mapping of the supplied French Workflow workbook's 26 tabs, with 12 optional detailed tables. The source spreadsheet is unchanged. Exports are new files, not an exact copy preserving workbook layout/formulas.
- 27 implementation tasks transcribed from KAN-548 through KAN-574. Consultant-maintained status, actual hours and client-visible notes; no live Jira/Zendesk synchronization.
- Exactly eight 30-minute meetings. Held checkboxes, dates and notes; meetings and configuration hours use separate totals.
- Cal.com meeting booking and course-specific training booking buttons, with per-project course entitlement visibility. Bookings do not automatically consume the eight-meeting allowance.
- Per-project working tabs with shared notes, tables, document links and reversible archiving. Stephanie alone assigns the client's Google Drive folder; the server preserves that setting on client writes. Uploads currently happen inside Drive after opening the folder, not directly through this app.
- Two supplied OmyCare training links preconfigured in a reusable catalog. Enable training and select purchased resources per project. Their codes are checked by the server, with eight attempts per 15 minutes per authenticated user/course.
- Named consultant invitation details, Zendesk URL and account owner email. Optional encrypted, expiring, single-retrieval credential handover. Passwords never enter the project JSON or exports.
- Shared D1 data, server-authorized project memberships and roles, audit history, optimistic revisions, idle refresh and recoverable conflict handling.
- JSON backups, XLSX/CSV, and review-only API request drafts for supported ticket fields. No changes applied to Zendesk or the source Sheet.
- Exact supplied OmyCare PNG logos; navy `#0e0452`, purple `#6e4ff5`, accent `#5a3297`.

## Client onboarding

The Site is private. Sign in as Stephanie to create a project, authorize the client's email in Project tracking, and grant that client platform-level Site access through Share. A client needs both Site access and project membership and signs in with ChatGPT. No invitation is sent automatically.

Clients edit discovery answers and read configuration/meetings. Only the consultant edits tasks, hours, meetings, entitlements, catalog and memberships. The client preview is only a display aid; server checks provide actual authorization.

Clients and Stephanie can create and edit project workspaces. Drive permissions are independent from portal membership and must be restricted to the correct client. See `docs/COLLABORATION-AND-DRIVE.md` for the new workflow and the pending direct Drive upload and threaded-conversation specifications.

## Access handover and course codes

Runtime secrets: `CREDENTIAL_ENCRYPTION_KEY` (64 hexadecimal characters), `AGENT_TRAINING_CODE`, `ADMIN_TRAINING_CODE`. Configure these on the server, never in the repository or frontend. Hosted values were configured through the hosting service. `.env.example` has empty values only.

Temporary credentials use AES-256-GCM with project-bound additional data and a fresh IV. The consultant's retrieval consumes the record. Access expires after seven days; expired ciphertext is purged on the next credential request for that project. Replacing/deleting a handover is explicit. Audit entries contain the event, not the secret. Keep the encryption key stable for pending handovers; rotating it invalidates existing ciphertext.

Course codes gate the portal's unlock action. They do not make the existing public GitHub training pages private. Anyone who knows a direct public URL can still open it. Protecting the course content itself requires moving it behind an authenticated service or configuring protection at its hosting origin.

## Commands and deployment

Node 22.13+ and the checked-in pnpm lockfile are used.

- `npm test`: core UI logic, tracking rules and SQLite-backed API security/permission tests.
- `npx tsc --noEmit`: type check.
- `npm run build`: sync frontend and build the Cloudflare Worker.
- `npm run db:generate`: generate a migration after a deliberate schema change.
- `node scripts/build-pages.mjs`: produce the GitHub Pages entrypoint and static local demo.

`frontend/` contains the standalone local frontend. `public/blueprint/` is generated for the shared hosted version. The internal preview and localhost intentionally use local mode for synthetic-data UI review. This does not relax API authorization. `app/api/blueprint/[[...path]]/route.ts` contains server behavior; `db/schema.ts` and `drizzle/` contain migrations.

The repository is [Omycare/zendesk-support-blueprint](https://github.com/Omycare/zendesk-support-blueprint). GitHub Pages serves the complete local questionnaire and simulators from the `gh-pages` branch. A persistent notice explains local-only storage and offers the shared-project link. The shared portal continues to provide authenticated multi-client storage, credential handover and code validation.

Pages is configured with GitHub's branch deployment, requiring no custom Actions workflow. `deployment/pages-actions.yml.example` is an optional workflow example, not an active workflow. Run `node scripts/build-pages.mjs` and publish the contents of `pages-dist/` to `gh-pages` when updating the public website. Never upload client exports, secrets or the server environment.

To deploy the server elsewhere, configure verified identity, a D1-compatible database, migrations and the three runtime secrets described above; the GitHub frontend alone does not provide these capabilities.

## Validation and known boundaries

Automated tests cover FR/EN/example rendering, fields, conditions, folders, export safety, draft API mapping, original-tab mapping, all Jira IDs, the meeting cap, permissions, project isolation, revision conflicts, course entitlement/codes/rate limits, encrypted one-time handover and expiration. XLSX output was opened independently with openpyxl.

The original internal preview was rejected by session permission controls; mobile, keyboard and 200% zoom acceptance remain listed in the pilot checklist. See `docs/ACCEPTANCE.md` for the short pilot checklist.

Advanced product configuration (Talk, AI, omnichannel, SSO and custom objects) is captured at the planning/requirement level, not simulated exhaustively. Plan eligibility and ambiguous/truncated Jira items remain consultant decisions. The platform does not automatically configure Zendesk, complete Jira tasks, write into the source spreadsheet or invoice hours.
