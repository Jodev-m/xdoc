"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/types";
import { ProjectService } from "@/services";
import { FavoriteButton } from "./FavoriteButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  progress: Record<string, { done: number; total: number }>;
  onUpdate: (projects: Project[]) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string, archived: boolean) => void;
  showArchiveBtn?: boolean;
}

export function ProjectList({ projects, progress, onUpdate, onDelete, onArchive, showArchiveBtn }: ProjectListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleFavorite = async (project: Project) => {
    await ProjectService.favoriteProject(project.id, !project.favorite);
    onUpdate(
      projects.map((p) =>
        p.id === project.id ? { ...p, favorite: !p.favorite } : p
      )
    );
  };

  if (projects.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">Aucun projet pour le moment.</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/project/${project.id}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-neutral-50 transition-colors group dark:border-neutral-700 hover:dark:bg-neutral-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FavoriteButton
                  favorite={project.favorite}
                  onToggle={() => handleFavorite(project)}
                />
                <div className="min-w-0 flex-1">
                  <span className="font-medium block truncate">{project.name}</span>
                  {project.description && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 block truncate">{project.description}</span>
                  )}
                  {(project.startDate || project.endDate) && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                      {project.startDate && new Date(project.startDate).toLocaleDateString("fr-FR")}
                      {project.startDate && project.endDate && " — "}
                      {project.endDate && new Date(project.endDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  {progress[project.id] && progress[project.id].total > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{
                            width: `${Math.round((progress[project.id].done / progress[project.id].total) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {progress[project.id].done}/{progress[project.id].total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(project.updatedAt).toLocaleDateString("fr-FR")}
                </span>
                {onArchive && showArchiveBtn && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onArchive(project.id, true);
                    }}
                    className="md:opacity-0 md:group-hover:opacity-100 text-xs p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-opacity"
                    title="Archiver le projet"
                  >
                    <Archive size={16} />
                  </button>
                )}
                {onArchive && !showArchiveBtn && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onArchive(project.id, false);
                    }}
                    className="md:opacity-0 md:group-hover:opacity-100 text-xs p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-opacity"
                    title="Restaurer le projet"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmDeleteId(project.id);
                  }}
                  className="md:opacity-0 md:group-hover:opacity-100 text-xs p-1 hover:bg-red-100 rounded transition-opacity"
                  title="Supprimer le projet"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Supprimer le projet"
        message="Le projet sera déplacé dans la corbeille."
        confirmLabel="Mettre à la corbeille"
        danger
        onConfirm={() => {
          if (confirmDeleteId) onDelete(confirmDeleteId);
        }}
        onClose={() => setConfirmDeleteId(null)}
      />
    </>
  );
}
