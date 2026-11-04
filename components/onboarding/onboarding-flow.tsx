"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Link2, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { demoCreator } from "@/lib/demo/seed";
import { creatorRepository } from "@/lib/repositories/demo";
import { isValidUsername, normalizeUsername, validateHttpUrl } from "@/lib/services/url";
import { imageFileToDataUrl } from "@/lib/services/image";
import type { OnboardingDraft, StoreCategory } from "@/types/store";

const initial: OnboardingDraft = { displayName: "", username: "", bio: "", avatarUrl: "", category: "Lifestyle", socialLinks: {} };
const steps = ["Your identity", "Your category", "Your links", "The preview"];
const categories: StoreCategory[] = ["Tech", "Beauty", "Fashion", "Fitness", "Home", "Gaming", "Food", "Lifestyle", "Other"];
const socials = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/you", Icon: Link2 },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you", Icon: Link2 },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/you", Icon: Link2 },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/you", Icon: Link2 },
  { key: "website", label: "Website", placeholder: "https://yourwebsite.com", Icon: Link2 },
] as const;
const reserved = new Set(["admin", "login", "signup", "dashboard", "onboarding", "go", "api", "creatorstore", demoCreator.username]);

export function OnboardingFlow() {
  const [draft, setDraft] = useState<OnboardingDraft>(initial);
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { const value = localStorage.getItem("creatorstore:onboarding:draft"); if (value) setDraft({ ...initial, ...JSON.parse(value) as Partial<OnboardingDraft> }); } catch { /* Keep a clean draft when local data is unavailable. */ } setHydrated(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("creatorstore:onboarding:draft", JSON.stringify(draft)); }, [draft, hydrated]);
  const usernameStatus = useMemo(() => {
    if (!draft.username) return "Choose your store link";
    if (!isValidUsername(draft.username)) return "Use 3–30 lowercase letters, numbers, dashes, or underscores";
    if (reserved.has(draft.username)) return "That username is already in use";
    return "This link looks available";
  }, [draft.username]);

  function patch(next: Partial<OnboardingDraft>) { setDraft((current) => ({ ...current, ...next })); setError(""); }
  function setSocial(key: keyof OnboardingDraft["socialLinks"], value: string) { setDraft((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: value } })); setError(""); }
  async function photoChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { patch({ avatarUrl: await imageFileToDataUrl(file, 512) }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not use that image."); }
  }
  async function next() {
    if (step === 0) {
      const name = draft.displayName.trim(); const username = normalizeUsername(draft.username);
      if (name.length < 2 || name.length > 60) { setError("Your display name should be between 2 and 60 characters."); return; }
      if (!isValidUsername(username)) { setError("Choose a 3–30 character username that starts and ends with a letter or number."); return; }
      setChecking(true); await new Promise((resolve) => setTimeout(resolve, 450)); setChecking(false);
      if (reserved.has(username)) { setError("That username is already in use. Try another one."); return; }
      patch({ username });
    }
    if (step === 2) {
      const invalid = Object.entries(draft.socialLinks).find(([, value]) => value && !validateHttpUrl(value));
      if (invalid) { setError(`Enter a valid http:// or https:// link for ${invalid[0]}.`); return; }
    }
    setStep((current) => Math.min(current + 1, 3));
  }
  async function publishDemo() {
    await creatorRepository.save({ id: "creator-demo-local", username: draft.username, displayName: draft.displayName.trim(), bio: draft.bio.trim(), avatarUrl: draft.avatarUrl, category: draft.category, socialLinks: draft.socialLinks, published: true });
    setSaved(true); localStorage.removeItem("creatorstore:onboarding:draft");
  }

  return <main className="min-h-screen bg-[#f7f8f4] px-4 py-5 sm:px-8 sm:py-8"><div className="mx-auto max-w-[1040px]"><header className="flex items-center justify-between"><Link href="/" className="text-xl font-extrabold tracking-[-.07em] text-[#23382c]">creator<span className="text-[#779783]">store</span><span className="text-[#bd775c]">.</span></Link><span className="rounded-full border border-[#eadfcf] bg-[#faf5ed] px-3 py-1.5 text-[10px] font-semibold text-[#806f5d]">DEMO SETUP · SAVED ON THIS DEVICE</span></header>
    <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[.7fr_1.3fr]"><aside><p className="eyebrow">A storefront of your own</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Let’s make it feel like you.</h1><p className="mt-3 max-w-sm text-sm leading-6 text-[#738077]">A few little details are all it takes to give your recommendations a home.</p><div className="mt-8 space-y-3">{steps.map((label, index)=><div key={label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${step===index ? "bg-white shadow-sm" : ""}`}><span className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${step>index ? "bg-[#6f9075] text-white" : step===index ? "bg-[#e6eee5] text-[#4f7359]" : "bg-[#edf0eb] text-[#9aa39a]"}`}>{step>index ? <Check size={14}/> : `0${index+1}`}</span><span className={`text-sm ${step===index ? "font-semibold text-[#35483a]" : "text-[#8a948b]"}`}>{label}</span></div>)}</div><div className="mt-8 hidden rounded-2xl bg-[#e9efe7] p-4 lg:block"><p className="text-sm font-semibold">Your store link</p><p className="mt-1 break-all font-mono text-xs text-[#68816e]">creatorstore.com/{draft.username || "yourname"}</p></div></aside>

    <section className="min-h-[480px] rounded-3xl border border-[#e9ede6] bg-white p-5 shadow-[0_18px_60px_-40px_#53655355] sm:p-8"><div className="mb-7 flex items-center justify-between"><div><p className="eyebrow">Step {step+1} of 4</p><h2 className="mt-1 text-xl font-semibold">{steps[step]}</h2></div><div className="flex gap-1">{steps.map((_,i)=><span key={i} className={`h-1.5 w-7 rounded-full ${i<=step ? "bg-[#6f9075]" : "bg-[#e8ece5]"}`}/>)}</div></div>
      {step===0 && <div className="space-y-5"><div className="flex items-center gap-4"><label className="relative grid size-[76px] cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-[#c9d4c9] bg-[#f4f7f2] text-[#6e8974]">{draft.avatarUrl ? <span className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url(${draft.avatarUrl})`}}/> : <Upload size={20}/>}<input className="sr-only" type="file" accept="image/*" onChange={photoChanged}/></label><div><p className="text-sm font-semibold">Add a profile photo</p><p className="mt-1 text-xs text-[#89948a]">Square image · up to 4 MB · optional</p></div></div><label className="field-label">Display name<input className="field-input" placeholder="Sundar" maxLength={60} value={draft.displayName} onChange={(e)=>patch({displayName:e.target.value})}/></label><label className="field-label">Your username<div className="mt-1 flex overflow-hidden rounded-xl border border-[#dfe4dc] focus-within:border-[#6c967e]"><span className="flex items-center bg-[#f7f8f5] px-3 text-xs text-[#849087]">creatorstore.com/</span><input className="min-w-0 flex-1 px-3 py-3 text-sm lowercase outline-none" placeholder="sundarpicks" value={draft.username} onChange={(e)=>patch({username:normalizeUsername(e.target.value)})}/></div><span className={`mt-1.5 block text-xs ${usernameStatus.startsWith("This") ? "text-[#63826a]" : "text-[#929b93]"}`}>{usernameStatus}</span></label><label className="field-label">A little about you<textarea className="field-input min-h-24 resize-y" placeholder="The things you love sharing with your people…" maxLength={180} value={draft.bio} onChange={(e)=>patch({bio:e.target.value})}/><span className="mt-1 block text-right text-[10px] font-normal text-[#9aa39a]">{draft.bio.length}/180</span></label></div>}
      {step===1 && <div><p className="text-sm text-[#7e8980]">What do you love recommending most? Pick the closest fit.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((item,index)=><button key={item} type="button" onClick={()=>patch({category:item})} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${draft.category===item ? "border-[#7c9a81] bg-[#f0f5ef] text-[#45624d]" : "border-[#e9ede6] hover:border-[#cdd9cc]"}`}><span className="text-xl">{["⌘","✿","✦","◌","⌂","◈","❋","☼","＋"][index]}</span><span className="text-sm font-semibold">{item}</span>{draft.category===item && <Check size={15} className="ml-auto"/>}</button>)}</div><p className="mt-5 text-xs text-[#8c968e]">You can change this anytime in your store settings.</p></div>}
      {step===2 && <div className="space-y-4"><p className="text-sm text-[#7e8980]">Let your community find you elsewhere. Everything here is optional.</p>{socials.map(({key,label,placeholder,Icon})=><label className="field-label" key={key}><span className="inline-flex items-center gap-2"><Icon size={14} className="text-[#78917d]"/>{label}</span><input className="field-input" type="url" placeholder={placeholder} value={draft.socialLinks[key] ?? ""} onChange={(e)=>setSocial(key,e.target.value)}/></label>)}</div>}
      {step===3 && <div className="mx-auto max-w-md rounded-3xl bg-[#f7f8f4] px-5 py-7 text-center"><div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-[#e2e9df] font-serif text-3xl italic text-[#4f7359]">{draft.avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${draft.avatarUrl})`}}/> : draft.displayName[0]?.toUpperCase()}</div><h3 className="mt-4 text-xl font-semibold">{draft.displayName}</h3><p className="mt-1 text-xs text-[#799080]">@{draft.username} · {draft.category}</p><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#738077]">{draft.bio || "A little space for the things you love to recommend."}</p><div className="mt-4 flex justify-center gap-2 text-[#738b78]">{Object.entries(draft.socialLinks).filter(([,value])=>value).map(([key])=><span key={key} className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase">{key.slice(0,2)}</span>)}</div><div className="mt-6 rounded-2xl border border-dashed border-[#d3dcd1] bg-white px-5 py-8"><div className="mx-auto grid size-11 place-items-center rounded-xl bg-[#edf3ec] text-[#6d8a73]"><Plus/></div><p className="mt-3 text-sm font-semibold">Your store is ready!</p><p className="mt-1 text-xs text-[#8b958d]">Your first recommendations will look right at home here.</p></div><p className="mt-3 text-[10px] text-[#9ba49b]">creatorstore.com/{draft.username}</p></div>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{saved && <p role="status" className="mt-5 rounded-xl bg-[#edf5ed] px-3 py-2 text-sm text-[#456b4e]">Your demo store is saved in this browser.</p>}
      <div className="mt-8 flex items-center justify-between border-t border-[#edf0eb] pt-5"><Button variant="ghost" disabled={step===0} onClick={()=>{setError("");setStep((value)=>Math.max(0,value-1));}}><ArrowLeft size={15}/> Back</Button>{step<3 ? <Button onClick={()=>void next()} disabled={checking}>{checking ? "Checking…" : <>Continue <ArrowRight size={15}/></>}</Button> : saved ? <Button href="/dashboard">Go to dashboard <ArrowRight size={15}/></Button> : <div className="flex gap-2"><Button variant="secondary" href="/dashboard/products/new">Add your first product <Plus size={14}/></Button><Button onClick={()=>void publishDemo()}>Publish store <Check size={15}/></Button></div>}</div>
    </section></div></div></main>;
}
