"use client";

import { useState, useRef } from "react";
import { DocumentService } from "@/services";

interface ImportDialogProps {
  open: boolean;
  projectId: string;
  folderId?: string;
  onClose: () => void;
  onImported: () => void;
}

export function ImportDialog({ open, projectId, folderId, onClose, onImported }: ImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const text = await file.text();
      const title = file.name.replace(/\.[^/.]+$/, "");
      let content: unknown;

      if (file.name.endsWith(".txt")) {
        content = {
          type: "doc",
          content: text.split("\n").filter((l) => l.trim()).map((line) => ({
            type: "paragraph",
            content: line.trim() ? [{ type: "text", text: line.trim() }] : [],
          })),
        };
      } else if (file.name.endsWith(".html")) {
        content = text;
      } else {
        setError("Format non supporté. Utilisez .txt ou .html.");
        setLoading(false);
        return;
      }

      await DocumentService.createDocument(projectId, title, folderId, content);
      onImported();
      onClose();
    } catch {
      setError("Erreur lors de la lecture du fichier.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold mb-4">Importer un fichier</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Formats supportés : .txt, .html
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.html"
          onChange={handleFile}
          className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 dark:file:bg-neutral-100 dark:file:text-neutral-900 dark:hover:file:bg-neutral-200 mb-4"
        />
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {loading && <p className="text-sm text-neutral-500 mb-2">Importation...</p>}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border dark:border-neutral-700 hover:bg-neutral-50 hover:dark:bg-neutral-800"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
