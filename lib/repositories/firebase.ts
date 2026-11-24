"use client";

import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch,
  type DocumentData, type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { isValidUsername, normalizeUsername } from "@/lib/services/url";
import type { AnalyticsRepository, CollectionRepository, CreatorRepository, ProductRepository, LeadRepository } from "@/lib/repositories/contracts";
import type { AnalyticsDay, AnalyticsProduct, AnalyticsSource, Creator, CreatorAccount, StoreCollection, StoreProduct, CreatorLead } from "@/types/store";

function requireDb() { if (!db) throw new Error("Firebase is not configured. Add the required Firebase web app environment variables."); return db; }
function requireOwner(uid: string) { const user = auth?.currentUser; if (!user || user.uid !== uid) throw new Error("Sign in to manage Bubbli."); return user; }
function urlHost(value: string) { try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return ""; } }
function profileFromDoc(data: DocumentData): Creator {
  return { id: String(data.uid), username: String(data.username), displayName: String(data.displayName), bio: String(data.bio ?? ""), avatarUrl: typeof data.photoURL === "string" ? data.photoURL : "", category: data.category, socialLinks: data.socialLinks ?? {}, theme: (["ananya","meera","sundar","minimal","bold","lifestyle"].includes(data.theme) ? data.theme : "ananya") as Creator["theme"], published: data.published === true, suspendedAt: data.suspendedAt, suspensionReason: typeof data.suspensionReason === "string" ? data.suspensionReason : undefined, lastStoreViewAt: data.lastStoreViewAt };
}
function productFromDoc(snap: QueryDocumentSnapshot<DocumentData>, collectionIds: string[]): StoreProduct {
  const data = snap.data();
  return { id: snap.id, creatorId: String(data.creatorId), name: String(data.title), description: String(data.description ?? ""), imageUrl: String(data.imageURL ?? ""), destinationUrl: String(data.destinationURL), redirectType: data.redirectType, price: typeof data.displayPrice === "string" ? data.displayPrice : undefined, currency: typeof data.currency === "string" ? data.currency : "INR", source: String(data.source ?? ""), recommendation: String(data.recommendation ?? ""), reviewUrl: typeof data.reviewURL === "string" ? data.reviewURL : undefined, reviewType: data.reviewType, featured: data.featured === true, active: data.active !== false, availability: data.availability ?? (data.active === false ? "deactivated" : "active"), clicks: 0, collectionIds, order: Number(data.sortOrder ?? 0) };
}
function collectionFromDoc(snap: QueryDocumentSnapshot<DocumentData>): StoreCollection {
  const data = snap.data();
  return { id: snap.id, creatorId: String(data.creatorId), title: String(data.name), description: String(data.description ?? ""), imageUrl: typeof data.imageURL === "string" ? data.imageURL : undefined, productIds: Array.isArray(data.productIds) ? data.productIds : [], order: Number(data.sortOrder ?? 0) };
}

export const firebaseCreatorRepository: CreatorRepository = {
  async get(username) {
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) return null;
    const store = requireDb();
    const alias = await getDoc(doc(store, "usernames", normalized));
    const redirectTo = alias.exists() && typeof alias.data().redirectTo === "string"
      ? normalizeUsername(alias.data().redirectTo)
      : "";
    const lookupUsername = redirectTo && isValidUsername(redirectTo) ? redirectTo : normalized;
    const results = await getDocs(query(collection(store, "creatorProfiles"), where("username", "==", lookupUsername), where("published", "==", true), limit(1)));
    return results.empty ? null : profileFromDoc(results.docs[0].data());
  },
  async getForUser(uid) {
    if (auth?.currentUser?.uid !== uid) throw new Error("You can only view your own creator profile.");
    const snap = await getDoc(doc(requireDb(), "creatorProfiles", uid));
    return snap.exists() ? profileFromDoc(snap.data()) : null;
  },
  async getAccount(uid) {
    if (auth?.currentUser?.uid !== uid) throw new Error("You can only view your own account.");
    const snap = await getDoc(doc(requireDb(), "users", uid));
    return snap.exists() ? snap.data() as CreatorAccount : null;
  },
  async isUsernameAvailable(username, uid) {
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) return false;
    const snap = await getDoc(doc(requireDb(), "usernames", normalized));
    return !snap.exists() || (Boolean(uid) && snap.data().uid === uid);
  },
  async completeOnboarding(uid, email, creator, termsVersion) {
    const user = requireOwner(uid);
    const normalized = normalizeUsername(creator.username);
    if (!isValidUsername(normalized) || normalized !== creator.username) throw new Error("Choose a valid lowercase store username.");
    const store = requireDb();
    const usernameRef = doc(store, "usernames", normalized);
    const profileRef = doc(store, "creatorProfiles", uid);
    const userRef = doc(store, "users", uid);
    await runTransaction(store, async (transaction) => {
      const [reservation, profile, account] = await Promise.all([transaction.get(usernameRef), transaction.get(profileRef), transaction.get(userRef)]);
      if (reservation.exists() && reservation.data().uid !== uid) throw new Error("That username has just been claimed. Try another.");
      if (profile.exists() && profile.data().username !== normalized) throw new Error("Username changes are not available after onboarding.");
      if (account.exists() && account.data().onboardingCompleted === true) {
        if (!profile.exists()) throw new Error("Your account setup needs support. Please contact the CreatorStore team.");
        return;
      }
      const profileData = { uid, username: normalized, displayName: creator.displayName.trim(), bio: creator.bio.trim(), photoURL: creator.avatarUrl || "", category: creator.category, socialLinks: creator.socialLinks, theme: creator.theme ?? "ananya", published: creator.published, createdAt: profile.exists() ? profile.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() };
      if (!reservation.exists()) transaction.set(usernameRef, { uid, username: normalized, createdAt: serverTimestamp() });
      if (profile.exists()) transaction.update(profileRef, { ...profileData, createdAt: profile.data().createdAt });
      else transaction.set(profileRef, profileData);
      if (account.exists()) transaction.update(userRef, { onboardingCompleted: true, termsVersion, termsAcceptedAt: serverTimestamp() });
      else transaction.set(userRef, { uid, email: email || user.email || "", createdAt: serverTimestamp(), onboardingCompleted: true, termsVersion, termsAcceptedAt: serverTimestamp() });
    });
  },
  async save(creator) {
    const user = requireOwner(creator.id);
    const normalized = normalizeUsername(creator.username);
    if (!isValidUsername(normalized)) throw new Error("Choose a valid store username.");
    const store = requireDb();
    const profileRef = doc(store, "creatorProfiles", user.uid);
    const currentProfile = await getDoc(profileRef);
    if (!currentProfile.exists()) throw new Error("Your store profile could not be found.");
    const oldUsername = normalizeUsername(String(currentProfile.data().username ?? ""));
    const oldUsernameRef = doc(store, "usernames", oldUsername);
    const newUsernameRef = doc(store, "usernames", normalized);
    if (!isValidUsername(oldUsername)) throw new Error("Your current store username is invalid. Contact support.");
    if (currentProfile.data().suspendedAt && creator.published) throw new Error("Your storefront was unpublished after 30 days without a recorded view. Email support@bubbli.in from your registered email to request reactivation.");
    await runTransaction(store, async (transaction) => {
      const [profile, oldReservation, newReservation] = await Promise.all([
        transaction.get(profileRef), transaction.get(oldUsernameRef), transaction.get(newUsernameRef),
      ]);
      if (!profile.exists() || profile.data().uid !== user.uid) throw new Error("Your store profile could not be verified.");
      if (!oldReservation.exists() || oldReservation.data().uid !== user.uid) throw new Error("Your current store link could not be verified. Contact support.");
      if (newReservation.exists() && newReservation.data().uid !== user.uid) throw new Error("That username is already taken. Try another.");
      if (normalized !== oldUsername) {
        transaction.set(newUsernameRef, { uid: user.uid, username: normalized, createdAt: serverTimestamp() });
        transaction.update(oldUsernameRef, { uid: user.uid, username: oldUsername, redirectTo: normalized });
      }
      transaction.update(profileRef, {
        username: normalized,
        displayName: creator.displayName.trim(),
        bio: creator.bio.trim(),
        photoURL: creator.avatarUrl ?? "",
        category: creator.category,
        socialLinks: creator.socialLinks,
        theme: creator.theme ?? "ananya",
        published: creator.published,
        updatedAt: serverTimestamp(),
      });
    });
  },
};

export const firebaseProductRepository: ProductRepository = {
  async list(creatorId) {
    requireOwner(creatorId);
    const store = requireDb();
    const [productDocs, collectionDocs] = await Promise.all([
      getDocs(query(collection(store, "products"), where("creatorId", "==", creatorId))),
      getDocs(query(collection(store, "collections"), where("creatorId", "==", creatorId))),
    ]);
    const membership = new Map<string, string[]>();
    for (const item of collectionDocs.docs) for (const productId of (item.data().productIds as string[] ?? [])) membership.set(productId, [...(membership.get(productId) ?? []), item.id]);
    return productDocs.docs.map((item) => productFromDoc(item, membership.get(item.id) ?? [])).sort((a, b) => a.order - b.order);
  },
  async listPublic(creatorId) {
    const store = requireDb();
    const snaps = await getDocs(query(
      collection(store, "products"),
      where("creatorId", "==", creatorId),
      where("active", "==", true),
    ));
    return snaps.docs.map((item) => productFromDoc(item, [])).sort((a, b) => a.order - b.order);
  },
  async save(product) {
    requireOwner(product.creatorId);
    const isInternal = product.redirectType === "internal";
    let destinationURL = "";
    if (!isInternal) {
      try {
        const destination = new URL(product.destinationUrl);
        if (!["http:", "https:"].includes(destination.protocol)) throw new Error();
        destinationURL = destination.toString();
      } catch {
        throw new Error("Product links must be a valid http:// or https:// address.");
      }
    }
    if (!product.name.trim() || product.name.length > 100) throw new Error("Enter a product name under 100 characters.");
    const store = requireDb();
    const ref = doc(store, "products", product.id);
    const previous = await getDoc(ref);
    const data = { id: product.id, creatorId: product.creatorId, title: product.name.trim(), description: product.description.trim(), imageURL: product.imageUrl, displayPrice: product.price ?? "", currency: product.currency ?? "INR", destinationURL, redirectType: product.redirectType ?? "website", source: product.source.trim(), sourceDomain: destinationURL ? urlHost(destinationURL) : "", reviewURL: product.reviewUrl ?? "", reviewType: product.reviewType ?? (product.reviewUrl ? "external" : ""), recommendation: product.recommendation.trim(), featured: product.featured, active: (product.availability ?? (product.active === false ? "deactivated" : "active")) !== "deactivated", availability: product.availability ?? (product.active === false ? "deactivated" : "active"), sortOrder: product.order, createdAt: previous.exists() ? previous.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() };
    await setDoc(ref, data);
  },
  async delete(productId) {
    const user = auth?.currentUser;
    if (!user) throw new Error("Sign in to manage products.");
    const store = requireDb();
    const productRef = doc(store, "products", productId);
    const product = await getDoc(productRef);
    if (!product.exists() || product.data().creatorId !== user.uid) throw new Error("This product wasn’t found in your store.");
    const collections = await getDocs(query(collection(store, "collections"), where("creatorId", "==", user.uid)));
    for (let offset = 0; offset < collections.docs.length; offset += 400) {
      const batch = writeBatch(store);
      for (const item of collections.docs.slice(offset, offset + 400)) if ((item.data().productIds as string[] ?? []).includes(productId)) batch.update(item.ref, { productIds: (item.data().productIds as string[]).filter((id) => id !== productId), updatedAt: serverTimestamp() });
      await batch.commit();
    }
    await deleteDoc(productRef);
  },
  async reorder(productIds) {
    const user = requireOwner(auth?.currentUser?.uid ?? "");
    const items = await this.list(user.uid);
    if (productIds.some((id) => !items.some((item) => item.id === id))) throw new Error("A product in the new order doesn’t belong to this store.");
    const store = requireDb();
    for (let offset = 0; offset < productIds.length; offset += 400) {
      const batch = writeBatch(store);
      productIds.slice(offset, offset + 400).forEach((id, index) => batch.update(doc(store, "products", id), { sortOrder: offset + index, updatedAt: serverTimestamp() }));
      await batch.commit();
    }
  },
};

export const firebaseCollectionRepository: CollectionRepository = {
  async list(creatorId) { requireOwner(creatorId); const snaps = await getDocs(query(collection(requireDb(), "collections"), where("creatorId", "==", creatorId))); return snaps.docs.map(collectionFromDoc).sort((a, b) => a.order - b.order); },
  async listPublic(creatorId) { const snaps = await getDocs(query(collection(requireDb(), "collections"), where("creatorId", "==", creatorId))); return snaps.docs.map(collectionFromDoc).sort((a, b) => a.order - b.order); },
  async save(item) {
    requireOwner(item.creatorId);
    if (!item.title.trim() || item.title.length > 80) throw new Error("Enter a collection name under 80 characters.");
    if (item.productIds.length > 30) throw new Error("A collection can contain up to 30 products.");
    const store = requireDb(); const ref = doc(store, "collections", item.id); const previous = await getDoc(ref);
    await setDoc(ref, { id: item.id, creatorId: item.creatorId, name: item.title.trim(), description: item.description.trim(), imageURL: item.imageUrl ?? "", productIds: item.productIds, sortOrder: item.order, createdAt: previous.exists() ? previous.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() });
  },
  async delete(collectionId) { const user = auth?.currentUser; if (!user) throw new Error("Sign in to manage collections."); const ref = doc(requireDb(), "collections", collectionId); const snap = await getDoc(ref); if (!snap.exists() || snap.data().creatorId !== user.uid) throw new Error("This collection wasn’t found in your store."); await deleteDoc(ref); },
};

export const firebaseAnalyticsRepository: AnalyticsRepository = {
  async getSummary(creatorId, days = 30) {
    requireOwner(creatorId);
    const store = requireDb();
    const [products, collections, events] = await Promise.all([
      firebaseProductRepository.list(creatorId),
      firebaseCollectionRepository.list(creatorId),
      getDocs(query(collection(store, "analyticsEvents"), where("creatorId", "==", creatorId), orderBy("createdAt", "desc"), limit(1000))),
    ]);
    const now = Date.now();
    const start = now - days * 24 * 60 * 60 * 1000;
    const recent = events.docs.map((item) => item.data()).filter((item) => {
      const timestamp = item.createdAt?.toMillis?.() ?? (item.createdAt?.seconds ? item.createdAt.seconds * 1000 : 0);
      return timestamp >= start && timestamp <= now + 60_000;
    });
    const dailyMap = new Map<string, { views: number; clicks: number }>();
    const sourceMap = new Map<string, number>();
    const productMap = new Map<string, number>();
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date(now - offset * 86400000).toISOString().slice(0, 10);
      dailyMap.set(date, { views: 0, clicks: 0 });
    }
    let storeViews = 0;
    let productClicks = 0;
    let whatsappClicks = 0;
    let externalClicks = 0;
    let bannerClicks = 0;
    let collectionClicks = 0;
    for (const event of recent) {
      const timestamp = event.createdAt?.toMillis?.() ?? (event.createdAt?.seconds ? event.createdAt.seconds * 1000 : 0);
      const date = new Date(timestamp).toISOString().slice(0, 10);
      const bucket = dailyMap.get(date);
      if (event.type === "store_view") {
        storeViews += 1;
        if (bucket) bucket.views += 1;
        const source = typeof event.source === "string" ? event.source : "direct";
        sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
      } else if (event.type === "product_click") {
        productClicks += 1;
        if (bucket) bucket.clicks += 1;
        if (typeof event.productId === "string") productMap.set(event.productId, (productMap.get(event.productId) ?? 0) + 1);
      } else if (event.type === "whatsapp_click") {
        whatsappClicks += 1;
      } else if (event.type === "external_click") {
        externalClicks += 1;
      } else if (event.type === "banner_click") {
        bannerClicks += 1;
      } else if (event.type === "collection_click") {
        collectionClicks += 1;
      }
    }
    const daily: AnalyticsDay[] = [...dailyMap.entries()].map(([date, counts]) => ({ date, ...counts }));
    const topProducts: AnalyticsProduct[] = [...productMap.entries()]
      .map(([productId, clicks]) => ({ productId, name: products.find((product) => product.id === productId)?.name ?? "Deleted product", clicks }))
      .sort((a, b) => b.clicks - a.clicks);
    const sources: AnalyticsSource[] = [...sourceMap.entries()].map(([source, visits]) => ({ source, visits })).sort((a, b) => b.visits - a.visits).slice(0, 6);
    return {
      storeViews, productClicks, whatsappClicks, externalClicks, bannerClicks, collectionClicks, topProductId: topProducts[0]?.productId,
      totalProducts: products.length, featuredProducts: products.filter((item) => item.featured).length,
      totalCollections: collections.length, daily, topProducts, sources, periodDays: days,
    };
  },
};

export const firebaseLeadRepository: LeadRepository = {
  async list(creatorId) {
    requireOwner(creatorId);
    const snaps = await getDocs(query(collection(requireDb(), "creatorLeads"), where("creatorId", "==", creatorId)));
    return snaps.docs.map((item) => ({ id: item.id, ...item.data() } as CreatorLead)).sort((a, b) => {
      const at = (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      const bt = (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      return bt - at;
    });
  },
  async save(lead) {
    requireOwner(lead.creatorId);
    if (!lead.name.trim() || lead.name.length > 80) throw new Error("Enter a name under 80 characters.");
    if (!lead.contact.trim() || lead.contact.length > 120) throw new Error("Enter an email address, phone number or social handle.");
    const store = requireDb();
    const ref = doc(store, "creatorLeads", lead.id);
    const previous = await getDoc(ref);
    await setDoc(ref, { ...lead, name: lead.name.trim(), contact: lead.contact.trim(), notes: lead.notes.trim().slice(0, 1000), createdAt: previous.exists() ? previous.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() });
  },
  async delete(leadId) {
    const user = auth?.currentUser;
    if (!user) throw new Error("Sign in to manage leads.");
    const ref = doc(requireDb(), "creatorLeads", leadId);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().creatorId !== user.uid) throw new Error("Lead not found.");
    await deleteDoc(ref);
  },
};
