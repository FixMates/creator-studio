"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function referrerDetails() {
  let referrerHost = "direct";
  try {
    if (document.referrer) referrerHost = new URL(document.referrer).hostname.replace(/^www\./, "");
  } catch {}
  const params = new URLSearchParams(window.location.search);
  return {
    source: (params.get("utm_source") || referrerHost || "direct").slice(0, 100),
    referrerHost: referrerHost.slice(0, 120),
    path: window.location.pathname.slice(0, 200),
  };
}

async function writeEvent(type: "store_view" | "product_click", creatorId: string, username: string, productId?: string) {
  if (!db || !creatorId) return;
  const details = referrerDetails();
  await addDoc(collection(db, "analyticsEvents"), {
    type, creatorId, username: username.slice(0, 30),
    ...(productId ? { productId } : {}),
    ...details,
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
  try { await writeEvent("product_click", creatorId, username, productId); }
  catch (error) { console.warn("Product click analytics could not be recorded.", error); }
}
