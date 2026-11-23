import { DemoStorePreview } from "@/components/homepage/demo-store-preview";

export default async function DemoPreviewPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <DemoStorePreview storeId={storeId} />;
}
