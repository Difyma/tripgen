# TripGen x Ostrovok Certification Report

## 1. What Was Implemented

- Chat pipeline now runs real ETG hotel search in production flow via:
  - primary `/api/b2b/v3/search/serp/region/`
  - optional geo fallback `/api/b2b/v3/search/serp/geo/`
- Test/demo hotel fallback is disabled in production paths and guarded by `ETG_ENABLE_TEST_FALLBACK=true` for dev/test only.
- Referral links use real search parameters (dates/guests/children ages), partner attribution and UTM params.
- Children are supported as `0..17` with per-child exact age in UI and API payload.
- Static data MVP implemented on local Postgres with full/incremental/regions sync jobs and sync run/state tracking.
- Debug/diagnostic visibility added for trace-based manual QA.

## 2. Endpoint Strategy

- Primary search endpoint: `/api/b2b/v3/search/serp/region/`
- Secondary endpoint: `/api/b2b/v3/search/serp/hotels/` (only when known IDs are available)
- Auxiliary fallback: `/api/b2b/v3/search/serp/geo/` (when region search yields no results and coordinates exist)

Resolver module:
- `server/src/etg/endpointResolver.ts`

## 3. Search Flow (Certification)

1. User sends a message in chat.
2. Pipeline extracts/uses destination + dates + occupancy.
3. Destination is normalized.
4. Endpoint resolver selects primary region search.
5. ETG request executes with timeout guard.
6. Response is mapped to chat hotel view model.
7. Referral links are generated from real parameters.
8. Trace logs capture key diagnostics.

## 4. Static Dump Flow (MVP)

Schema:
- `db/migrations/001_etg_static_tables.sql`
  - `etg_hotels_static`
  - `etg_regions`
  - `etg_sync_runs`
  - `etg_sync_state`

Jobs:
- `server/src/jobs/sync_hotels_full.ts`
- `server/src/jobs/sync_hotels_incremental.ts`
- `server/src/jobs/sync_regions_full.ts`

Runtime scripts:
- `npm run sync:hotels:full`
- `npm run sync:hotels:incremental`
- `npm run sync:regions:full`

Status endpoint:
- `GET /api/hotels/sync/status`

## 5. Debug and QA Endpoints

- `GET /api/openai` (recent traces in serverless memory)
- `GET /api/openai?traceId=<id>` (single trace)
- `GET /api/hotels/debug/last`
- `GET /api/hotels/debug/last?traceId=<id>`
- `GET /api/hotels/sync/status`

Trace fields include:
- raw query
- parsed destination/dates/adults/children/childrenAges
- selected endpoint
- ETG request payload summary
- ETG response summary + hotel count
- first referral link
- traceId + timestamps

## 6. Env Variables

- `OPENROUTER_API_KEY`
- `OSTROVOK_API_URL`
- `OSTROVOK_KEY_ID` or `OSTROVOK_API_KEY`
- `OSTROVOK_API_TOKEN` or `OSTROVOK_API_SECRET`
- `OSTROVOK_PARTNER_SLUG`
- `ETG_ENABLE_TEST_FALLBACK` (`false` in production)
- `ETG_SEARCH_TIMEOUT_MS` (default `15000`)
- `ETG_SEARCH_TIMEOUT_MAX_MS` (default `30000`)
- `ETG_DEBUG_MODE`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `PGSSLMODE`

## 7. Smoke Checks

Script:
- `scripts/etg-cert-smoke.mjs`

Run:
- `npm run smoke:etg`

Covered scenarios:
- 2 adults, city search
- 2 adults + child age 5
- 2 adults + children 3 and 11
- destination with geo normalization
- no results behavior
- timeout envelope
- referral attribution in links
- tariff/policy fields in hotel payload

## 8. Example Evidence (Template)

### Example A
- User input: "Подбери отель в Москве на 10-12 июня, 2 взрослых"
- Parsed params: destination=Москва, checkin=2026-06-10, checkout=2026-06-12, adults=2, children=[]
- Endpoint: `/api/b2b/v3/search/serp/region/`
- ETG summary: hotels_count=...
- First referral link: ...

### Example B
- User input: "Нужен отель в Питере, 2 взрослых и ребенок 5 лет"
- Parsed params: destination=Питер, adults=2, childrenAges=[5]
- Endpoint: `/api/b2b/v3/search/serp/region/` (with possible geo fallback)
- ETG summary: hotels_count=...
- First referral link: ...

### Example C
- User input: "Подбери вариант в неизвестном городе XYZ"
- Parsed params: destination=XYZ
- Endpoint: region -> optional geo fallback
- ETG summary: hotels_count=0
- Result: empty-state/clear error (no forced test hotel)

## 9. Legacy/Test Cleanup Notes

Cleaned in production path:
- Forced test-hotel substitution in chat open-link flow.
- Production fallback to demo hotels in main chat ETG path.
- Test-only branches now guarded behind `ETG_ENABLE_TEST_FALLBACK` and non-production mode.

Remaining test-only branches (intentional):
- Dedicated test/debug helper scripts in `server/test_*.mjs` for local diagnostics.
- Demo datasets kept for explicit dev/test fallback mode and regression checks.
