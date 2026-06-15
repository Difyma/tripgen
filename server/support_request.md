# Ostrovok / ETG Support Request Template

Do not commit real API tokens or Basic Auth headers.

## Subject
ETG API access / certification test hotel check

## Public information
- Key ID: `<key_id>`
- Contract / partner slug: `<partner_slug>`
- Environment: production endpoint `https://api.worldota.net`

## Test request shape

```bash
curl -X POST "https://api.worldota.net/api/b2b/v3/search/serp/hotels/" \
  -H "Authorization: Basic <base64(key_id:api_token)>" \
  -H "Content-Type: application/json" \
  -d '{"ids":["test_hotel","test_hotel_do_not_book"],"checkin":"YYYY-MM-DD","checkout":"YYYY-MM-DD","guests":[{"adults":2,"children":[]}]}'
```

Share the real token only through a secure support channel, not through git.
