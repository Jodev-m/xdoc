"use client";

import { useState, useEffect, useRef } from "react";
import { ChecklistService } from "@/services";
import type { Checklist, ChecklistTask } from "@/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface ChecklistPanelProps {
  projectId: string;
  onProgressChange?: () => void;
}

export function ChecklistPanel({ projectId, onProgressChange }: ChecklistPanelProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [tasks, setTasks] = useState<Record<string, ChecklistTask[]>>({});
  const [newTitle, setNewTitle] = useState("");
  const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});
  const [showDeleteChecklist, setShowDeleteChecklist] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const loadData = useRef<() => Promise<void>>(undefined);

  useEffect(() => {
    const fn = async () => {
      const cls = await ChecklistService.getChecklists(projectId);
      setChecklists(cls);
      const t: Record<string, ChecklistTask[]> = {};
      for (const c of cls) {
        t[c.id] = await ChecklistService.getTasks(c.id);
      }
      setTasks(t);
    };
    loadData.current = fn;
    fn();
  }, [projectId]);

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await ChecklistService.createChecklist(projectId, newTitle.trim());
    setNewTitle("");
    await loadData.current?.();
    onProgressChange?.();
  };

  const handleDeleteChecklist = async () => {
    if (!showDeleteChecklist) return;
    await ChecklistService.deleteChecklist(showDeleteChecklist);
    setShowDeleteChecklist(null);
    await loadData.current?.();
    onProgressChange?.();
  };

  const handleAddTask = async (checklistId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText[checklistId]?.trim();
    if (!text) return;
    await ChecklistService.addTask(checklistId, text);
    setNewTaskText((prev) => ({ ...prev, [checklistId]: "" }));
    await loadData.current?.();
    onProgressChange?.();
  };

  const handleToggleTask = async (task: ChecklistTask) => {
    await ChecklistService.toggleTask(task.id, !task.completed);
    await loadData.current?.();
    onProgressChange?.();
  };

  const handleDuplicateChecklist = async (id: string) => {
    await ChecklistService.duplicateChecklist(id);
    await loadData.current?.();
    onProgressChange?.();
  };

  const handleRemoveTask = async (taskId: string) => {
    await ChecklistService.removeTask(taskId);
    await loadData.current?.();
    onProgressChange?.();
  };

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
      Checklists
    </h3>
      </div>

      <form onSubmit={handleCreateChecklist} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nouvelle checklist..."
          className="flex-1 px-3 py-1.5 text-sm border dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 hover:dark:bg-neutral-200 disabled:opacity-50"
        >
          +
        </button>
      </form>

      {checklists.map((cl) => {
        const clTasks = tasks[cl.id] ?? [];
        const done = clTasks.filter((t) => t.completed).length;
        const total = clTasks.length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <div key={cl.id} className="border dark:border-neutral-700 rounded-lg">
            <button
              onClick={() => toggleCollapsed(cl.id)}
              className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-neutral-50 hover:dark:bg-neutral-800 rounded-t-lg"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium block truncate">{cl.title}</span>
                {total > 0 && (
                  <span className="text-xs text-neutral-400">
                    {done}/{total} — {percent}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {total > 0 && (
                  <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateChecklist(cl.id);
                  }}
                  className="text-xs px-1.5 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                  title="Dupliquer la checklist"
                >
                  📋
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteChecklist(cl.id);
                  }}
                  className="text-xs px-1.5 py-1 hover:bg-red-100 hover:dark:bg-red-900/30 rounded"
                  title="Supprimer la checklist"
                >
                  🗑️
                </button>
              </div>
            </button>

            {!collapsed[cl.id] && (
              <div className="border-t px-3 py-2 space-y-1">
                {clTasks.length === 0 && (
                  <p className="text-xs text-neutral-400 py-1">Aucune tâche</p>
                )}
                {clTasks
                  .sort((a, b) => a.position - b.position)
                  .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                      e.dataTransfer.effectAllowed = "move";
                      (e.currentTarget as HTMLElement).classList.add("opacity-40");
                    }}
                    onDragEnd={(e) => {
                      (e.currentTarget as HTMLElement).classList.remove("opacity-40");
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const dragId = e.dataTransfer.getData("text/plain");
                      if (dragId === task.id) return;
                      const currentTasks = [...(tasks[cl.id] ?? [])].sort((a, b) => a.position - b.position);
                      const dragIdx = currentTasks.findIndex((t) => t.id === dragId);
                      const dropIdx = currentTasks.findIndex((t) => t.id === task.id);
                      if (dragIdx < 0 || dropIdx < 0) return;
                      const [moved] = currentTasks.splice(dragIdx, 1);
                      currentTasks.splice(dropIdx, 0, moved);
                      const updates = currentTasks.map((t, i) => ChecklistService.reorderTask(t.id, i));
                      await Promise.all(updates);
                      setTasks((prev) => ({ ...prev, [cl.id]: currentTasks }));
                    }}
                    className="flex items-center gap-2 group"
                  >
                    <span className="text-xs text-neutral-300 cursor-grab active:cursor-grabbing">⠿</span>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                      className="accent-green-600"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        task.completed ? "line-through text-neutral-400" : ""
                      }`}
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-xs md:opacity-0 md:group-hover:opacity-100 hover:text-red-500 transition-opacity px-1.5 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <form
                  onSubmit={(e) => handleAddTask(cl.id, e)}
                  className="flex gap-1 pt-1"
                >
                  <input
                    type="text"
                    value={newTaskText[cl.id] ?? ""}
                    onChange={(e) =>
                      setNewTaskText((prev) => ({ ...prev, [cl.id]: e.target.value }))
                    }
                    placeholder="Ajouter une tâche..."
                    className="flex-1 px-2 py-1 text-xs border dark:border-neutral-700 rounded outline-none focus:ring-1 focus:ring-neutral-300 focus:dark:ring-neutral-600"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskText[cl.id]?.trim()}
                    className="px-2 py-1 text-xs rounded bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 disabled:opacity-50"
                  >
                    +
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}

      <ConfirmDialog
        open={showDeleteChecklist !== null}
        title="Supprimer la checklist"
        message="Toutes les tâches seront supprimées."
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDeleteChecklist}
        onClose={() => setShowDeleteChecklist(null)}
      />
    </div>
  );
}
