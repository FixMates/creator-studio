"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { getSafeRedirectUrl } from "@/lib/services/url";
import { trackProductClick, trackWhatsAppClick, trackExternalClick } from "@/lib/services/analytics";

type InternalProduct = { name:string; description:string; imageURL:string; price:string; recommendation:string; whatsappUrl:string; creatorId:string; username:string };

export function ProductRedirect({ productId }: { productId: string }) {
  const [username, setUsername] = useState<string | null>(null);
  const [message, setMessage] = useState("Taking you to the seller…");
  const [internalProduct,setInternalProduct]=useState<InternalProduct|null>(null);
  const [imageUnavailable,setImageUnavailable]=useState(false);
  const returnTo = username ? `/${encodeURIComponent(username)}` : "/";

  useEffect(() => {
    const requestedUsername = new URLSearchParams(window.location.search).get("u")?.trim() || "";
    const creatorName = /^[a-z0-9_-]{3,30}$/i.test(requestedUsername) ? requestedUsername : null;
    setUsername(creatorName);
    const firestore = db;
    if (!firestore) { setMessage("Store data is unavailable."); return; }

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
    void getDoc(doc(firestore, "products", productId)).then(async (snap) => {
      if (cancelled) return;
      if (!snap.exists()) { setMessage("We couldn’t find that product."); return; }
      const data = snap.data();
      if (data.active !== true || data.availability === "deactivated") { setMessage("This product is no longer available."); return; }
      if (data.availability === "out_of_stock") { setMessage("This product is currently out of stock."); return; }
      if (data.availability === "coming_soon") { setMessage("This product is coming soon."); return; }

      const creatorId = typeof data.creatorId === "string" ? data.creatorId : "";
      const profile = creatorId ? await getDoc(doc(firestore, "creatorProfiles", creatorId)) : null;
      const actualUsername = profile?.exists() && typeof profile.data().username === "string"
        ? profile.data().username as string
        : creatorName ?? "";
      if (creatorId && actualUsername) {
        await Promise.race([
          trackProductClick(creatorId, actualUsername, productId),
          new Promise<void>((resolve) => window.setTimeout(resolve, 900)),
        ]);
      }

      if (data.redirectType === "internal") {
        const socialLinks = profile?.exists() ? profile.data().socialLinks ?? {} : {};
        const rawWhatsApp = typeof socialLinks.whatsapp === "string" ? socialLinks.whatsapp : "";
        const digits = rawWhatsApp.replace(/\D/g, "");
        const whatsappUrl = rawWhatsApp.startsWith("http") ? getSafeRedirectUrl(rawWhatsApp) ?? "" : digits.length >= 10 && digits.length <= 15 ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi, I’m interested in ${String(data.title ?? "this product")}.`)}` : "";
        if (!cancelled) {
          setImageUnavailable(false);
          setInternalProduct({
            name:String(data.title??"Product"),
            description:String(data.description??""),
            imageURL:String(data.imageURL??""),
            price:String(data.displayPrice??""),
            recommendation:String(data.recommendation??""),
            whatsappUrl,
            creatorId,
            username: actualUsername,
          });
          setMessage("Available directly from this creator.");
        }
        return;
      }

      const destination = getSafeRedirectUrl(String(data.destinationURL ?? ""));
      if (!destination) { setMessage("This product link isn’t a valid web address."); return; }
      try { sessionStorage.setItem(returnKey, "1"); } catch {}
      if (data.redirectType === "whatsapp") void trackWhatsAppClick(creatorId, actualUsername, productId);
      else void trackExternalClick(creatorId, actualUsername, productId, data.redirectType === "website" ? "website" : data.redirectType === "instagram" || data.redirectType === "facebook" ? "social" : "marketplace");
      if (!cancelled) window.location.assign(destination);
    }).catch(() => {
      if (!cancelled) setMessage("We couldn’t open that product right now.");
    });

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [productId]);

  if(internalProduct)return <main className="min-h-screen bg-[#faf8ff] px-4 py-8 text-[#24143f]"><div className="mx-auto max-w-2xl"><Link href={returnTo} className="inline-flex items-center gap-2 text-xs font-bold text-[#7b35bc]"><ArrowLeft size={15}/> Back to @{username}’s store</Link><article className="mt-5 overflow-hidden rounded-3xl border border-[#eee6f7] bg-white shadow-sm"><div className="relative aspect-[1.2/1] bg-[#f4eff8]">{internalProduct.imageURL&&!imageUnavailable?<Image src={internalProduct.imageURL} alt={internalProduct.name} fill unoptimized sizes="(max-width:640px) 100vw, 640px" className="object-contain p-4" onError={()=>setImageUnavailable(true)}/>:<div className="grid h-full place-items-center px-6 text-center text-sm text-[#8b789e]">Product image unavailable</div>}</div><div className="p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#8b22ef]">Direct from the creator</p><h1 className="mt-2 text-2xl font-black">{internalProduct.name}</h1>{internalProduct.price&&<p className="mt-2 text-lg font-bold">{internalProduct.price}</p>}{internalProduct.description&&<p className="mt-4 text-sm leading-7 text-[#71647e]">{internalProduct.description}</p>}{internalProduct.recommendation&&<p className="mt-4 rounded-2xl bg-[#f8f3fc] p-4 text-sm leading-6 text-[#715c83]">{internalProduct.recommendation}</p>}<p className="mt-5 text-xs text-[#9485a1]">{message}</p>{internalProduct.whatsappUrl?<a href={internalProduct.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => void trackWhatsAppClick(internalProduct.creatorId, internalProduct.username, productId)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#8b22ef] px-5 text-sm font-bold text-white"><MessageCircle size={16}/> Enquire with creator <ArrowUpRight size={15}/></a>:<p className="mt-5 rounded-xl bg-[#f8f3fc] p-3 text-xs leading-5 text-[#715c83]">This creator has not added a WhatsApp contact. Return to their store to find their other contact links.</p>}<Link href={returnTo} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#e9e0f1] text-sm font-semibold text-[#715c83]">Continue browsing</Link></div></article></div></main>;

  return <main className="grid min-h-screen place-items-center bg-[#faf8ff] px-5 text-center">
    <section className="max-w-sm">
      <p className="eyebrow">Bubbli.in redirect</p>
      <h1 className="mt-3 text-2xl font-semibold" aria-live="polite">{message}</h1>
      <p className="mt-2 text-sm text-[#7b887e]">Your visit is attributed to the creator who shared this recommendation.</p>
      <Link href={returnTo} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#8b22ef] px-5 text-sm font-semibold text-white">Back to {username ? `@${username}’s store` : "store"}</Link>
    </section>
  </main>;
}
