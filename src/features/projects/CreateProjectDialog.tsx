"use client";

import { useState } from "react";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string, startDate?: number, endDate?: number) => Promise<void>;
}

export function CreateProjectDialog({ open, onClose, onSubmit }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(
      name.trim(),
      description.trim() || undefined,
      startDate ? new Date(startDate).getTime() : undefined,
      endDate ? new Date(endDate).getTime() : undefined
    );
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold mb-4">Nouveau projet</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du projet"
            className="w-full px-4 py-2 border dark:border-neutral-700 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
            autoFocus
            disabled={submitting}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnelle)"
            rows={3}
            className="w-full px-4 py-2 border dark:border-neutral-700 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600 resize-none"
            disabled={submitting}
          />
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
                disabled={submitting}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
                disabled={submitting}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 hover:dark:bg-neutral-200 disabled:opacity-50"
              disabled={!name.trim() || submitting}
            >
              {submitting ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
