import type { MetadataResult, ProductMetadataExtractor } from "@/lib/services/metadata/types";

abstract class MarketplaceExtractor implements ProductMetadataExtractor {
  abstract canHandle(url: URL): boolean;
  async extract(): Promise<MetadataResult> { return { status: "unsupported", message: "Automatic product details are not connected yet. Add the details manually." }; }
}
export class AmazonExtractor extends MarketplaceExtractor { canHandle(url: URL) { return /(^|\.)amazon\./i.test(url.hostname); } }
export class FlipkartExtractor extends MarketplaceExtractor { canHandle(url: URL) { return /(^|\.)flipkart\.com$/i.test(url.hostname); } }
export class MeeshoExtractor extends MarketplaceExtractor { canHandle(url: URL) { return /(^|\.)meesho\.com$/i.test(url.hostname); } }
export class GenericMetadataExtractor implements ProductMetadataExtractor {
  canHandle() { return true; }
  async extract(url: URL): Promise<MetadataResult> { return { status: "manual_required", source: url.hostname.replace(/^www\./, ""), message: "Paste a link and add a title and image. Secure Open Graph and product metadata fetching will be connected through a server service later." }; }
}
const extractors: ProductMetadataExtractor[] = [new AmazonExtractor(), new FlipkartExtractor(), new MeeshoExtractor(), new GenericMetadataExtractor()];
export async function extractProductMetadata(rawUrl: string) {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return { status: "manual_required" as const, message: "Enter a complete product link beginning with https://." }; }
  if (!["http:", "https:"].includes(url.protocol)) return { status: "manual_required" as const, message: "Only web links beginning with http:// or https:// are supported." };
  const extractor = extractors.find((item) => item.canHandle(url));
  return extractor ? extractor.extract(url) : { status: "unsupported" as const };
}
