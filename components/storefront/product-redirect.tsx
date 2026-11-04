"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getSafeRedirectUrl } from "@/lib/services/url";

export function ProductRedirect({productId}:{productId:string}){
  const [message,setMessage]=useState("Taking you to the seller…");
  useEffect(()=>{
    if(!db){setMessage("Store data is unavailable.");return;}
    void getDoc(doc(db,"products",productId)).then((snap)=>{
      if(!snap.exists()){setMessage("We couldn’t find that product.");return;}
      const data=snap.data();
      if(data.active!==true){setMessage("This product is no longer available.");return;}
      const destination=getSafeRedirectUrl(String(data.destinationURL??""));
      if(destination){window.location.replace(destination);return;}
      setMessage("This product link isn’t a valid web address.");
    }).catch(()=>setMessage("We couldn’t open that product right now."));
  },[productId]);
  return <main className="grid min-h-screen place-items-center bg-[#f8f9f5] px-5 text-center"><section><p className="eyebrow">CreatorStore redirect</p><h1 className="mt-3 text-2xl font-semibold">{message}</h1><Link href="/" className="mt-5 inline-flex text-sm font-semibold text-[#5f8068]">Back to CreatorStore</Link></section></main>;
}
