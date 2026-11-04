import type { Timestamp } from "firebase/firestore";

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
};

export type CreatorProfile = {
  uid: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: { instagram?: string; youtube?: string; website?: string };
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Product = {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  destinationUrl: string;
  videoUrl?: string;
  collectionIds: string[];
  sortOrder: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Collection = {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ProductClick = {
  id: string;
  creatorId: string;
  productId: string;
  clickedAt: Timestamp;
  referrer?: string;
};
