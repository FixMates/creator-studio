import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

export {adminConsole, claimInitialSuperAdmin} from "./admin";

const db = getFirestore();
const REGION = "asia-south1";
setGlobalOptions({maxInstances: 10, region: REGION});

/** Publish or unpublish the authenticated creator's existing storefront. */
export const setStorePublication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to manage your store.");
  }
  if (typeof request.data?.published !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "Choose whether to publish your store.",
    );
  }
  const uid = request.auth.uid;
  const profileRef = db.collection("creatorProfiles").doc(uid);
  const accountRef = db.collection("users").doc(uid);
  const [profile, account] = await Promise.all([
    profileRef.get(),
    accountRef.get(),
  ]);
  if (!profile.exists) {
    throw new HttpsError("failed-precondition", "Finish store setup first.");
  }
  if (account.get("adminSuspended") === true) {
    throw new HttpsError("permission-denied", "This account is suspended.");
  }
  if (profile.get("suspendedAt")) {
    throw new HttpsError(
      "permission-denied",
      "Contact Bubbli support to request storefront reactivation.",
    );
  }
  const publish = request.data.published as boolean;
  if (publish) {
    const username = profile.get("username");
    const displayName = profile.get("displayName");
    if (
      typeof username !== "string" ||
      !/^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/.test(username)
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Choose a valid public username before publishing.",
      );
    }
    if (typeof displayName !== "string" || !displayName.trim()) {
      throw new HttpsError(
        "failed-precondition",
        "Add a store name before publishing.",
      );
    }
    const products = await db.collection("products")
      .where("creatorId", "==", uid)
      .where("active", "==", true)
      .limit(1)
      .get();
    if (products.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Add an active product before publishing.",
      );
    }
  }
  await profileRef.update({
    published: publish,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return {
    published: publish,
    url: publish ? `/${profile.get("username")}` : null,
  };
});

/**
 * Update the creator's private last recorded storefront-view timestamp.
 * The Firestore rules restrict event creation to published profiles and
 * require the event username to match the profile username.
 */
export const recordCreatorStoreView = onDocumentCreated(
  {document: "analyticsEvents/{eventId}", region: REGION},
  async (event) => {
    const data = event.data?.data();
    if (
      !data ||
      data.type !== "store_view" ||
      typeof data.creatorId !== "string" ||
      typeof data.username !== "string"
    ) {
      return;
    }
    const profileRef = db.collection("creatorProfiles").doc(data.creatorId);
    const profile = await profileRef.get();
    if (
      !profile.exists ||
      profile.get("published") !== true ||
      profile.get("username") !== data.username
    ) {
      return;
    }
    await db.collection("creatorPrivate").doc(data.creatorId).set({
      lastStoreViewAt: event.data?.createTime ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
  },
);
