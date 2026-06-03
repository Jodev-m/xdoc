import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import type { Folder } from '@/types';

export const FolderService = {
  async createFolder(projectId: string, name: string, parentId?: string): Promise<Folder> {
    const folder: Folder = {
      id: uuid(),
      projectId,
      parentId,
      name,
    };
    await db.folders.add(folder);
    return folder;
  },

  async moveFolder(id: string, newParentId?: string): Promise<void> {
    await db.folders.update(id, { parentId: newParentId });
  },

  async deleteFolder(id: string): Promise<void> {
    const children = await db.folders.where('parentId').equals(id).toArray();
    for (const child of children) {
      await this.deleteFolder(child.id);
    }
    await db.documents.where('folderId').equals(id).modify({ folderId: undefined });
    await db.folders.delete(id);
  },

  async getFolders(projectId: string): Promise<Folder[]> {
    return db.folders.where('projectId').equals(projectId).toArray();
  },

  async renameFolder(id: string, name: string): Promise<void> {
    await db.folders.update(id, { name });
  },
};
