"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Eye, MousePointerClick, Package, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth } from "@/lib/firebase/client";
import { getAnalyticsRepository, getCreatorRepository, getProductRepository } from "@/lib/repositories";
import type { AnalyticsSummary, StoreProduct, Creator } from "@/types/store";

export function Overview() {
  const [summary, setSummary] = useState<AnalyticsSummary>({ storeViews: 0, productClicks: 0 });
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    let cancelled = false;
    void Promise.all([
      getCreatorRepository().getForUser(uid),
      getAnalyticsRepository().getSummary(uid),
      getProductRepository().list(uid),
    ]).then(([c, s, p]) => {
      if (cancelled) return;
      setCreator(c);
      setSummary(s);
      setProducts(p);
    }).catch((error) => {
      if (!cancelled) console.error("Dashboard data failed to load:", error);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const topProduct = products.find((product) => product.id === summary.topProductId);
  const firstName = creator?.displayName?.trim().split(" ")[0]?.replace(/[’']s$/, "") || "Creator";
  const metrics = [
    { label: "Store views", value: summary.storeViews.toLocaleString(), change: "+12.8%", icon: Eye, note: "vs. last month" },
    { label: "Product clicks", value: summary.productClicks.toLocaleString(), change: "+8.4%", icon: MousePointerClick, note: "vs. last month" },
    { label: "Total products", value: String(products.length).padStart(2, "0"), change: "Keep curating", icon: Package, note: "in your storefront" },
  ];

  return <DashboardShell title="Overview"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Your CreatorStore</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Good to see you, {loading ? "..." : firstName} <span className="text-[#bd8c64]">✳</span></h2><p className="mt-1 text-sm text-[#7a877e]">Here’s how your little corner is doing.</p></div><Link href="/dashboard/products/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#315c4c] px-5 text-sm font-semibold text-white hover:bg-[#24483b]">Add a product <ArrowRight size={15}/></Link></div>
    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, change, icon: Icon, note })=><article key={label} className="rounded-2xl border border-[#e9ede6] bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#758178]">{label}</span><span className="grid size-9 place-items-center rounded-xl bg-[#eff4ee] text-[#66826d]"><Icon size={17}/></span></div><div className="mt-4 flex items-baseline gap-2"><span className="text-3xl font-semibold tracking-tight">{value}</span>{label !== "Total products" && <span className="text-[11px] font-semibold text-[#6d9674]">{change}</span>}</div><p className="mt-1 text-xs text-[#929b93]">{note}</p></article>)}
      <article className="rounded-2xl border border-[#e9ede6] bg-white p-5"><div className="flex items-center gap-2 text-sm text-[#758178]"><Sparkles size={15} className="text-[#b98761]"/>Top product</div><p className="mt-4 truncate text-lg font-semibold">{topProduct?.name ?? "Your next favourite"}</p><p className="mt-1 text-xs text-[#929b93]">{topProduct ? `${topProduct.clicks} visits to seller` : "Add products to see what resonates"}</p></article></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><section className="rounded-2xl border border-[#e9ede6] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><h3 className="font-semibold">Your products</h3><p className="mt-1 text-xs text-[#879188]">A little snapshot of your storefront.</p></div><Link href="/dashboard/products" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5f8068]">All products <ArrowRight size={13}/></Link></div>{products.length ? <div className="mt-5 divide-y divide-[#eef0eb]">{products.slice(0, 4).map((product)=><div key={product.id} className="flex items-center gap-3 py-3"><div className="size-12 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${product.imageUrl})` }}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="mt-0.5 text-xs text-[#879188]">{product.source}</p></div><span className="hidden text-xs text-[#879188] sm:block">{product.clicks} clicks</span><span className="text-sm font-semibold">{product.price}</span></div>)}</div> : <div className="py-12 text-center"><p className="font-medium">A fresh start</p><p className="mt-1 text-sm text-[#879188]">Add your first recommendation to get going.</p><Link href="/dashboard/products/new" className="mt-4 inline-flex text-sm font-semibold text-[#5f8068]">Add a product <ArrowRight size={14}/></Link></div>}</section>
      <section className="rounded-2xl border border-[#e9ede6] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Store visits</h3><p className="mt-1 text-xs text-[#879188]">Last 7 days</p></div><button aria-label="View analytics" className="grid size-8 place-items-center rounded-full bg-[#f5f7f3] text-[#6d7d70]"><ArrowUpRight size={15}/></button></div><div className="mt-8 flex h-32 items-end gap-2">{[45,63,52,76,58,89,72].map((height,i)=><div key={i} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-md ${i===5 ? "bg-[#70947a]" : "bg-[#dce7dc]"}`} style={{height:`${height}%`}}/><span className="text-[9px] text-[#9aa39a]">{["M","T","W","T","F","S","S"][i]}</span></div>)}</div><div className="mt-4 rounded-xl bg-[#f7f8f5] p-3 text-xs leading-5 text-[#78847b]">Your weekend picks are getting noticed. Keep sharing what you love.</div></section></div>
    <div className="mt-5 rounded-2xl bg-[#eaf0e8] p-5 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Your link is ready to travel</p><p className="mt-1 text-xs text-[#758477]">creatorstore.com/{creator?.username ?? "your-store"}</p></div><Link href="/dashboard/store" className="mt-3 inline-flex text-xs font-semibold text-[#52755c] sm:mt-0">Manage your store <ArrowRight size={14}/></Link></div>
    </DashboardShell>;
}
