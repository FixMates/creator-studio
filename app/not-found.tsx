import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-6 text-center"><section><p className="eyebrow">404 · Page not found</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">This link wandered off.</h1><p className="mt-3 text-[#718077]">Let’s get you back to somewhere lovely.</p><Button href="/" className="mt-7">Back to home</Button></section></main>;
}
