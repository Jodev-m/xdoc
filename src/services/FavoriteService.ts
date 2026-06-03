import { v4 as uuid } from 'uuid';
import { db } from '@/db';

export const FavoriteService = {
  async toggle(documentId: string): Promise<boolean> {
    const existing = await db.favorites.where('documentId').equals(documentId).first();
    if (existing) {
      await db.favorites.delete(existing.id);
      return false;
    }
    await db.favorites.add({ id: uuid(), documentId, createdAt: Date.now() });
    return true;
  },

  async isFavorite(documentId: string): Promise<boolean> {
    const existing = await db.favorites.where('documentId').equals(documentId).first();
    return !!existing;
  },

  async getFavoriteIds(): Promise<Set<string>> {
    const all = await db.favorites.toArray();
    return new Set(all.map((f) => f.documentId));
  },

  async getFavorites() {
    return db.favorites.toArray();
  },
};
