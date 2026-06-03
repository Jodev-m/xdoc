import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import type { XDoc } from '@/types';

export const DocumentService = {
  async createDocument(projectId: string, title: string, folderId?: string, content?: unknown): Promise<XDoc> {
    const now = Date.now();
    const existing = folderId
      ? await db.documents.where({ projectId, folderId }).toArray()
      : await db.documents.where('projectId').equals(projectId).toArray();
    const maxPos = existing.reduce((max, d) => Math.max(max, d.position ?? 0), -1);
    const doc: XDoc = {
      id: uuid(),
      projectId,
      folderId,
      title,
      content: content ?? null,
      version: 1,
      position: maxPos + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.documents.add(doc);
    return doc;
  },

  async reorderDocument(id: string, position: number): Promise<void> {
    await db.documents.update(id, { position, updatedAt: Date.now() });
  },

  async getDocumentsSorted(projectId: string, folderId?: string): Promise<XDoc[]> {
    const docs = folderId
      ? await db.documents.where({ projectId, folderId }).toArray()
      : await db.documents.where('projectId').equals(projectId).toArray();
    return docs.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  },

  async openDocument(id: string): Promise<XDoc | undefined> {
    return db.documents.get(id);
  },

  async saveDocument(id: string, content: unknown): Promise<void> {
    const doc = await db.documents.get(id);
    if (!doc) return;
    await db.documents.update(id, {
      content,
      version: doc.version + 1,
      updatedAt: Date.now(),
    });
  },

  async renameDocument(id: string, title: string): Promise<void> {
    await db.documents.update(id, { title, updatedAt: Date.now() });
  },

  async deleteDocument(id: string): Promise<void> {
    const doc = await db.documents.get(id);
    if (!doc) return;
    await db.trash.add({
      id: uuid(),
      documentId: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      content: doc.content,
      deletedAt: Date.now(),
    });
    await db.documents.delete(id);
    await db.versions.where('documentId').equals(id).delete();
    await db.images.where('documentId').equals(id).delete();
  },

  async duplicateDocument(id: string, projectId?: string): Promise<XDoc | undefined> {
    const doc = await db.documents.get(id);
    if (!doc) return;
    const newDoc: XDoc = {
      ...doc,
      id: uuid(),
      title: `${doc.title} - Copie`,
      projectId: projectId ?? doc.projectId,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.documents.add(newDoc);
    return newDoc;
  },

  async getDocuments(projectId: string, folderId?: string): Promise<XDoc[]> {
    const docs = folderId
      ? await db.documents.where({ projectId, folderId }).toArray()
      : await db.documents.where('projectId').equals(projectId).toArray();
    return docs.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  },
};
