import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 5;
const ALLOWED_HOSTS = [
  /(^|\\.)flipkart\\.com$/i,
  /(^|\\.)amazon\\.(?:in|com|co\\.uk|de|fr|it|es|ca|com\\.au|co\\.jp)$/i,
  /(^|\\.)meesho\\.com$/i,
];

function allowedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (/^(\\d{1,3}\\.){3}\\d{1,3}$/.test(host) || host.includes(":")) return false;
  return ALLOWED_HOSTS.some((pattern) => pattern.test(host));
}
function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) { const match = html.match(pattern); if (match?.[1]) return decode(match[1].trim()); }
  return undefined;
}
function structuredProduct(html: string): Record<string, unknown> | undefined {
  const scripts = html.match(/<script[^>]+type=["']application\\/ld\\+json["'][^>]*>[\\s\\S]*?<\\/script>/gi) ?? [];
  for (const script of scripts) {
    const raw = script.replace(/^<[\\s\\S]*?>/, "").replace(/<\\/script>$/i, "").trim();
    try {
      const parsed: unknown = JSON.parse(raw);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const queue = [...entries];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        const object = item as Record<string, unknown>;
        if (Array.isArray(object["@graph"])) queue.push(...object["@graph"]);
        const type = object["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return object;
      }
    } catch { /* Ignore malformed JSON-LD. */ }
  }
  return undefined;
}
function imageFrom(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageFrom(value[0]);
  if (value && typeof value === "object" && "url" in value) return imageFrom((value as {url: unknown}).url);
  return undefined;
}
async function resolvePage(input: URL) {
  let current = input;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.protocol !== "https:" || !allowedHost(current.hostname)) throw new Error("This marketplace link redirects to an unsupported or unsafe domain.");
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(9000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; BubbliProductPreview/1.0)", accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || hop === MAX_REDIRECTS) throw new Error("Too many or incomplete marketplace redirects.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? "The marketplace is blocking automated previews. Add the product details manually; your original link can still be saved." : `Marketplace returned HTTP ${response.status}. Add the details manually.`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) throw new Error("The link did not return a product web page. Add the details manually.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("The marketplace page could not be read.");
    const chunks: Uint8Array[] = []; let total = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) { await reader.cancel(); throw new Error("The product page is too large to preview. Add the details manually."); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { html: new TextDecoder().decode(bytes), finalUrl: current.toString() };
  }
  throw new Error("Could not resolve this product link.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 2048) return NextResponse.json({status:"manual_required",message:"Enter a valid product link."},{status:400});
    const input = new URL(body.url);
    if (input.protocol !== "https:" || !allowedHost(input.hostname)) return NextResponse.json({status:"manual_required",message:"Automatic preview currently supports Flipkart, Amazon and Meesho product links. Other links can still be added manually."});
    const {html, finalUrl} = await resolvePage(input);
    const product = structuredProduct(html);
    const title = meta(html,"og:title") || meta(html,"twitter:title") || (typeof product?.name === "string" ? product.name : undefined) || html.match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i)?.[1]?.replace(/<[^>]+>/g,"").trim();
    const description = meta(html,"og:description") || meta(html,"description") || (typeof product?.description === "string" ? product.description : undefined);
    const imageRaw = meta(html,"og:image") || meta(html,"twitter:image") || imageFrom(product?.image);
    let imageUrl: string | undefined;
    if (imageRaw) { try { const parsed = new URL(imageRaw, finalUrl); if (parsed.protocol === "https:") imageUrl = parsed.toString(); } catch { /* Ignore invalid image URLs. */ } }
    if (!title) return NextResponse.json({status:"manual_required",source:new URL(finalUrl).hostname,message:"The marketplace did not expose product details to automatic preview. Your link is saved; add the title, image and price manually."});
    return NextResponse.json({status:"success",title,description,imageUrl,source:new URL(finalUrl).hostname.replace(/^www\\./,""),resolvedUrl:finalUrl,message:imageUrl?"Product details found. Please review before saving.":"Product title found. Add a product image and price if needed."});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not preview this product link.";
    return NextResponse.json({status:"manual_required",message});
  }
}
