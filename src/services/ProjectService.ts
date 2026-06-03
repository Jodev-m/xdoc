import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import type { Project } from '@/types';

export const ProjectService = {
  async createProject(name: string, description?: string, startDate?: number, endDate?: number): Promise<Project> {
    const now = Date.now();
    const project: Project = {
      id: uuid(),
      name,
      description,
      startDate,
      endDate,
      favorite: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    return project;
  },

  async updateProject(id: string, data: Partial<Pick<Project, 'name' | 'description' | 'startDate' | 'endDate' | 'favorite' | 'archived'>>): Promise<void> {
    await db.projects.update(id, { ...data, updatedAt: Date.now() });
  },

  async deleteProject(id: string): Promise<void> {
    await db.projects.update(id, { deleted: true, deletedAt: Date.now(), updatedAt: Date.now() });
  },

  async restoreProject(id: string): Promise<void> {
    await db.projects.update(id, { deleted: false, deletedAt: undefined, updatedAt: Date.now() });
  },

  async permanentlyDeleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
    await db.folders.where('projectId').equals(id).delete();
    await db.documents.where('projectId').equals(id).delete();
    const checklists = await db.checklists.where('projectId').equals(id).toArray();
    for (const c of checklists) {
      await db.checklistTasks.where('checklistId').equals(c.id).delete();
    }
    await db.checklists.where('projectId').equals(id).delete();
  },

  async getDeletedProjects(): Promise<Project[]> {
    const all = await db.projects.toArray();
    return all.filter((p) => p.deleted).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  },

  async favoriteProject(id: string, favorite: boolean): Promise<void> {
    await db.projects.update(id, { favorite, updatedAt: Date.now() });
  },

  async getProjects(includeArchived?: boolean): Promise<Project[]> {
    let projects = await db.projects.orderBy('updatedAt').reverse().toArray();
    projects = projects.filter((p) => !p.deleted);
    if (!includeArchived) {
      projects = projects.filter((p) => !p.archived);
    }
    return projects;
  },

  async getArchivedProjects(): Promise<Project[]> {
    const all = await db.projects.toArray();
    return all.filter((p) => p.archived && !p.deleted).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async archiveProject(id: string, archived: boolean): Promise<void> {
    await db.projects.update(id, { archived, updatedAt: Date.now() });
  },

  async duplicateProject(id: string): Promise<Project | undefined> {
    const original = await db.projects.get(id);
    if (!original) return;
    const now = Date.now();
    const newProj: Project = {
      ...original,
      id: uuid(),
      name: `${original.name} - Copie`,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(newProj);

    const folders = await db.folders.where('projectId').equals(id).toArray();
    const folderMap = new Map<string, string>();
    for (const f of folders) {
      const newId = uuid();
      folderMap.set(f.id, newId);
      await db.folders.add({ ...f, id: newId, projectId: newProj.id, parentId: f.parentId ? folderMap.get(f.parentId) ?? f.parentId : undefined });
    }

    const docs = await db.documents.where('projectId').equals(id).toArray();
    for (const d of docs) {
      await db.documents.add({
        ...d,
        id: uuid(),
        projectId: newProj.id,
        folderId: d.folderId ? folderMap.get(d.folderId) ?? d.folderId : undefined,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    const checklists = await db.checklists.where('projectId').equals(id).toArray();
    for (const c of checklists) {
      const newClId = uuid();
      await db.checklists.add({ ...c, id: newClId, projectId: newProj.id, createdAt: now, updatedAt: now });
      const tasks = await db.checklistTasks.where('checklistId').equals(c.id).toArray();
      for (const t of tasks) {
        await db.checklistTasks.add({ ...t, id: uuid(), checklistId: newClId, createdAt: now });
      }
    }

    return newProj;
  },

  async getProject(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  },
};
