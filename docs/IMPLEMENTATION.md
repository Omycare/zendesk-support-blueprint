# Implementation notes - current release

`README.md` and `BLUEPRINT.md` supersede the earlier prototype design.

## Source grounding

The connected Google Sheets reader successfully read metadata and populated ranges from all 26 tabs in [French Workflow](https://docs.google.com/spreadsheets/d/1DpfOoZr_leMDt5IfUx26-1dRPEBRYVYelEB4cO3RUwo/edit). Some source tabs were empty. `frontend/extensions.js` records each tab-to-stage mapping and the detailed import headers. Source records, sample customer contacts and old app prices are not treated as real project data. No source write occurred.

## Data model

- `blueprint_projects`: name, normalized questionnaire/tracking JSON, revision and update timestamp.
- `blueprint_members`: project/email membership.
- `blueprint_events`: project, timestamp, actor and changed entity labels, no old secret values.
- `blueprint_settings`: global bilingual training catalog with revision.
- `blueprint_credentials`: project-bound ciphertext, IV and expiration, separate from project responses.
- `blueprint_attempts`: per-user/course rolling code-attempt window.

The hosting dispatcher supplies authenticated identity. Preserve dispatcher-only access to the Worker origin when migrating to a different host; never trust these headers on an otherwise publicly reachable origin. Implement the new host's verified authentication before exposing this API elsewhere.

## API

`/session`, `/projects`, `/projects/:id`, `/projects/:id/members`, `/catalog`, `/projects/:id/credentials`, `/projects/:id/credentials/reveal`, `/projects/:id/training/:course/unlock`.

All routes require a signed-in identity. Project membership is checked before returning data. Only the owner can administer membership, catalog or tracking. Clients may submit a separate credential handover; only the owner can consume it. Server-side origin checks protect mutations; normalized schemas and prepared SQL protect stored data. A revision mismatch returns 409 rather than silently replacing another person's changes.

## Exports and integration boundaries

XLSX and CSV are separate review files. JSON restores project answers/tracking/selected training IDs. The global catalog has its own server record and is not backed up by the project JSON. Technical field JSON contains draft API POST payloads, not executed requests. Regex and lookup require more parameters and are excluded from generated requests. Freeze option tags and review existing fields/IDs before using a draft; repeating POST creates duplicates.

No Google Sheets OAuth token, Zendesk API credential, GitHub token, course password or encryption key is stored in frontend source. Exact passwords supplied for the two courses are server secrets only.

## GitHub Pages

GitHub Pages hosts the full local questionnaire and simulators. A prominent button opens the protected shared portal. The notice clearly identifies local data storage. Hosting a shared frontend directly on Pages would need an independently authenticated cross-origin backend; this is not silently simulated with browser storage.
