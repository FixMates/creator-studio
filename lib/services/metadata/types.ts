export type MetadataResult = { status: "success" | "unsupported" | "manual_required"; title?: string; description?: string; imageUrl?: string; source?: string; message?: string };
export interface ProductMetadataExtractor { canHandle(url: URL): boolean; extract(url: URL): Promise<MetadataResult> }
