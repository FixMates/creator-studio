# Bubbli Technical Audit

Branch: `feat/bubbli-product-enhancements`  
Audited source head: `6173b5e2a2efe930380be2196d8d6ed17a357a82` (before this documentation refresh)

## Confirmed findings

### Cloud Functions
- The feature branch's `functions/src/index.ts` exports `recordCreatorStoreView` only.
- The inactivity-based scheduled suspension export is absent from the branch source.
- Removing the source export does not prove an already deployed scheduled function has been decommissioned. An approved Functions deployment/removal is still required before production decommissioning can be claimed.

### Product metadata import
- `lib/services/metadata/extractors.ts` recognizes Amazon, Flipkart and Meesho hostnames, but all marketplace extractors still return manual-entry/unsupported results.
- Generic metadata parsing exists in `lib/services/metadata/parsers.ts`, but it does not perform network requests.
- Product editor stores a validated pasted URL and allows manual completion.
- A production importer must be server-side and must validate every redirect, DNS/IP destination, response size, content type and timeout. It must not bypass retailer protections. This secure fetch service remains unimplemented.

### Homepage discovery
- `components/homepage/bubbli-home.tsx` loads a bounded set of published creator profiles and combines them with showcase stores.
- Homepage search now includes showcase product names, descriptions and recommendation copy as search terms, in addition to store name/category/tagline.
- This is not yet global live-product discovery. Published creator products are not queried through a secure, paginated discovery index, and product result cards are not yet shown independently.

### Analytics
- `lib/services/analytics.ts` now defines event writers for `store_view`, `product_click`, `whatsapp_click`, `external_click`, `banner_click` and `collection_click`.
- Store-level WhatsApp and product outbound/WhatsApp redirects call the new writers.
- `firestore.rules` now allows the expanded event types and checks creator ownership for associated product/collection references.
- Banner and collection event writers are not yet connected to UI controls.
- Dashboard aggregation/reporting still needs to consume the new event types. An event write is not a sale.

### Onboarding and data model
- Onboarding currently asks for identity, category and social links, then previews the store.
- `types/store.ts` has no Maker / Curator / Hybrid business-type field. Legacy-safe type persistence and dashboard guidance remain pending.

### Images and Storage
- `lib/services/image.ts` converts uploaded images into WebP data URLs.
- `storage.rules` denies all access. A Storage migration requires coordinated owner-only upload rules, MIME/size checks, deletion and legacy-data compatibility.

### Demo storefronts
- `lib/demo/showcase-stores.ts` defines 11 sample showcase stores.
- Showcase products have sample titles/descriptions/prices and stock Unsplash photography, but no verified Amazon, Flipkart or Meesho product-detail URLs.
- The product source register intentionally contains zero verified listings. Do not present sample prices as retailer-verified prices.
- Three-slide banner carousels, product-specific retailer galleries and authorized seller WhatsApp numbers are not established in current demo data.

### Routes
- 21 Next.js page routes were found under `app/`, including public username stores, demo previews, product redirects, auth, onboarding and dashboard sections.
- A route inventory is documented in `docs/NAVIGATION-AUDIT.md`; full control-level and browser-history verification remains open.

## Security and release notes
- Analytics event validation was expanded in `firestore.rules`; Firestore Emulator tests have not been run.
- Do not weaken rules as a shortcut.
- No production deployment, production data mutation or merge to `main` has been performed.
- No claim is made that lint, typecheck, build, emulator or browser tests passed; these checks were not executable in this session.
