# Bubbli Technical Audit — Baseline

Branch: `feat/bubbli-product-enhancements`  
Audited source ref: `feat/bubbli-product-enhancements` at `19477e8c336763609e2c3c0aa0cf1bd95e5d6190`

## Confirmed findings

### Cloud Functions
- `functions/src/index.ts` on the feature branch exports `recordCreatorStoreView` only. The inactivity-based scheduled suspension export is absent from branch source.
- The feature branch does not automatically decommission an already deployed scheduled function. An approved Functions deployment/removal is still required before claiming production decommissioning.

### Product metadata
- `lib/services/metadata/extractors.ts` has Amazon, Flipkart and Meesho hostname recognizers, but marketplace extractors return a generic unsupported/manual-entry result.
- Generic extraction explicitly says server-side metadata fetching is not connected.
- The product editor currently stores a pasted URL and lets the creator fill details manually.
- A secure server-side fetcher must validate every redirect and block private/internal destinations to avoid SSRF.

### Homepage discovery
- `components/homepage/bubbli-home.tsx` loads a bounded set of published creator profiles and combines them with demo stores.
- Search currently matches store name, category and tagline. It does not search products.
- The current client-side store query is limited to 18 records; there is no global product discovery index in the inspected code.

### Analytics
- `lib/services/analytics.ts` writes only `store_view` and `product_click`.
- `firestore.rules` permits only those event types.
- Dashboard reporting currently displays visits, product clicks, derived click-through rate, active products, traffic sources and top clicked products.
- No WhatsApp/contact, banner or collection click events are currently written in the inspected analytics service.

### Onboarding and data model
- `components/onboarding/onboarding-flow.tsx` currently asks for identity, category and social links, then previews the store.
- `types/store.ts` has no creator business-type field for Maker / Curator / Hybrid.
- Any new field must remain optional for legacy creator records.

### Images and storage
- `lib/services/image.ts` converts uploaded images into WebP data URLs.
- `firestore.rules` currently allows large image URL/data fields.
- `storage.rules` denies all access. Storage migration requires coordinated code and narrowly scoped owner-only rules, with legacy data compatibility.

### Demo storefront data
- `lib/demo/showcase-stores.ts` contains showcase store/product sample content.
- The inspected sample products have names, descriptive copy and prices but do not establish genuine marketplace listing URLs or verified prices.
- Do not label these sample details as verified retailer listings. Use explicit illustrative disclosure until verified sources are recorded.

## Security and release notes

- Firestore rules have strict owner/public boundaries and validate current event types; changes to event schema must be reflected in rules and emulator tests.
- Do not weaken rules as a shortcut.
- The currently deployed scheduled suspension function is a production resource. Removing its source export is not equivalent to deleting the deployed scheduler/function. Record and separately execute an approved decommission deployment.
- No production deployment, production data mutation or merge is authorized by this workstream.
- Baseline source inspection is not a substitute for running lint, typecheck, build, emulator or browser tests.
