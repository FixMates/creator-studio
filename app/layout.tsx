import type { Metadata } from "next";
import { PlatformState } from "@/components/platform/platform-state";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bubbli.in — Your recommendations, together",
  description: "Create your personal product storefront and share everything you recommend from one link.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PlatformState>{children}</PlatformState></body></html>;
}
