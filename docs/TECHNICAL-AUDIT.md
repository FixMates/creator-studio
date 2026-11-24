# Bubbli Technical Audit

Audit branch: `codex/demo-niche-showcases`
Base: `FixMates/creator-studio:main` at `79f715b`

| Priority | Issue | Root cause | Recommended fix | Status |
|---|---|---|---|---|
| High | Dashboard could send a completed creator into onboarding after a Firestore read error | Dashboard gate checked only the account document and treated read failures as onboarding incompletion | Resolve both account and creator profile after Firebase auth hydration; show a retryable verification error on read failure; ignore stale requests | Fixed; creator lifecycle E2E passes in emulators |
| High | Onboarding could inspect auth before Firebase finished restoring the session | It read `auth.currentUser` during mount rather than waiting for the auth observer | Wait for `onAuthStateChanged` before routing or loading a draft; retain a retry action for account/profile read errors | Fixed; creator lifecycle E2E passes in emulators |
| Medium | Auth-dependent profile fetches could finish after account/path changes | Async profile lookup did not reject stale results | Sequence and cancel dashboard-shell profile reads | Fixed in this branch |
| Medium | ESLint rejected initial state updates performed from effects | Existing React effect setup mixed synchronous initialization with subscription/data-load effects | Move stable initial state into state initializers and keep auth-driven updates in observer callbacks | Fixed; app lint passes |
| Medium | Firebase Functions lint command was incompatible with the locally resolved ESLint 9 | Script passed `--ext`, removed by ESLint 9; the Functions lockfile pins ESLint 8 | Resolve the local Functions ESLint binary and accommodate Windows line endings in the runner | Fixed; Functions lint passes on this Windows workspace |
| High | Dependency audit reported moderate production advisories in Firebase Admin's dependency tree | The Functions code used Firebase Admin 13.x and vulnerable transitive packages | Upgrade to Firebase Admin 14.5.1, remove unused incompatible test helper, refresh lockfiles and rerun audits | Fixed; both web and Functions audits report zero vulnerabilities |
| Enhancement | Demo catalogue had 12 products per niche and emoji store marks | Seed data stopped at 12 products and used emoji identifiers | Add 3 fully described illustrative items to each of 11 niche showcases, collection cover images and custom local SVG marks | Implemented and locally validated |
| Medium | Marketplace source/price verification is unavailable | Existing extractors are manual-entry only and sample catalogues have no traceable retailer listings | Keep demo pricing illustrative and do not imply live retailer stock or synchronisation | Still applicable; intentionally disclosed in previews |
| Medium | Analytics event coverage is partial | Banner event controls and some aggregation paths are not connected | Complete analytics wiring and validate event ownership with emulator tests | Open |
| Medium | Storage uploads use data URLs; Firebase Storage rules deny access | No coordinated Storage migration has been implemented | Keep existing data URL path until owner-only upload rules, validation and migration are tested | Open |
| Low | Public discovery covers stores, not an independently paginated live product index | Homepage combines creator stores and showcase data | Add secure, paginated discovery only if product-level search is required | Open |
| Critical | Secure administration surface | Custom claims and Admin SDK callable actions on `/admin` | Role-scoped dashboard, moderation, notes, categories/configuration, trusted bootstrap and server audit writer | Implemented; emulator E2E covers search, moderation, audit and denial |
| Critical | Creator suspension needs backend enforcement | Account/store publication and product visibility are controlled by trusted operations and Firestore rules | Keep owner writes blocked for suspended accounts and public reads hidden for suspended/unpublished stores | Implemented; Firestore adversarial tests pass |
| High | Creator lifecycle lacked automated end-to-end coverage | No Playwright configuration, seeded test identity or emulator suite existed | Use isolated Auth/Firestore/Functions emulators; test register-through-publish and negative admin access | Implemented; 3 Playwright tests pass |
| High | App Hosting Git source does not match requested source repository | Firebase backend is linked to `Aathiyapp-my-llm`, while the requested repository is `FixMates/creator-studio` | Align the App Hosting connection before relying on branch pushes for release | Open; deployment source mismatch |

## Confirmed repository state

- The supplied auth fix `79f715b5b71bda8d971a74489d60d2e2b6a414ba` is now present as the target repository base (merged PR #12).
- The app contains 21 page routes under `app/` (see `docs/NAVIGATION-AUDIT.md`).
- Firestore and Storage rules are present. Firestore Rules Emulator tests run through `npm run test:rules`; Storage still denies all client access.
- No live retailer product URLs, verified prices or seller contact numbers are fabricated for showcase stores.

## Release boundary

No production data writes or deployments have been made. Production rollout is blocked until the Firebase App Hosting Git source is aligned with the requested repository and the authorized Super Admin UID is configured as `BUBBLI_SUPER_ADMIN_UID`.
