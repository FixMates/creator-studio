"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Link2, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import { getCreatorRepository } from "@/lib/repositories";
import { isValidUsername, normalizeUsername, validateHttpUrl } from "@/lib/services/url";
import { imageFileToDataUrl } from "@/lib/services/image";
import type { OnboardingDraft, StoreCategory } from "@/types/store";

const initial: OnboardingDraft = { displayName: "", username: "", bio: "", avatarUrl: "", category: "Lifestyle", socialLinks: {} };
const steps = ["Your identity", "Your category", "Your links", "The preview"];
const categories: StoreCategory[] = ["Gifting", "Fashion", "Sarees & Ethnic Wear", "Jewellery", "Watches & Accessories", "Home & Living", "Lifestyle", "Handmade & Craft", "Beauty & Personal Care", "Food & Beverages", "Photography & Prints", "Digital Products", "UGC & Creator Services", "Tech", "Fitness", "Gaming", "Other"];
const socials = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/you" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/you" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/you" },
  { key: "website", label: "Website", placeholder: "https://yourwebsite.com" },
] as const;
const reserved = new Set(["admin", "login", "signup", "dashboard", "onboarding", "go", "api", "bubbli"]);

export function OnboardingFlow() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(initial);
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hydratedUid, setHydratedUid] = useState("");
  const userUid = auth?.currentUser?.uid ?? "";
  const draftStorageKey = userUid ? `bubbli:onboarding:draft:${userUid}` : "";
  const hydrated = Boolean(userUid && hydratedUid === userUid);

  useEffect(() => {
    let cancelled = false;
    const user = auth?.currentUser;
    setHydratedUid("");
    if (!user) {
      router.replace("/login");
      return () => { cancelled = true; };
    }
    const uid = user.uid;
    const displayName = user.displayName ?? "";

    async function prepareAccountDraft() {
      try {
        const repository = getCreatorRepository();
        const [account, profile] = await Promise.all([
          repository.getAccount(uid),
          repository.getForUser(uid),
        ]);
        if (cancelled || auth?.currentUser?.uid !== uid) return;
        if (account?.onboardingCompleted || profile) {
          router.replace("/dashboard");
          return;
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not verify your account.");
          setDraft({ ...initial, displayName: displayName });
          setHydratedUid(uid);
        }
        return;
      }

      if (cancelled || auth?.currentUser?.uid !== uid) return;
      let savedDraft: Partial<OnboardingDraft> = {};
      try {
        const value = localStorage.getItem(`bubbli:onboarding:draft:${uid}`);
        if (value) savedDraft = JSON.parse(value) as Partial<OnboardingDraft>;
      } catch {}
      setDraft({ ...initial, displayName: displayName, ...savedDraft });
      setStep(0);
      setHydratedUid(uid);
    }

    void prepareAccountDraft();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (hydrated && draftStorageKey) {
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    }
  }, [draft, draftStorageKey, hydrated]);

  const usernameStatus = useMemo(() => {
    if (!draft.username) return "Choose your store link";
    if (!isValidUsername(draft.username)) return "Use 3–30 lowercase letters, numbers, dashes, or underscores";
    if (reserved.has(draft.username)) return "That username is reserved";
    return "We'll verify this before continuing";
  }, [draft.username]);

  function patch(next: Partial<OnboardingDraft>) { setDraft((current) => ({ ...current, ...next })); setError(""); }
  function setSocial(key: keyof OnboardingDraft["socialLinks"], value: string) { setDraft((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: value } })); setError(""); }

  async function photoChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { patch({ avatarUrl: await imageFileToDataUrl(file, 256) }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not use that image."); }
  }

  async function next() {
    if (step === 0) {
      const user = auth?.currentUser;
      if (!user) { router.replace("/login"); return; }
      const name = draft.displayName.trim();
      const username = normalizeUsername(draft.username);
      if (name.length < 2 || name.length > 60) { setError("Your display name should be between 2 and 60 characters."); return; }
      if (!isValidUsername(username) || reserved.has(username)) { setError("Choose a different valid store username."); return; }
      setChecking(true);
      try {
        const available = await getCreatorRepository().isUsernameAvailable(username, user.uid);
        if (!available) { setError("That username is already in use. Try another."); return; }
        patch({ username });
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not check that username."); return; }
      finally { setChecking(false); }
    }
    if (step === 2) {
      const invalid = Object.entries(draft.socialLinks).find(([, value]) => value && !validateHttpUrl(value));
      if (invalid) { setError(`Enter a valid http:// or https:// link for ${invalid[0]}.`); return; }
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  async function publishStore() {
    if (!acceptedTerms) { setError("Please accept the Terms of Service and Privacy Policy before publishing."); return; }
    const user = auth?.currentUser;
    if (!user) { router.replace("/login"); return; }
    setSaving(true); setError("");
    try {
      await getCreatorRepository().completeOnboarding(user.uid, user.email ?? "", {
        id: user.uid, username: normalizeUsername(draft.username), displayName: draft.displayName.trim(),
        bio: draft.bio.trim(), avatarUrl: draft.avatarUrl, category: draft.category,
        socialLinks: draft.socialLinks, theme: "ananya", published: true,
      }, "2026-11-23");
      if (draftStorageKey) localStorage.removeItem(draftStorageKey);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't create your store. Please try again.");
    } finally { setSaving(false); }
  }

  if (!hydrated) return <main className="grid min-h-screen place-items-center bg-[#faf8ff] text-sm text-[#69756d]">Preparing your store setup…</main>;

  return <main className="min-h-screen bg-[#faf8ff] px-4 py-5 sm:px-8 sm:py-8"><div className="mx-auto max-w-[1040px]">
    <header className="flex items-center justify-between"><Link href="/" className="text-xl font-extrabold tracking-[-.07em] text-[#35105f]">bubbli<span className="text-[#d52ac0]">.</span></Link><span className="rounded-full border border-[#eadfcf] bg-[#faf5ed] px-3 py-1.5 text-[10px] font-semibold text-[#806f5d]">YOUR STORE SETUP</span></header>
    <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[.7fr_1.3fr]"><aside><p className="eyebrow">A storefront of your own</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Let’s make it feel like you.</h1><p className="mt-3 max-w-sm text-sm leading-6 text-[#738077]">A few little details are all it takes to give your recommendations a home.</p><div className="mt-8 space-y-3">{steps.map((label, index)=><div key={label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${step===index ? "bg-white shadow-sm" : ""}`}><span className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${step>index ? "bg-[#8b22ef] text-white" : step===index ? "bg-[#f4eaff] text-[#8b22ef]" : "bg-[#edf0eb] text-[#9aa39a]"}`}>{step>index ? <Check size={14}/> : `0${index+1}`}</span><span className={`text-sm ${step===index ? "font-semibold text-[#35483a]" : "text-[#8a948b]"}`}>{label}</span></div>)}</div></aside>
    <section className="min-h-[480px] rounded-3xl border border-[#eee6f7] bg-white p-5 shadow-[0_18px_60px_-40px_#53655355] sm:p-8"><div className="mb-7 flex items-center justify-between"><div><p className="eyebrow">Step {step+1} of 4</p><h2 className="mt-1 text-xl font-semibold">{steps[step]}</h2></div></div>
      {step===0 && <div className="space-y-5"><div className="flex items-center gap-4"><label className="relative grid size-[76px] cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-[#c9d4c9] bg-[#f4f7f2] text-[#6e8974]">{draft.avatarUrl ? <span className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url(${draft.avatarUrl})`}}/> : <Upload size={20}/>}<input className="sr-only" type="file" accept="image/*" onChange={photoChanged}/></label><div><p className="text-sm font-semibold">Add a profile photo</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#89948a]">Optional · use a clear square portrait or brand logo. It appears on your store and creator listing.</p></div></div><label className="field-label">Display name<input className="field-input" maxLength={60} value={draft.displayName} onChange={(e)=>patch({displayName:e.target.value})}/></label><label className="field-label">Your username<input className="field-input lowercase" placeholder="sundarpicks" value={draft.username} onChange={(e)=>patch({username:normalizeUsername(e.target.value)})}/><span className="mt-1.5 block text-xs text-[#929b93]">{usernameStatus}</span></label><label className="field-label">A little about you<textarea className="field-input min-h-24 resize-y" maxLength={180} value={draft.bio} onChange={(e)=>patch({bio:e.target.value})}/></label></div>}
      {step===1 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((item)=><button key={item} type="button" onClick={()=>patch({category:item})} className={`rounded-2xl border p-4 text-left text-sm font-semibold ${draft.category===item ? "border-[#b88be9] bg-[#f8f0ff] text-[#7d22cb]" : "border-[#eee6f7]"}`}>{item}{draft.category===item && <Check size={15} className="float-right"/>}</button>)}</div>}
      {step===2 && <div className="space-y-4"><p className="text-sm text-[#7e8980]">Everything here is optional.</p>{socials.map(({key,label,placeholder})=><label className="field-label" key={key}><span className="inline-flex items-center gap-2"><Link2 size={14}/>{label}</span><input className="field-input" type="url" placeholder={placeholder} value={draft.socialLinks[key] ?? ""} onChange={(e)=>setSocial(key,e.target.value)}/></label>)}</div>}
      {step===3 && <div className="mx-auto max-w-md rounded-3xl bg-[#faf8ff] px-5 py-7 text-center"><div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-[#e2e9df] font-serif text-3xl italic text-[#4f7359]">{draft.avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${draft.avatarUrl})`}}/> : draft.displayName[0]?.toUpperCase()}</div><h3 className="mt-4 text-xl font-semibold">{draft.displayName}</h3><p className="mt-1 text-xs text-[#799080]">@{draft.username} · {draft.category}</p><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#738077]">{draft.bio || "A little space for the things you love to recommend."}</p><div className="mt-6 rounded-2xl border border-dashed border-[#d3dcd1] bg-white px-5 py-8"><Plus className="mx-auto text-[#8b22ef]"/><p className="mt-3 text-sm font-semibold">Your store is ready!</p><p className="mt-1 text-xs text-[#8b958d]">Publish now, then start adding recommendations.</p></div></div>}
      {step===3 && <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e9ddf4] bg-white p-4 text-left"><input type="checkbox" checked={acceptedTerms} onChange={(event)=>setAcceptedTerms(event.target.checked)} className="mt-1 size-4 accent-[#8b22ef]"/><span className="text-xs leading-5 text-[#6f607f]">I agree to Bubbli’s <Link href="/terms" target="_blank" className="font-bold text-[#7b35bc] underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="font-bold text-[#7b35bc] underline">Privacy Policy</Link>. I understand that a store with no recorded views for 30 consecutive days may be unpublished and that reactivation requires contacting support.</span></label>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex items-center justify-between border-t border-[#edf0eb] pt-5"><Button variant="ghost" disabled={step===0 || saving} onClick={()=>setStep((value)=>Math.max(0,value-1))}><ArrowLeft size={15}/> Back</Button>{step<3 ? <Button onClick={()=>void next()} disabled={checking}>{checking ? "Checking…" : <>Continue <ArrowRight size={15}/></>}</Button> : <Button onClick={()=>void publishStore()} disabled={saving||!acceptedTerms}>{saving ? "Creating your store…" : <>Publish store <Check size={15}/></>}</Button>}</div>
    </section></div></div></main>;
}
