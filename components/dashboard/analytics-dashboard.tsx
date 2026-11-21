"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { BarChart3, Eye, MousePointerClick, Package, RefreshCw, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth } from "@/lib/firebase/client";
import { getAnalyticsRepository } from "@/lib/repositories";
import type { AnalyticsSummary } from "@/types/store";

const empty: AnalyticsSummary = { storeViews: 0, productClicks: 0, daily: [], topProducts: [], sources: [] };
const number = (value: number) => value.toLocaleString("en-IN");

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary>(empty);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(period = days) {
    const uid = auth?.currentUser?.uid;
    if (!uid) { setError("Sign in to view your analytics."); setLoading(false); return; }
    setLoading(true); setError("");
    try { setSummary(await getAnalyticsRepository().getSummary(uid, period)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Analytics could not be loaded."); }
    finally { setLoading(false); }
  }

  useEffect(() => {\n    if (!auth) { setLoading(false); setError("Firebase authentication is not configured."); return; }\n    const unsubscribe = onAuthStateChanged(auth, (user) => {\n      if (user) void load(30);\n      else { setLoading(false); setError("Sign in to view your analytics."); }\n    });\n    return unsubscribe;\n  }, []);

  const daily = summary.daily ?? [];
  const maxValue = Math.max(1, ...daily.map((day) => Math.max(day.views, day.clicks)));
  const totalProducts = summary.totalProducts ?? 0;
  const sources = summary.sources ?? [];
  const topProducts = summary.topProducts ?? [];

  return <DashboardShell title="Analytics">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Performance, without guesswork</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Your store analytics</h2><p className="mt-1 text-sm text-[#7a877e]">Real storefront visits and product click-throughs recorded by Bubbli.in.</p></div>
      <div className="flex items-center gap-2"><div className="flex rounded-full border border-[#e4e9e1] bg-white p-1">{[7,30,90].map((value)=><button key={value} onClick={()=>{setDays(value);void load(value);}} className={`min-h-9 rounded-full px-3 text-xs font-semibold ${days===value?"bg-[#315c4c] text-white":"text-[#748178]"}`}>{value} days</button>)}</div><button aria-label="Refresh analytics" onClick={()=>void load()} className="grid size-10 place-items-center rounded-full border border-[#e4e9e1] bg-white text-[#63786a]"><RefreshCw size={15}/></button></div>
    </div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        {label:"Store visits",value:summary.storeViews,icon:Eye,note:"One view per browser session"},
        {label:"Product clicks",value:summary.productClicks,icon:MousePointerClick,note:"Tracked before redirect"},
        {label:"Click-through rate",value:summary.storeViews?Math.round(summary.productClicks/summary.storeViews*1000)/10+"%":"—",icon:TrendingUp,note:"Clicks ÷ store visits"},
        {label:"Active products",value:totalProducts,icon:Package,note:"Published in your store"},
      ].map(({label,value,icon:Icon,note})=><article key={label} className="rounded-2xl border border-[#e9ede6] bg-white p-5"><div className="flex items-center justify-between text-sm text-[#77847b]"><span>{label}</span><span className="grid size-9 place-items-center rounded-xl bg-[#eff4ee] text-[#66826d]"><Icon size={17}/></span></div><p className="mt-4 text-3xl font-semibold tracking-tight">{loading?"—":typeof value==="number"?number(value):value}</p><p className="mt-1 text-[11px] text-[#929b93]">{note}</p></article>)}
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
      <section className="rounded-2xl border border-[#e9ede6] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><h3 className="font-semibold">Traffic over time</h3><p className="mt-1 text-xs text-[#879188]">Daily views and product clicks · last {days} days</p></div><BarChart3 className="text-[#7e9b82]" size={18}/></div>
        {daily.some((d)=>d.views||d.clicks)?<><div className="mt-7 flex h-48 items-end gap-1.5 sm:gap-2">{daily.map((d,index)=><div key={d.date} className="group flex min-w-0 flex-1 items-end justify-center gap-[2px]" title={`${d.date}: ${d.views} views, ${d.clicks} clicks`}><div className="w-1/2 rounded-t-sm bg-[#a8c2a9]" style={{height:`${Math.max(d.views?3:0,d.views/maxValue*100)}%`}}/><div className="w-1/2 rounded-t-sm bg-[#315c4c]" style={{height:`${Math.max(d.clicks?3:0,d.clicks/maxValue*100)}%`}}/></div>)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#929b93]"><span>{daily[0]?.date}</span><span>{daily[daily.length-1]?.date}</span></div><div className="mt-4 flex gap-4 text-[11px] text-[#758178]"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[#a8c2a9]"/> Store visits</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[#315c4c]"/> Product clicks</span></div></>:<div className="grid min-h-48 place-items-center text-center"><div><BarChart3 className="mx-auto text-[#a0b2a1]" size={26}/><p className="mt-3 text-sm font-semibold">No traffic recorded yet</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#8a958c]">Share your store link. Visits and product clicks will appear here as people browse.</p></div></div>}
      </section>
      <section className="rounded-2xl border border-[#e9ede6] bg-white p-5 sm:p-6"><h3 className="font-semibold">Traffic sources</h3><p className="mt-1 text-xs text-[#879188]">Where store visitors came from</p>{sources.length?<div className="mt-5 space-y-4">{sources.map((source)=>{const width=Math.max(4,source.visits/Math.max(1,sources[0].visits)*100);return <div key={source.source}><div className="mb-1.5 flex justify-between gap-2 text-xs"><span className="truncate text-[#53645a]">{source.source}</span><span className="font-semibold text-[#65776a]">{number(source.visits)}</span></div><div className="h-2 rounded-full bg-[#eff2ed]"><div className="h-2 rounded-full bg-[#86a48a]" style={{width:`${width}%`}}/></div></div>})}</div>:<div className="grid min-h-40 place-items-center text-center text-xs text-[#89948b]">Source breakdown will appear after your first store visits.</div>}</section>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-[#e9ede6] bg-white p-5 sm:p-6"><h3 className="font-semibold">Most-clicked products</h3><p className="mt-1 text-xs text-[#879188]">Products visitors opened from your store</p>{topProducts.length?<div className="mt-4 divide-y divide-[#eef0eb]">{topProducts.map((product,index)=><div key={product.productId} className="flex items-center gap-3 py-3"><span className="grid size-8 place-items-center rounded-lg bg-[#f1f5ef] text-xs font-semibold text-[#68836d]">{index+1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span><span className="text-sm font-semibold tabular-nums">{number(product.clicks)}</span><span className="text-[10px] text-[#929b93]">clicks</span></div>)}</div>:<p className="py-10 text-center text-xs text-[#89948b]">Your product rankings will appear here after your first clicks.</p>}</section>
      <section className="rounded-2xl border border-[#e9ede6] bg-white p-5 sm:p-6"><h3 className="font-semibold">How these numbers work</h3><div className="mt-4 space-y-3 text-xs leading-5 text-[#7c8980]"><p><strong className="text-[#46594b]">Store visits:</strong> one recorded visit per browser session and creator store. Repeat visits in the same tab session are deduplicated.</p><p><strong className="text-[#46594b]">Product clicks:</strong> each product redirect attempt is recorded before sending the visitor to the seller or external app.</p><p><strong className="text-[#46594b]">Traffic sources:</strong> UTM source when present; otherwise the referring website, or Direct.</p><p><strong className="text-[#46594b]">Reporting window:</strong> {days} days, based on server timestamps. The current implementation reads up to 1,000 recent event records per creator.</p></div><p className="mt-4 rounded-xl bg-[#f5f7f3] p-3 text-[10px] leading-4 text-[#89948b]">Analytics are approximate and browser-based. Ad blockers, private browsing, disabled storage, network failures and automated traffic can affect counts. No personal customer information is collected.</p></section>
    </div>
  </DashboardShell>;
}
