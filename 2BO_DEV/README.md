# 2BOrder DEV — G1 workspace marker

**Status:** G1 in progress (NOT PASS). Safe workspace placeholder only.

## Ownership / isolation
- Work is scoped to `2BO_DEV/` on branch `2bo-dev-g1` of the existing `BTC-CHA/2border` repository.
- **Do not edit or reorganize VerifyX, unrelated paths, root app, or the current Vercel production project.**
- Production บ้านช่าง Order is READ-ONLY.
- This existing repository is currently **public**. Do not commit source from the private บ้านช่าง Order repository, private data, environment files, or credentials into it.
- Isolated Windows development source workspace: `E:\Ai_Projects\2BOrder\2BO_DEV_shop_web`.

## G1 baseline
- Authoritative source repository: `BTC-CHA/bannchang-food-order` (private, read-only).
- Production-deployed source commit: `14b5d8f9795592c8cdc7402ee3970f2ce7cbf0a6`.
- Production Supabase project reference: `cxnvnpgglwqlwhldovxc` (read-only).
- DEV Supabase project reference: `hhrnpohhaqbicqkhxidh`.
- DEV database is **not a full clone** of Production.
- Live G1 pass requires dev-only data connections and parity testing against Production; no PASS until evidence.

## Order of work
1. Pin local clone to the deployed source commit and disable Git push to Production.
2. Inventory schema, storage, auth, RLS, policies, triggers, functions, and connected services.
3. Repoint the **DEV copy only** to DEV infrastructure, never to Production.
4. Reproduce the existing UI and workflows before any SaaS/Multi-Tenant changes.
5. Integration verification and G1 acceptance only after all boundaries are safe.

No POS rewrite, redesign, or VerifyX cleanup during G1.
