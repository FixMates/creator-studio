import {createRequire} from "node:module";
import {expect, test, type Page} from "@playwright/test";

const require = createRequire(
  `${process.cwd()}/functions/package.json`,
);
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const adminApp = initializeApp(
  {projectId: "demo-bubbli-e2e"},
  "bubbli-suspension-regression",
);
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

test("user suspension preserves account and independent store state", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signInAsAdmin(page);

  const publishedUid = "e2e-suspend-published";
  await suspendAccount(page, publishedUid);
  await expectAccountState(publishedUid, {
    disabled: true,
    published: false,
    adminSuspended: true,
  });
  const suspendAudit = await adminDb
    .collection("adminAuditLogs")
    .where("target", "==", publishedUid)
    .where("action", "==", "user.suspend")
    .get();
  expect(suspendAudit.size).toBe(1);
  expect(suspendAudit.docs[0].get("details.reason")).toBe(
    "Regression test account suspension",
  );

  await restoreAccount(page, publishedUid);
  await expectAccountState(publishedUid, {
    disabled: false,
    published: true,
    adminSuspended: false,
  });
  const restoreAudit = await adminDb
    .collection("adminAuditLogs")
    .where("target", "==", publishedUid)
    .where("action", "==", "user.restore")
    .get();
  expect(restoreAudit.size).toBe(1);
  expect(suspendAudit.docs[0].exists).toBe(true);

  const independentlySuspendedUid = "e2e-suspend-independent-store";
  await suspendAccount(page, independentlySuspendedUid);
  await expectAccountState(independentlySuspendedUid, {
    disabled: true,
    published: false,
    adminSuspended: true,
  });
  const profileBeforeRestore = await adminDb
    .collection("creatorProfiles")
    .doc(independentlySuspendedUid)
    .get();
  const independentSuspensionTime = profileBeforeRestore.get("suspendedAt");
  expect(profileBeforeRestore.get("suspensionReason")).toBe(
    "Independent storefront moderation reason",
  );

  await restoreAccount(page, independentlySuspendedUid);
  await expectAccountState(independentlySuspendedUid, {
    disabled: false,
    published: false,
    adminSuspended: false,
  });
  const profileAfterRestore = await adminDb
    .collection("creatorProfiles")
    .doc(independentlySuspendedUid)
    .get();
  expect(profileAfterRestore.get("suspendedAt").toMillis()).toBe(
    independentSuspensionTime.toMillis(),
  );
  expect(profileAfterRestore.get("suspensionReason")).toBe(
    "Independent storefront moderation reason",
  );
  await page.getByRole("button", {name: "Stores"}).click();
  await page.getByLabel("Search stores").fill(independentlySuspendedUid);
  await page.getByRole("button", {name: "Search"}).click();
  const storeRow = page
    .locator("article")
    .filter({hasText: independentlySuspendedUid});
  await expect(storeRow).toBeVisible();
  await storeRow.getByRole("button", {name: "Restore"}).click();
  await expect(storeRow.getByText("Available")).toBeVisible();
  await expectAccountState(independentlySuspendedUid, {
    disabled: false,
    published: false,
    adminSuspended: false,
  });
  await page.getByRole("button", {name: "Users"}).click();

  const unpublishedUid = "e2e-suspend-unpublished";
  await suspendAccount(page, unpublishedUid);
  await expectAccountState(unpublishedUid, {
    disabled: true,
    published: false,
    adminSuspended: true,
  });
  await restoreAccount(page, unpublishedUid);
  await expectAccountState(unpublishedUid, {
    disabled: false,
    published: false,
    adminSuspended: false,
  });

  const disabledUid = "e2e-suspend-disabled-auth";
  await suspendAccount(page, disabledUid);
  await expectAccountState(disabledUid, {
    disabled: true,
    published: false,
    adminSuspended: true,
  });
  await restoreAccount(page, disabledUid);
  await expectAccountState(disabledUid, {
    disabled: true,
    published: true,
    adminSuspended: false,
  });
});

async function signInAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("e2e-admin@bubbli.test");
  await page.getByLabel("Password").fill("EmulatorOnly-2468");
  await page.getByRole("button", {name: "Sign in"}).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", {name: "Users"}).click();
}

async function suspendAccount(page: Page, uid: string) {
  const row = await searchAccount(page, uid);
  page.once("dialog", (dialog) =>
    dialog.accept("Regression test account suspension"),
  );
  await row.getByRole("button", {name: "Suspend"}).click();
  await expect(row.getByRole("button", {name: "Restore"})).toBeVisible();
}

async function restoreAccount(page: Page, uid: string) {
  const row = await searchAccount(page, uid);
  await row.getByRole("button", {name: "Restore"}).click();
  await expect(row.getByRole("button", {name: "Suspend"})).toBeVisible();
}

async function searchAccount(page: Page, uid: string) {
  const email = `${uid}@bubbli.test`;
  await page.getByLabel("Search users").fill(email);
  await page.getByRole("button", {name: "Search"}).click();
  const row = page.locator("article").filter({hasText: email});
  await expect(row).toBeVisible();
  return row;
}

async function expectAccountState(
  uid: string,
  state: {disabled: boolean; published: boolean; adminSuspended: boolean},
) {
  const [authUser, profile, account] = await Promise.all([
    adminAuth.getUser(uid),
    adminDb.collection("creatorProfiles").doc(uid).get(),
    adminDb.collection("users").doc(uid).get(),
  ]);
  expect(authUser.disabled).toBe(state.disabled);
  expect(profile.get("published")).toBe(state.published);
  expect(account.get("adminSuspended")).toBe(state.adminSuspended);
}
