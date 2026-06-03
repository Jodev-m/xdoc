import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import type { Checklist, ChecklistTask } from '@/types';

export const ChecklistService = {
  async getChecklists(projectId: string): Promise<Checklist[]> {
    return db.checklists.where('projectId').equals(projectId).toArray();
  },

  async createChecklist(projectId: string, title: string): Promise<Checklist> {
    const now = Date.now();
    const checklist: Checklist = {
      id: uuid(),
      projectId,
      title,
      createdAt: now,
      updatedAt: now,
    };
    await db.checklists.add(checklist);
    return checklist;
  },

  async renameChecklist(id: string, title: string): Promise<void> {
    await db.checklists.update(id, { title, updatedAt: Date.now() });
  },

  async deleteChecklist(id: string): Promise<void> {
    await db.checklistTasks.where('checklistId').equals(id).delete();
    await db.checklists.delete(id);
  },

  async getTasks(checklistId: string): Promise<ChecklistTask[]> {
    return db.checklistTasks
      .where('checklistId')
      .equals(checklistId)
      .sortBy('position');
  },

  async addTask(checklistId: string, text: string): Promise<ChecklistTask> {
    const tasks = await this.getTasks(checklistId);
    const maxPos = tasks.reduce((max, t) => Math.max(max, t.position), -1);
    const task: ChecklistTask = {
      id: uuid(),
      checklistId,
      text,
      completed: false,
      position: maxPos + 1,
      createdAt: Date.now(),
    };
    await db.checklistTasks.add(task);
    await db.checklists.update(checklistId, { updatedAt: Date.now() });
    return task;
  },

  async toggleTask(id: string, completed: boolean): Promise<void> {
    await db.checklistTasks.update(id, { completed });
  },

  async removeTask(id: string): Promise<void> {
    await db.checklistTasks.delete(id);
  },

  async reorderTask(id: string, position: number): Promise<void> {
    await db.checklistTasks.update(id, { position });
  },

  async duplicateChecklist(id: string): Promise<Checklist | undefined> {
    const original = await db.checklists.get(id);
    if (!original) return;
    const now = Date.now();
    const newCl: Checklist = {
      ...original,
      id: uuid(),
      title: `${original.title} - Copie`,
      createdAt: now,
      updatedAt: now,
    };
    await db.checklists.add(newCl);
    const tasks = await this.getTasks(id);
    for (const t of tasks) {
      await db.checklistTasks.add({ ...t, id: uuid(), checklistId: newCl.id, createdAt: now });
    }
    return newCl;
  },

  async getProjectProgress(projectId: string): Promise<{ done: number; total: number }> {
    const checklists = await this.getChecklists(projectId);
    const checklistIds = checklists.map((c) => c.id);
    if (checklistIds.length === 0) return { done: 0, total: 0 };

    let total = 0;
    let done = 0;
    for (const id of checklistIds) {
      const tasks = await db.checklistTasks.where('checklistId').equals(id).toArray();
      total += tasks.length;
      done += tasks.filter((t) => t.completed).length;
    }
    return { done, total };
  },
};
