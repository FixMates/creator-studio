"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Compass, Link2, Play, Share2, Sparkles } from "lucide-react";
import { getCollectionRepository, getCreatorRepository, getProductRepository } from "@/lib/repositories";
import { copyLink, shareLink, whatsappShareUrl } from "@/lib/services/sharing";
import { trackStoreView } from "@/lib/services/analytics";
import type { Creator, StoreCollection, StoreProduct } from "@/types/store";
import { validateHttpUrl } from "@/lib/services/url";

function InitialAvatar({ creator }: { creator: Creator }) {
  return (
    <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/70 bg-[#dce7dc] font-serif text-4xl italic text-[#456451] shadow-xl shadow-black/10 sm:size-28">
      {creator.avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${creator.avatarUrl})` }} /> : creator.displayName[0]?.toLowerCase()}
    </span>
  );
}

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
        if (!cancelled) { setCreator(profile); setProducts(p); setCollections(cs); void trackStoreView(profile.id, profile.username); }
      } catch (error) {
        console.error("Failed to load public storefront:", error);
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [username]);

  const featured = useMemo(() => products.filter((product) => product.featured).sort((a, b) => a.order - b.order), [products]);
  const allProducts = useMemo(() => [...products].sort((a, b) => a.order - b.order), [products]);
  const theme = ({ gold: { background: "#d8bd68", text: "#241d12", page: "#fbf7e9" }, sage: { background: "#cbd9c6", text: "#20372a", page: "#f3f7f0" }, rose: { background: "#e8c7c4", text: "#432a2b", page: "#fff6f5" }, midnight: { background: "#25364b", text: "#ffffff", page: "#edf1f6" } } as const)[creator?.theme ?? "gold"];

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
    <main aria-busy="true" className="min-h-screen bg-[#f7f8f3] px-5">
      <div className="mx-auto max-w-7xl animate-pulse py-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 rounded bg-[#e5eae2]" />
          <div className="h-10 w-32 rounded-full bg-[#e5eae2]" />
        </div>
        <div className="mt-10 grid min-h-[390px] items-center gap-10 rounded-[2rem] bg-[#e7ece4] p-8 sm:p-12 lg:grid-cols-[1.2fr_.8fr]">
          <div><div className="h-6 w-44 rounded-full bg-[#d8e1d6]" /><div className="mt-7 h-12 max-w-lg rounded-xl bg-[#d8e1d6]" /><div className="mt-3 h-12 max-w-sm rounded-xl bg-[#d8e1d6]" /><div className="mt-6 h-4 max-w-md rounded bg-[#d8e1d6]" /><div className="mt-3 h-4 max-w-xs rounded bg-[#d8e1d6]" /><div className="mt-8 h-12 w-40 rounded-full bg-[#d8e1d6]" /></div>
          <div className="mx-auto size-36 rounded-full bg-[#d8e1d6]" />
        </div>
        <div className="mt-14 h-7 w-56 rounded bg-[#e5eae2]" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="overflow-hidden rounded-3xl bg-white p-4"><div className="aspect-[1.2/1] rounded-2xl bg-[#e9ede6]" /><div className="mt-4 h-4 w-2/3 rounded bg-[#e9ede6]" /><div className="mt-3 h-4 w-1/2 rounded bg-[#e9ede6]" /></div>)}</div>
      </div>
    </main>
  );

  if (!creator) return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f3] px-6 text-center">
      <section className="max-w-md">
        <p className="eyebrow">{loadFailed ? "Unable to load store" : "Store not found"}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{loadFailed ? "We couldn’t load this store." : "This little corner isn’t ready yet."}</h1>
        <p className="mt-3 text-sm leading-6 text-[#7d8980]">{loadFailed ? "Please refresh and try again." : "Check the link or create your own Bubbli.in."}</p>
        {loadFailed ? <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-[#244b3b] px-5 py-3 text-sm font-semibold text-white">Try again</button> : <Link href="/onboarding" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#244b3b] px-5 py-3 text-sm font-semibold text-white">Create your store <ArrowRight size={15} /></Link>}
      </section>
    </main>
  );

  return (
    <main className="min-h-screen overflow-hidden text-[#1e3328]" style={{ background: theme.page }}>
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="text-xl font-black tracking-[-.075em]">creator<span className="text-[#779780]">store</span><span className="text-[#c27b5c]">.</span></Link>
        <div className="flex items-center gap-2"><button onClick={async () => { try { await copyLink(`${window.location.origin}/${username}`); setNotice("Copied!"); } catch { setNotice("Could not copy link."); } }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dfe6dc] bg-white/90 px-4 text-xs font-semibold text-[#405b49] shadow-sm transition hover:bg-white"><Link2 size={14} /> Copy link</button><button onClick={() => void share()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dfe6dc] bg-white/80 px-4 text-xs font-semibold text-[#405b49] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"><Share2 size={14} /> Share</button></div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-2 sm:px-8 sm:pb-12">
        <div className="relative isolate flex min-h-[340px] items-end overflow-hidden rounded-[1.75rem] bg-cover bg-center shadow-lg sm:min-h-[430px] sm:rounded-[2.25rem]" style={{ backgroundColor: theme.background, backgroundImage: creator.avatarUrl ? `url("${creator.avatarUrl}")` : undefined, color: "#fff" }}>
          <div className="absolute inset-0 -z-10" style={{ background: creator.avatarUrl ? "linear-gradient(180deg,rgba(12,20,15,.12) 0%,rgba(12,20,15,.35) 42%,rgba(12,20,15,.88) 100%)" : `linear-gradient(135deg,${theme.background},#263d30)` }} />
          <div className="w-full p-6 text-white sm:p-10">
            <p className="inline-flex rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-white/95 backdrop-blur-md">@{creator.username} · {creator.category}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight drop-shadow sm:text-5xl">{creator.displayName}</h1>
            <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-white/95 drop-shadow sm:text-lg sm:leading-8">{creator.bio || "My favourite finds, all in one place."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(creator.socialLinks).filter(([, value]) => value && validateHttpUrl(value)).map(([key, value]) => <a key={key} href={value} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-full border border-white/35 bg-black/25 px-4 text-xs font-semibold capitalize text-white backdrop-blur-md hover:bg-black/40">{key}</a>)}
              <button onClick={() => void share()} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#263d30]"><Share2 size={13} /> Share store</button>
            </div>
          </div>
        </div>
        {notice && <p role="status" className="mt-3 text-center text-xs font-semibold text-[#53745b]" aria-live="polite">{notice}</p>}
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="eyebrow">The shortlist</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Worth a closer look.</h2><p className="mt-2 text-sm text-[#829087]">The things I’d put at the top of your list.</p></div>
            <span className="hidden rounded-full bg-[#e9eee5] px-3 py-1.5 text-[10px] font-bold text-[#58715d] sm:inline-flex">{featured.length} featured</span>
          </div>
          <div className="product-mosaic grid grid-cols-2 items-start gap-3 sm:gap-5 lg:grid-cols-3">{featured.map((product, index) => <ProductCard key={product.id} product={product} username={username} index={index} />)}</div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-12">
          <div className="mb-6"><p className="eyebrow">Browse by mood</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Curated collections.</h2></div>
          <div className="grid gap-5 md:grid-cols-2">
            {collections.map((collection) => {
              const items = collection.productIds.map((id) => products.find((product) => product.id === id)).filter((product): product is StoreProduct => Boolean(product));
              return (
                <article id={collection.id} key={collection.id} className="group rounded-[1.6rem] border border-[#e5e9e1] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#233f30]/5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#88a08a]">Collection · {items.length} picks</p><h3 className="mt-2 text-xl font-semibold">{collection.title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#7d8980]">{collection.description || "A few favourites, gathered in one place."}</p></div>
                    <button aria-label={`Share ${collection.title}`} onClick={async () => { try { await shareLink(`${window.location.origin}/${username}#${collection.id}`, collection.title, collection.description); setNotice("Collection link copied or shared."); } catch { setNotice("Share this collection from your browser menu."); } }} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f1f5ef] text-[#617b67] transition hover:bg-[#e4ece2]"><Share2 size={15} /></button>
                  </div>
                  {items.length > 0 ? <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{items.slice(0, 4).map((product) => <Link key={product.id} href={`/go/${product.id}?u=${encodeURIComponent(username)}`} title={product.name} className="group/item min-w-0"><div className="aspect-square overflow-hidden rounded-xl bg-[#f0f1eb] bg-cover bg-center transition group-hover/item:scale-[1.02]" style={{ backgroundImage: `url(${product.imageUrl})` }} /><p className="mt-2 truncate text-[11px] font-semibold text-[#43574a]">{product.name}</p></Link>)}</div> : <p className="mt-5 rounded-xl bg-[#f6f7f3] p-4 text-xs text-[#8a948c]">More picks are on their way.</p>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section id="all-picks" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="eyebrow">Good things, collected</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Browse all picks.</h2><p className="mt-2 text-sm text-[#829087]">Every recommendation, in one place.</p></div>
          <span className="text-xs font-medium text-[#849087]">{allProducts.length} items</span>
        </div>
        {allProducts.length > 0 ? <div className="product-mosaic grid grid-cols-2 items-start gap-3 sm:gap-5 lg:grid-cols-3">{allProducts.map((product, index) => <ProductCard key={product.id} product={product} username={username} index={index} />)}</div> : <div className="rounded-3xl border border-dashed border-[#dce4d9] bg-white/70 px-6 py-14 text-center"><Compass className="mx-auto text-[#8ba18d]" size={28} /><h3 className="mt-3 font-semibold">The collection is taking shape.</h3><p className="mt-2 text-sm text-[#849087]">Check back soon for new recommendations.</p></div>}
      </section>

      <footer className="border-t border-[#e4e9e0] bg-[#f0f3ec] px-5 py-8 text-center sm:px-8">
        <p className="text-xs text-[#849087]">A little corner of the internet, curated by {creator.displayName}.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-black tracking-[-.06em] text-[#385a45]">bubbli.in<span className="text-[#bd775c]">.</span></Link>
        <p className="mt-2 text-[10px] text-[#9aa49a]">Recommendations are personal. Prices and availability may change at the seller.</p><nav className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] text-[#78877b]"><Link href="/about">About Bubbli.in</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/affiliate-disclosure">Affiliate disclosure</Link><a href="mailto:support@bubbli.in">Support</a></nav>
      </footer>
    </main>
  );
}

function ProductCard({ product, username, index = 0 }: { product: StoreProduct; username: string; index?: number }) {
  const [shared, setShared] = useState(false);
  async function share() {
    const url = `${window.location.origin}/go/${product.id}?u=${encodeURIComponent(username)}`;
    try {
      const result = await shareLink(url, product.name, product.recommendation);
      if (result === "copied") setShared(true);
    } catch {
      try { await copyLink(url); setShared(true); } catch { /* Sharing is optional. */ }
    }
  }
  return (
    <article className={`group min-w-0 overflow-hidden rounded-[1.35rem] border border-[#e5e9e1] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#233f30]/10 ${index % 5 === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
      <Link href={`/go/${product.id}?u=${encodeURIComponent(username)}`} className={`relative block overflow-hidden bg-[#eff1eb] bg-cover bg-center ${index % 5 === 0 ? "aspect-[1.8/1] lg:aspect-[1.2/1]" : "aspect-[1/1] sm:aspect-[1.15/1]"}`} style={{ backgroundImage: `url(${product.imageUrl})` }} aria-label={`View ${product.name}`}>
        {product.featured && <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#49644e] shadow-sm"><Sparkles size={10} className="mr-1 inline" /> Creator’s pick</span>}
        <span className="absolute bottom-4 right-4 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-[#315c4c] opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="p-3 sm:p-5">
        <div className="flex items-center justify-between gap-3"><p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-[#8ba08b]">{product.source || "RECOMMENDED"}</p>{product.price && <p className="shrink-0 text-sm font-bold text-[#315c4c]">{product.price}</p>}</div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#263b2e]">{product.name}</h3>
        {(product.recommendation || product.description) && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#7a887e]">{product.recommendation || product.description}</p>}
        {product.reviewUrl && validateHttpUrl(product.reviewUrl) && <a href={product.reviewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#68866e] hover:text-[#315c4c]"><Play size={13} /> Watch my review</a>}
        <div className="mt-5 flex gap-2">
          <Link href={`/go/${product.id}?u=${encodeURIComponent(username)}`} className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#294f3e] px-2 text-[10px] font-bold text-white transition hover:bg-[#1d3d30] sm:min-h-12 sm:px-4 sm:text-xs">View recommendation <ArrowUpRight size={15} /></Link>
          <button aria-label={`Copy link for ${product.name}`} onClick={async () => { try { await copyLink(`${window.location.origin}/go/${product.id}?u=${encodeURIComponent(username)}`); setShared(true); } catch { setShared(false); } }} className="grid size-11 shrink-0 place-items-center rounded-full border border-[#e2e8df] text-[#607a66] transition hover:bg-[#f1f5ef]"><Link2 size={15} /></button>
        </div>
        <a href={whatsappShareUrl(`${typeof window !== "undefined" ? window.location.origin : "https://bubbli.in"}/go/${product.id}?u=${encodeURIComponent(username)}`, `Hi, I’m interested in ${product.name}. Could you share more details?`)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#68866e] hover:text-[#315c4c]">Send to a friend on WhatsApp <ArrowRight size={12} /></a>
        {shared && <p role="status" className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#5d7e65]"><Check size={11} /> Product link copied</p>}
      </div>
    </article>
  );
}
