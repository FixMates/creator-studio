import { demoCollections, demoCreator, demoProducts } from "@/lib/demo/seed";
import type { AnalyticsRepository, CollectionRepository, CreatorRepository, ProductRepository } from "@/lib/repositories/contracts";
import type { Creator, StoreCollection, StoreProduct } from "@/types/store";

const KEYS = { creator: "creatorstore:demo:creator", products: "creatorstore:demo:products", collections: "creatorstore:demo:collections" };
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function write<T>(key: string, value: T) { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value)); }

export function getCurrentDemoCreator() { return read<Creator>(KEYS.creator, demoCreator); }

export const creatorRepository: CreatorRepository = {
  async get(username) { const saved = read<Creator>(KEYS.creator, demoCreator); return saved.username === username ? saved : username === demoCreator.username ? demoCreator : null; },
  async getForUser() { const saved = read<Creator>(KEYS.creator, demoCreator); return saved; },
  async getAccount() { return null; },
  async isUsernameAvailable(username) { const normalized = username.toLowerCase(); const saved = read<Creator>(KEYS.creator, demoCreator); return normalized === saved.username || (normalized !== demoCreator.username && !["admin", "login", "signup", "dashboard", "onboarding", "go", "api"].includes(normalized)); },
  async completeOnboarding(_uid, _email, creator) { write(KEYS.creator, creator); },
  async save(creator) { write(KEYS.creator, creator); },
};
export const productRepository: ProductRepository = {
  async list() { return read<StoreProduct[]>(KEYS.products, demoProducts).slice().sort((a, b) => a.order - b.order); },
  async save(product) { const items = read<StoreProduct[]>(KEYS.products, demoProducts); const index = items.findIndex((item) => item.id === product.id); if (index < 0) items.push(product); else items[index] = product; write(KEYS.products, items); },
  async delete(id) { write(KEYS.products, read<StoreProduct[]>(KEYS.products, demoProducts).filter((item) => item.id !== id)); },
  async reorder(ids) { const items = read<StoreProduct[]>(KEYS.products, demoProducts).map((item) => ({ ...item, order: ids.indexOf(item.id) < 0 ? item.order : ids.indexOf(item.id) })); write(KEYS.products, items); },
};
export const collectionRepository: CollectionRepository = {
  async list() { return read<StoreCollection[]>(KEYS.collections, demoCollections).slice().sort((a, b) => a.order - b.order); },
  async save(collection) { const items = read<StoreCollection[]>(KEYS.collections, demoCollections); const index = items.findIndex((item) => item.id === collection.id); if (index < 0) items.push(collection); else items[index] = collection; write(KEYS.collections, items); },
  async delete(id) { write(KEYS.collections, read<StoreCollection[]>(KEYS.collections, demoCollections).filter((item) => item.id !== id)); },
};
export const analyticsRepository: AnalyticsRepository = { async getSummary() { const products = read<StoreProduct[]>(KEYS.products, demoProducts); return { storeViews: 1248, productClicks: products.reduce((total, item) => total + item.clicks, 0), topProductId: products.slice().sort((a, b) => b.clicks - a.clicks)[0]?.id }; } };
