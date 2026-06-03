"use client";

import { useState, useEffect } from "react";
import { ProjectService, ChecklistService } from "@/services";
import type { Project } from "@/types";
import Link from "next/link";
import { ProjectList, CreateProjectDialog } from "@/features/projects";

export default function HomePage() {
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
  };

  const handleDelete = async (id: string) => {
    await ProjectService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setArchived((prev) => prev.filter((p) => p.id !== id));
  };

  const handleArchive = async (id: string, archived: boolean) => {
    await ProjectService.archiveProject(id, archived);
    await loadProjects();
  };

  const displayProjects = showArchived ? archived : projects;

  return (
    <div className="flex flex-col flex-1 p-6 max-w-4xl mx-auto w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">xdoc-mobile</h1>
        <nav className="hidden md:flex gap-4 text-sm">
          <Link href="/search" className="hover:underline">Recherche</Link>
          <Link href="/stats" className="hover:underline">Statistiques</Link>
          <Link href="/versions" className="hover:underline">Historique</Link>
          <Link href="/trash" className="hover:underline">Corbeille</Link>
          <Link href="/settings" className="hover:underline">Paramètres</Link>
        </nav>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white dark:bg-neutral-900 border-t dark:border-neutral-700 px-2 py-2 safe-area-bottom">
        <NavItem href="/" label="Accueil" icon="🏠" />
        <NavItem href="/search" label="Recherche" icon="🔍" />
        <NavItem href="/stats" label="Stats" icon="📊" />
        <NavItem href="/versions" label="Historique" icon="🕐" />
        <NavItem href="/settings" label="Paramètres" icon="⚙️" />
      </nav>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(false)}
              className={`text-sm font-semibold ${showArchived ? "text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}
            >
              Projets
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`text-sm font-semibold ${showArchived ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400"}`}
            >
              Archivés {archived.length > 0 && `(${archived.length})`}
            </button>
          </div>
          {!showArchived && (
            <button
              onClick={() => setDialogOpen(true)}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 hover:dark:bg-neutral-200"
            >
              + Nouveau projet
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-neutral-500">Chargement...</p>
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

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
