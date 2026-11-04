import type { MetadataResult } from "@/lib/services/metadata/types";

function contentOf(document: Document, selector: string) { return document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined; }

/** Parse metadata from HTML supplied by a trusted server-side fetcher; this function does not perform network requests. */
export function parseGenericMetadata(html: string, pageUrl: string): MetadataResult {
  if (typeof DOMParser === "undefined") return { status: "manual_required", message: "Metadata parsing requires a document parser." };
  const document = new DOMParser().parseFromString(html, "text/html");
  const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  let jsonLd: Record<string, unknown> | undefined;
  for (const script of jsonLdScripts) {
    try {
      const value: unknown = JSON.parse(script.textContent || "");
      const entries = Array.isArray(value) ? value : [value];
      const match = entries.find((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null && ("name" in entry || "headline" in entry));
      if (match) { jsonLd = match; break; }
    } catch { /* Skip malformed structured data and try regular page metadata. */ }
  }
  const title = contentOf(document, 'meta[property="og:title"]') || contentOf(document, 'meta[name="twitter:title"]') || (typeof jsonLd?.name === "string" ? jsonLd.name : undefined) || (typeof jsonLd?.headline === "string" ? jsonLd.headline : undefined) || document.querySelector("title")?.textContent?.trim();
  const description = contentOf(document, 'meta[property="og:description"]') || contentOf(document, 'meta[name="description"]') || (typeof jsonLd?.description === "string" ? jsonLd.description : undefined);
  const image = contentOf(document, 'meta[property="og:image"]') || contentOf(document, 'meta[name="twitter:image"]') || (typeof jsonLd?.image === "string" ? jsonLd.image : undefined) || (typeof jsonLd?.image === "object" && jsonLd.image !== null && "url" in jsonLd.image && typeof jsonLd.image.url === "string" ? jsonLd.image.url : undefined);
  const source = (() => { try { return new URL(pageUrl).hostname.replace(/^www\./, ""); } catch { return undefined; } })();
  let imageUrl: string | undefined;
  if (image) { try { imageUrl = new URL(image, pageUrl).toString(); } catch { imageUrl = undefined; } }
  return title ? { status: "success", title, description, imageUrl, source } : { status: "manual_required", source, message: "No product title was found. Add the details manually." };
}
