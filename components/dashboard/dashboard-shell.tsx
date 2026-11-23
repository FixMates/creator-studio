"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleUserRound, FolderHeart, LayoutDashboard, Menu, Package, Settings, Store, X, LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getCreatorRepository } from "@/lib/repositories";
import type { Creator } from "@/types/store";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Collections", href: "/dashboard/collections", icon: FolderHeart },
  { label: "Customize store", href: "/dashboard/store", icon: Store },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Orders & Leads", href: "/dashboard/leads", icon: CircleUserRound },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!auth) { setCreator(null); return; }
    const load = (uid?: string) => {
      if (!uid) { setCreator(null); return; }
      void getCreatorRepository().getForUser(uid).then(setCreator).catch(() => setCreator(null));
    };
    load(auth.currentUser?.uid);
    const unsubscribe = onAuthStateChanged(auth, (user) => load(user?.uid));
    return unsubscribe;
  }, [pathname]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  const initial = creator?.displayName?.[0]?.toUpperCase() ?? "B";
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return <div className="min-h-screen bg-[#faf8ff] text-[#24143f]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col border-r border-[#eee6fa] bg-white px-5 py-6 lg:flex">
      <Link href="/" className="text-[1.55rem] font-black tracking-[-.07em] text-[#35105f]">bubbli<span className="bg-gradient-to-r from-[#8b22ef] to-[#f02b9b] bg-clip-text text-transparent">.</span></Link>
      <div className="mt-9 flex items-center gap-3 rounded-2xl bg-[#f8f2ff] p-3"><span className="grid size-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#8b22ef] to-[#f02b9b] font-bold text-white">{creator?.avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${creator.avatarUrl})`}}/> : initial}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{creator?.displayName ?? "Your Bubbli store"}</span><span className="mt-0.5 block truncate text-[11px] text-[#8b7a9f]">{creator ? `@${creator.username}` : "Creator account"}</span></span></div>
      <nav className="mt-8 space-y-1">{nav.map(({label,href,icon:Icon})=><Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive(href)?"bg-gradient-to-r from-[#8b22ef] to-[#d52ac0] text-white shadow-md shadow-purple-200":"text-[#6d5b82] hover:bg-[#f7f0ff]"}`}><Icon size={18}/>{label}</Link>)}</nav>
      <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#381064] to-[#7d1acb] p-4 text-white"><p className="text-sm font-bold">Your store, one link away ✨</p><p className="mt-1 text-xs leading-5 text-purple-100">Share your Bubbli storefront and grow your audience.</p>{creator&&<Link href={`/${creator.username}`} className="mt-3 inline-flex text-xs font-bold text-white underline underline-offset-4">View public store ↗</Link>}</div>
      <button onClick={()=>void signOut(auth!)} className="mt-4 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#8b789e]"><LogOut size={15}/> Log out</button>
    </aside>
    <div className="lg:pl-[258px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#eee6f7] bg-white/95 px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={()=>setDrawerOpen(true)} className="grid size-10 place-items-center rounded-xl bg-[#f7efff] text-[#7c20d4] lg:hidden"><Menu size={20}/></button><div><p className="hidden text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a18bb8] sm:block">BUBBLI CREATOR SPACE</p><h1 className="text-lg font-bold tracking-tight">{title}</h1></div></div>
        <div className="flex items-center gap-2"><span className="hidden text-xs font-semibold text-[#8a789e] sm:block">bubbli.in</span><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#8b22ef] to-[#f02b9b] font-bold text-white">{initial}</span></div>
      </header>
      <main className="mx-auto max-w-[1250px] px-4 pb-28 pt-6 sm:px-7 sm:pt-8 lg:px-10">{children}</main>
    </div>
    {drawerOpen&&<div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-[#1e0b32]/45" onClick={()=>setDrawerOpen(false)}/><aside className="relative flex h-full w-[min(86vw,330px)] flex-col bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><Link href="/" className="text-2xl font-black tracking-[-.07em] text-[#35105f]">bubbli<span className="text-[#d52ac0]">.</span></Link><button aria-label="Close menu" onClick={()=>setDrawerOpen(false)} className="grid size-9 place-items-center rounded-full bg-[#f7efff]"><X/></button></div><div className="mt-8 rounded-2xl bg-[#f8f2ff] p-4"><p className="font-bold">{creator?.displayName??"Your Bubbli store"}</p><p className="mt-1 text-xs text-[#8b789e]">{creator?`@${creator.username}`:"Creator account"}</p></div><nav className="mt-6 space-y-1">{nav.map(({label,href,icon:Icon})=><Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive(href)?"bg-gradient-to-r from-[#8b22ef] to-[#d52ac0] text-white":"text-[#6d5b82] hover:bg-[#f7f0ff]"}`}><Icon size={18}/>{label}</Link>)}</nav><button onClick={()=>void signOut(auth!)} className="mt-auto flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-[#8b789e]"><LogOut size={17}/> Log out</button></aside></div>}
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#eee6f7] bg-white/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">{nav.filter((item)=>item.href!=="/dashboard/settings").slice(0,5).map(({label,href,icon:Icon})=><Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 px-0.5 py-1 text-[9px] font-semibold ${isActive(href)?"text-[#8b22ef]":"text-[#998ba8]"}`}><Icon size={19}/><span className="truncate">{label==="Customize store"?"Store":label}</span></Link>)}</nav>
  </div>;
}
