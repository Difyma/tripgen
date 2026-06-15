# Security Audit Report

Status: historical report redacted.

This repository previously contained real secrets in committed files and history. Do not add real API keys, tokens, Basic Auth headers, JWTs, or `.env` contents to tracked files.

Required remediation if these credentials were ever pushed to GitHub:

1. Rotate all exposed keys in their providers:
   - OpenAI
   - OpenRouter
   - Telegram bot token
   - ETG/Ostrovok key/token/secret
   - Supabase service keys if any were exposed
2. Keep secrets only in deployment environment variables or local ignored `.env` files.
3. If the repository was public or shared, purge history with `git filter-repo` or BFG and force-push after team coordination.
4. Run `./scripts/scan-secrets.sh` before every release.

Allowed in frontend code:
- Public Supabase anon key only if RLS policies are correctly configured.
- Public partner slug/UTM values.

Not allowed in frontend code:
- ETG/Ostrovok API token or secret.
- OpenAI/OpenRouter keys.
- Supabase service role key.
- Telegram bot token.
