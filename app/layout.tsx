import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorStore — Your recommendations, together",
  description: "Create your personal product storefront and share everything you recommend from one link.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
