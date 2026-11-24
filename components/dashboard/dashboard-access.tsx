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
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }

    let active = true;
    let requestId = 0;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const currentRequest = ++requestId;
      setReady(false);
      setUser(null);
      setVerificationError("");

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      try {
        const repository = getCreatorRepository();
        const [account, profile] = await Promise.all([
          repository.getAccount(currentUser.uid),
          repository.getForUser(currentUser.uid),
        ]);

        if (!active || currentRequest !== requestId) return;

        // Match the routing decision used after sign-in and on onboarding:
        // an existing creator profile is sufficient evidence that setup exists,
        // even if an older account document lacks onboardingCompleted.
        if (account?.onboardingCompleted === true || profile) {
          setUser(currentUser);
        } else {
          router.replace("/onboarding");
        }
      } catch (caught) {
        if (!active || currentRequest !== requestId) return;
        // A transient Firestore/network/permission failure must not be treated
        // as incomplete onboarding; doing so creates a dashboard/onboarding loop.
        setVerificationError(
          caught instanceof Error
            ? caught.message
            : "We couldn't verify your studio. Please try again.",
        );
      } finally {
        if (active && currentRequest === requestId) setReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (verificationError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8f4] px-6 text-center">
        <section className="max-w-md">
          <h1 className="text-xl font-semibold text-[#35483a]">We couldn’t verify your studio</h1>
          <p className="mt-3 text-sm leading-6 text-[#69756d]">{verificationError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#35105f] px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (!ready || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8f4] text-sm text-[#69756d]">
        Loading your studio…
      </main>
    );
  }

  return <>{children}</>;
}
