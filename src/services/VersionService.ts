import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import type { Version } from '@/types';

const MAX_VERSIONS = 20;

export const VersionService = {
  async createVersion(documentId: string, content: unknown): Promise<Version> {
    const existing = await db.versions
      .where('documentId').equals(documentId)
      .reverse()
      .sortBy('version');

    const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

    if (existing.length >= MAX_VERSIONS) {
      const oldest = existing[existing.length - 1];
      await db.versions.delete(oldest.id);
    }

    const version: Version = {
      id: uuid(),
      documentId,
      version: nextVersion,
      createdAt: Date.now(),
      content,
    };
    await db.versions.add(version);
    return version;
  },

  async restoreVersion(documentId: string, versionId: string): Promise<unknown | null> {
    const version = await db.versions.get(versionId);
    if (!version || version.documentId !== documentId) return null;

    const content = version.content;
    await db.documents.update(documentId, {
      content,
      updatedAt: Date.now(),
    });
    return content;
  },

  async listVersions(documentId: string): Promise<Version[]> {
    return db.versions
      .where('documentId').equals(documentId)
      .reverse()
      .sortBy('version');
  },

  async getVersion(versionId: string): Promise<Version | undefined> {
    return db.versions.get(versionId);
  },
};
