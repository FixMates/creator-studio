# Bubbli Product Enhancement Checklist

Branch: `feat/bubbli-product-enhancements`  
Baseline: `main` at `223c45cdda9e1ac419d692473f562f9a467e5aa7`

Status definitions: **Pending** = not implemented; **In progress** = implementation started; **Blocked** = requires external access or verification; **Verified** = implementation and its stated test both passed.

| ID | Task | Priority | Status | Verification |
|---|---|---:|---|---|
| B01 | Remove inactivity-based automatic suspension from source | P0 | In progress | Function source audit; deployment decommission documented separately |
| B02 | Secure server-side product URL importer | P0 | Pending | URL, redirect, SSRF and metadata tests |
| B03 | Implement real product discovery and search | P0 | Pending | Search, filters, pagination and visibility tests |
| B04 | Track WhatsApp/contact and external destination clicks | P0 | Pending | Analytics event tests and rules validation |
| B05 | Add Maker / Curator / Hybrid onboarding | P1 | Pending | New and legacy account flow tests |
| B06 | Improve storefront conversion and product actions | P1 | Pending | Mobile and desktop browser tests |
| B07 | Improve analytics event schema and reporting | P1 | Pending | Aggregation and event validation tests |
| B08 | Review Firestore security rules | P0 | In progress | Emulator rules tests; source inspection only so far |
| B09 | Replace data-URL image storage with restricted Storage uploads | P1 | Pending | Upload, ownership, size and legacy-image tests |
| B10 | Audit every route and navigation control | P0 | In progress | Full route/control inventory and route matrix |
| B11 | Fix navigation defects found in audit | P0 | Pending | Browser Back/Forward and direct-link regression |
| B12 | Run complete application QA | P0 | Pending | Lint, typecheck, build, rules and Playwright |
| D01 | Audit all demo stores and clearly separate demo from live creator data | P0 | In progress | Demo data and homepage source audit |
| D02 | Replace invented demo marketplace listings with verified genuine listings or clearly illustrative items | P0 | Pending | Product source register and URL verification |
| D03 | Add three useful branded banner slides per demo store | P1 | Pending | Store-by-store CTA and responsive tests |
| D04 | Add distinct demo-store identity and product presentation | P1 | Pending | Store-by-store visual QA |
| D05 | Add safe demo WhatsApp actions without fabricated phone numbers | P1 | Pending | URL/message tests and click analytics |
| D06 | Add genuine product galleries only where multiple authorized images exist | P1 | Pending | Image-source and gallery tests |

## Baseline findings

- Product metadata extractors currently return manual-entry/unsupported messages; automatic metadata fetching is not implemented.
- Homepage search currently filters store name, category and tagline, not product records.
- Analytics currently records only `store_view` and `product_click`.
- Firestore analytics rules currently accept only those two event types.
- Onboarding has identity/category/social-link steps but no Maker / Curator / Hybrid selection.
- Storage rules currently deny all reads and writes; image upload code stores data URLs.
- Cloud Functions source contains the inactivity suspension scheduler. The live Firebase project previously had that scheduler deployed; removing the source export does not by itself prove the remote scheduled function has been decommissioned.
- Demo showcase data contains sample product titles/descriptions/prices without marketplace product URLs or a verification register. These values must not be represented as verified listings.
- The homepage currently combines published creator profiles with showcase demo stores. Demo records need clear separation and disclosure.

## Execution constraints

- Work only on this feature branch.
- Do not deploy to production, change production Firestore data, or merge to `main`.
- Do not add payment, checkout, shipping, refund, delivery or settlement features.
- Never claim tests passed unless they were run and passed.
