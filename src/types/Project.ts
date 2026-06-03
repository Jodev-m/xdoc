export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: number;
  endDate?: number;
  favorite: boolean;
  archived: boolean;
  deleted?: boolean;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}
