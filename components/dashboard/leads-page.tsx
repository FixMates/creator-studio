"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Plus, Trash2, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth } from "@/lib/firebase/client";
import { getLeadRepository } from "@/lib/repositories";
import type { CreatorLead, LeadStatus } from "@/types/store";

const statuses: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" }, { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow-up" }, { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not interested" },
];
const empty = { name: "", contact: "", productName: "", channel: "Instagram", notes: "" };

export function LeadsPage() {
  const [leads, setLeads] = useState<CreatorLead[]>([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh(uid = auth?.currentUser?.uid) {
    if (!uid) { setLeads([]); return; }
    try { setLeads(await getLeadRepository().list(uid)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load leads."); }
  }
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => { if (user) void refresh(user.uid); else setLeads([]); });
    return unsubscribe;
  }, []);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uid = auth?.currentUser?.uid;
    if (!uid) { setError("Sign in again to manage leads."); return; }
    setBusy(true); setError("");
    try {
      await getLeadRepository().save({ id: crypto.randomUUID(), creatorId: uid, ...form, status: "new", notes: form.notes.trim() });
      setForm(empty); setShowForm(false); await refresh(uid);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save this lead."); }
    finally { setBusy(false); }
  }
  async function update(lead: CreatorLead, patch: Partial<CreatorLead>) {
    try { await getLeadRepository().save({ ...lead, ...patch }); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update lead."); }
  }
  async function remove(lead: CreatorLead) {
    if (!window.confirm(`Delete lead “${lead.name}”?`)) return;
    try { await getLeadRepository().delete(lead.id); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete lead."); }
  }

  return <DashboardShell title="Orders & Leads">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Turn interest into relationships</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Your leads</h2><p className="mt-1 text-sm text-[#897b9b]">Keep track of enquiries and update each lead as you follow up.</p></div><button onClick={()=>setShowForm(!showForm)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b22ef] to-[#d52ac0] px-5 text-sm font-bold text-white"><Plus size={16}/> Add a lead</button></div>
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {showForm&&<form onSubmit={(e)=>void add(e)} className="mt-5 grid gap-3 rounded-2xl border border-[#eee6f7] bg-white p-5 sm:grid-cols-2"><label className="field-label">Name *<input required maxLength={80} className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="field-label">Contact *<input required maxLength={120} className="field-input" placeholder="Email, phone or Instagram handle" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/></label><label className="field-label">Interested in<input className="field-input" value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})}/></label><label className="field-label">Source<select className="field-input" value={form.channel} onChange={e=>setForm({...form,channel:e.target.value})}><option>Instagram</option><option>WhatsApp</option><option>Storefront</option><option>YouTube</option><option>Other</option></select></label><label className="field-label sm:col-span-2">Notes<textarea className="field-input min-h-20" maxLength={1000} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={()=>setShowForm(false)} className="rounded-full px-4 text-sm text-[#8b789e]">Cancel</button><button disabled={busy} className="min-h-10 rounded-full bg-[#8b22ef] px-5 text-sm font-bold text-white">{busy?"Saving…":"Save lead"}</button></div></form>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#eee6f7] bg-white">
      <div className="flex items-center justify-between border-b border-[#f0eaf7] px-5 py-4"><div><h3 className="font-bold">Lead pipeline</h3><p className="mt-1 text-xs text-[#9889a8]">{leads.length} saved enquiries</p></div><Users className="text-[#9b4de0]"/></div>
      {leads.length ? <div className="divide-y divide-[#f1ebf7]">{leads.map(lead=><article key={lead.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_170px_auto] sm:items-center sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-bold">{lead.name}</p><p className="mt-1 truncate text-xs text-[#897b9b]">{lead.contact}</p></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#51376d]">{lead.productName||"General enquiry"}</p><p className="mt-1 text-[11px] text-[#a08fb0]">Via {lead.channel}</p></div><select aria-label={`Status for ${lead.name}`} className="field-input mt-0 py-2 text-xs" value={lead.status} onChange={e=>void update(lead,{status:e.target.value as LeadStatus})}>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select><button aria-label={`Delete ${lead.name}`} onClick={()=>void remove(lead)} className="grid size-9 place-items-center rounded-lg text-[#a38bb5] hover:bg-[#fbf5ff]"><Trash2 size={15}/></button>{lead.notes&&<p className="text-xs leading-5 text-[#81738f] sm:col-span-4">{lead.notes}</p>}</article>)}</div> : <div className="px-6 py-14 text-center"><Users className="mx-auto text-[#b18bd6]" size={26}/><p className="mt-3 font-semibold">No leads yet</p><p className="mt-1 text-sm text-[#9384a2]">Add enquiries you receive through Instagram, WhatsApp or your storefront.</p></div>}
    </section>
    <p className="mt-3 text-[11px] text-[#9c8cac]">Lead tracking is manual in this release. Automatic WhatsApp/Instagram inbox sync is not included.</p>
  </DashboardShell>;
}
