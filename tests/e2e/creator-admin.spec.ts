import {expect, test} from "@playwright/test";

const creatorName = "Playwright Creator";
const creatorEmail = "creator-flow@bubbli.test";
const creatorPassword = "CreatorOnly-2468";
const creatorUsername = `bubbli${Date.now().toString().slice(-6)}`;

test.describe.configure({mode: "serial"});

test("creator can onboard, add a product, publish and visit the public store", async ({page}) => {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(creatorName);
  await page.getByLabel("Email address").fill(creatorEmail);
  await page.getByLabel("Password").fill(creatorPassword);
  await page.getByRole("button", {name: "Create your account"}).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("Display name").fill(creatorName);
  await page.getByLabel("Your username").fill(creatorUsername);
  await page.getByRole("button", {name: "Continue"}).click();
  await page.getByRole("button", {name: "Food & Beverages"}).click();
  await page.getByRole("button", {name: "Continue"}).click();
  await page.getByRole("button", {name: "Continue"}).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Create store draft"}).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/products/new");
  await page.getByLabel("Product name *").fill("Emulator Garden Tea");
  await page.getByLabel("Product category").fill("Tea & Pantry");
  await page.locator("select").first().selectOption("internal");
  await page.getByLabel("Why you recommend it").fill("A test product in the isolated Firebase emulator.");
  await page.getByRole("button", {name: "Save product"}).click();
  await expect(page).toHaveURL(/\/dashboard\/products$/);

  await page.goto("/dashboard/store");
  await expect(page.getByText("Status: Draft")).toBeVisible();
  await page.getByRole("button", {name: "Publish store"}).click();
  await expect(page.getByText("Status: Published")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(`/${creatorUsername}`);

  await page.goto(`/${creatorUsername}`);
  await expect(page.getByRole("heading", {name: creatorName, exact: true})).toBeVisible();
  await expect(page.getByText("Emulator Garden Tea")).toBeVisible();
  await page.getByRole("link", {name: "View details"}).click();
  await expect(page).toHaveURL(/\/go\//);
  await expect(page.getByRole("heading", {name: "Emulator Garden Tea", exact: true})).toBeVisible();
});

test("admin can search creators, moderate a storefront, restore it and review audit logs", async ({page}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("e2e-admin@bubbli.test");
  await page.getByLabel("Password").fill("EmulatorOnly-2468");
  await page.getByRole("button", {name: "Sign in"}).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", {name: "Admin console"})).toBeVisible();

  await page.getByRole("button", {name: "Users"}).click();
  await page.getByLabel("Search users").fill(creatorUsername);
  await page.getByRole("button", {name: "Search"}).click();
  await expect(page.getByText(`@${creatorUsername}`)).toBeVisible();

  await page.getByRole("button", {name: "Stores"}).click();
  await page.getByLabel("Search stores").fill(creatorUsername);
  await page.getByRole("button", {name: "Search"}).click();
  await expect(page.getByText(`@${creatorUsername}`)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("Automated moderation verification"));
  await page.getByRole("button", {name: "Suspend store"}).click();
  await expect(page.getByText(/Suspended: Automated moderation verification/)).toBeVisible();
  await page.getByRole("button", {name: "Restore"}).click();
  await expect(page.getByText("Available")).toBeVisible();

  await page.getByRole("button", {name: "Audit log"}).click();
  await expect(page.getByText("store.suspend")).toBeVisible();
  await expect(page.getByText("store.restore")).toBeVisible();
});

test("non-admin users cannot open admin operations", async ({page}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(creatorEmail);
  await page.getByLabel("Password").fill(creatorPassword);
  await page.getByRole("button", {name: "Sign in"}).click();
  await page.goto("/admin");
  await expect(page.getByRole("heading", {name: "Administrator access required"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Provision initial Super Admin"})).toBeVisible();
});
