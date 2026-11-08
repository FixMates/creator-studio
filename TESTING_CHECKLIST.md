# CreatorStore End-to-End Verification Checklist

## Authentication
- [ ] Email signup creates a Firebase Auth user.
- [ ] Google signup/signin works.
- [ ] Sign out clears the current account.
- [ ] Switching accounts does not retain the previous account's dashboard identity or products.

## Onboarding
- [ ] Username availability is checked.
- [ ] Username is reserved in `usernames/{username}`.
- [ ] Creator profile is created in `creatorProfiles/{uid}`.
- [ ] User account is marked `onboardingCompleted`.
- [ ] Published storefront opens at `/{username}`.

## Product management
- [ ] Signed-in creator can create a product.
- [ ] Creator can only list their own products in the dashboard.
- [ ] Creator can edit, feature, reorder and delete their own products.
- [ ] Another creator's products never appear in the dashboard.
- [ ] Active products appear on the matching public storefront.

## Collections
- [ ] Creator can create, edit and delete collections.
- [ ] Dashboard only returns collections owned by the signed-in creator.
- [ ] Public storefront only shows collections belonging to that creator.

## Public storefront
- [ ] Published creator profile resolves by username.
- [ ] Public product query filters by creator and active status.
- [ ] Product cards link through the product redirect route.
- [ ] Unpublished/inactive products are not exposed publicly.

## Firebase deployment
- [ ] Deploy Firestore rules after every rules change:
  `firebase deploy --only firestore:rules`
- [ ] Confirm the correct Firebase project is selected with `firebase use`.
- [ ] Verify Email/Password and Google providers in Firebase Authentication.
- [ ] Verify Firestore database exists in the configured Firebase project.

## Final regression test
Test with two separate accounts (A and B):
1. Sign in as A and create product A.
2. Confirm A's dashboard shows only A's product.
3. Open A's public storefront and confirm A's product is visible.
4. Sign out.
5. Sign in as B and confirm A's product is not in B's dashboard.
6. Create product B.
7. Confirm B's storefront shows only B's product.
