import { Storefront } from "@/components/storefront/storefront";

export default async function StorefrontPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <Storefront username={username.toLowerCase()} />;
}
