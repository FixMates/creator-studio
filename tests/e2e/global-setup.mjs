import {createRequire} from "node:module";

const require = createRequire(
  new URL("../../functions/package.json", import.meta.url),
);
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");

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
  await app.delete();
}
