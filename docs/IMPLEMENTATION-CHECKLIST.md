# Bubbli Product Enhancement Checklist

Branch: `feat/bubbli-product-enhancements`  
Latest audited branch head before this documentation update: `6173b5e2a2efe930380be2196d8d6ed17a357a82`

Status definitions: **Verified** means code and the stated verification passed. **Implemented — tests pending** means code was changed but required automated/browser verification has not run. **Partial** means only a bounded part of the requirement is implemented. **Pending** means not implemented. **Blocked** means safe completion requires an external dependency or runtime capability not available in this work session.

| ID | Task | Priority | Status | Verification / limitation |
|---|---|---:|---|---|
| B01 | Remove inactivity-based automatic suspension from source | P0 | Verified in branch source | `functions/src/index.ts` contains only `recordCreatorStoreView`; a deployed legacy scheduler still needs approved decommission deployment |
| B02 | Secure server-side product URL importer | P0 | Pending | Extractors remain manual-only; SSRF-safe server fetcher and redirect resolution not implemented |
| B03 | Product discovery and search | P0 | Partial | Homepage search now includes sample showcase product names/descriptions/recommendations; it does not yet query/paginate live creator products |
| B04 | WhatsApp/contact and outbound analytics | P0 | Implemented — tests pending | Added WhatsApp, external, banner and collection event writers; wired store WhatsApp and product outbound redirect events; Firestore rules updated; banner/collection writers not yet wired to controls |
| B05 | Maker / Curator / Hybrid onboarding | P1 | Pending | No creator type field or onboarding selection in current model |
| B06 | Storefront conversion improvements | P1 | Partial | Existing public storefront supports search, collections, share and WhatsApp; no three-slide banner or demo-store contact implementation yet |
| B07 | Analytics reporting | P1 | Partial | Event writers added; dashboard aggregation/reporting for new event types remains unimplemented |
| B08 | Firebase security review | P0 | Partial | Rules source updated for expanded analytics; emulator validation not run |
| B09 | Restricted Firebase Storage image uploads | P1 | Pending | Existing image data-URL approach remains; Storage rules deny access |
| B10 | Full route and navigation audit | P0 | Partial | 21 page routes inventoried; control-by-control and browser history QA not complete |
| B11 | Fix navigation defects | P0 | Pending | No full browser regression run |
| B12 | Complete application QA | P0 | Blocked in this session | GitHub source edits possible; repository runtime, dependencies, emulator and browser are unavailable for executing project scripts |
| D01 | Audit demo stores and separate illustrative data | P0 | Partial | 11 showcase stores identified; source catalogue is static illustrative data and homepage labels showcase content as illustrative |
| D02 | Genuine marketplace product source register | P0 | Pending | No Amazon/Flipkart/Meesho listing has been verified; sample catalogue must not be presented as genuine listings |
| D03 | Three branded banner slides per demo store | P1 | Pending | Not implemented |
| D04 | Distinct demo store identity | P1 | Partial | 11 existing store names, categories, taglines, emoji marks and cover images retained; per-store visual QA not run |
| D05 | Safe demo WhatsApp actions | P1 | Pending | Demo seller numbers are not configured; must use generic WhatsApp share/contact URL and disclose demo nature |
| D06 | Genuine multi-image product galleries | P1 | Pending | Existing showcase data does not establish authorized multi-image listing galleries |

## Execution constraints

- Work only on this feature branch.
- Do not deploy to production, change production Firestore data, or merge to `main`.
- Do not add payment, checkout, shipping, refund, delivery or settlement features.
- Never invent marketplace listings, prices, ratings, seller phone numbers or verification results.
- Do not mark a task complete without its required test evidence.
