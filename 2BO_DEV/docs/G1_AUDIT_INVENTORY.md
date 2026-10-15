# 2BOrder G1 — Audit inventory (16 Oct 2026)

Status: **IN PROGRESS / NOT PASS**. No production modification is authorized.

## Confirmed source
- Verified Vercel production deploy uses GitHub commit `14b5d8f9795592c8cdc7402ee3970f2ce7cbf0a6`.
- Isolated local clone: `E:\Ai_Projects\2BOrder\2BO_DEV_shop_web` (exact SHA validated via NEXUS result).
- Push URL back to the production source Git repository deliberately disabled.
- Frontend DEV endpoints switched to Supabase project `hhrnpohhaqbicqkhxidh` via local-only ignored `.env.local`.
- Four demo-market pages repointed to DEV; copied production backup workflow disabled.
- No private original source has been committed into the PUBLIC `BTC-CHA/2border` repository.

## Database evidence
- DEV currently has **7** public tables: `shops`, `shop_members`, `shop_plans`, `menu_items`, `orders`, `order_items`, `payments`. All seven have RLS enabled.
- Available Google Drive archival schema dump: `Backup_Web_Bannchang-order/Database/2026-09-14_05-15-31/schema.sql`. **Historical reference only**: it predates source commit and later database changes.
- Historical dump defines roughly **65** application tables and over **100** database functions, not just seven tables.
- Core shape conflicts with existing DEV prototype: old `orders.id`, `menu_items.id`, `order_items.id`, and `payments.id` are `bigint` while the 2BOrder pilot versions are `uuid`. These tables cannot be treated as compatible.
- The historical dump lacks the later `ingredient_groups` table, which exists in the app repository migration dated 16 Sep 2026.
- Current production Supabase schema introspection through the linked connector returns `Permission Denied`, so current parity is not verified.

## G1 safety / release boundary
- **Never point any DEV instance back to `cxnvnpgglwqlwhldovxc`**.
- Do not run a destructive migration on the seven-table DEV pilot without a current canonical production schema and a vetted replacement plan.
- No source uploads to this public repository until safe visibility/isolation is decided.
- No changes to VerifyX or `main`, and no Vercel deployment to existing VerifyX or Bannchang projects.
- G1 remains **NOT PASS** until DB, storage, auth, policies, functions, live UI and workflows match the authoritative production baseline in an isolated environment.
