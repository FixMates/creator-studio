"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

function requireAuth() {
  if (!auth) throw new Error("Firebase is not configured. Add the required environment variables.");
  return auth;
}

export async function signInWithGoogle() {
  return signInWithPopup(requireAuth(), new GoogleAuthProvider());
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  await updateProfile(credential.user, { displayName });
  return credential;
}

export async function signOutUser() {
  return signOut(requireAuth());
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(requireAuth(), callback);
}
