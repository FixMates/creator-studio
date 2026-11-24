import {createRequire} from "node:module";

const require = createRequire(
  new URL("../../functions/package.json", import.meta.url),
);
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {FieldValue, getFirestore} = require("firebase-admin/firestore");

export default async function globalSetup() {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("E2E setup requires the Firebase Auth Emulator.");
  }
  const app = initializeApp({projectId: "demo-bubbli-e2e"}, "bubbli-e2e-seed");
  const auth = getAuth(app);
  const adminUid = "e2e-admin";
  try {
    await auth.getUser(adminUid);
  } catch {
    await auth.createUser({
      uid: adminUid,
      email: "e2e-admin@bubbli.test",
      password: "EmulatorOnly-2468",
      displayName: "E2E Administrator",
    });
  }
  await auth.setCustomUserClaims(adminUid, {platformRole: "super_admin"});
  const db = getFirestore(app);
  const regressionAccounts = [
    {uid: "e2e-suspend-published", published: true, disabled: false},
    {
      uid: "e2e-suspend-independent-store",
      published: false,
      disabled: false,
      independentlySuspended: true,
    },
    {uid: "e2e-suspend-unpublished", published: false, disabled: false},
    {uid: "e2e-suspend-disabled-auth", published: true, disabled: true},
  ];
  for (const account of regressionAccounts) {
    const email = `${account.uid}@bubbli.test`;
    try {
      await auth.getUser(account.uid);
      await auth.updateUser(account.uid, {
        email,
        password: "EmulatorOnly-2468",
        displayName: account.uid,
        disabled: account.disabled,
      });
    } catch {
      await auth.createUser({
        uid: account.uid,
        email,
        password: "EmulatorOnly-2468",
        displayName: account.uid,
        disabled: account.disabled,
      });
    }
    await db.collection("users").doc(account.uid).set({
      uid: account.uid,
      email,
      adminSuspended: false,
    });
    const profile = {
      uid: account.uid,
      username: account.uid,
      displayName: account.uid,
      bio: "Suspension regression fixture",
      photoURL: "",
      category: "Lifestyle",
      socialLinks: {},
      theme: "ananya",
      published: account.published,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (account.independentlySuspended) {
      profile.suspendedAt = FieldValue.serverTimestamp();
      profile.suspensionReason = "Independent storefront moderation reason";
      profile.suspendedBy = adminUid;
    }
    await db.collection("creatorProfiles").doc(account.uid).set(profile);
    const privateData = {};
    if (account.independentlySuspended) {
      privateData.publishedBeforeModeration = true;
    }
    await db.collection("creatorPrivate").doc(account.uid).set(privateData);
  }
  await app.delete();
}
