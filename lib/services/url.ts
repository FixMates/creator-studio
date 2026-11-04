export function validateHttpUrl(value: string): string | null {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}

export function getSafeRedirectUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const safe = validateHttpUrl(value.trim());
  if (!safe) return null;
  const parsed = new URL(safe);
  if (parsed.username || parsed.password) return null;
  return safe;
}

export function normalizeUsername(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""); }
export function isValidUsername(value: string) { return /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/.test(value); }
