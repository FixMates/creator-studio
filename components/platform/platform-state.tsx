"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {onAuthStateChanged} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";
import {app, auth, db} from "@/lib/firebase/client";

type PlatformConfig = {announcement?: string; maintenanceMode?: boolean};

/** Applies the publicly configured maintenance and announcement state. */
export function PlatformState({children}: {children: React.ReactNode}) {
  const [config, setConfig] = useState<PlatformConfig>({});
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !app) return;
    let active = true;
    const refresh = async () => {
      try {
        const snapshot = await getDoc(doc(firestore, "platformConfig", "public"));
        if (!active) return;
        const value = snapshot.exists() ? snapshot.data() as PlatformConfig : {};
        setConfig(value);
        if (!value.maintenanceMode) {
          setRestricted(false);
          return;
        }
        const token = await auth?.currentUser?.getIdTokenResult();
        setRestricted(!token?.claims.platformRole);
      } catch {
        if (active) setRestricted(false);
      }
    };
    void refresh();
    const unsubscribe = auth ? onAuthStateChanged(auth, () => void refresh()) : () => undefined;
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (restricted) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f6fb] px-5 py-12 text-center"><section className="max-w-lg rounded-3xl border border-[#e9e1ef] bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8b22ef]">Bubbli</p><h1 className="mt-3 text-2xl font-semibold">We’ll be back soon</h1><p className="mt-3 text-sm leading-6 text-[#786c82]">{config.announcement || "Bubbli is temporarily unavailable while we make a platform update."}</p><Link href="/admin" className="mt-5 inline-flex rounded-full border border-[#ded3e7] px-4 py-2.5 text-xs font-semibold text-[#6d5b79]">Administrator sign in</Link></section></main>;
  }

  return <>{config.announcement && <div role="status" className="bg-[#35105f] px-4 py-2 text-center text-xs font-medium text-white">{config.announcement}</div>}{children}</>;
}
