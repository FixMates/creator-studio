"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { ArrowRight, ExternalLink, LogOut, Settings, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth } from "@/lib/firebase/client";
import { getCreatorRepository } from "@/lib/repositories";
import type { Creator } from "@/types/store";

export function SimpleSection({kind}:{kind:"analytics"|"settings"}) {
  const [user,setUser]=useState<User|null>(null);
  const [creator,setCreator]=useState<Creator|null>(null);
  useEffect(()=>{
    if(!auth)return;
    const unsubscribe=onAuthStateChanged(auth,(current)=>{
      setUser(current);
      if(current)void getCreatorRepository().getForUser(current.uid).then(setCreator).catch(()=>setCreator(null));
      else setCreator(null);
    });
    return unsubscribe;
  },[]);
  if(kind==="analytics")return <DashboardShell title="Analytics"><p className="eyebrow">Performance</p><h2 className="mt-2 text-2xl font-bold">Your analytics</h2><p className="mt-2 text-sm text-[#897b9b]">Open your real-time store performance dashboard.</p><Link href="/dashboard/analytics" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#8b22ef] px-5 py-3 text-sm font-bold text-white">View analytics <ArrowRight size={15}/></Link></DashboardShell>;
  return <DashboardShell title="Settings">
    <p className="eyebrow">Your Bubbli account</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Settings & account</h2><p className="mt-1 text-sm text-[#897b9b]">Manage your profile and account access.</p>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#eee6f7] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#f4eaff] text-[#8b22ef]"><UserRound/></span><div><h3 className="font-bold">Account details</h3><p className="text-xs text-[#9889a8]">Signed-in account</p></div></div><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#a08fb0]">Email address</p><p className="mt-1 break-all text-sm font-semibold">{user?.email??"Not available"}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#a08fb0]">Store username</p><p className="mt-1 text-sm font-semibold">{creator ? "@" + creator.username : "Loading…"}</p></section>
      <section className="rounded-2xl border border-[#eee6f7] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#f4eaff] text-[#8b22ef]"><Store/></span><div><h3 className="font-bold">Store profile</h3><p className="text-xs text-[#9889a8]">Public identity and links</p></div></div><p className="mt-4 text-sm leading-6 text-[#897b9b]">Update your store name, bio, category, WhatsApp number, social links and selected storefront theme.</p><Link href="/dashboard/store" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#8b22ef]">Edit store profile <ArrowRight size={14}/></Link>{creator&&<Link href={"/"+creator.username} target="_blank" className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#8b789e]">View public store <ExternalLink size={13}/></Link>}</section>
    </div>
    <section className="mt-4 rounded-2xl border border-[#eee6f7] bg-white p-5"><div className="flex items-center gap-3"><Settings className="text-[#9b4de0]"/><div><h3 className="font-bold">Future upgrades</h3><p className="mt-1 text-xs text-[#9889a8]">Payment, payout and shipping settings are intentionally not included in this release.</p></div></div></section>
    <button onClick={()=>auth&&void signOut(auth)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f0d5e8] bg-white px-5 text-sm font-bold text-[#bd287f]"><LogOut size={16}/> Log out</button>
  </DashboardShell>;
}
