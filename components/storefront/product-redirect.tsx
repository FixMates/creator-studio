"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getSafeRedirectUrl } from "@/lib/services/url";
import { trackProductClick } from "@/lib/services/analytics";

export function ProductRedirect({ productId }: { productId: string }) {
  const [username, setUsername] = useState<string | null>(null);
  const [message, setMessage] = useState("Taking you to the seller…");
  const returnTo = username ? `/${encodeURIComponent(username)}` : "/";

  useEffect(() => {
    const requestedUsername = new URLSearchParams(window.location.search).get("u")?.trim() || "";
    const creatorName = /^[a-z0-9_-]{3,30}$/i.test(requestedUsername) ? requestedUsername : null;
    setUsername(creatorName);
    if (!db) { setMessage("Store data is unavailable."); return; }

    const returnKey = `bubbli:return:${productId}`;
    const showReturnMessage = () => {
      try {
        if (sessionStorage.getItem(returnKey) === "1") {
          sessionStorage.removeItem(returnKey);
          setMessage("You’re back. Continue exploring this creator’s store.");
          return true;
        }
      } catch {}
      return false;
    };

    if (showReturnMessage()) return;
    const onPageShow = () => { showReturnMessage(); };
    window.addEventListener("pageshow", onPageShow);

    let cancelled = false;
    void getDoc(doc(db, "products", productId)).then(async (snap) => {
      if (cancelled) return;
      if (!snap.exists()) { setMessage("We couldn’t find that product."); return; }
      const data = snap.data();
      if (data.active !== true || data.availability === "deactivated") { setMessage("This product is no longer available."); return; }
      if (data.availability === "out_of_stock") { setMessage("This product is currently out of stock."); return; }
      if (data.availability === "coming_soon") { setMessage("This product is coming soon."); return; }
      const destination = getSafeRedirectUrl(String(data.destinationURL ?? ""));
      if (!destination) { setMessage("This product link isn’t a valid web address."); return; }

      // Keep /go in browser history. When visitors return from WhatsApp or a seller
      // app, the session marker prevents the same redirect from firing again.
      try { sessionStorage.setItem(returnKey, "1"); } catch {}
      const creatorId = typeof data.creatorId === "string" ? data.creatorId : "";
      if (creatorId) {
        await Promise.race([
          trackProductClick(creatorId, creatorName ?? "", productId),
          new Promise<void>((resolve) => window.setTimeout(resolve, 900)),
        ]);
      }
      if (!cancelled) window.location.assign(destination);
    }).catch(() => {
      if (!cancelled) setMessage("We couldn’t open that product right now.");
    });

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [productId]);

  return <main className="grid min-h-screen place-items-center bg-[#faf8ff] px-5 text-center">
    <section className="max-w-sm">
      <p className="eyebrow">Bubbli.in redirect</p>
      <h1 className="mt-3 text-2xl font-semibold" aria-live="polite">{message}</h1>
      <p className="mt-2 text-sm text-[#7b887e]">Your visit is attributed to the creator who shared this recommendation.</p>
      <Link href={returnTo} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#8b22ef] px-5 text-sm font-semibold text-white">Back to {username ? `@${username}’s store` : "store"}</Link>
    </section>
  </main>;
}
