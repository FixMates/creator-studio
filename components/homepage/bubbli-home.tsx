"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { ArrowRight, Search, ShoppingBag, Store, Layers3, UserRound, Plus, Menu, X, Sparkles, Users, Gift, Shirt, Gem, House, Leaf, Scissors, Camera, Gamepad2, Utensils, Clock } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { showcaseStores } from "@/lib/demo/showcase-stores";

type ShowcaseStore = { id: string; name: string; username: string; category: string; tagline: string; image: string; logo: string; featured?: boolean; productSearchTerms?: string[] };
const demoStores: ShowcaseStore[] = showcaseStores.map((store) => ({
  id: store.id, name: store.name, username: store.username, category: store.category,
  tagline: store.tagline, image: store.cover, logo: store.logo,\n  productSearchTerms: store.products.flatMap((product) => [product.name, product.description, product.recommendation]),
}));
const categories = [
  { name:"Gifting", sub:"Puzzles, Hampers, Custom Gifts", icon:Gift, color:"#bd28dc", bg:"#f8e9fb" },
  { name:"Fashion", sub:"Apparel, Shirts, T-shirts", icon:Shirt, color:"#1599d5", bg:"#e8f5fc" },
  { name:"Sarees & Ethnic Wear", sub:"", icon:Scissors, color:"#e87520", bg:"#fff3e5" },
  { name:"Jewellery", sub:"& Accessories", icon:Gem, color:"#e45d35", bg:"#fff0ed" },
  { name:"Watches & Accessories", sub:"Timepieces, everyday accessories", icon:Clock, color:"#5374b8", bg:"#edf1fb" },
  { name:"Home & Living", sub:"Decor, Organisers", icon:House, color:"#d89a13", bg:"#fbf5e7" },
  { name:"Lifestyle", sub:"Wellness, Personal, Everyday Essentials", icon:Leaf, color:"#56a638", bg:"#edf7e9" },
  { name:"Handmade & Craft", sub:"Crochet, Art, DIY", icon:Scissors, color:"#a04bd1", bg:"#f5eafa" },
  { name:"Beauty & Personal Care", sub:"Skincare, Grooming", icon:Sparkles, color:"#d14cb9", bg:"#fbeafa" },
  { name:"Food & Beverages", sub:"Homemade, Organic", icon:Utensils, color:"#db672b", bg:"#fff0e7" },
  { name:"Photography & Prints", sub:"Frames, Merch", icon:Camera, color:"#2796ba", bg:"#e9f5f8" },
  { name:"Digital Products", sub:"Templates, Presets", icon:Gamepad2, color:"#7454d5", bg:"#f0ebfc" },
  { name:"UGC & Creator Services", sub:"UGC videos, content and brand shoots", icon:Camera, color:"#bd4d9b", bg:"#fbedf7" },
  { name:"Other", sub:"Add your business", icon:Plus, color:"#8050cf", bg:"#f5efff" },
];
const collections = [
  { title:"Custom Gifting", subtitle:"Make it Personal", image:"https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85", tint:"from-pink-100" },
  { title:"Wedding & Festive", subtitle:"Collections", image:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", tint:"from-fuchsia-100" },
  { title:"Everyday Wear", subtitle:"Shirts, Tees & More", image:"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85", tint:"from-blue-100" },
  { title:"Handmade Specials", subtitle:"Crochet, Art & Craft", image:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85", tint:"from-orange-100" },
  { title:"Home & Living", subtitle:"Decor, Organisers & More", image:"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85", tint:"from-green-100" },
];

export function BubbliHome() {
  const [stores,setStores] = useState<ShowcaseStore[]>(demoStores);
  const [category,setCategory] = useState("All");
  const [search,setSearch] = useState("");
  const [menuOpen,setMenuOpen] = useState(false);
  useEffect(() => {
    if (!db) return;
    void getDocs(query(collection(db,"creatorProfiles"),where("published","==",true),limit(18))).then((profiles) => {
      const live = profiles.docs.map((doc) => { const d=doc.data(); return { id:doc.id, name:String(d.displayName??"Creator store"), username:String(d.username??""), category:String(d.category??"Other"), tagline:String(d.bio??"Independent creator store"), image:String(d.coverURL??d.photoURL??""), logo:String(d.photoURL??""), featured:false }; }).filter(s=>s.username);
      const combined = [...live,...demoStores].filter((store,index,all)=>all.findIndex(item=>item.username===store.username)===index);
      setStores(combined);
    }).catch((error)=>console.error("Could not load public stores",error));
  },[]);
  const visible = useMemo(()=>stores.filter(s=>(category==="All"||s.category.toLowerCase()===category.toLowerCase())&&[s.name,s.category,s.tagline,...(s.productSearchTerms??[])].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[stores,category,search]);
  return <main className="min-h-screen overflow-hidden bg-white text-[#160d32] pb-20 md:pb-0">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#170b38] text-white shadow-lg">
      <div className="mx-auto flex h-[66px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
        <button className="md:hidden" aria-label="Open menu" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button>
        <Link href="/" className="flex shrink-0 items-center gap-2"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#f04dbb] to-[#8d26f4] text-xl shadow-lg">🛍️</span><span className="leading-tight"><strong className="block text-[22px] font-black tracking-tight">Bubbli</strong><small className="block text-[10px] text-white/75">Creator Store Platform</small></span></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex"><a className="border-b-2 border-fuchsia-400 py-5" href="#">Home</a><a href="#features">Features</a><a href="#stores">Stores</a><a href="#collections">Collections</a><a href="#creators">For Creators</a><a href="#creators">Get started</a></nav>
        <div className="hidden min-w-0 flex-1 justify-end gap-3 md:flex lg:max-w-[540px]"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/30 bg-white/5 px-4"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stores, products or creators..." className="w-full bg-transparent py-2.5 text-xs outline-none placeholder:text-white/65"/><Search size={17}/></label><Link href="/login" className="rounded-xl border border-white/50 px-5 py-2.5 text-sm">Login</Link><Link href="/onboarding" className="rounded-xl bg-gradient-to-r from-[#a62bf2] to-[#f04cae] px-5 py-2.5 text-sm font-bold">Create Your Store</Link></div>
        <Link href="/login" className="rounded-full border border-white/50 px-4 py-2 text-xs md:hidden">Login</Link>
      </div>
      {menuOpen&&<nav className="grid gap-3 border-t border-white/10 px-6 py-4 text-sm md:hidden"><a href="#features" onClick={()=>setMenuOpen(false)}>Features</a><a href="#stores" onClick={()=>setMenuOpen(false)}>Stores</a><a href="#collections" onClick={()=>setMenuOpen(false)}>Collections</a><a href="#creators" onClick={()=>setMenuOpen(false)}>For Creators</a><Link href="/onboarding">Create Your Store</Link></nav>}
    </header>
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_15%_85%,#a82bfa_0%,transparent_40%),radial-gradient(ellipse_at_90%_30%,#e744bd_0%,transparent_32%),linear-gradient(112deg,#21064d,#19083c_55%,#321052)] text-white">
      <div className="mx-auto grid max-w-[1500px] items-center gap-6 px-6 py-9 sm:px-9 sm:py-12 lg:min-h-[380px] lg:grid-cols-[1.05fr_.8fr_.55fr] lg:gap-5 lg:px-10">
        <div className="relative z-10">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold shadow-inner sm:text-sm">For Creators • Small Businesses • Influencers</span>
          <h1 className="mt-4 max-w-[660px] text-[2.3rem] font-black leading-[1.05] tracking-[-.045em] sm:text-5xl">Turn Your Passion into an Online Store with <span className="text-[#f15acb]">Bubbli</span></h1>
          <p className="mt-4 max-w-[570px] text-sm leading-6 text-white/90 sm:text-base">Bubbli.in helps creators, artisans and small businesses launch their own branded online store, showcase products, sell directly or promote affiliate products — all in one place.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-semibold sm:grid-cols-4"><Feature icon={<ShoppingBag/>} title="Your Own Store" sub="Free to start"/><Feature icon={<span className="text-xl">🔗</span>} title="Sell Your Products" sub="or Affiliate Links"/><Feature icon={<Users/>} title="Reach More" sub="Customers"/><Feature icon={<Layers3/>} title="Grow with" sub="Built-in Tools"/></div>
          <div className="mt-6 flex flex-col gap-3 min-[440px]:flex-row"><Link href="/onboarding" className="rounded-xl bg-gradient-to-r from-[#a82bf2] to-[#f14bad] px-6 py-3.5 text-center text-sm font-extrabold shadow-xl shadow-fuchsia-950/40">Create Your Store for Free →</Link><a href="#features" className="rounded-xl border border-white/80 px-6 py-3.5 text-center text-sm font-bold">Explore Storefronts</a></div>
        </div>
        <div className="relative mx-auto w-full max-w-[340px] lg:max-w-[300px]">
          <div className="absolute -inset-5 rounded-[3rem] bg-fuchsia-400/30 blur-2xl"/>
          <div className="relative rotate-[4deg] rounded-[2.8rem] border-[7px] border-[#29213c] bg-black p-2 shadow-2xl shadow-black/60"><div className="overflow-hidden rounded-[2.2rem] bg-white text-[#190d2f]">
            <div className="flex items-center justify-between px-4 pt-5 text-xs font-black"><span>🛍️ Bubbli</span><span>⌑　☰</span></div><div className="px-3 pb-4 pt-3 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-pink-100 text-2xl">🎁</div><b className="mt-1 block text-sm">GiftzOwn Store</b><small className="text-[9px]">Custom Gifts · Hampers · Handmade</small><div className="mt-3 rounded-xl bg-gradient-to-r from-pink-100 to-rose-200 p-3 text-left"><b className="text-sm italic">Personalised Gifts for Every Occasion</b><div className="mt-1 text-3xl text-right">🎀🎁</div></div><div className="mt-3 grid grid-cols-4 gap-1 text-center text-[9px]"><span>🧩<br/>Puzzles</span><span>💐<br/>Bouquets</span><span>🧶<br/>Crochet</span><span>•••<br/>More</span></div><b className="mt-4 block text-left text-sm italic">Bestsellers</b><div className="mt-2 grid grid-cols-2 gap-2"><div className="h-20 rounded-lg bg-cover bg-center" style={{backgroundImage:"url(https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400)"}}/><div className="h-20 rounded-lg bg-cover bg-center" style={{backgroundImage:"url(https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400)"}}/></div></div></div></div>
        </div>
        <div className="hidden space-y-3 lg:block"><Benefit icon="⚡" text="Set up your store in minutes"/><Benefit icon="🎨" text="Use your own brand & style"/><Benefit icon="📦" text="Sell your products or share affiliate links"/><Benefit icon="👥" text="Build your audience & get orders"/><Benefit icon="％" text="Create collections, offers & run campaigns"/></div>
      </div>
    </section>
    <section id="features" className="mx-auto max-w-[1500px] px-4 py-5 sm:px-8">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black tracking-tight sm:text-2xl">Explore by Category</h2><p className="hidden text-xs text-slate-600 sm:block">Find stores and products across popular niches.</p></div><a href="#stores" className="shrink-0 text-xs font-bold text-purple-700">View All →</a></div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">{categories.map(({name,sub,icon:Icon,color,bg})=><button key={name} onClick={()=>{setCategory(name==="Other"?"All":name);document.getElementById("stores")?.scrollIntoView({behavior:"smooth"});}} className="flex min-h-[112px] flex-col items-center justify-center rounded-xl px-1.5 py-3 text-center transition hover:-translate-y-1 hover:shadow-md sm:min-h-[120px]" style={{background:bg}}><Icon size={27} style={{color}}/><b className="mt-2 text-[11px] leading-tight sm:text-xs">{name}</b><small className="mt-1 line-clamp-2 text-[9px] leading-tight text-slate-600">{sub}</small></button>)}</div>
    </section>
    <section id="stores" className="mx-auto max-w-[1500px] border-t border-slate-100 px-4 py-5 sm:px-8">
      <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black tracking-tight sm:text-2xl">Explore creator storefronts</h2><p className="mt-1 text-xs text-slate-600">Explore thoughtfully built stores across different niches. Some featured storefronts are illustrative examples.</p></div><button onClick={()=>{setCategory("All");setSearch("");}} className="shrink-0 text-xs font-bold text-purple-700">View All Stores →</button></div>
      <div className="mb-4 flex gap-2 md:hidden"><label className="flex w-full items-center gap-2 rounded-full border border-slate-200 px-4"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stores, products or creators..." className="w-full py-2.5 text-sm outline-none"/></label></div>
      {category!=="All"&&<button onClick={()=>setCategory("All")} className="mb-3 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">✕ {category}</button>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{visible.map(store=><Link key={store.id} href={demoStores.some((demo)=>demo.username===store.username&&demo.id===store.id)?`/preview/${store.id}`:`/${store.username}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="relative h-24 overflow-hidden bg-slate-100 sm:h-28">{store.image?<Image src={store.image} alt={store.name} fill unoptimized sizes="(max-width:640px) 45vw, 16vw" className="object-cover transition duration-500 group-hover:scale-105"/>:<div className="grid h-full place-items-center text-4xl">🏪</div>}</div><div className="relative px-3 pb-3 pt-0"><span className="-mt-5 grid size-10 place-items-center rounded-full border-2 border-white bg-white text-xl shadow">{store.logo.startsWith("http")?<Image src={store.logo} alt="" width={36} height={36} unoptimized className="rounded-full"/>:store.logo||"🏪"}</span><b className="mt-1 block truncate text-xs">{store.name}</b><p className="mt-0.5 line-clamp-1 text-[10px] text-slate-600">{store.tagline}</p>{search.trim()&&store.productSearchTerms?.some((term)=>term.toLowerCase().includes(search.trim().toLowerCase()))&&<p className="mt-1 line-clamp-1 text-[9px] font-semibold text-purple-700">Matching demo product</p>}<span className="mt-2 flex min-h-7 items-center justify-center rounded-full bg-purple-50 text-[10px] font-bold text-purple-800 group-hover:bg-purple-100">Visit Store →</span></div></Link>)}</div>
      {visible.length===0&&<p className="py-10 text-center text-sm text-slate-500">No stores found. Try another category or search.</p>}
    </section>
    <section id="collections" className="mx-auto max-w-[1500px] border-t border-slate-100 px-4 py-5 sm:px-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black tracking-tight sm:text-2xl">Curated Collections</h2><p className="mt-1 text-xs text-slate-600">Handpicked themes to help you discover unique stores and ideas.</p></div><Link href="/onboarding" className="text-xs font-bold text-purple-700">Explore →</Link></div><div className="flex snap-x gap-3 overflow-x-auto pb-2">{collections.map(c=><div key={c.title} className="relative h-[100px] min-w-[220px] flex-1 snap-start overflow-hidden rounded-xl bg-slate-100 sm:min-w-[250px]"><Image src={c.image} alt="" fill unoptimized sizes="280px" className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent"/><div className="absolute left-4 top-1/2 -translate-y-1/2 text-white"><b className="block text-sm">{c.title}</b><small>{c.subtitle}</small></div></div>)}</div></section>
    <section id="creators" className="mx-4 my-8 rounded-3xl bg-gradient-to-r from-[#23064d] via-[#491078] to-[#b52bba] px-6 py-10 text-center text-white sm:mx-8"><p className="text-xs font-bold uppercase tracking-widest text-pink-200">For creators and small businesses</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black">Your brand. Your products. Your audience.</h2><p className="mx-auto mt-3 max-w-xl text-sm text-white/80">Launch your own storefront, showcase your products and affiliate links, and grow your business with Bubbli.</p><Link href="/onboarding" className="mt-6 inline-flex rounded-xl bg-white px-7 py-3.5 text-sm font-extrabold text-purple-800">Create Your Store for Free →</Link></section>
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-6 text-xs text-slate-500 sm:flex-row"><Link href="/" className="text-lg font-black text-[#28104c]">Bubbli</Link><span>Creator Store Platform · © 2026 Bubbli.in</span><div className="flex gap-4"><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></footer>
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-5px_25px_#160d3210] backdrop-blur md:hidden"><MobileNav href="/" icon={<Store size={21}/>} label="Home" active/><MobileNav href="#stores" icon={<ShoppingBag size={21}/>} label="Stores"/><Link href="/onboarding" className="-mt-5 flex flex-col items-center gap-1 text-[10px] font-semibold"><span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white shadow-lg shadow-purple-300"><Plus size={30}/></span>Create Store</Link><MobileNav href="#collections" icon={<Layers3 size={21}/>} label="Collections"/><MobileNav href="/dashboard" icon={<UserRound size={21}/>} label="You"/></nav>
  </main>;
}
function Feature({icon,title,sub}:{icon:React.ReactNode;title:string;sub:string}){return <div className="flex items-center gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white [&_svg]:size-5">{icon}</span><span className="leading-tight">{title}<small className="block font-normal text-white/75">{sub}</small></span></div>}
function Benefit({icon,text}:{icon:string;text:string}){return <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 text-sm"><span className="text-2xl">{icon}</span>{text}</div>}
function MobileNav({href,icon,label,active=false}:{href:string;icon:React.ReactNode;label:string;active?:boolean}){return <a href={href} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${active?"text-purple-700":"text-slate-700"}`}>{icon}{label}</a>}
