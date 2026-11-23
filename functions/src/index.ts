import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();
const REGION = "asia-south1";

setGlobalOptions({maxInstances: 10, region: REGION});

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
