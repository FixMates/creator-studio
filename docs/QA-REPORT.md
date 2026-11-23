# Bubbli QA Report — Baseline

Status: **Not release-ready; implementation and verification pending.**

## Baseline source review

| Area | Result | Evidence |
|---|---|---|
| Cloud Function source | Finding | Inactivity suspension export exists; removal and remote decommissioning are separate tasks |
| Product URL import | Gap | Extractors do not fetch metadata |
| Product discovery | Gap | Homepage search filters stores, not products |
| WhatsApp analytics | Gap | Analytics service supports only store views and product clicks |
| Creator type onboarding | Gap | No Maker / Curator / Hybrid field in inspected model |
| Storage | Gap | Storage rules deny all access; images are data URLs |
| Demo catalogue authenticity | Gap | Sample products lack verified marketplace source records |
| Navigation | Partial | A few key flows inspected; full route/control inventory incomplete |

## Automated checks

Not run in this baseline review:
- ESLint
- TypeScript
- Production build
- Unit tests
- Firestore Emulator rules tests
- Playwright / browser E2E
- Responsive visual QA

No pass is claimed for an unrun check.

## Production safety

No production deployment, production data mutation or merge to `main` has been performed as part of this audit.
