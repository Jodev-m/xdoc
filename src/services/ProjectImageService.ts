import { v4 as uuid } from 'uuid';
import { db, type ProjectImageEntry } from '@/db';

export const ProjectImageService = {
  async getImages(projectId: string): Promise<ProjectImageEntry[]> {
    return db.projectImages
      .where('projectId')
      .equals(projectId)
      .reverse()
      .toArray();
  },

  async addImage(projectId: string, file: File): Promise<ProjectImageEntry> {
    const base64 = await fileToBase64(file);
    const entry: ProjectImageEntry = {
      id: uuid(),
      projectId,
      data: base64,
      name: file.name,
      createdAt: Date.now(),
    };
    await db.projectImages.add(entry);
    return entry;
  },

  async deleteImage(id: string): Promise<void> {
    await db.projectImages.delete(id);
  },

  async deleteAllForProject(projectId: string): Promise<void> {
    await db.projectImages.where('projectId').equals(projectId).delete();
  },
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
