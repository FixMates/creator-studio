"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { signOutUser } from "@/lib/firebase/auth";

export function ProtectedDashboard() {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/login");
  }, [configured, loading, router, user]);

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-[#69756d]">Loading your studio…</main>;
  if (!configured) return <main className="grid min-h-screen place-items-center px-6"><section className="max-w-md text-center"><p className="eyebrow">Creator studio</p><h1 className="mt-3 text-3xl font-semibold">Connect Firebase to continue</h1><p className="mt-3 text-[#69756d]">Add the web app environment values in <code>.env.local</code>, then refresh this page.</p><Button href="/" className="mt-6">Back to home</Button></section></main>;
  if (!user) return <main className="grid min-h-screen place-items-center text-sm text-[#69756d]">Taking you to sign in…</main>;

  return <main className="min-h-screen bg-[#f7f8f4]"><header className="flex items-center justify-between border-b border-[#e6e9e2] bg-white px-6 py-4"><Link href="/" className="text-xl font-bold tracking-tight">creator<span className="text-[#6c967e]">store</span></Link><Button variant="secondary" onClick={async () => { await signOutUser(); router.push("/"); }}>Sign out</Button></header><section className="mx-auto max-w-5xl px-6 py-16"><p className="eyebrow">Your studio</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Welcome, {user.displayName?.split(" ")[0] ?? "creator"}.</h1><p className="mt-3 max-w-lg text-[#66736a]">Your storefront foundation is ready. Your products and collections will live here.</p><div className="mt-10 rounded-3xl border border-dashed border-[#cbd5cb] bg-white p-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eef3ed] text-2xl">✳</div><h2 className="mt-4 text-xl font-semibold">Your store is taking shape</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#738077]">Soon you’ll be able to gather all the things you love and share them from one beautiful link.</p></div></section></main>;
}
