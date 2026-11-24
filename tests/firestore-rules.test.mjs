import {readFileSync} from "node:fs";
import {after, before, test} from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const projectId = "demo-bubbli-rules";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {rules: readFileSync("firestore.rules", "utf8")},
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/creator-a"), {uid: "creator-a", adminSuspended: false});
    await setDoc(doc(db, "creatorProfiles/creator-a"), {
      uid: "creator-a",
      username: "creatora",
      displayName: "Creator A",
      bio: "A creator store",
      photoURL: "",
      category: "Lifestyle",
      socialLinks: {},
      theme: "ananya",
      published: true,
    });
    await setDoc(doc(db, "products/public-product"), product("creator-a", true));
    await setDoc(doc(db, "products/draft-product"), product("creator-a", false));
    await setDoc(doc(db, "products/moderated-product"), {
      ...product("creator-a", true),
      hiddenFromPublic: true,
    });
    await setDoc(doc(db, "platformCategories/visible"), {
      name: "Visible",
      active: true,
      order: 0,
    });
    await setDoc(doc(db, "platformCategories/inactive"), {
      name: "Inactive",
      active: false,
      order: 1,
    });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test("public visibility and owner/admin restrictions are enforced", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const creatorDb = testEnv.authenticatedContext("creator-a").firestore();
  const otherCreatorDb = testEnv.authenticatedContext("creator-b").firestore();
  const claimedAdminDb = testEnv.authenticatedContext("admin-a", {
    platformRole: "super_admin",
  }).firestore();

  await assertSucceeds(getDoc(doc(publicDb, "creatorProfiles/creator-a")));
  await assertSucceeds(getDoc(doc(publicDb, "products/public-product")));
  await assertFails(getDoc(doc(publicDb, "products/draft-product")));
  await assertFails(getDoc(doc(publicDb, "products/moderated-product")));

  await assertSucceeds(getDoc(doc(creatorDb, "products/draft-product")));
  await assertFails(getDoc(doc(otherCreatorDb, "products/draft-product")));
  await assertFails(
    setDoc(doc(otherCreatorDb, "products/cross-owner-write"), product("creator-a", true)),
  );
  await assertSucceeds(
    setDoc(
      doc(creatorDb, "products/creator-owned"),
      product("creator-a", true, "creator-owned"),
    ),
  );
  await assertFails(
    updateDoc(doc(creatorDb, "creatorProfiles/creator-a"), {published: false}),
  );

  await assertFails(getDoc(doc(claimedAdminDb, "adminAuditLogs/anything")));
  await assertFails(
    setDoc(doc(claimedAdminDb, "adminAuditLogs/forged"), {action: "forged"}),
  );
  await assertSucceeds(getDoc(doc(publicDb, "platformCategories/visible")));
  await assertFails(getDoc(doc(publicDb, "platformCategories/inactive")));
});

test("suspended users and maintenance mode cannot write creator data", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/suspended-creator"), {
      uid: "suspended-creator",
      adminSuspended: true,
    });
    await setDoc(doc(db, "creatorProfiles/suspended-creator"), {
      uid: "suspended-creator",
      username: "suspendedcreator",
      displayName: "Suspended Creator",
      bio: "",
      photoURL: "",
      category: "Lifestyle",
      socialLinks: {},
      theme: "ananya",
      published: true,
    });
  });

  const suspendedDb = testEnv.authenticatedContext("suspended-creator").firestore();
  await assertFails(
    setDoc(doc(suspendedDb, "products/suspended-write"), product("suspended-creator", true)),
  );

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "platformConfig/public"), {
      maintenanceMode: true,
    });
  });
  const creatorDb = testEnv.authenticatedContext("creator-a").firestore();
  const publicDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(publicDb, "creatorProfiles/creator-a")));
  await assertFails(
    setDoc(doc(creatorDb, "products/maintenance-write"), product("creator-a", true)),
  );
});

function product(creatorId, active, id = "test-product") {
  return {
    id,
    creatorId,
    title: "Test product",
    description: "A product used only by emulator rule tests.",
    imageURL: "",
    destinationURL: "https://example.com/item",
    displayPrice: "₹100",
    currency: "INR",
    redirectType: "website",
    source: "Example",
    sourceDomain: "example.com",
    reviewURL: "",
    reviewType: "",
    recommendation: "Recommended for testing.",
    featured: false,
    active,
    availability: active ? "active" : "deactivated",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
