export function whatsappShareUrl(url: string, message = "Take a look at this!") { return `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`; }
export async function copyLink(url: string) { await navigator.clipboard.writeText(url); }
export async function shareLink(url: string, title: string, text?: string) {
  if (navigator.share) { await navigator.share({ url, title, text }); return "shared" as const; }
  await copyLink(url); return "copied" as const;
}
