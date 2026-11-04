"use client";

import { firebaseConfigured, demoModeEnabled } from "@/lib/firebase/config";
import { db } from "@/lib/firebase/client";
import { analyticsRepository as demoAnalytics, collectionRepository as demoCollections, creatorRepository as demoCreators, productRepository as demoProducts } from "@/lib/repositories/demo";
import { firebaseAnalyticsRepository, firebaseCollectionRepository, firebaseCreatorRepository, firebaseProductRepository } from "@/lib/repositories/firebase";

function unavailable(): never { throw new Error("Firebase configuration is required for production CreatorStore data. Demo data is disabled in production."); }
function firebaseReady() { if (!firebaseConfigured || !db) unavailable(); }

export function getCreatorRepository() { if (firebaseConfigured) { firebaseReady(); return firebaseCreatorRepository; } if (demoModeEnabled) return demoCreators; return unavailable(); }
export function getProductRepository() { if (firebaseConfigured) { firebaseReady(); return firebaseProductRepository; } if (demoModeEnabled) return demoProducts; return unavailable(); }
export function getCollectionRepository() { if (firebaseConfigured) { firebaseReady(); return firebaseCollectionRepository; } if (demoModeEnabled) return demoCollections; return unavailable(); }
export function getAnalyticsRepository() { if (firebaseConfigured) { firebaseReady(); return firebaseAnalyticsRepository; } if (demoModeEnabled) return demoAnalytics; return unavailable(); }
