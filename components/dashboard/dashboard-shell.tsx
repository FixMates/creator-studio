"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleUserRound, FolderHeart, LayoutDashboard, Package, Settings, Store } from "lucide-react";
import type { ReactNode } from "react";
import { useDemoCreator } from "@/hooks/use-demo-creator";

const nav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Store", href: "/dashboard/store", icon: Store },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Collections", href: "/dashboard/collections", icon: FolderHeart },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const creator = useDemoCreator();
  return <div className="min-h-screen bg-[#f5f7f3] text-[#20362a]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-[#e7ebe4] bg-white px-5 py-6 lg:flex">
      <Link href="/" className="text-[1.35rem] font-extrabold tracking-[-.07em]">creator<span className="text-[#789681]">store</span><span className="text-[#bd775c]">.</span></Link>
      <div className="mt-10 flex items-center gap-3 rounded-2xl bg-[#f5f7f3] p-3"><span className="grid size-10 place-items-center overflow-hidden rounded-full bg-[#dfe9df] font-serif text-lg italic">{creator.avatarUrl?<span className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${creator.avatarUrl})`}}/>:creator.displayName[0]}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{creator.displayName}’s studio</span><span className="mt-0.5 block text-[11px] text-[#849087]">@{creator.username}</span></span></div>
      <nav className="mt-8 space-y-1">{nav.map(({ label, href, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#edf3ed] text-[#41634d]" : "text-[#69766d] hover:bg-[#f6f8f4]"}`}><Icon size={17}/>{label}{label === "Products" && <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] text-[#869087]">04</span>}</Link>; })}</nav>
      <div className="mt-auto rounded-2xl bg-[#2e4b3a] p-4 text-white"><p className="text-sm font-semibold">Looking good ✳</p><p className="mt-1 text-xs leading-5 text-[#d1ddd2]">Your storefront is ready to share with the world.</p><Link href={`/${creator.username}`} className="mt-3 inline-flex text-xs font-semibold text-[#ccdfcc]">View your store ↗</Link></div>
      <Link href="/" className="mt-4 flex items-center gap-2 px-2 py-2 text-xs text-[#869087]"><CircleUserRound size={15}/> Back to CreatorStore</Link>
    </aside>
    <div className="lg:pl-[250px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e8ece5] bg-white/90 px-4 backdrop-blur sm:px-7"><div><p className="hidden text-[10px] font-bold uppercase tracking-[.16em] text-[#8b978d] sm:block">Creator studio</p><h1 className="text-lg font-semibold tracking-tight">{title}</h1></div><div className="flex items-center gap-3"><span className="rounded-full border border-[#e7ece5] bg-[#f8faf7] px-2.5 py-1 text-[10px] font-semibold text-[#738378]">DEMO MODE</span><span className="grid size-9 place-items-center rounded-full bg-[#dfe9df] font-serif italic">S</span></div></header>
      <div className="border-b border-[#eee8dd] bg-[#faf6ef] px-4 py-2 text-center text-[11px] text-[#806d56] sm:px-7">Demo workspace · changes are saved in this browser only</div>
      <main className="mx-auto max-w-[1250px] px-4 pb-24 pt-6 sm:px-7 sm:pt-8 lg:px-10">{children}</main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[#e6ebe3] bg-white/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">{nav.map(({ label, href, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 px-0.5 py-1 text-[8px] sm:text-[9px] ${active ? "text-[#4f735a]" : "text-[#89948b]"}`}><Icon size={18}/><span className="truncate">{label}</span></Link>; })}</nav>
  </div>;
}
