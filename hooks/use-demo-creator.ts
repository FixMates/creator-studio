"use client";

import { useEffect, useState } from "react";
import { demoCreator } from "@/lib/demo/seed";
import { getCurrentDemoCreator } from "@/lib/repositories/demo";

export function useDemoCreator() {
  const [creator, setCreator] = useState(demoCreator);
  useEffect(() => { const timer = window.setTimeout(() => setCreator(getCurrentDemoCreator()), 0); return () => window.clearTimeout(timer); }, []);
  return creator;
}
