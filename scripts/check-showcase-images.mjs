import { readFile, readdir } from "node:fs/promises";

const source = await readFile(new URL("../lib/demo/showcase-stores.ts", import.meta.url), "utf8");
const starts = [...source.matchAll(/makeStore\("([^"]+)","[^"]+","([^"]+)"/g)];
const usernames = new Set();
const catalogErrors = [];
for (let index = 0; index < starts.length; index++) {
  const start = starts[index].index ?? 0;
  const end = index + 1 < starts.length ? starts[index + 1].index ?? source.length : source.indexOf("\n];", start);
  const block = source.slice(start, end < 0 ? source.length : end);
  const storeId = starts[index][1];
  const username = starts[index][2];
  const baseProductCount = (block.match(/\["[^"]+","₹/g) ?? []).length;
  const extrasStart = source.indexOf(`${storeId}: {`, source.indexOf("const additionalProducts"));
  const extrasEnd = extrasStart < 0 ? -1 : source.indexOf("},", extrasStart);
  const extrasBlock = extrasStart < 0 ? "" : source.slice(extrasStart, extrasEnd < 0 ? source.length : extrasEnd);
  const extraProductCount = (extrasBlock.match(/\["[^"]+","₹/g) ?? []).length;
  const productCount = baseProductCount + extraProductCount;
  if (usernames.has(username)) catalogErrors.push(`Duplicate store username: ${username}`);
  usernames.add(username);
  if (productCount < 15 || productCount > 20) catalogErrors.push(`${storeId} has ${productCount} products; expected 15–20.`);
}
if (starts.length < 10) catalogErrors.push(`Only ${starts.length} showcase stores are configured; minimum is 10.`);
const logoFiles = [...source.matchAll(/: "([^\"]+\.svg)"/g)].map((match) => match[1]);
const logoAssets = await readdir(new URL("../public/demo-logos/", import.meta.url));
if (logoFiles.length !== starts.length || new Set(logoFiles).size !== starts.length) {
  catalogErrors.push(`Expected one unique local logo per store; found ${logoFiles.length}.`);
}
for (const logo of logoFiles) {
  if (!logoAssets.includes(logo)) catalogErrors.push(`Missing local logo asset: ${logo}`);
}
for (const field of ["creatorId", "title", "description", "imageUrl", "productIds", "order"]) {
  if (!new RegExp(`\\b${field}\\s*:`).test(source)) catalogErrors.push(`Showcase collections do not define ${field}.`);
}
for (const field of ["id", "creatorId", "name", "price", "currency", "description", "recommendation", "imageUrl", "destinationUrl", "redirectType", "source", "featured", "clicks", "collectionIds", "order", "active", "availability"]) {
  if (!new RegExp(`\\b${field}\\s*:`).test(source)) catalogErrors.push(`Showcase products do not define ${field}.`);
}
if (catalogErrors.length) {
  console.error("Showcase catalog validation failed:", catalogErrors);
  process.exit(1);
}
console.log(`Catalog check passed: ${starts.length} stores, ${starts.length * 3} collections, at least 15 products per store.`);

const ids = [...new Set(source.match(/photo-[a-zA-Z0-9-]+/g) ?? [])];
const failures = [];
let cursor = 0;
async function worker() {
  while (cursor < ids.length) {
    const id = ids[cursor++];
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=45`;
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(12000) });
      if (!response.ok) failures.push({ id, status: response.status });
    } catch (error) {
      failures.push({ id, error: error instanceof Error ? error.message : String(error) });
    }
  }
}
await Promise.all(Array.from({ length: 6 }, () => worker()));
if (failures.length) {
  console.error("Showcase image URL check failed:", failures);
  process.exitCode = 1;
} else {
  console.log(`Image check passed: ${ids.length} unique showcase image URLs.`);
}
