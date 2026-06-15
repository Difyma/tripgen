# Ostrovok / ETG API Setup

ETG credentials must be stored only in backend environment variables.

Required backend env vars:

```env
OSTROVOK_KEY_ID=<key_id>
OSTROVOK_API_TOKEN=<api_token>
OSTROVOK_API_URL=https://api.worldota.net
OSTROVOK_PARTNER_SLUG=<partner_slug>
```

Do not put `OSTROVOK_API_TOKEN`, Basic Auth headers, or encoded credentials in documentation, frontend code, screenshots, or support files committed to git.

Testing test hotels:

```bash
# Uses env vars from your shell/server env. Does not hardcode secrets.
node server/test_ostrovok_debug.mjs
```

Current implementation uses the backend/serverless proxy and real ETG endpoints:
- `/api/b2b/v3/search/serp/region/`
- `/api/b2b/v3/search/serp/geo/`
- `/api/b2b/v3/search/serp/hotels/`

For certification test hotels, use string ids:
- `test_hotel`
- `test_hotel_do_not_book`
