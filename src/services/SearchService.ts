import Fuse, { type IFuseOptions } from 'fuse.js';
import { db } from '@/db';
import type { XDoc } from '@/types';

export interface SearchDoc {
  id: string;
  title: string;
  projectId: string;
  projectName?: string;
  content: string;
}

let fuse: Fuse<SearchDoc> | null = null;
let initialized = false;

const fuseOptions: IFuseOptions<SearchDoc> = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'content', weight: 1 },
    { name: 'projectName', weight: 1.5 },
  ],
  threshold: 0.4,
  includeScore: true,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return stripHtml(content);
  if (!content) return '';
  try {
    return JSON.stringify(content);
  } catch {
    return '';
  }
}

async function enrichWithProjectName(docs: SearchDoc[]): Promise<SearchDoc[]> {
  if (docs.length === 0) return docs;
  const projectIds = [...new Set(docs.map((d) => d.projectId))];
  const projects = await Promise.all(
    projectIds.map((pid) => db.projects.get(pid))
  );
  const projectMap = new Map(projectIds.map((pid, i) => [pid, projects[i]?.name]));

  return docs.map((doc) => ({
    ...doc,
    projectName: projectMap.get(doc.projectId) ?? 'Projet inconnu',
  }));
}

export const SearchService = {
  async init(): Promise<void> {
    if (initialized) return;
    const docs = await db.documents.toArray();
    const searchDocs = await enrichWithProjectName(
      docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        projectId: doc.projectId,
        content: extractText(doc.content),
      }))
    );
    fuse = new Fuse<SearchDoc>(searchDocs, fuseOptions);
    initialized = true;
  },

  async indexDocument(doc: XDoc): Promise<void> {
    const project = await db.projects.get(doc.projectId);
    const contentText = extractText(doc.content);

    const searchDoc: SearchDoc = {
      id: doc.id,
      title: doc.title,
      projectId: doc.projectId,
      projectName: project?.name ?? 'Projet inconnu',
      content: contentText,
    };

    if (!fuse) {
      fuse = new Fuse<SearchDoc>([searchDoc], fuseOptions);
      initialized = true;
      return;
    }

    fuse.remove((d) => d.id === doc.id);
    fuse.add(searchDoc);
  },

  async search(query: string): Promise<SearchDoc[]> {
    if (!fuse) await this.init();
    if (!fuse || !query.trim()) return [];

    const results = fuse.search(query);
    return results.map((r) => r.item);
  },

  async rebuildIndex(docs: XDoc[]): Promise<void> {
    const searchDocs = await enrichWithProjectName(
      docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        projectId: doc.projectId,
        content: extractText(doc.content),
      }))
    );
    fuse = new Fuse<SearchDoc>(searchDocs, fuseOptions);
    initialized = true;
  },

  async clearIndex(): Promise<void> {
    fuse = null;
    initialized = false;
  },
};
