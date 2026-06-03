export interface XDoc {
  id: string;
  projectId: string;
  folderId?: string;
  title: string;
  content: unknown;
  version: number;
  position?: number;
  createdAt: number;
  updatedAt: number;
}
