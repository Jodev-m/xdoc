export interface Checklist {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChecklistTask {
  id: string;
  checklistId: string;
  text: string;
  completed: boolean;
  position: number;
  createdAt: number;
}
