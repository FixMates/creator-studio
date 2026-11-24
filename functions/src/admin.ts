import {defineSecret} from "firebase-functions/params";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
} from "firebase-admin/firestore";

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const bootstrapUid = defineSecret("BUBBLI_SUPER_ADMIN_UID");
type Role = "super_admin" | "admin" | "moderator" | "support_agent";
type Action =
  | "dashboard"
  | "listUsers"
  | "listStores"
  | "listProducts"
  | "listCategories"
  | "getConfig"
  | "listAudit"
  | "listNotes"
  | "recordLogin"
  | "moderateStore"
  | "moderateProduct"
  | "suspendUser"
  | "restoreUser"
  | "saveNote"
  | "saveCategory"
  | "deleteCategory"
  | "saveConfig"
  | "setRole";

const permissions: Record<Role, Set<string>> = {
  super_admin: new Set(["*"]),
  admin: new Set([
    "read",
    "moderate_store",
    "moderate_product",
    "suspend_user",
    "restore_user",
    "notes",
    "categories",
    "config",
    "audit",
    "login",
  ]),
  moderator: new Set([
    "read",
    "moderate_store",
    "moderate_product",
    "audit",
    "login",
  ]),
  support_agent: new Set(["read", "notes", "audit", "login"]),
};

/** Validates and returns a required bounded request string.
 * @param {Record<string, unknown>} data Callable request object.
 * @param {string} key Field name to validate.
 * @param {number} max Maximum accepted string length.
 * @return {string} Trimmed non-empty string.
 */
function stringField(
  data: Record<string, unknown>,
  key: string,
  max = 160,
): string {
  const value = data[key];
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > max
  ) {
    throw new HttpsError("invalid-argument", `A valid ${key} is required.`);
  }
  return value.trim();
}

/** Validates a callable payload as a non-array object.
 * @param {unknown} value Untrusted callable payload.
 * @return {Record<string, unknown>} Validated object payload.
 */
function objectData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "Request data must be an object.");
  }
  return value as Record<string, unknown>;
}

/** Parses a supported platform administrator role.
 * @param {unknown} value Untrusted role value.
 * @return {Role | null} Supported role or null.
 */
function roleOf(value: unknown): Role | null {
  return value === "super_admin" ||
    value === "admin" ||
    value === "moderator" ||
    value === "support_agent" ?
    value :
    null;
}

/** Maps admin actions to their minimum permission.
 * @param {Action} action Admin action to authorize.
 * @return {string} Permission name.
 */
function permissionFor(action: Action): string {
  if (
    [
      "dashboard",
      "listUsers",
      "listStores",
      "listProducts",
      "listCategories",
      "getConfig",
      "listAudit",
    ].includes(action)
  ) {
    return "read";
  }
  if (action === "recordLogin") return "login";
  if (action === "moderateStore") return "moderate_store";
  if (action === "moderateProduct") return "moderate_product";
  if (action === "suspendUser") return "suspend_user";
  if (action === "restoreUser") return "restore_user";
  if (["saveNote", "listNotes"].includes(action)) return "notes";
  if (["saveCategory", "deleteCategory"].includes(action)) return "categories";
  if (action === "saveConfig") return "config";
  if (action === "setRole") return "roles";
  throw new HttpsError("invalid-argument", "Unknown admin action.");
}

/** Adds an immutable server-generated moderation audit entry.
 * @param {string} actorUid Authenticated actor ID.
 * @param {Role} role Actor's verified role.
 * @param {string} action Audit event name.
 * @param {string} target Target document or user ID.
 * @param {Record<string, unknown>} details Bounded audit event metadata.
 */
async function writeAudit(
  actorUid: string,
  role: Role,
  action: string,
  target: string,
  details: Record<string, unknown> = {},
) {
  await db.collection("adminAuditLogs").add({
    actorUid,
    actorRole: role,
    action,
    target,
    details,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Converts Firestore timestamps into callable-safe ISO strings.
 * @param {unknown} value Value to convert.
 * @return {unknown} JSON-compatible result.
 */
function jsonValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(jsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        jsonValue(item),
      ]),
    );
  }
  return value;
}

/** Returns a Firestore aggregation count for the requested query.
 * @param {string} collectionName Collection to count.
 * @param {Array<[string, FirebaseFirestore.WhereFilterOp, unknown]>} filters
 * Query filters applied before counting.
 */
async function count(
  collectionName: string,
  filters: Array<[string, FirebaseFirestore.WhereFilterOp, unknown]> = [],
) {
  let ref: FirebaseFirestore.Query = db.collection(collectionName);
  for (const [field, operator, value] of filters) {
    ref = ref.where(field, operator, value);
  }
  const result = await ref.count().get();
  return result.data().count;
}

/** Counts all Authentication accounts without a hardcoded dashboard value. */
async function countAuthUsers(): Promise<number> {
  let total = 0;
  let pageToken: string | undefined;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    total += page.users.length;
    pageToken = page.pageToken;
  } while (pageToken);
  return total;
}

/** Loads actual platform counts and recent activity for the admin dashboard. */
async function dashboardMetrics() {
  const [
    registeredUsers,
    activeCreators,
    publishedStores,
    draftStores,
    totalProducts,
    storeVisits,
    productClicks,
    recentEvents,
  ] = await Promise.all([
    countAuthUsers(),
    count("creatorProfiles", [["published", "==", true]]),
    count("creatorProfiles", [["published", "==", true]]),
    count("creatorProfiles", [["published", "==", false]]),
    count("products"),
    count("analyticsEvents", [["type", "==", "store_view"]]),
    count("analyticsEvents", [
      ["type", "in", ["product_click", "external_click", "whatsapp_click"]],
    ]),
    db
      .collection("analyticsEvents")
      .where(
        "createdAt",
        ">=",
        Timestamp.fromMillis(Date.now() - 30 * 86400000),
      )
      .limit(5000)
      .get(),
  ]);
  const activity = new Map<
    string,
    { views: number; clicks: number; registrations: number }
  >();
  for (const event of recentEvents.docs) {
    const data = event.data();
    const createdAt = data.createdAt as Timestamp | undefined;
    if (!createdAt?.toDate) continue;
    const day = createdAt.toDate().toISOString().slice(0, 10);
    const row = activity.get(day) ?? {views: 0, clicks: 0, registrations: 0};
    if (data.type === "store_view") row.views += 1;
    if (
      ["product_click", "external_click", "whatsapp_click"].includes(data.type)
    ) {
      row.clicks += 1;
    }
    activity.set(day, row);
  }
  const registrations = await getAuth().listUsers(1000);
  for (const user of registrations.users) {
    const day = new Date(user.metadata.creationTime).toISOString().slice(0, 10);
    const row = activity.get(day) ?? {views: 0, clicks: 0, registrations: 0};
    row.registrations += 1;
    activity.set(day, row);
  }
  return {
    registeredUsers,
    activeCreators,
    publishedStores,
    draftStores,
    totalProducts,
    storeVisits,
    productClicks,
    activity: [...activity.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({date, ...values})),
    eventWindowCapped: recentEvents.size === 5000,
  };
}

/** Returns creator accounts enriched with Auth and product summary fields.
 * @param {Record<string, unknown>} data Callable request fields.
 */
async function usersPage(data: Record<string, unknown>) {
  const queryText =
    typeof data.query === "string" ? data.query.trim().toLowerCase() : "";
  const token = typeof data.pageToken === "string" ? data.pageToken : undefined;
  const page = await getAuth().listUsers(1000, token);
  const users = await Promise.all(
    page.users.map(async (user) => {
      const [account, profile, products] = await Promise.all([
        db.collection("users").doc(user.uid).get(),
        db.collection("creatorProfiles").doc(user.uid).get(),
        db.collection("products").where("creatorId", "==", user.uid).get(),
      ]);
      const profileData = profile.data() ?? {};
      const accountData = account.data() ?? {};
      return {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? profileData.displayName ?? "",
        username: profileData.username ?? "",
        createdAt: user.metadata.creationTime,
        disabled: user.disabled,
        suspended: accountData.adminSuspended === true,
        platformRole: user.customClaims?.platformRole ?? null,
        storePublished: profileData.published === true,
        productCount: products.size,
      };
    }),
  );
  return {
    items: queryText ?
      users.filter((user) =>
        [user.email, user.displayName, user.username].some((value) =>
          String(value).toLowerCase().includes(queryText),
        ),
      ) :
      users,
    nextPageToken: page.pageToken ?? null,
  };
}

/** Returns storefronts enriched with owner email and product counts.
 * @param {Record<string, unknown>} data Callable request fields.
 */
async function storesPage(data: Record<string, unknown>) {
  const queryText =
    typeof data.query === "string" ? data.query.trim().toLowerCase() : "";
  const snapshot = await db
    .collection("creatorProfiles")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const items = await Promise.all(
    snapshot.docs.map(async (profile) => {
      const values = profile.data();
      const [owner, products] = await Promise.all([
        getAuth()
          .getUser(profile.id)
          .catch(() => null),
        count("products", [["creatorId", "==", profile.id]]),
      ]);
      return {
        uid: profile.id,
        username: values.username ?? "",
        displayName: values.displayName ?? "",
        ownerEmail: owner?.email ?? "",
        createdAt: jsonValue(values.createdAt),
        updatedAt: jsonValue(values.updatedAt),
        published: values.published === true,
        suspended: Boolean(values.suspendedAt),
        suspensionReason: values.suspensionReason ?? "",
        productCount: products,
      };
    }),
  );
  const filtered = queryText ?
    items.filter((item) =>
      [item.username, item.displayName, item.ownerEmail].some((value) =>
        value.toLowerCase().includes(queryText),
      ),
    ) :
    items;
  return {
    items: filtered,
    nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id ?? null,
  };
}

/** Returns products enriched with their owning storefront identity.
 * @param {Record<string, unknown>} data Callable request fields.
 */
async function productsPage(data: Record<string, unknown>) {
  const snapshot = await db
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const items = await Promise.all(
    snapshot.docs.map(async (product) => {
      const values = product.data();
      const owner = await db
        .collection("creatorProfiles")
        .doc(String(values.creatorId))
        .get();
      return {
        id: product.id,
        creatorId: values.creatorId,
        name: values.title ?? "",
        description: values.description ?? "",
        imageURL: values.imageURL ?? "",
        category: values.category ?? "",
        active: values.active === true,
        hidden: values.hiddenFromPublic === true,
        ownerUsername: owner.data()?.username ?? "",
        ownerName: owner.data()?.displayName ?? "",
        moderationReason: values.moderationReason ?? "",
      };
    }),
  );
  const queryText =
    typeof data.query === "string" ? data.query.trim().toLowerCase() : "";
  return {
    items: queryText ?
      items.filter((item) =>
        [item.name, item.category, item.ownerUsername, item.ownerName].some(
          (value) => String(value).toLowerCase().includes(queryText),
        ),
      ) :
      items,
    nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id ?? null,
  };
}

export const claimInitialSuperAdmin = onCall(
  {region: "asia-south1", secrets: [bootstrapUid]},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in with the provisioned administrator account.",
      );
    }
    const allowedUid = bootstrapUid.value().trim();
    if (!allowedUid || request.auth.uid !== allowedUid) {
      throw new HttpsError(
        "permission-denied",
        "This account is not configured for initial admin provisioning.",
      );
    }
    const bootstrapRef = db.collection("adminSystem").doc("bootstrap");
    await db.runTransaction(async (transaction) => {
      const bootstrap = await transaction.get(bootstrapRef);
      const claimedBy = bootstrap.data()?.claimedBy;
      if (claimedBy && claimedBy !== request.auth?.uid) {
        throw new HttpsError(
          "already-exists",
          "A Super Admin is already provisioned.",
        );
      }
      if (!claimedBy) {
        transaction.create(bootstrapRef, {
          claimedBy: request.auth?.uid,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });
    const user = await getAuth().getUser(request.auth.uid);
    const claims = {...user.customClaims, platformRole: "super_admin"};
    await getAuth().setCustomUserClaims(request.auth.uid, claims);
    await bootstrapRef.set(
      {completedAt: FieldValue.serverTimestamp()},
      {merge: true},
    );
    await writeAudit(
      request.auth.uid,
      "super_admin",
      "admin.bootstrap",
      request.auth.uid,
    );
    return {role: "super_admin"};
  },
);

export const adminConsole = onCall({region: "asia-south1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to continue.");
  }
  const data = objectData(request.data);
  const action = data.action as Action;
  const role = roleOf(request.auth.token.platformRole);
  if (!role) {
    throw new HttpsError(
      "permission-denied",
      "This account does not have administrator access.",
    );
  }
  const permission = permissionFor(action);
  if (!permissions[role].has("*") && !permissions[role].has(permission)) {
    throw new HttpsError(
      "permission-denied",
      "Your role cannot perform this action.",
    );
  }

  if (action === "dashboard") return dashboardMetrics();
  if (action === "listUsers") {
    try {
      return await usersPage(data);
    } catch (error) {
      console.error("Admin listUsers action failed", error);
      throw error;
    }
  }
  if (action === "listStores") return storesPage(data);
  if (action === "listProducts") return productsPage(data);
  if (action === "listCategories") {
    const categories = await db
      .collection("platformCategories")
      .orderBy("order", "asc")
      .limit(200)
      .get();
    return {
      items: categories.docs.map((doc) => ({
        id: doc.id,
        ...(jsonValue(doc.data()) as DocumentData),
      })),
    };
  }
  if (action === "getConfig") {
    const config = await db.collection("platformConfig").doc("public").get();
    return {
      config: config.exists ?
        jsonValue(config.data()) :
        {
          platformName: "Bubbli",
          supportEmail: "",
          termsUrl: "/terms",
          privacyUrl: "/privacy",
          maintenanceMode: false,
          announcement: "",
          featureFlags: {},
          limits: {maxProductsPerCreator: 100},
        },
    };
  }
  if (action === "listAudit") {
    const logs = await db
      .collection("adminAuditLogs")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return {
      items: logs.docs.map((doc) => ({
        id: doc.id,
        ...(jsonValue(doc.data()) as DocumentData),
      })),
    };
  }
  if (action === "listNotes") {
    const uid = stringField(data, "uid");
    const notes = await db
      .collection("adminNotes")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return {
      items: notes.docs.map((doc) => ({
        id: doc.id,
        ...(jsonValue(doc.data()) as DocumentData),
      })),
    };
  }
  if (action === "recordLogin") {
    await writeAudit(request.auth.uid, role, "admin.login", request.auth.uid);
    return {ok: true};
  }
  if (action === "suspendUser" || action === "restoreUser") {
    const uid = stringField(data, "uid");
    if (uid === request.auth.uid) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot change your own account status.",
      );
    }
    const userRecord = await getAuth()
      .getUser(uid)
      .catch(() => null);
    if (!userRecord) {
      throw new HttpsError("not-found", "The user account was not found.");
    }
    const accountRef = db.collection("users").doc(uid);
    const account = await accountRef.get();
    const profileRef = db.collection("creatorProfiles").doc(uid);
    const profile = await profileRef.get();
    const privateRef = db.collection("creatorPrivate").doc(uid);
    if (action === "suspendUser") {
      if (account.get("adminSuspended") === true) {
        throw new HttpsError(
          "failed-precondition",
          "This account is already suspended.",
        );
      }
      const reason = stringField(data, "reason", 500);
      if (profile.exists) {
        await privateRef.set(
          {publishedBeforeAccountSuspension: profile.get("published") === true},
          {merge: true},
        );
      }
      await accountRef.set(
        {
          adminSuspended: true,
          adminSuspensionReason: reason,
          adminSuspendedAt: FieldValue.serverTimestamp(),
          adminSuspendedBy: request.auth.uid,
          disabledBeforeAdminSuspension: userRecord.disabled,
        },
        {merge: true},
      );
      if (profile.exists) {
        await profileRef.update({
          published: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      if (!userRecord.disabled) {
        await getAuth().updateUser(uid, {disabled: true});
      }
      await writeAudit(request.auth.uid, role, "user.suspend", uid, {reason});
    } else {
      const accountData = account.data() ?? {};
      if (accountData.adminSuspended !== true) {
        throw new HttpsError(
          "failed-precondition",
          "This account is not suspended by Bubbli moderation.",
        );
      }
      const privateDoc = await privateRef.get();
      const restoreAuthDisabled =
        accountData.disabledBeforeAdminSuspension === true;
      if (userRecord.disabled !== restoreAuthDisabled) {
        await getAuth().updateUser(uid, {disabled: restoreAuthDisabled});
      }
      if (profile.exists) {
        // Account suspension never clears independent storefront moderation.
        // Only restore publication when the store itself is not suspended.
        await profileRef.update({
          published: profile.get("suspendedAt") ? false :
            privateDoc.get("publishedBeforeAccountSuspension") === true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await accountRef.set(
        {
          adminSuspended: false,
          adminSuspensionReason: FieldValue.delete(),
          adminSuspendedAt: FieldValue.delete(),
          adminSuspendedBy: FieldValue.delete(),
        },
        {merge: true},
      );
      await accountRef.update({
        disabledBeforeAdminSuspension: FieldValue.delete(),
      });
      const independentlySuspended = Boolean(profile.get("suspendedAt"));
      if (privateDoc.exists && !independentlySuspended) {
        await privateRef.update({
          publishedBeforeAccountSuspension: FieldValue.delete(),
        });
      }
      await writeAudit(request.auth.uid, role, "user.restore", uid);
    }
    return {ok: true};
  }
  if (action === "moderateStore") {
    const uid = stringField(data, "uid");
    const profileRef = db.collection("creatorProfiles").doc(uid);
    const privateRef = db.collection("creatorPrivate").doc(uid);
    const profile = await profileRef.get();
    if (!profile.exists) {
      throw new HttpsError("not-found", "The storefront was not found.");
    }
    if (data.suspend === true) {
      if (profile.get("suspendedAt")) {
        throw new HttpsError(
          "failed-precondition",
          "This storefront is already suspended.",
        );
      }
      const reason = stringField(data, "reason", 500);
      await privateRef.set(
        {publishedBeforeModeration: profile.get("published") === true},
        {merge: true},
      );
      await profileRef.update({
        published: false,
        suspendedAt: FieldValue.serverTimestamp(),
        suspensionReason: reason,
        suspendedBy: request.auth.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await writeAudit(request.auth.uid, role, "store.suspend", uid, {
        reason,
      });
    } else {
      if (!profile.get("suspendedAt")) {
        throw new HttpsError(
          "failed-precondition",
          "This storefront is not suspended.",
        );
      }
      const privateDoc = await privateRef.get();
      const account = await db.collection("users").doc(uid).get();
      const accountPublicationState = privateDoc.get(
        "publishedBeforeAccountSuspension",
      );
      const wasPublishedBeforeAccountSuspension =
        typeof accountPublicationState === "boolean" ?
          accountPublicationState :
          privateDoc.get("publishedBeforeModeration") === true;
      await profileRef.update({
        published: account.get("adminSuspended") === true ? false :
          wasPublishedBeforeAccountSuspension,
        suspendedAt: FieldValue.delete(),
        suspensionReason: FieldValue.delete(),
        suspendedBy: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await privateRef.update({
        publishedBeforeModeration: FieldValue.delete(),
        publishedBeforeAccountSuspension: FieldValue.delete(),
      });
      await writeAudit(request.auth.uid, role, "store.restore", uid);
    }
    return {ok: true};
  }
  if (action === "moderateProduct") {
    const productId = stringField(data, "productId");
    const productRef = db.collection("products").doc(productId);
    const product = await productRef.get();
    if (!product.exists) {
      throw new HttpsError("not-found", "The product was not found.");
    }
    if (data.hide === true) {
      const reason = stringField(data, "reason", 500);
      await productRef.update({
        hiddenFromPublic: true,
        moderationReason: reason,
        moderatedBy: request.auth.uid,
        moderatedAt: FieldValue.serverTimestamp(),
      });
      await writeAudit(request.auth.uid, role, "product.hide", productId, {
        reason,
        creatorId: product.get("creatorId"),
      });
    } else {
      await productRef.update({
        hiddenFromPublic: FieldValue.delete(),
        moderationReason: FieldValue.delete(),
        moderatedBy: FieldValue.delete(),
        moderatedAt: FieldValue.delete(),
      });
      await writeAudit(request.auth.uid, role, "product.restore", productId, {
        creatorId: product.get("creatorId"),
      });
    }
    return {ok: true};
  }
  if (action === "saveNote") {
    const uid = stringField(data, "uid");
    const note = stringField(data, "note", 2000);
    const ref = await db
      .collection("adminNotes")
      .add({
        uid,
        note,
        actorUid: request.auth.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    await writeAudit(request.auth.uid, role, "user.note.add", uid, {
      noteId: ref.id,
    });
    return {ok: true};
  }
  if (action === "saveCategory") {
    const id = stringField(data, "id")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const name = stringField(data, "name", 80);
    const imageURL =
      typeof data.imageURL === "string" ? data.imageURL.trim() : "";
    const remoteImage = /^https:\/\//i.test(imageURL);
    const uploadedImage =
      /^data:image\/(webp|png|jpeg);base64,[a-z0-9+/=]+$/i.test(imageURL);
    if (
      imageURL &&
      ((!remoteImage && !uploadedImage) || imageURL.length > 500000)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Choose an HTTPS image or compressed image under 500 KB.",
      );
    }
    const order = Number.isInteger(data.order) ? (data.order as number) : 0;
    await db
      .collection("platformCategories")
      .doc(id)
      .set(
        {
          name,
          imageURL,
          active: data.active !== false,
          order,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    await writeAudit(request.auth.uid, role, "category.save", id, {name});
    return {ok: true};
  }
  if (action === "deleteCategory") {
    const id = stringField(data, "id");
    await db
      .collection("platformCategories")
      .doc(id)
      .update({active: false, updatedAt: FieldValue.serverTimestamp()});
    await writeAudit(request.auth.uid, role, "category.deactivate", id);
    return {ok: true};
  }
  if (action === "saveConfig") {
    const config = objectData(data.config);
    const allowedKeys = [
      "platformName",
      "supportEmail",
      "termsUrl",
      "privacyUrl",
      "announcement",
      "maintenanceMode",
      "featureFlags",
      "limits",
    ];
    if (Object.keys(config).some((key) => !allowedKeys.includes(key))) {
      throw new HttpsError(
        "invalid-argument",
        "Configuration contains an unsupported field.",
      );
    }
    if (
      typeof config.platformName !== "string" ||
      config.platformName.length > 80
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Platform name is required and must be 80 characters or fewer.",
      );
    }
    if (
      typeof config.supportEmail !== "string" ||
      (config.supportEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail))
    ) {
      throw new HttpsError("invalid-argument", "Enter a valid support email.");
    }
    for (const key of ["termsUrl", "privacyUrl"]) {
      const value = config[key];
      if (
        typeof value !== "string" ||
        value.length > 2048 ||
        (value && !/^(\/|https:\/\/)/i.test(value))
      ) {
        throw new HttpsError(
          "invalid-argument",
          `${key} must be a local path or HTTPS URL.`,
        );
      }
    }
    if (
      typeof config.announcement !== "string" ||
      config.announcement.length > 500
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Announcement must be 500 characters or fewer.",
      );
    }
    if (typeof config.maintenanceMode !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "Maintenance mode must be a boolean.",
      );
    }
    const featureFlags =
      config.featureFlags &&
      typeof config.featureFlags === "object" &&
      !Array.isArray(config.featureFlags) ?
        config.featureFlags :
        {};
    const limits =
      config.limits &&
      typeof config.limits === "object" &&
      !Array.isArray(config.limits) ?
        config.limits :
        {};
    const featureFlagValues = Object.values(featureFlags);
    if (featureFlagValues.some((value) => typeof value !== "boolean")) {
      throw new HttpsError(
        "invalid-argument",
        "Feature flags must use boolean values.",
      );
    }
    if (
      Object.values(limits).some(
        (value) =>
          !Number.isInteger(value) ||
          Number(value) < 1 ||
          Number(value) > 10000,
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Platform limits must be integers between 1 and 10,000.",
      );
    }
    await db
      .collection("platformConfig")
      .doc("public")
      .set(
        {
          ...config,
          featureFlags,
          limits,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    await writeAudit(request.auth.uid, role, "config.save", "public", {
      fields: Object.keys(config),
    });
    return {ok: true};
  }
  if (action === "setRole") {
    if (role !== "super_admin") {
      throw new HttpsError(
        "permission-denied",
        "Only a Super Admin can manage administrator roles.",
      );
    }
    const uid = stringField(data, "uid");
    const nextRole = data.role === null ? null : roleOf(data.role);
    if (data.role !== null && !nextRole) {
      throw new HttpsError(
        "invalid-argument",
        "Select a valid administrator role.",
      );
    }
    if (uid === request.auth.uid) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot change your own administrator role.",
      );
    }
    const user = await getAuth().getUser(uid);
    const claims = {...user.customClaims};
    if (nextRole) claims.platformRole = nextRole;
    else delete claims.platformRole;
    await getAuth().setCustomUserClaims(uid, claims);
    await writeAudit(request.auth.uid, role, "admin.role.set", uid, {
      role: nextRole,
    });
    return {ok: true};
  }
  throw new HttpsError("invalid-argument", "Unknown admin action.");
});
