import type { MetadataResult } from "@/lib/services/metadata/types";

export async function extractProductMetadata(rawUrl: string): Promise<MetadataResult> {
  let url: URL;
  try { url = new URL(rawUrl); }
  catch { return { status: "manual_required", message: "Enter a complete product link beginning with https://." }; }
  if (url.protocol !== "https:") return { status: "manual_required", message: "Use a secure https:// product link." };
  try {
    const response = await fetch("/api/product-metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.toString() }),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json() as MetadataResult;
    return result;
  } catch {
    return { status: "manual_required", message: "Automatic preview is temporarily unavailable. Your product link can still be saved; add the details manually." };
  }
}
