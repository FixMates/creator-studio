# Bubbli Navigation Audit

Status: **Route inventory complete; control and browser verification pending.**  
Branch: `feat/bubbli-product-enhancements`

## Route inventory

| Route | Purpose / expected entry | Key expected exit or parent | Status |
|---|---|---|---|
| `/` | Homepage | Login, onboarding, demo preview, public store | Source inspected; browser untested |
| `/login` | Sign in | Signup, dashboard after auth, homepage | Browser untested |
| `/signup` | Create account | Login / onboarding | Browser untested |
| `/onboarding` | New creator setup | Previous step, dashboard after publish | Browser untested |
| `/[username]` | Public creator storefront | Product redirect, share, homepage | Source inspected; browser untested |
| `/preview/[storeId]` | Showcase demo store | Homepage / demo discovery | Browser untested |
| `/go/[productId]` | Product redirect/detail | Creator store via `u` query or homepage fallback | Source inspected; browser untested |
| `/dashboard` | Creator dashboard | Dashboard sections, public store, logout | Browser untested |
| `/dashboard/products` | Product listing | Add/edit product, dashboard | Browser untested |
| `/dashboard/products/new` | Add product | Product listing on save/cancel/back | Source inspected; browser untested |
| `/dashboard/products/[productId]/edit` | Edit product | Product listing on save/cancel/back | Browser untested |
| `/dashboard/store` | Store editor | Dashboard / public store | Browser untested |
| `/dashboard/analytics` | Analytics | Dashboard | Browser untested |
| `/dashboard/leads` | Leads | Dashboard | Browser untested |
| `/dashboard/collections` | Collections | Dashboard / collection editor where present | Browser untested |
| `/dashboard/settings` | Settings | Dashboard | Browser untested |
| `/about` | About page | Homepage | Browser untested |
| `/contact` | Contact page | Homepage | Browser untested |
| `/affiliate-disclosure` | Affiliate disclosure | Homepage | Browser untested |
| `/privacy` | Privacy policy | Homepage | Browser untested |
| `/terms` | Terms | Homepage | Browser untested |
| `/not-found` | Branded not-found UI | Homepage | Browser untested |

## Controls inspected from source

| Route / component | Control | Expected destination/action | Source observation | Status |
|---|---|---|---|---|
| Homepage | Login | `/login` | Header link exists | Source observed; browser untested |
| Homepage | Create store | `/onboarding` | Header/hero CTA exists | Source observed; browser untested |
| Homepage | Demo store card | `/preview/{storeId}` | Showcase IDs route to preview | Source observed; browser untested |
| Onboarding | Back | Previous local step | Multi-step state exists; all transitions not yet checked | Pending |
| Product editor | Back / Cancel | `/dashboard/products` | Explicit links exist | Source observed; browser untested |
| Product editor | Save | `/dashboard/products` | Router push after save | Source observed; browser untested |
| Storefront | Product action | `/go/{productId}?u={username}` | Product card links to redirect route | Source observed; browser untested |
| Storefront | WhatsApp | Configured creator WhatsApp URL | Link exists; click analytics now added | Browser untested |
| Product redirect | Back to store | `/{username}` | Uses validated `u` query; falls back to `/` | Source observed; browser untested |
| Storefront | Share | Native share or copy fallback | Share/copy helper exists | Source observed; browser untested |

## Required regression tests still open

- Inspect every Link, anchor, `router.push/replace/back`, `window.location`, `window.open`, form submit, modal close, cancel action and mobile navigation.
- Test direct entry, refresh, browser Back and Forward for all dynamic routes.
- Test `/go/{productId}` with missing, malformed and valid `u` values.
- Verify no customer flow sends a user to an unexpected external page when using Back.
- Verify reserved usernames do not shadow static routes.
- Run Playwright at 320, 375, 390, 430, 768, 1024 and 1440 px.
- Do not mark controls as passed based on source inspection alone.
