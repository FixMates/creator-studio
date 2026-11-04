import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const picks = [
  { category: "DESK ESSENTIALS", name: "The everyday notebook", by: "A small ritual, made better", color: "#e9e4d8", shape: "notebook" },
  { category: "SLOW MORNINGS", name: "Ceramic pour-over set", by: "My 8am must-have", color: "#e8d9c7", shape: "cup" },
  { category: "ON MY SHELF", name: "Objects for thought", by: "Books I keep coming back to", color: "#dce5db", shape: "books" },
];

function ProductArt({ shape, color }: { shape: string; color: string }) {
  return <div className="relative grid aspect-[1.12/1] place-items-center overflow-hidden rounded-[1.15rem]" style={{ background: color }}>
    <div className="absolute -right-7 -top-10 size-40 rounded-full bg-white/30" />
    {shape === "notebook" && <div className="relative h-40 w-32 -rotate-6 rounded-lg bg-[#f9f6ed] shadow-[12px_18px_30px_#57524733]"><div className="absolute inset-y-0 left-3 w-px bg-[#d8d1c2]"/><div className="absolute left-7 top-10 text-[10px] tracking-[.2em] text-[#66756a]">NOTES<br/><span className="text-[7px]">VOL. 01</span></div><div className="absolute bottom-5 left-7 right-5 h-px bg-[#d7d2c7]"/><div className="absolute bottom-2 left-7 right-5 h-px bg-[#d7d2c7]"/></div>}
    {shape === "cup" && <div className="relative h-32 w-32 rounded-b-[3rem] rounded-t-[1.8rem] bg-gradient-to-br from-[#fffdf7] to-[#d8c8b3] shadow-[14px_20px_26px_#67543b3d]"><div className="absolute -right-9 top-8 h-16 w-16 rounded-full border-[12px] border-[#ddcfbd]"/><div className="absolute left-8 top-8 h-2 w-12 rounded-full bg-[#b6a48d]/35"/></div>}
    {shape === "books" && <div className="relative flex -rotate-6 items-end gap-1.5 drop-shadow-[8px_12px_8px_#33443630]"><div className="h-36 w-10 rounded-sm bg-[#697d67]"/><div className="h-40 w-11 rounded-sm bg-[#f2e9d9]"/><div className="h-32 w-10 rounded-sm bg-[#bd775c]"/></div>}
  </div>;
}

export default function Home() {
  return <main className="overflow-hidden">
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
      <header className="flex h-[76px] items-center justify-between border-b border-[#e9ece5]">
        <Link href="/" className="text-[1.35rem] font-extrabold tracking-[-.07em] text-[#23382c]">creator<span className="text-[#779783]">store</span><span className="ml-1 text-[#bd775c]">.</span></Link>
        <nav className="hidden items-center gap-9 text-[.82rem] font-medium text-[#657168] md:flex"><a href="#how-it-works" className="hover:text-[#263c30]">How it works</a><a href="#discover" className="hover:text-[#263c30]">Discover</a><a href="#about" className="hover:text-[#263c30]">For creators</a></nav>
        <div className="flex items-center gap-2 sm:gap-4"><Link href="/login" className="px-2 py-2 text-sm font-semibold text-[#48564d] sm:px-3">Log in</Link><Button href="/onboarding" className="min-h-10 px-4 text-xs sm:min-h-11 sm:px-5 sm:text-sm">Create your store <ArrowRight size={15}/></Button></div>
      </header>

      <section className="relative grid min-h-[650px] items-center gap-8 pb-14 pt-14 lg:min-h-[700px] lg:grid-cols-[.95fr_1.05fr] lg:gap-4 lg:py-16">
        <div className="relative z-10 max-w-[590px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e4e8df] bg-white px-3.5 py-2 text-[.7rem] font-semibold tracking-wide text-[#617164] shadow-sm"><Sparkles size={13} className="text-[#bd775c]"/> A little corner of the internet, all yours</div>
          <h1 className="text-[3.2rem] font-semibold leading-[1.02] tracking-[-.065em] text-[#21372b] sm:text-6xl lg:text-[4.55rem]">Your Products.<br/>Your Recommendations.<br/><span className="font-serif font-medium italic text-[#779783]">One Link.</span></h1>
          <p className="mt-7 max-w-[440px] text-base leading-7 text-[#69756c] sm:text-[1.05rem]">Create your personal product storefront and share everything you recommend from one link.</p>
          <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row"><Button href="/onboarding" className="min-h-[52px] px-6">Create Your Store — Free <ArrowRight size={16}/></Button><Button href="#discover" variant="secondary" className="min-h-[52px] px-6">Explore Stores <ArrowDownRight size={16}/></Button></div>
          <div className="mt-8 flex items-center gap-3 text-xs text-[#7b867e]"><div className="flex -space-x-2"><span className="grid size-7 place-items-center rounded-full border-2 border-[#fbfcf9] bg-[#dfc0aa] text-[9px]">M</span><span className="grid size-7 place-items-center rounded-full border-2 border-[#fbfcf9] bg-[#a9c3ae] text-[9px]">J</span><span className="grid size-7 place-items-center rounded-full border-2 border-[#fbfcf9] bg-[#e8d8a5] text-[9px]">A</span></div><span>Made for the things you love to share</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-[620px] pb-7 pt-4 lg:ml-auto lg:pt-0">
          <div className="absolute -right-8 top-0 size-48 rounded-full bg-[#e4eadf]/80 blur-3xl sm:right-4 sm:size-64"/><div className="absolute -bottom-8 left-0 size-48 rounded-full bg-[#f0e4d7]/70 blur-3xl sm:left-14 sm:size-60"/>
          <div className="relative rotate-[1.5deg] rounded-[1.75rem] border border-[#e6e8e0] bg-white p-4 shadow-[0_28px_80px_-35px_#50655355] sm:p-6">
            <div className="flex items-center justify-between border-b border-[#edf0ea] pb-4"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-[#e4e9df] font-serif text-lg italic text-[#4e6955]">s</div><div><p className="text-sm font-semibold text-[#2b3d31]">Sundar’s little finds</p><p className="mt-0.5 text-[10px] text-[#889188]">@sundarpicks · things I actually love</p></div></div><span className="rounded-full bg-[#f3f5f0] px-3 py-1.5 text-[9px] font-semibold tracking-wide text-[#748174]">MY STOREFRONT</span></div>
            <div className="grid grid-cols-3 gap-3 pt-4 sm:gap-4">{picks.map((pick, i)=><article key={pick.name} className={i === 2 ? "hidden sm:block" : ""}><ProductArt shape={pick.shape} color={pick.color}/><p className="mt-3 text-[8px] font-bold tracking-[.16em] text-[#8b9a8c]">{pick.category}</p><h3 className="mt-1 text-[.72rem] font-semibold leading-snug text-[#334439] sm:text-[.82rem]">{pick.name}</h3><p className="mt-1 hidden text-[.67rem] text-[#89928a] sm:block">{pick.by}</p><a href="#discover" className="mt-2 inline-flex items-center gap-1 text-[.65rem] font-semibold text-[#688774]">Take a look <ArrowUpRight size={11}/></a></article>)}</div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[#f7f8f4] px-3.5 py-3"><span className="text-[.65rem] text-[#78847a]">One link. A whole lot of good taste.</span><span className="font-mono text-[.66rem] text-[#587461]">creator.store/sundarpicks</span></div>
          </div>
          <div className="absolute -bottom-1 -left-2 flex items-center gap-2 rounded-xl border border-[#edf0e9] bg-white px-3.5 py-3 shadow-lg sm:-left-7"><span className="grid size-8 place-items-center rounded-lg bg-[#f4e8dd] text-[#aa725c]"><Play size={13} fill="currentColor"/></span><span className="text-[.68rem] font-semibold text-[#536257]">A quick review, right here</span><Check size={14} className="ml-2 text-[#71917a]"/></div>
          <span className="absolute -right-3 top-5 hidden -rotate-6 rounded-full bg-[#bd775c] px-4 py-2 text-[.67rem] font-semibold text-white shadow-md sm:block">The good stuff, gathered ✳</span>
        </div>
      </section>
    </div>

    <section id="how-it-works" className="border-y border-[#ecefe8] bg-[#f4f6f1] px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-7 gap-y-2 text-center text-[.68rem] font-medium text-[#718075] sm:gap-x-12"><span className="inline-flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white text-[.6rem] text-[#799481]">01</span> Gather what you love</span><span className="hidden text-[#c3cbc1] sm:inline">✳</span><span className="inline-flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white text-[.6rem] text-[#799481]">02</span> Add your own words & reviews</span><span className="hidden text-[#c3cbc1] sm:inline">✳</span><span className="inline-flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white text-[.6rem] text-[#799481]">03</span> Share one lovely link</span></div></section>

    <section id="discover" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">A place for good taste</p><h2 className="mt-3 font-serif text-4xl italic tracking-tight text-[#294033] sm:text-5xl">Made personal, by you.</h2></div><Link href="/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c8b75]">Make yours <ArrowRight size={15}/></Link></div><div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">{picks.map(p=><div key={p.name} className="rounded-2xl border border-[#eaede6] bg-white p-3"><ProductArt shape={p.shape} color={p.color}/><p className="mt-3 text-xs font-semibold text-[#526257]">{p.name}</p></div>)}</div></section>

    <section id="about" className="mx-5 mb-16 overflow-hidden rounded-[2rem] bg-[#2d4939] px-6 py-14 text-center text-white sm:mx-8 sm:mb-24 sm:py-20"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#b7c9b8]">Your corner. Your curation.</p><h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl italic leading-tight sm:text-5xl">The things you love deserve a home.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#d0dbd0]">Start gathering your recommendations into a storefront that feels like you.</p><Button href="/onboarding" variant="secondary" className="mt-7 border-white/30 bg-white text-[#2d4939]">Create your store for free <ArrowRight size={15}/></Button></section>

    <footer className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 border-t border-[#e9ece5] px-5 py-7 text-xs text-[#869087] sm:flex-row sm:px-8 lg:px-14"><Link href="/" className="font-bold tracking-[-.05em] text-[#35483a]">creator<span className="text-[#779783]">store</span>.</Link><span>Made for the things worth sharing.</span><span>© 2026 CreatorStore</span></footer>
  </main>;
}
