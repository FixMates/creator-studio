import type { AnalyticsSummary, Creator, CreatorAccount, StoreCollection, StoreProduct } from "@/types/store";

export interface CreatorRepository { get(username: string): Promise<Creator | null>; getForUser(uid: string): Promise<Creator | null>; getAccount(uid: string): Promise<CreatorAccount | null>; isUsernameAvailable(username: string, uid?: string): Promise<boolean>; completeOnboarding(uid: string, email: string, creator: Creator): Promise<void>; save(creator: Creator): Promise<void> }
export interface ProductRepository { list(creatorId: string): Promise<StoreProduct[]>; listPublic(creatorId: string): Promise<StoreProduct[]>; save(product: StoreProduct): Promise<void>; delete(productId: string): Promise<void>; reorder(productIds: string[]): Promise<void> }
export interface CollectionRepository { list(creatorId: string): Promise<StoreCollection[]>; listPublic(creatorId: string): Promise<StoreCollection[]>; save(collection: StoreCollection): Promise<void>; delete(collectionId: string): Promise<void> }
export interface AnalyticsRepository { getSummary(creatorId: string): Promise<AnalyticsSummary> }
