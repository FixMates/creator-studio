# Bubbli Navigation Audit

Status: **In progress**  
Audited source ref: `main` at `223c45cdda9e1ac419d692473f562f9a467e5aa7`

This is a baseline, not a completed route audit. The full `app/` route tree and every interactive control still need inventory and browser verification.

| Route / component | Control | Expected destination | Baseline observation | Status |
|---|---|---|---|---|
| Homepage | Login | `/login` | Link present in desktop and mobile header | Source observed; browser untested |
| Homepage | Create store | `/onboarding` | Link present | Source observed; browser untested |
| Onboarding | Previous step | Previous onboarding step | Multi-step state exists; all step transitions not yet inspected | Pending |
| Onboarding | Completion | `/dashboard` | Completion handler requires full source review | Pending |
| Product editor | Back to products | `/dashboard/products` | Explicit Link present | Source observed; browser untested |
| Product editor | Cancel | `/dashboard/products` | Explicit Link present | Source observed; browser untested |
| Product editor | Save | `/dashboard/products` | Calls router.push after repository save | Source observed; browser untested |
| Public storefront | Product action | `/go/{productId}?u={username}` | Product cards link to redirect route | Source observed; browser untested |
| Product redirect | Back to creator store | `/{username}` | Deterministic return link uses query username or homepage fallback | Source observed; deep-link cases need testing |
| Public storefront | Share | Current store URL | Share/copy fallback exists | Source observed; browser untested |

## Known test requirements

- Inventory every route from the actual Next.js `app/` directory.
- Inspect all `Link`, anchors, `router.push/replace/back`, `window.location`, `window.open`, submit handlers, cancel/close actions and mobile navigation.
- Test direct entry, refresh, browser Back and Forward, and missing/invalid dynamic parameters.
- Specifically test `/go/{productId}` with and without the `u` query parameter. The current fallback without a creator username is `/`.
- Do not mark controls as passed based on source inspection alone.
