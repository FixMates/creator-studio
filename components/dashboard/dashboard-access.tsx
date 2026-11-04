"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getCreatorRepository } from "@/lib/repositories";

export function DashboardAccess({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.replace("/login"); return; }
      try {
        const account = await getCreatorRepository().getAccount(currentUser.uid);
        if (!account?.onboardingCompleted) { router.replace("/onboarding"); return; }
        setUser(currentUser);
      } catch {
        router.replace("/onboarding");
      } finally { setReady(true); }
    });
  }, [router]);

  if (!ready || !user) return <main className="grid min-h-screen place-items-center bg-[#f7f8f4] text-sm text-[#69756d]">Loading your studio…</main>;
  return <>{children}</>;
}
