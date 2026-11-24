# Bubbli QA Report

Branch: `codex/demo-niche-showcases`
Target: `FixMates/creator-studio:main` at `79f715b5b71bda8d971a74489d60d2e2b6a414ba`

## Implemented in this release candidate

- 11 niche showcase stores with 15 illustrative products and 3 collections each; 11 local SVG brand marks.
- Authenticated admin console with custom-claim roles, trusted one-time Super Admin bootstrap, audited moderation, user/store/product controls, category/configuration management and internal notes.
- Server-side store publication validation; onboarding creates a draft and an active product is required before publishing.
- Firestore rules for owner isolation, creator publication, suspended accounts, maintenance mode, product visibility and protected admin data.
- Firebase Auth, Firestore and Functions emulator routing; Playwright creator/admin test harness.

## Validation

| Check | Current result |
|---|---|
| App typecheck and ESLint | Pass |
| Next.js production build | Pass; all 21 routes generated |
| Cloud Functions lint and build | Pass |
| Firestore Rules Emulator | Pass; 2 adversarial test groups |
| Playwright creator/admin E2E | Pass; 3/3 | Emulator-only creator lifecycle, admin search/moderation/audit, and non-admin denial |
| Showcase image URLs | Pass; 51 unique Unsplash images checked |
| Web and Functions dependency audits | Previously pass with zero findings; rerun before merge |
| GitHub CI for this branch | Pending push |
| Live production smoke test | Not run |

## Release blockers and boundaries

- The live `creatorstore` App Hosting backend is in Firebase project `affiliate-93078`, region `asia-southeast1`, and its Git source remains linked to `Aathiyapp/my-llm`, not `FixMates/creator-studio`. A merge in the requested repository will not trigger that backend's linked-source deployment.
- Trusted Super Admin bootstrap requires the Firebase secret `BUBBLI_SUPER_ADMIN_UID` to identify the authorized account. No production UID was selected or configured in this workspace. The emulator uses a seeded test-only custom claim.
- The current admin dashboard provides operational counts and daily activity, but it does not yet include every requested analytics/reporting view or multi-image product galleries/banner campaigns.
- Demo product descriptions, prices and imagery are illustrative, not verified retailer offers.
- Storage rules continue to deny access; product/category imagery is stored as bounded data URLs for this release candidate.

Production deployment is not complete. Do not treat this candidate as deployed until the Git source, bootstrap secret and CI/release checks are aligned and verified.
