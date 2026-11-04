import type { Creator, StoreCollection, StoreProduct } from "@/types/store";

export const demoCreator: Creator = {
  id: "creator-sundar", username: "sundarpicks", displayName: "Sundar's little finds",
  bio: "Thoughtful tech, everyday essentials, and a few things that just make life nicer. Everything here is something I genuinely use.",
  avatarUrl: "", category: "Lifestyle", socialLinks: { instagram: "https://instagram.com", youtube: "https://youtube.com", website: "https://example.com" }, published: true,
};

export const demoProducts: StoreProduct[] = [
  { id: "p-notebook", creatorId: demoCreator.id, name: "The everyday notebook", description: "A lovely notebook for collecting half-formed ideas and daily notes.", imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85", destinationUrl: "https://example.com/notebook", price: "₹649", source: "Paper & Co.", recommendation: "The paper feels lovely, and it has quietly become part of my morning ritual.", featured: true, clicks: 128, collectionIds: ["c-desk", "c-daily"], order: 0 },
  { id: "p-headphones", creatorId: demoCreator.id, name: "Quiet Hours headphones", description: "Comfortable, warm sounding headphones for deep work and long walks.", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", destinationUrl: "https://example.com/headphones", price: "₹4,999", source: "Soundroom", recommendation: "The pair I reach for when I need to get into my own little world.", featured: true, clicks: 96, collectionIds: ["c-desk"], order: 1 },
  { id: "p-pourover", creatorId: demoCreator.id, name: "Ceramic pour-over set", description: "A handmade ceramic dripper that makes weekday coffee feel a little slower.", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85", destinationUrl: "https://example.com/pourover", price: "₹1,250", source: "Clay House", recommendation: "My favourite small upgrade to the first cup of the day.", featured: false, clicks: 74, collectionIds: ["c-daily"], order: 2 },
  { id: "p-lamp", creatorId: demoCreator.id, name: "Soft glow desk lamp", description: "Warm, adjustable light for late evenings at the desk.", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85", destinationUrl: "https://example.com/lamp", price: "₹2,190", source: "Form & Function", recommendation: "Makes the end of the day feel a little calmer.", featured: false, clicks: 52, collectionIds: ["c-desk"], order: 3 },
];

export const demoCollections: StoreCollection[] = [
  { id: "c-desk", creatorId: demoCreator.id, title: "My thoughtful desk", description: "Little upgrades for a happier workspace.", productIds: ["p-notebook", "p-headphones", "p-lamp"], order: 0 },
  { id: "c-daily", creatorId: demoCreator.id, title: "Daily rituals", description: "The things that make ordinary days feel good.", productIds: ["p-notebook", "p-pourover"], order: 1 },
];
