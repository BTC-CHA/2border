# 2BOrder — HANDOFF_CURRENT
Updated: 2026-10-16 Asia/Bangkok
Gate: G1 IN PROGRESS — NOT PASS

## Source / working environment
- Scope approved: G1 Duplicate Bannchang Production -> isolated 2BOrder DEV only.
- NEXUS project_id: `2BOrder` (registered PASS).
- Source mount: `E:\Ai_Projects\2BOrder` (mounted PASS).
- Isolated local source: `E:\Ai_Projects\2BOrder\2BO_DEV_shop_web`.
- Source repo (READ ONLY): `BTC-CHA/bannchang-food-order`; deployed Vercel production SHA `14b5d8f9795592c8cdc7402ee3970f2ce7cbf0a6`.
- Local git clone checked out at exact deployed SHA; remote renamed `production-readonly` with push URL disabled.
- Local-only environment `.env.local` points to DEV Supabase project `hhrnpohhaqbicqkhxidh`.
- `src/supabase.js` reads DEV Vite env; DEV auth storage keys separated.
- Four demo market HTML clients repointed to DEV; copied production backup workflow disabled; OAuth callback repointed to a non-production placeholder.
- Local-only Windows build compatibility: CRLF normalized, nested Vite CLI launched using Node directly instead of `spawnSync('npx.cmd')`. No edits to actual production source.
- Local DEV build PASS: `2BO-G1-RUN-RESUMEBUILD-20261016-B01`, 10 build assets, no production Supabase project reference detected in build output.
- No DEV web deployment exists yet. Live UI parity is UNTESTED.

## Git / hosting boundary
- Work is inside existing `BTC-CHA/2border` repo, safe branch `2bo-dev-g1`, folder `2BO_DEV/` for nonsensitive docs only.
- The repo is PUBLIC; DO NOT commit the PRIVATE Bannchang source or secrets into it. Do not change repo visibility without reviewing VerifyX impact.
- Existing VerifyX and repo main untouched. Existing Vercel projects unchanged.
- No new Vercel DEV project successfully created; prior 403 permissions blocker remains.

## Database inventory / blocker
- Target DEV Supabase `2border-saas-pilot` (`hhrnpohhaqbicqkhxidh`) is ACTIVE_HEALTHY; seven pilot tables present with RLS, NOT a source clone.
- Current production Supabase `bannchang-food` (`cxnvnpgglwqlwhldovxc`) returns Permission Denied through linked connector. Do not bypass.
- Historical Google Drive backup `Backup_Web_Bannchang-order/Database/2026-09-14_05-15-31/schema.sql`: roughly 65 public tables and >100 functions. Historical snapshot only; too old for G1.
- Archived source schema has `orders`, `menu_items`, `order_items`, `payments` BIGINT IDs; current seven-table pilot uses UUID IDs. Do not blindly apply source schema on the pilot.
- `ingredient_groups` added by source migration 2026-09-16, absent from the old backup.
- No PROD customer records, secret keys, or live DB dumped/copied; no target schema modifications.

## Latest verified NEXUS jobs
- `CTRL-2BO-G1-REGISTER-20261016-A01` — PASS registered
- `CTRL-2BO-G1-MOUNT-20261016-A01` — PASS mounted
- `2BO-G1-RUN-CLONEFIX-20261016-A01` — PASS commit-pinned local clone + push disabled
- `2BO-G1-RUN-REFSCAN-20261016-A01` — PASS production-reference audit
- `2BO-G1-RUN-DEVCONFIG-20261016-A01` — PASS DEV endpoint isolation
- `2BO-G1-RUN-RESUMEBUILD-20261016-B01` — PASS Windows-compatible local build / no prod endpoint in dist

## Next authorized action
1. Resolve read-only access to the **current** production schema or obtain a fresh complete schema-only export; verify tables, columns, functions, policies/RLS, triggers, storage, auth settings, dependencies.
2. Compare to seven-table DEV pilot; prepare safe replacement plan with no production writes. Implement schema duplication on DEV only after current parity is known.
3. Validate all relevant DEV endpoints and workflows against Production; solve existing Vercel DEV project permission / public-repo privacy boundary without impacting VerifyX or Bannchang.
4. Integration test once and only then consider G1 PASS. Do not start G2-G6.

Permanent rule: READ-ONLY Bannchang Production. Do not rewrite UI, POS, or index giant file in G1.
