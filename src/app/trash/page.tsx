"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectService, TrashService } from "@/services";
import type { Project } from "@/types";
import type { TrashEntry } from "@/db";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function TrashPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TrashEntry[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => {
    (async () => {
      const [trash, projects] = await Promise.all([
        TrashService.listTrash(),
        ProjectService.getDeletedProjects(),
      ]);
      setEntries(trash);
      setDeletedProjects(projects);
      setLoading(false);
    })();
  }, []);

  const handleRestore = async (entry: TrashEntry) => {
    await TrashService.restoreDocument(entry);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  };

  const handleRestoreProject = async (id: string) => {
    await ProjectService.restoreProject(id);
    setDeletedProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDelete = (entryId: string) => {
    setConfirmDeleteId(entryId);
  };

  const handleDeleteProject = (id: string) => {
    setConfirmDeleteProjectId(id);
  };

  const doDelete = async () => {
    if (!confirmDeleteId) return;
    await TrashService.permanentlyDelete(confirmDeleteId);
    setEntries((prev) => prev.filter((e) => e.id !== confirmDeleteId));
  };

  const doDeleteProject = async () => {
    if (!confirmDeleteProjectId) return;
    await ProjectService.permanentlyDeleteProject(confirmDeleteProjectId);
    setDeletedProjects((prev) => prev.filter((p) => p.id !== confirmDeleteProjectId));
    setConfirmDeleteProjectId(null);
  };

  const total = entries.length + deletedProjects.length;

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 pb-20 sm:pb-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1" title="Retour">←</button>
        <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">|</span>
        <Link href="/" className="hover:underline hidden sm:inline">Accueil</Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">Corbeille</span>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Corbeille</h1>
        {total > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmEmpty(true)}
              className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 hover:dark:bg-red-900/30"
            >
              Vider la corbeille
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-neutral-500">Chargement...</p>
      ) : total === 0 ? (
        <p className="text-neutral-400">La corbeille est vide.</p>
      ) : (
        <>
          {deletedProjects.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
                Projets supprimés
              </h2>
              <ul className="space-y-2 mb-6">
                {deletedProjects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-lg border dark:border-neutral-700"
                  >
                    <div>
                      <span className="font-medium">{project.name}</span>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Supprimé le {project.deletedAt ? new Date(project.deletedAt).toLocaleString("fr-FR") : "—"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestoreProject(project.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Restaurer
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Supprimer déf.
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
            Documents supprimés
          </h2>
          {entries.length === 0 ? (
            <p className="text-sm text-neutral-400 mb-6">Aucun document supprimé.</p>
          ) : (
            <ul className="space-y-2 mb-6">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-lg border dark:border-neutral-700"
                >
                  <div>
                    <span className="font-medium">{entry.title}</span>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Supprimé le {new Date(entry.deletedAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(entry)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Restaurer
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Supprimer définitivement"
        message="Supprimer définitivement ce document ?"
        confirmLabel="Supprimer"
        danger
        onConfirm={doDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
      <ConfirmDialog
        open={!!confirmDeleteProjectId}
        title="Supprimer définitivement le projet"
        message="Tous les dossiers, documents et checklists seront définitivement supprimés."
        confirmLabel="Supprimer"
        danger
        onConfirm={doDeleteProject}
        onClose={() => setConfirmDeleteProjectId(null)}
      />
      <ConfirmDialog
        open={confirmEmpty}
        title="Vider la corbeille"
        message="Tous les documents et projets supprimés seront définitivement effacés."
        confirmLabel="Vider"
        danger
        onConfirm={async () => {
          await TrashService.emptyTrash();
          for (const p of deletedProjects) {
            await ProjectService.permanentlyDeleteProject(p.id);
          }
          setEntries([]);
          setDeletedProjects([]);
        }}
        onClose={() => setConfirmEmpty(false)}
      />
    </div>
  );
}
