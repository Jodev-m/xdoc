import Dexie, { type Table } from 'dexie';
import type { Project, Folder, XDoc, Version, Checklist, ChecklistTask } from '@/types';

export interface ImageEntry {
  id: string;
  documentId: string;
  data: string;
  name: string;
  createdAt: number;
}

export interface ProjectImageEntry {
  id: string;
  projectId: string;
  data: string;
  name: string;
  createdAt: number;
}

export interface FavoriteEntry {
  id: string;
  documentId: string;
  createdAt: number;
}

export interface TrashEntry {
  id: string;
  documentId: string;
  projectId: string;
  title: string;
  content: unknown;
  deletedAt: number;
}

export class XDocDatabase extends Dexie {
  projects!: Table<Project, string>;
  folders!: Table<Folder, string>;
  documents!: Table<XDoc, string>;
  versions!: Table<Version, string>;
  images!: Table<ImageEntry, string>;
  favorites!: Table<FavoriteEntry, string>;
  trash!: Table<TrashEntry, string>;
  checklists!: Table<Checklist, string>;
  checklistTasks!: Table<ChecklistTask, string>;
  projectImages!: Table<ProjectImageEntry, string>;

  constructor() {
    super('xdoc-database');
    this.version(3).stores({
      projects: 'id, name, favorite, updatedAt',
      folders: 'id, projectId, parentId',
      documents: 'id, projectId, folderId, title, updatedAt',
      versions: 'id, documentId, version',
      images: 'id, documentId',
      favorites: 'id, documentId',
      trash: 'id, documentId, projectId, deletedAt',
      checklists: 'id, projectId',
      checklistTasks: 'id, checklistId',
    });
    this.version(4).stores({
      projects: 'id, name, favorite, updatedAt',
      folders: 'id, projectId, parentId',
      documents: 'id, projectId, folderId, title, updatedAt',
      versions: 'id, documentId, version',
      images: 'id, documentId',
      favorites: 'id, documentId',
      trash: 'id, documentId, projectId, deletedAt',
      checklists: 'id, projectId',
      checklistTasks: 'id, checklistId',
      projectImages: 'id, projectId',
    });
  }
}

export const db = new XDocDatabase();
