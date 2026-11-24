# Bubbli Release Checklist

Branch: `codex/demo-niche-showcases`
Base: `FixMates/creator-studio:main` at `79f715b5b71bda8d971a74489d60d2e2b6a414ba`

| Area | Status | Notes |
|---|---|---|
| Repository and architecture review | Verified | See `TECHNICAL-AUDIT.md` |
| Auth hydration and dashboard redirect fix | In target main | Merged PR #12 |
| Niche demo stores and local brand marks | Implemented | 11 stores, 15 sample products and 3 collections per store |
| Secure admin console and role claims | Implemented; needs production bootstrap config | Custom claims and callable authorization; no public self-assignment |
| Moderation, platform configuration and audit log | Implemented; emulator coverage | Server-side writes; immutable client denial |
| Draft-to-publish creator lifecycle | Implemented; E2E coverage | Requires active product; server validates publication |
| Firestore rules attack checks | Pass locally | Firebase Rules Emulator, 2 test groups |
| Creator and admin browser workflows | Pass locally; 3/3 | Uses demo Auth/Firestore/Functions emulators only |
| App lint/typecheck/build and Functions lint/build | Pass locally | Re-run after final edits |
| CI workflow | Updated; not yet run remotely | Adds Java, rules tests, Playwright and Firebase CLI |
| Production App Hosting source alignment | Blocked | `creatorstore` currently links `Aathiyapp/my-llm`; target is `FixMates/creator-studio` |
| Production Super Admin bootstrap | Blocked | Requires authorized UID in `BUBBLI_SUPER_ADMIN_UID` secret |
| Production deploy and smoke test | Not performed | Resolve source link and secret before rollout |
| Remaining requested product scope | Partial | Advanced analytics, reports and multi-image/banner features remain |

The candidate can be reviewed and merged after local/remote checks pass. Production rollout remains blocked by deployment source alignment and bootstrap configuration.
