"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase/client";
import { imageFileToDataUrl } from "@/lib/services/image";

type Tab = "overview" | "users" | "stores" | "products" | "categories" | "configuration" | "audit";
type Row = Record<string, unknown>;
type Result = Record<string, unknown>;
const tabNames: Array<[Tab, string]> = [["overview", "Overview"], ["users", "Users"], ["stores", "Stores"], ["products", "Products"], ["categories", "Categories"], ["configuration", "Configuration"], ["audit", "Audit log"]];
const initialConfig = {platformName: "Bubbli", supportEmail: "", termsUrl: "/terms", privacyUrl: "/privacy", announcement: "", maintenanceMode: false, featureFlags: {}, limits: {maxProductsPerCreator: 100}};

function text(value: unknown, fallback = "—") { return typeof value === "string" && value ? value : fallback; }
function rows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object") : []; }
function title(tab: Tab) { return tabNames.find(([key]) => key === tab)?.[1] ?? "Overview"; }

export function AdminConsole() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [role, setRole] = useState("");
  const [authReady, setAuthReady] = useState(!auth);
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Result>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedUid, setSelectedUid] = useState("");
  const [note, setNote] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [configDraft, setConfigDraft] = useState(JSON.stringify(initialConfig, null, 2));

  const invoke = useCallback(async (action: string, values: Row = {}) => {
    if (!functions) throw new Error("Firebase is not configured.");
    const callable = httpsCallable<Row, Result>(functions, "adminConsole");
    const response = await callable({action, ...values});
    return response.data;
  }, []);

  const load = useCallback(async (nextTab: Tab, search = "") => {
    setLoading(true); setError(""); setNotice("");
    try {
      const action: Record<Tab, string> = {overview: "dashboard", users: "listUsers", stores: "listStores", products: "listProducts", categories: "listCategories", configuration: "getConfig", audit: "listAudit"};
      const result = await invoke(action[nextTab], search ? {query: search} : {});
      setData(result);
      if (nextTab === "configuration" && result.config && typeof result.config === "object") setConfigDraft(JSON.stringify(result.config, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load platform data.");
    } finally { setLoading(false); }
  }, [invoke]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      setAuthReady(false);
      if (!user) { router.replace("/login"); return; }
      setUid(user.uid);
      try {
        const token = await user.getIdTokenResult(true);
        const currentRole = typeof token.claims.platformRole === "string" ? token.claims.platformRole : "";
        setRole(currentRole);
        setAuthReady(true);
        if (currentRole) {
          await invoke("recordLogin");
          await load("overview");
        }
      } catch (caught) {
        setAuthReady(true);
        setError(caught instanceof Error ? caught.message : "Could not verify administrator access.");
      }
    });
  }, [invoke, load, router]);

  const itemRows = useMemo(() => rows(data.items), [data]);
  const canModerate = ["super_admin", "admin", "moderator"].includes(role);
  const canManage = ["super_admin", "admin"].includes(role);

  async function perform(action: string, values: Row, success: string) {
    setLoading(true); setError(""); setNotice("");
    try { await invoke(action, values); setNotice(success); await load(tab, query); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The operation failed."); }
    finally { setLoading(false); }
  }

  async function selectUser(userUid: string) {
    setSelectedUid(userUid);
    try {
      const result = await invoke("listNotes", {uid: userUid});
      setData((current) => ({...current, selectedUserNotes: result.items}));
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load notes."); }
  }

  async function categoryImageChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setCategoryImage(await imageFileToDataUrl(file, 640));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not use that image.");
    }
  }

  if (!authReady) return <main className="grid min-h-screen place-items-center bg-[#f7f6fb] text-sm text-[#74657e]">Checking administrator access…</main>;
  if (!role) return <main className="min-h-screen bg-[#f7f6fb] px-5 py-16"><section className="mx-auto max-w-xl rounded-3xl border border-[#eadff4] bg-white p-8 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8b22ef]">Bubbli administration</p><h1 className="mt-3 text-2xl font-semibold text-[#30213d]">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-[#756b7c]">Admin roles are provisioned by trusted server configuration. Creator registration cannot grant administrator access.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button onClick={() => void (async () => { try { if(!functions)throw new Error("Firebase is not configured.");await httpsCallable(functions, "claimInitialSuperAdmin")({}); await auth?.currentUser?.getIdToken(true); window.location.reload(); } catch (caught) { setError(caught instanceof Error ? caught.message : "This account is not provisioned as the initial Super Admin."); } })()} className="mt-5 rounded-full border border-[#ddd0eb] px-5 py-3 text-sm font-semibold text-[#62328a]">Provision initial Super Admin</button><p className="mt-3 text-xs text-[#968ba0]">This succeeds only for the UID configured in the server secret, and only once.</p></section></main>;

  return <main className="min-h-screen bg-[#f7f6fb] text-[#32253d]"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-7 lg:px-9"><header className="flex flex-col gap-4 border-b border-[#e9e1ef] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8b22ef]">Bubbli platform control</p><h1 className="mt-1 text-2xl font-semibold">Admin console</h1><p className="mt-1 text-xs text-[#80758a]">Signed in as {role.replaceAll("_", " ")} · {uid}</p></div><button onClick={() => router.push("/dashboard")} className="min-h-10 self-start rounded-full border border-[#ded3e7] bg-white px-4 text-xs font-semibold text-[#6d5b79]">Creator dashboard</button></header>
    <nav aria-label="Administration sections" className="mt-5 flex gap-2 overflow-x-auto pb-2">{tabNames.map(([key, label]) => <button key={key} onClick={() => {setTab(key); void load(key, query);}} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold ${tab === key ? "bg-[#35105f] text-white" : "border border-[#e7deee] bg-white text-[#74647e]"}`}>{label}</button>)}</nav>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">{["users", "stores", "products"].includes(tab) && <><input aria-label={`Search ${title(tab).toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {if(event.key === "Enter") void load(tab, query);}} placeholder={`Search ${title(tab).toLowerCase()}…`} className="min-h-11 flex-1 rounded-xl border border-[#e4dce9] bg-white px-4 text-sm outline-none focus:border-[#8b22ef]"/><button onClick={() => void load(tab, query)} className="min-h-11 rounded-xl bg-[#35105f] px-5 text-sm font-semibold text-white">Search</button></>}</div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}{loading && <p aria-live="polite" className="mt-4 text-xs text-[#81738b]">Loading…</p>}
    {tab === "overview" && <section className="mt-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Registered users", data.registeredUsers], ["Active creators", data.activeCreators], ["Published stores", data.publishedStores], ["Draft stores", data.draftStores], ["Products", data.totalProducts], ["Store visits", data.storeVisits], ["Product clicks", data.productClicks]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-[#e9e1ef] bg-white p-5"><p className="text-xs font-medium text-[#877b90]">{String(label)}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{typeof value === "number" ? value.toLocaleString() : "—"}</p></article>)}</div><section className="mt-4 rounded-2xl border border-[#e9e1ef] bg-white p-5"><h2 className="font-semibold">Daily activity · last 30 days</h2>{data.eventWindowCapped === true && <p className="mt-1 text-xs text-[#887b91]">Event sample limit reached; totals above use database counts.</p>}<div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10 lg:grid-cols-15">{rows(data.activity).map((day) => <div key={String(day.date)} title={`${day.date}: ${day.views} visits, ${day.clicks} clicks`} className="min-w-0 rounded-lg bg-[#f6f1fb] p-2 text-center"><p className="text-[9px] text-[#877b90]">{String(day.date).slice(5)}</p><p className="mt-1 text-xs font-semibold">{Number(day.views) + Number(day.clicks)}</p></div>)}</div></section></section>}
    {tab === "users" && <section className="mt-5 space-y-3">{itemRows.map((user) => <article key={String(user.uid)} className="rounded-2xl border border-[#e9e1ef] bg-white p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">{text(user.displayName, "Creator account")}</p><p className="mt-1 text-xs text-[#82758c]">{text(user.email)} · @{text(user.username, "no store")} · {text(user.createdAt)}</p><p className="mt-1 text-xs text-[#82758c]">{String(user.productCount)} products · {user.storePublished ? "Published store" : "No published store"} · {user.suspended ? "Suspended" : "Active"} · role: {text(user.platformRole, "creator")}</p></div><div className="flex flex-wrap gap-2">{canManage && <button onClick={() => {void selectUser(String(user.uid));}} className="rounded-full border border-[#e1d6e9] px-3 py-2 text-xs font-semibold">Notes</button>}{canManage && (user.suspended === true ? <button onClick={() => void perform("restoreUser", {uid:user.uid}, "Account restored.")} className="rounded-full border border-green-200 px-3 py-2 text-xs font-semibold text-green-800">Restore</button> : <button onClick={() => {const reason = window.prompt("Moderation reason"); if(reason?.trim()) void perform("suspendUser", {uid:user.uid, reason}, "Account suspended.");}} className="rounded-full border border-[#f0d3d3] px-3 py-2 text-xs font-semibold text-red-700">Suspend</button>)}{role === "super_admin" && String(user.uid) !== uid && <select aria-label={`Administrator role for ${text(user.email)}`} value={text(user.platformRole, "creator")} onChange={(event) => void perform("setRole", {uid:user.uid, role:event.target.value === "creator" ? null : event.target.value}, "Administrator role updated.")} className="rounded-full border border-[#e1d6e9] bg-white px-3 py-2 text-xs"><option value="creator">Creator</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="support_agent">Support Agent</option></select>}</div></div>{selectedUid === user.uid && <div className="mt-4 rounded-xl bg-[#faf8fc] p-3"><h3 className="text-xs font-bold">Internal notes</h3><ul className="mt-2 space-y-1 text-xs text-[#796d82]">{rows(data.selectedUserNotes).map((item) => <li key={String(item.id)}>{text(item.note)} · {text(item.actorUid)}</li>)}</ul><div className="mt-3 flex gap-2"><input aria-label="Add internal note" value={note} onChange={(event)=>setNote(event.target.value)} className="min-h-10 flex-1 rounded-lg border border-[#e4dce9] bg-white px-3 text-xs"/><button onClick={()=>{void perform("saveNote",{uid:user.uid,note},"Note saved.");setNote("");}} disabled={!note.trim()} className="rounded-lg bg-[#35105f] px-4 text-xs font-semibold text-white disabled:opacity-50">Add note</button></div></div>}</article>)}{!itemRows.length && !loading && <Empty text="No users were returned for this search."/>}</section>}
    {tab === "stores" && <section className="mt-5 space-y-3">{itemRows.map((store) => <article key={String(store.uid)} className="flex flex-col gap-3 rounded-2xl border border-[#e9e1ef] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{text(store.displayName)} <span className="text-xs font-normal text-[#82758c]">@{text(store.username)}</span></p><p className="mt-1 text-xs text-[#82758c]">Owner {text(store.ownerEmail)} · {String(store.productCount)} products · {store.published ? "Published" : "Draft"} · {store.suspended ? `Suspended: ${text(store.suspensionReason)}` : "Available"}</p><a href={`/${String(store.username)}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#7133a1]">Preview public store ↗</a></div>{canModerate && (store.suspended ? <button onClick={()=>void perform("moderateStore",{uid:store.uid,suspend:false},"Store restored.")} className="rounded-full border border-green-200 px-4 py-2 text-xs font-semibold text-green-800">Restore</button> : <button onClick={()=>{const reason=window.prompt("Moderation reason");if(reason?.trim())void perform("moderateStore",{uid:store.uid,suspend:true,reason},"Store suspended.");}} className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">Suspend store</button>)}</article>)}{!itemRows.length && !loading && <Empty text="No storefronts found."/>}</section>}
    {tab === "products" && <section className="mt-5 space-y-3">{itemRows.map((product) => <article key={String(product.id)} className="flex flex-col gap-3 rounded-2xl border border-[#e9e1ef] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="size-16 shrink-0 rounded-xl bg-[#f3eef8] bg-cover bg-center" style={{backgroundImage: /^https:\/\//i.test(String(product.imageURL)) ? `url(${String(product.imageURL)})` : undefined}}/><div><p className="font-semibold">{text(product.name)}</p><p className="mt-1 text-xs text-[#82758c]">{text(product.category, "Uncategorized")} · @{text(product.ownerUsername)} · {product.active ? "Active" : "Inactive"}{product.hidden ? ` · Hidden: ${text(product.moderationReason)}` : ""}</p></div></div>{canModerate && (product.hidden ? <button onClick={()=>void perform("moderateProduct",{productId:product.id,hide:false},"Product restored.")} className="rounded-full border border-green-200 px-4 py-2 text-xs font-semibold text-green-800">Restore</button> : <button onClick={()=>{const reason=window.prompt("Moderation reason");if(reason?.trim())void perform("moderateProduct",{productId:product.id,hide:true,reason},"Product hidden.");}} className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">Hide product</button>)}</article>)}{!itemRows.length && !loading && <Empty text="No products found."/>}</section>}
    {tab === "categories" && <section className="mt-5 space-y-4">{canManage && <form onSubmit={(event)=>{event.preventDefault();const id=categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");if(id)void perform("saveCategory",{id,name:categoryName,imageURL:categoryImage,active:true,order:itemRows.length},"Category saved.");}} className="grid gap-3 rounded-2xl border border-[#e9e1ef] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-semibold">Category name<input required maxLength={80} value={categoryName} onChange={(event)=>setCategoryName(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-[#e4dce9] px-3 text-sm"/></label><label className="text-xs font-semibold">HTTPS image URL<input value={categoryImage.startsWith("data:") ? "Uploaded image ready" : categoryImage} onChange={(event)=>setCategoryImage(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-[#e4dce9] px-3 text-sm"/><span className="mt-1 block font-normal text-[#82758c]">or upload a JPG, PNG or WebP image up to 8 MB</span><input aria-label="Upload category image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>void categoryImageChanged(event)} className="mt-2 block w-full text-xs"/></label><button className="self-end rounded-lg bg-[#35105f] px-4 py-3 text-xs font-semibold text-white">Add category</button></form>}{itemRows.map((category)=><article key={String(category.id)} className="flex items-center justify-between rounded-2xl border border-[#e9e1ef] bg-white p-4"><div><p className="font-semibold">{text(category.name)}</p><p className="text-xs text-[#82758c]">{category.active ? "Visible" : "Inactive"} · order {text(category.order, "0")}</p></div>{canManage && <button onClick={()=>void perform("deleteCategory",{id:category.id},"Category deactivated.")} className="rounded-full border border-[#e1d6e9] px-3 py-2 text-xs">Deactivate</button>}</article>)}</section>}
    {tab === "configuration" && <section className="mt-5 rounded-2xl border border-[#e9e1ef] bg-white p-5"><h2 className="font-semibold">Platform configuration</h2><p className="mt-1 text-xs text-[#82758c]">Configuration is stored server-side and changes are audited. Maintenance mode and feature flags are currently controls only; application-wide enforcement still needs wiring.</p><label className="mt-4 block text-xs font-semibold">Validated configuration JSON<textarea aria-label="Platform configuration JSON" value={configDraft} onChange={(event)=>setConfigDraft(event.target.value)} rows={18} className="mt-2 w-full rounded-xl border border-[#e4dce9] bg-[#fbfafd] p-4 font-mono text-xs leading-5"/></label>{canManage && <button onClick={()=>{try{const config=JSON.parse(configDraft) as Row;void perform("saveConfig",{config},"Configuration saved.");}catch{setError("Configuration must be valid JSON.");}}} className="mt-4 rounded-full bg-[#35105f] px-5 py-3 text-xs font-semibold text-white">Save configuration</button>}</section>}
    {tab === "audit" && <section className="mt-5 space-y-2">{itemRows.map((entry)=><article key={String(entry.id)} className="rounded-xl border border-[#e9e1ef] bg-white p-4"><p className="text-sm font-semibold">{text(entry.action)} · {text(entry.target)}</p><p className="mt-1 text-xs text-[#82758c]">{text(entry.createdAt)} · {text(entry.actorUid)} · {text(entry.actorRole)}</p>{Boolean(entry.details) && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[10px] text-[#8a7e91]">{JSON.stringify(entry.details)}</pre>}</article>)}{!itemRows.length && !loading && <Empty text="No audit activity recorded yet."/>}</section>}
    </div></main>;
}

function Empty({text: message}: {text: string}) { return <div className="rounded-2xl border border-dashed border-[#d8cfe0] bg-white px-6 py-14 text-center text-sm text-[#84798d]">{message}</div>; }
