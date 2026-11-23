"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type AnalyticsEventType = "store_view" | "product_click" | "whatsapp_click" | "external_click" | "banner_click" | "collection_click";
type AnalyticsEventDetails = { productId?: string; collectionId?: string; destinationType?: "whatsapp" | "marketplace" | "website" | "social" | "other" };

function referrerDetails() {
  let referrerHost = "direct";
  try {
    if (document.referrer) referrerHost = new URL(document.referrer).hostname.replace(/^www\\./, "");
  } catch {}
  const params = new URLSearchParams(window.location.search);
  return {
    source: (params.get("utm_source") || referrerHost || "direct").slice(0, 100),
    referrerHost: referrerHost.slice(0, 120),
    path: window.location.pathname.slice(0, 200),
  };
}

async function writeEvent(type: AnalyticsEventType, creatorId: string, username: string, details: AnalyticsEventDetails = {}) {
  if (!db || !creatorId || !username) return;
  const context = referrerDetails();
  await addDoc(collection(db, "analyticsEvents"), {
    type, creatorId, username: username.slice(0, 30),
    ...(details.productId ? { productId: details.productId.slice(0, 128) } : {}),
    ...(details.collectionId ? { collectionId: details.collectionId.slice(0, 128) } : {}),
    ...(details.destinationType ? { destinationType: details.destinationType } : {}),
    ...context,
    createdAt: serverTimestamp(),
  });
}

export async function trackStoreView(creatorId: string, username: string) {
  if (typeof window === "undefined") return;
  const key = `creatorstore:view:${creatorId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}
  try { await writeEvent("store_view", creatorId, username); }
  catch (error) { console.warn("Store view analytics could not be recorded.", error); }
}

export async function trackProductClick(creatorId: string, username: string, productId: string) {
  try { await writeEvent("product_click", creatorId, username, { productId }); }
  catch (error) { console.warn("Product click analytics could not be recorded.", error); }
}

export async function trackWhatsAppClick(creatorId: string, username: string, productId?: string) {
  try { await writeEvent("whatsapp_click", creatorId, username, { productId, destinationType: "whatsapp" }); }
  catch (error) { console.warn("WhatsApp click analytics could not be recorded.", error); }
}

export async function trackExternalClick(creatorId: string, username: string, productId: string, destinationType: AnalyticsEventDetails["destinationType"] = "marketplace") {
  try { await writeEvent("external_click", creatorId, username, { productId, destinationType }); }
  catch (error) { console.warn("External click analytics could not be recorded.", error); }
}

export async function trackBannerClick(creatorId: string, username: string) {
  try { await writeEvent("banner_click", creatorId, username); }
  catch (error) { console.warn("Banner click analytics could not be recorded.", error); }
}

export async function trackCollectionClick(creatorId: string, username: string, collectionId: string) {
  try { await writeEvent("collection_click", creatorId, username, { collectionId }); }
  catch (error) { console.warn("Collection click analytics could not be recorded.", error); }
}
