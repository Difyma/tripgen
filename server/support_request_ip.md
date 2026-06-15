# Ostrovok / ETG IP Whitelist Request Template

Do not commit real API tokens or Basic Auth headers.

## Subject
Add production egress IP to ETG whitelist

## Public information
- Key ID: `<key_id>`
- Contract / partner slug: `<partner_slug>`
- Production domain: `<domain>`
- Production egress IP/range: `<ip_or_range>`

## Question
Please whitelist the production egress IP/range for ETG B2B API requests.

If the application is deployed on a serverless provider with dynamic outbound IPs, use a static egress proxy/NAT and provide that IP/range.
