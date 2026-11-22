"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Link2, Share2 } from "lucide-react";
import { getCollectionRepository, getCreatorRepository, getProductRepository } from "@/lib/repositories";
import { copyLink, shareLink, whatsappShareUrl } from "@/lib/services/sharing";
import { trackStoreView } from "@/lib/services/analytics";
import type { Creator, StoreCollection, StoreProduct } from "@/types/store";
import { validateHttpUrl } from "@/lib/services/url";

export function Storefront({ username }: { username: string }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setCreator(null);
    void (async () => {
      try {
        const profile = await getCreatorRepository().get(username);
        if (!profile) {
          if (!cancelled) setCreator(null);
          return;
        }
        const [p, cs] = await Promise.all([
          getProductRepository().listPublic(profile.id),
          getCollectionRepository().listPublic(profile.id),
        ]);
        if (!cancelled) {
          setCreator(profile);
          setProducts(p);
          setCollections(cs);
          void trackStoreView(profile.id, profile.username);
        }
      } catch (error) {
        console.error("Failed to load public storefront:", error);
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [username]);

  const allProducts = useMemo(() => [...products].sort((a, b) => a.order - b.order), [products]);
  const productGroups = useMemo(() => {
    const groups = new Map<string, StoreProduct[]>();
    for (const product of allProducts) {
      const label = product.source?.trim() || "My recommendations";
      groups.set(label, [...(groups.get(label) ?? []), product]);
    }
    return [...groups.entries()];
  }, [allProducts]);

  const theme = ({ gold: { background: "#d8bd68", text: "#241d12", page: "#d8bd68" }, sage: { background: "#cbd9c6", text: "#20372a", page: "#cbd9c6" }, rose: { background: "#e8c7c4", text: "#432a2b", page: "#e8c7c4" }, midnight: { background: "#25364b", text: "#ffffff", page: "#25364b" } } as const)[creator?.theme ?? "gold"];

  async function share() {
    const url = `${window.location.origin}/${username}`;
    try {
      const result = await shareLink(url, creator?.displayName ?? "Bubbli.in", creator?.bio);
      setNotice(result === "copied" ? "Store link copied." : result === "cancelled" ? "Share cancelled." : "Store shared.");
    } catch {
      try { await copyLink(url); setNotice("Store link copied."); }
      catch { setNotice("Sharing isn’t available here."); }
    }
  }

  if (loading) return (
    <main aria-busy="true" className="min-h-screen bg-[#f7f4e8] px-5">
      <div className="mx-auto max-w-5xl animate-pulse py-6">
        <div className="h-8 w-36 rounded bg-[#e8dfc2]" />
        <div className="mt-8 h-[420px] rounded-[2rem] bg-[#e8dfc2]" />
        <div className="mx-auto mt-8 h-8 w-64 rounded bg-[#e8dfc2]" />
        <div className="mt-8 flex gap-4 overflow-hidden">{[1,2,3].map((item) => <div key={item} className="h-64 w-56 shrink-0 rounded-3xl bg-[#e8dfc2]" />)}</div>
      </div>
    </main>
  );

  if (!creator) return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4e8] px-6 text-center">
      <section className="max-w-md">
        <p className="eyebrow">{loadFailed ? "Unable to load store" : "Store not found"}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{loadFailed ? "We couldn’t load this store." : "This store isn’t available yet."}</h1>
        <p className="mt-3 text-sm leading-6 text-[#7d7460]">{loadFailed ? "Please refresh and try again." : "Check the link or create your own Bubbli.in."}</p>
        {loadFailed ? <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-[#244b3b] px-5 py-3 text-sm font-semibold text-white">Try again</button> : <Link href="/onboarding" className="mt-6 inline-flex rounded-full bg-[#244b3b] px-5 py-3 text-sm font-semibold text-white">Create your store</Link>}
      </section>
    </main>
  );

  return (
    <main className="min-h-screen overflow-hidden" style={{ background: theme.page, color: theme.text }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link href="/" className="text-xl font-black tracking-[-.075em]">creator<span className="text-[#779780]">store</span><span className="text-[#c27b5c]">.</span></Link>
        <div className="flex items-center gap-2">
          <button onClick={async () => { try { await copyLink(`${window.location.origin}/${username}`); setNotice("Store link copied."); } catch { setNotice("Could not copy link."); } }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3.5 text-xs font-semibold shadow-sm"><Link2 size={14} /> Copy link</button>
          <button onClick={() => void share()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3.5 text-xs font-semibold shadow-sm"><Share2 size={14} /> Share</button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-0 sm:px-8">
        <div className="relative flex min-h-[470px] items-end justify-center overflow-hidden bg-black sm:min-h-[590px] sm:rounded-[2rem]" style={{ backgroundColor: theme.background }}>
          {creator.avatarUrl ? <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${creator.avatarUrl}")` }} /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.35),transparent_55%)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
          <div className="relative z-10 w-full px-5 pb-8 text-center text-white sm:pb-12">
            <p className="mx-auto mb-3 inline-flex rounded-full border border-white/40 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] backdrop-blur-sm">@{creator.username} · {creator.category}</p>
            <h1 className="mx-auto max-w-4xl break-words text-5xl font-black leading-[.98] tracking-[-.055em] drop-shadow-lg sm:text-7xl">{creator.displayName}</h1>
            <div className="mx-auto mt-5 flex flex-wrap justify-center gap-2">
              {Object.entries(creator.socialLinks).filter(([, value]) => value && validateHttpUrl(value)).map(([key, value]) => <a key={key} href={value} target="_blank" rel="noreferrer" className="rounded-full border border-white/40 bg-black/25 px-4 py-2 text-xs font-semibold capitalize backdrop-blur-sm">{key}</a>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-8 pt-8 text-center sm:pb-12 sm:pt-10">
        <p className="mx-auto max-w-2xl whitespace-pre-line font-serif text-xl leading-[1.55] sm:text-2xl">{creator.bio || "I’ve collected some of my favourite products below."}</p>
        <button onClick={() => void share()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-black/90 px-5 text-sm font-semibold text-white"><Share2 size={15} /> Share store</button>
        {notice && <p role="status" aria-live="polite" className="mt-3 text-xs font-semibold">{notice}</p>}
      </section>

      <div className="mx-auto max-w-6xl pb-12">
        {productGroups.length > 0 ? productGroups.map(([label, items]) => (
          <section key={label} className="pb-10">
            <div className="px-6 pb-5 text-center sm:text-left sm:px-8">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{label}</h2>
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-5 sm:gap-5 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((product) => <ProductCard key={product.id} product={product} username={username} />)}
            </div>
          </section>
        )) : (
          <section className="px-6 pb-16 text-center">
            <h2 className="text-2xl font-bold">Products coming soon</h2>
            <p className="mt-2 font-serif text-lg">Check back for the creator’s latest recommendations.</p>
          </section>
        )}

        {collections.length > 0 && (
          <section className="px-6 pb-12 sm:px-8">
            <h2 className="mb-5 text-center text-2xl font-black sm:text-left">Curated collections</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {collections.map((collection) => {
                const items = collection.productIds.map((id) => products.find((product) => product.id === id)).filter((product): product is StoreProduct => Boolean(product));
                return <article key={collection.id} className="rounded-3xl border border-black/10 bg-white/60 p-5">
                  <h3 className="text-lg font-bold">{collection.title}</h3>
                  {collection.description && <p className="mt-1 text-sm opacity-75">{collection.description}</p>}
                  <div className="mt-4 flex gap-3 overflow-x-auto">
                    {items.map((product) => <Link key={product.id} href={`/go/${product.id}?u=${encodeURIComponent(username)}`} className="w-28 shrink-0">
                      <div className="aspect-square rounded-xl bg-cover bg-center" style={{ backgroundImage: `url("${product.imageUrl}")` }} />
                      <p className="mt-2 truncate text-xs font-semibold">{product.name}</p>
                    </Link>)}
                  </div>
                </article>;
              })}
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-black/10 px-5 py-8 text-center">
        <p className="font-serif text-sm opacity-75">A little corner of the internet, curated by {creator.displayName}.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-black tracking-[-.06em]">bubbli.in<span className="text-[#bd775c]">.</span></Link>
        <nav className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] opacity-70"><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/affiliate-disclosure">Affiliate disclosure</Link><a href="mailto:support@bubbli.in">Support</a></nav>
      </footer>
    </main>
  );
}

function ProductCard({ product, username }: { product: StoreProduct; username: string }) {
  const [shared, setShared] = useState(false);
  const productUrl = `/go/${product.id}?u=${encodeURIComponent(username)}`;
  async function copyProductLink() {
    try { await copyLink(`${window.location.origin}${productUrl}`); setShared(true); }
    catch { setShared(false); }
  }
  return (
    <article className="w-[72vw] max-w-[270px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-black/10 bg-white text-[#251f17] shadow-sm sm:w-[260px]">
      <Link href={productUrl} className="block aspect-[.88/1] overflow-hidden bg-[#f1eee5] bg-cover bg-center" style={{ backgroundImage: `url("${product.imageUrl}")` }} aria-label={`View ${product.name}`} />
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-11 font-serif text-lg font-bold leading-tight">{product.name}</h3>
        {(product.recommendation || product.description) && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#716b60]">{product.recommendation || product.description}</p>}
        {product.price && <p className="mt-2 text-sm font-bold">{product.price}</p>}
        <div className="mt-4 flex items-center gap-2">
          <Link href={productUrl} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-full bg-[#251f17] px-3 text-xs font-bold text-white">View product <ArrowUpRight size={14} /></Link>
          <button onClick={() => void copyProductLink()} aria-label={`Copy link for ${product.name}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-black/15"><Link2 size={15} /></button>
        </div>
        <a href={whatsappShareUrl(`${typeof window !== "undefined" ? window.location.origin : "https://bubbli.in"}${productUrl}`, `Hi, I’m interested in ${product.name}. Could you share more details?`)} target="_blank" rel="noreferrer" className="mt-3 block text-center text-[11px] font-semibold text-[#62785f]">Share on WhatsApp</a>
        {shared && <p role="status" className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#5d7e65]"><Check size={11} /> Link copied</p>}
      </div>
    </article>
  );
}
