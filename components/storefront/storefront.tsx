"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, ExternalLink, Link2, Search, Share2, ShoppingBag } from "lucide-react";
import { getCollectionRepository, getCreatorRepository, getProductRepository } from "@/lib/repositories";
import { copyLink, shareLink } from "@/lib/services/sharing";
import { trackStoreView } from "@/lib/services/analytics";
import type { Creator, StoreCollection, StoreProduct } from "@/types/store";
import { validateHttpUrl } from "@/lib/services/url";

const themeStyles = {
  ananya: { page: "#fff8fb", ink: "#27133e", accent: "#8b22ef", card: "#ffffff" },
  meera: { page: "#fff7fb", ink: "#3b183d", accent: "#d52ac0", card: "#ffffff" },
  sundar: { page: "#f9f5ff", ink: "#24103e", accent: "#a21caf", card: "#ffffff" },
  minimal: { page: "#ffffff", ink: "#24143f", accent: "#7c3aed", card: "#ffffff" },
  bold: { page: "#190c2c", ink: "#ffffff", accent: "#ec2c9b", card: "#28143d" },
  lifestyle: { page: "#fff8f2", ink: "#34203c", accent: "#b832c5", card: "#ffffff" },
} as const;
  }, [username]);

  const orderedProducts = useMemo(
    () => [...products].filter((product) => product.active !== false && (product.availability ?? "active") !== "deactivated")
      .sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order),
    [products],
  );
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orderedProducts.filter((product) => {
      const matchesCollection = activeCollection === "all" ||
        Boolean(collections.find((collection) => collection.id === activeCollection)?.productIds.includes(product.id));
      const matchesSearch = !query || [product.name, product.description, product.recommendation, product.source]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesCollection && matchesSearch;
    });
  }, [orderedProducts, collections, activeCollection, search]);
  const featuredProducts = orderedProducts.filter((product) => product.featured);
  const theme = themeStyles[creator?.theme ?? "ananya"];

  async function share() {
    const url = `${window.location.origin}/${username}`;
    try {
      const result = await shareLink(url, creator?.displayName ?? "CreatorStore", creator?.bio);
      setNotice(result === "copied" ? "Store link copied." : result === "cancelled" ? "Share cancelled." : "Store shared.");
    } catch {
      try { await copyLink(url); setNotice("Store link copied."); }
      catch { setNotice("Sharing isn’t available here."); }
    }
  }

  if (loading) return (
    <main aria-busy="true" className="min-h-screen bg-[#f8f6f0] px-4">
      <div className="mx-auto max-w-7xl animate-pulse py-6">
        <div className="h-12 rounded-xl bg-[#e9e5da]" />
        <div className="mt-8 h-44 rounded-2xl bg-[#e9e5da]" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[.8/1] rounded-xl bg-[#e9e5da]" />)}
        </div>
      </div>
    </main>
  );

  if (!creator) return (
    <main className="grid min-h-screen place-items-center bg-[#f8f6f0] px-6 text-center">
      <section className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#71816f]">{loadFailed ? "Store unavailable" : "Store not found"}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#26251f]">{loadFailed ? "We couldn’t load this store." : "This store isn’t available yet."}</h1>
        <p className="mt-3 text-sm leading-6 text-[#7d7460]">{loadFailed ? "Please refresh and try again." : "Check the link or create your own store."}</p>
        {loadFailed ? <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-[#315c4c] px-5 py-3 text-sm font-semibold text-white">Try again</button> : <Link href="/onboarding" className="mt-6 inline-flex rounded-full bg-[#315c4c] px-5 py-3 text-sm font-semibold text-white">Create your store</Link>}
      </section>
    </main>
  );

  const socials = Object.entries(creator.socialLinks ?? {}).filter(([key, value]) =>
    value && validateHttpUrl(key === "whatsapp" && !value.startsWith("http") ? `https://wa.me/${value.replace(/\\D/g, "")}` : value),
  );
  const whatsapp = creator.socialLinks?.whatsapp;
  const whatsappUrl = whatsapp ? (validateHttpUrl(whatsapp) ?? (whatsapp.replace(/\\D/g, "").length >= 10 ? `https://wa.me/${whatsapp.replace(/\\D/g, "")}` : "")) : "";

  return (
    <main className="min-h-screen" style={{ background: theme.page, color: theme.ink }}>
      <header className="sticky top-0 z-30 border-b border-black/[.07] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link href={`/${username}`} className="flex min-w-0 items-center gap-3" aria-label={`${creator.displayName} home`}>
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-black/10 bg-[#f4f2ec] text-sm font-semibold text-[#526b50]">
              {creator.avatarUrl ? <Image src={creator.avatarUrl} alt={`${creator.displayName} logo`} width={80} height={80} unoptimized className="h-full w-full object-contain" /> : creator.displayName.trim().charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">{creator.displayName}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <a href="#products" className="hidden rounded-full px-3 py-2 text-xs font-semibold text-[#5f665d] hover:bg-[#f4f3ee] sm:inline-flex">Shop all</a>
            <button onClick={() => void share()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 text-xs font-semibold"><Share2 size={14} /> <span className="hidden sm:inline">Share store</span><span className="sm:hidden">Share</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <section className="border-b border-black/[.08] py-8 sm:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-9">
            <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-sm sm:size-36">
              {creator.avatarUrl ? <Image src={creator.avatarUrl} alt={`${creator.displayName} business logo`} width={288} height={288} unoptimized className="h-full w-full object-contain" /> : <span className="text-4xl font-semibold tracking-tight" style={{ color: theme.accent }}>{creator.displayName.trim().charAt(0).toUpperCase()}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em]" style={{ color: theme.accent }}>{creator.category} · Independent store</p>
              <h1 className="mt-2 break-words text-3xl font-semibold tracking-[-.04em] sm:text-5xl">{creator.displayName}</h1>
              {creator.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#6e7068] sm:text-base">{creator.bio}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-white" style={{ background: theme.accent }}>Contact on WhatsApp <ArrowUpRight size={14} /></a>}
                {socials.filter(([key]) => key !== "whatsapp").map(([key, value]) => (
                  <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold capitalize">{key} <ExternalLink size={12} /></a>
                ))}
              </div>
            </div>
          </div>
          {notice && <p role="status" aria-live="polite" className="mt-4 text-xs font-semibold" style={{ color: theme.accent }}>{notice}</p>}
        </section>

        {featuredProducts.length > 0 && (
          <section className="border-b border-black/[.08] py-8 sm:py-10">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: theme.accent }}>Handpicked for you</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Featured products</h2></div>
              <a href="#products" className="text-xs font-semibold underline underline-offset-4">Explore all</a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} username={username} accent={theme.accent} />)}
            </div>
          </section>
        )}

        <section id="products" className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: theme.accent }}>The collection</p><h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Shop all products</h2><p className="mt-1 text-xs text-[#7b7d75]">{orderedProducts.length} {orderedProducts.length === 1 ? "product" : "products"}</p></div>
            <label className="flex min-h-11 w-full items-center gap-2 rounded-full border border-black/10 bg-white px-4 sm:max-w-xs"><Search size={15} className="shrink-0 text-[#85877f]" /><input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this store" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0a197]" /></label>
          </div>

          {collections.length > 0 && (
            <nav aria-label="Shop collections" className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button onClick={() => setActiveCollection("all")} className="min-h-9 shrink-0 rounded-full border px-4 text-xs font-semibold" style={activeCollection === "all" ? { background: theme.accent, color: "#fff", borderColor: theme.accent } : { background: "#fff", borderColor: "rgba(0,0,0,.12)" }}>All products</button>
              {collections.map((collection) => <button key={collection.id} onClick={() => setActiveCollection(collection.id)} className="min-h-9 shrink-0 rounded-full border px-4 text-xs font-semibold" style={activeCollection === collection.id ? { background: theme.accent, color: "#fff", borderColor: theme.accent } : { background: "#fff", borderColor: "rgba(0,0,0,.12)" }}>{collection.title}</button>)}
            </nav>
          )}

          {visibleProducts.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} username={username} accent={theme.accent} />)}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-white/60 px-5 py-14 text-center">
              <ShoppingBag className="mx-auto text-[#899084]" size={25} />
              <h3 className="mt-3 text-base font-semibold">{orderedProducts.length ? "No matching products" : "Products coming soon"}</h3>
              <p className="mt-1 text-sm text-[#7d8177]">{orderedProducts.length ? "Try another search or collection." : "This business is getting its products ready."}</p>
              {(search || activeCollection !== "all") && <button onClick={() => { setSearch(""); setActiveCollection("all"); }} className="mt-4 text-xs font-semibold underline underline-offset-4">Clear filters</button>}
            </div>
          )}
        </section>

        <section className="border-t border-black/[.08] py-8 sm:py-10">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: theme.accent }}>Behind the store</p><h2 className="mt-1 text-xl font-semibold">About {creator.displayName}</h2><p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#72746c]">{creator.bio || `${creator.displayName} curates products and recommendations for this store.`}</p></div>
            <div className="flex flex-wrap gap-2">
              {socials.map(([key, value]) => <a key={key} href={key === "whatsapp" ? whatsappUrl : value ?? ""} target="_blank" rel="noopener noreferrer" className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold capitalize">{key}</a>)}
              <button onClick={() => void share()} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ background: theme.accent }}><Share2 size={13} /> Share store</button>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-black/[.08] bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-[#777a72]">{creator.displayName} · {creator.category}</p>
          <nav className="flex flex-wrap justify-center gap-4 text-[10px] text-[#777a72]"><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/affiliate-disclosure">Affiliate disclosure</Link><a href="mailto:support@bubbli.in">Support</a></nav>
          <p className="text-[10px] text-[#96988f]">Storefront powered by Bubbli</p>
        </div>
      </footer>
    </main>
  );
}

function ProductCard({ product, username, accent }: { product: StoreProduct; username: string; accent: string }) {
  const [shared, setShared] = useState(false);
  const productUrl = `/go/${product.id}?u=${encodeURIComponent(username)}`;
  const actionLabel = product.redirectType === "whatsapp" ? "Enquire on WhatsApp" :
    product.redirectType === "instagram" ? "View on Instagram" :
    product.redirectType === "facebook" ? "View on Facebook" :
    product.redirectType === "other" ? "Open product link" : "Shop now";

  async function copyProductLink() {
    try { await copyLink(`${window.location.origin}${productUrl}`); setShared(true); }
    catch { setShared(false); }
  }

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-[0_3px_14px_-12px_rgba(0,0,0,.25)]">
      <Link href={productUrl} className="relative block aspect-[.88/1] overflow-hidden bg-[#f1efe8]" aria-label={`View ${product.name}`}>
        {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill unoptimized sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 23vw" className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.025]" /> : <div className="grid h-full place-items-center text-xs text-[#96978d]">Image unavailable</div>}
        {product.featured && <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[9px] font-semibold text-[#526b50]">Featured</span>}
      </Link>
      <div className="p-3 sm:p-4">
        {product.source && <p className="truncate text-[9px] font-semibold uppercase tracking-[.14em] text-[#8b8e83]">{product.source}</p>}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#292a24]">{product.name}</h3>
        {(product.recommendation || product.description) && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#777a71]">{product.recommendation || product.description}</p>}
        {product.price && <p className="mt-2 text-sm font-bold text-[#292a24]">{product.price}</p>}
        {product.availability === "out_of_stock" && <p className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">Out of Stock</p>}
        {product.availability === "coming_soon" && <p className="mt-2 inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-800">Coming Soon</p>}
        <div className="mt-3 flex items-center gap-2">
          {product.availability === "out_of_stock" || product.availability === "coming_soon" ? <span aria-disabled="true" className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-full bg-[#eee8f5] px-2 text-[10px] font-semibold text-[#8c7d9b] sm:text-xs">{product.availability === "out_of_stock" ? "Currently unavailable" : "Coming soon"}</span> : <Link href={productUrl} className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white sm:text-xs" style={{ background: accent }}>{actionLabel} <ArrowUpRight size={13} /></Link>}
          <button onClick={() => void copyProductLink()} aria-label={`Copy link for ${product.name}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-black/10 text-[#62665c]"><Link2 size={14} /></button>
        </div>
        {shared && <p role="status" className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#5d7e65]"><Check size={11} /> Link copied</p>}
      </div>
    </article>
  );
}
