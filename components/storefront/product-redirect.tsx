"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productRepository } from "@/lib/repositories/demo";
import { getSafeRedirectUrl } from "@/lib/services/url";

export function ProductRedirect({productId}:{productId:string}){const[message,setMessage]=useState("Taking you to the seller…");useEffect(()=>{void productRepository.list("creator-sundar").then((items)=>{const product=items.find((item)=>item.id===productId);const destination=getSafeRedirectUrl(product?.destinationUrl);if(destination){window.location.replace(destination);return;}setMessage(product?"This product link isn’t a valid web address.":"We couldn’t find that product.");});},[productId]);return <main className="grid min-h-screen place-items-center bg-[#f8f9f5] px-5 text-center"><section><p className="eyebrow">CreatorStore redirect</p><h1 className="mt-3 text-2xl font-semibold">{message}</h1><Link href="/sundarpicks" className="mt-5 inline-flex text-sm font-semibold text-[#5f8068]">Back to Sundar’s store</Link></section></main>;}
