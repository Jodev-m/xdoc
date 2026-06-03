import { db } from '@/db';
import type { TrashEntry } from '@/db';
import type { XDoc } from '@/types';

const PURGE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export const TrashService = {
  async listTrash(): Promise<TrashEntry[]> {
    return db.trash.orderBy('deletedAt').reverse().toArray();
  },

  async restoreDocument(entry: TrashEntry): Promise<void> {
    const doc: XDoc = {
      id: entry.documentId,
      projectId: entry.projectId,
      title: entry.title,
      content: entry.content,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.documents.add(doc);
    await db.trash.delete(entry.id);
  },

  async permanentlyDelete(entryId: string): Promise<void> {
    await db.trash.delete(entryId);
  },

  async purgeOld(): Promise<number> {
    const cutoff = Date.now() - PURGE_AFTER_MS;
    const old = await db.trash.where('deletedAt').below(cutoff).toArray();
    const ids = old.map((e) => e.id);
    await db.trash.bulkDelete(ids);
    return ids.length;
  },

  async emptyTrash(): Promise<void> {
    await db.trash.clear();
  },
};
