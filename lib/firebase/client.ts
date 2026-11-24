"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { firebaseConfigured, getFirebaseConfig } from "@/lib/firebase/config";

const config = getFirebaseConfig();
export { firebaseConfigured };

export const app = config
  ? getApps().length
    ? getApp()
    : initializeApp(config)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const functions = app ? getFunctions(app, "asia-south1") : null;

type EmulatorWindow = typeof globalThis & {
  __bubbliEmulatorsConnected?: boolean;
};
const emulatorWindow = globalThis as EmulatorWindow;
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  auth &&
  db &&
  functions &&
  !emulatorWindow.__bubbliEmulatorsConnected
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {disableWarnings: true});
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  emulatorWindow.__bubbliEmulatorsConnected = true;
}
