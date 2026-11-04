"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase/client";
import { getCreatorRepository } from "@/lib/repositories";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function continueToWorkspace(uid: string, forceOnboarding = false) {
    if (forceOnboarding) { router.replace("/onboarding"); return; }
    const account = await getCreatorRepository().getAccount(uid);
    router.replace(account?.onboardingCompleted ? "/dashboard" : "/onboarding");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      if (isSignup) {
        const credential = await signUpWithEmail(String(data.get("email")), String(data.get("password")), String(data.get("name")));
        await continueToWorkspace(credential.user.uid, true);
      } else {
        const credential = await signInWithEmail(String(data.get("email")), String(data.get("password")));
        await continueToWorkspace(credential.user.uid);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function google() {
    setError("");
    setBusy(true);
    try {
      const credential = await signInWithGoogle();
      await continueToWorkspace(credential.user.uid);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in failed.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-5">
    {!firebaseConfigured && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Add your Firebase web app values to <code>.env.local</code> to enable sign-in.</p>}
    <Button type="button" variant="secondary" className="w-full" disabled={!firebaseConfigured || busy} onClick={google}>Continue with Google</Button>
    <div className="flex items-center gap-3 text-xs text-[#8b948c]"><span className="h-px flex-1 bg-[#e7e9e3]" />OR WITH EMAIL<span className="h-px flex-1 bg-[#e7e9e3]" /></div>
    <form className="space-y-4" onSubmit={submit}>
      {isSignup && <label className="field-label">Your name<input className="field-input" name="name" autoComplete="name" required /></label>}
      <label className="field-label">Email address<input className="field-input" type="email" name="email" autoComplete="email" required /></label>
      <label className="field-label">Password<input className="field-input" type="password" name="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={6} required /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={!firebaseConfigured || busy}>{busy ? "Please wait…" : isSignup ? "Create your account" : "Sign in"}</Button>
    </form>
  </div>;
}
