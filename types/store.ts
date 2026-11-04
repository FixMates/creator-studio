export type StoreCategory = "Tech" | "Beauty" | "Fashion" | "Fitness" | "Home" | "Gaming" | "Food" | "Lifestyle" | "Other";
export type SocialLinks = { instagram?: string; youtube?: string; facebook?: string; telegram?: string; website?: string };
export type Creator = { id: string; username: string; displayName: string; bio: string; avatarUrl?: string; category: StoreCategory; socialLinks: SocialLinks; published: boolean };
export type StoreProduct = { id: string; creatorId: string; name: string; description: string; imageUrl: string; destinationUrl: string; price?: string; currency?: string; source: string; recommendation: string; reviewUrl?: string; reviewType?: "youtube" | "instagram" | "external"; featured: boolean; active?: boolean; clicks: number; collectionIds: string[]; order: number };
export type StoreCollection = { id: string; creatorId: string; title: string; description: string; imageUrl?: string; productIds: string[]; order: number };
export type OnboardingDraft = { displayName: string; username: string; bio: string; avatarUrl: string; category: StoreCategory; socialLinks: SocialLinks };
export type AnalyticsSummary = { storeViews: number; productClicks: number; topProductId?: string; totalProducts?: number; featuredProducts?: number; totalCollections?: number };
export type CreatorAccount = { uid: string; email: string; createdAt: unknown; onboardingCompleted: boolean };
