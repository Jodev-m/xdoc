"use client";

import { useState, useEffect } from "react";
import { ProjectService, ChecklistService } from "@/services";
import type { Project } from "@/types";
import Link from "next/link";
import { ProjectList, CreateProjectDialog } from "@/features/projects";
import { useToast } from "@/components/Toast";
import { MobileNav } from "@/components/MobileNav";
import { Skeleton } from "@/components/Skeleton";

export default function HomePage() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [archived, setArchived] = useState<Project[]>([]);
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadProjects = async () => {
    const [active, arch] = await Promise.all([
      ProjectService.getProjects(),
      ProjectService.getArchivedProjects(),
    ]);
    setProjects(active);
    setArchived(arch);
    const prog: Record<string, { done: number; total: number }> = {};
    for (const p of [...active, ...arch]) {
      prog[p.id] = await ChecklistService.getProjectProgress(p.id);
    }
    setProgress(prog);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects();
  }, []);

  const handleCreate = async (name: string, description?: string, startDate?: number, endDate?: number) => {
    const project = await ProjectService.createProject(name, description, startDate, endDate);
    setProjects((prev) => [project, ...prev]);
    toast.showToast(`Projet "${name}" créé`, "success");
  };

  const handleDelete = async (id: string) => {
    const p = projects.find((p) => p.id === id);
    await ProjectService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setArchived((prev) => prev.filter((p) => p.id !== id));
    toast.showToast(`Projet "${p?.name}" supprimé`, "info");
  };

  const handleArchive = async (id: string, toArchive: boolean) => {
    const p = [...projects, ...archived].find((p) => p.id === id);
    await ProjectService.archiveProject(id, toArchive);
    await loadProjects();
    toast.showToast(`Projet "${p?.name}" ${toArchive ? "archivé" : "restauré"}`, "info");
  };

  const displayProjects = showArchived ? archived : projects;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 pb-20 sm:pb-6 max-w-4xl mx-auto w-full">
      <header className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">xdoc-mobile</h1>
        <nav className="hidden md:flex gap-4 text-sm">
          <Link href="/search" className="hover:underline">Recherche</Link>
          <Link href="/stats" className="hover:underline">Statistiques</Link>
          <Link href="/versions" className="hover:underline">Historique</Link>
          <Link href="/trash" className="hover:underline">Corbeille</Link>
          <Link href="/settings" className="hover:underline">Paramètres</Link>
        </nav>
      </header>

      <MobileNav />

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(false)}
              className={`text-sm font-semibold ${showArchived ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}
            >
              Projets
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`text-sm font-semibold ${showArchived ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}
            >
              Archivés {archived.length > 0 && `(${archived.length})`}
            </button>
          </div>
          {!showArchived && (
            <button
              onClick={() => setDialogOpen(true)}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 hover:dark:bg-neutral-200 whitespace-nowrap"
            >
              + Nouveau
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : !showArchived && displayProjects.length === 0 && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-24 h-24 text-neutral-300 dark:text-neutral-600 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Bienvenue sur xdoc-mobile</h2>
            <p className="text-neutral-500 mb-8 max-w-sm">
              Crée ton premier projet pour commencer à rédiger, organiser et suivre tes documents.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-sm font-medium hover:bg-neutral-800 hover:dark:bg-neutral-200"
            >
              Créer mon premier projet
            </button>
          </div>
        ) : (
          <ProjectList projects={displayProjects} progress={progress} onUpdate={setProjects} onDelete={handleDelete} onArchive={handleArchive} showArchiveBtn={!showArchived} />
        )}
      </section>

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
