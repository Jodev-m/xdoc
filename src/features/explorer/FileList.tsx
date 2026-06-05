"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { XDoc } from "@/types";
import { FavoriteButton } from "@/features/projects";
import { FavoriteService, DocumentService } from "@/services";
import { ContextMenu } from "./ContextMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GripVertical, FileText, Pencil, Copy, Trash2 } from "lucide-react";

interface FileListProps {
  documents: XDoc[];
  projectId: string;
  onRename: (docId: string, title: string) => void;
  onDelete: (docId: string) => void;
  onDuplicate: (docId: string) => void;
  onFavorite?: (docId: string, favorite: boolean) => void;
  onCreateDocument: () => void;
  onImport?: () => void;
  folderName?: string;
}

export function FileList({
  documents,
  projectId,
  onRename,
  onDelete,
  onDuplicate,
  onFavorite,
  onCreateDocument,
  onImport,
  folderName,
}: FileListProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    doc: XDoc;
  } | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<XDoc | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    FavoriteService.getFavoriteIds().then(setFavoriteIds);
  }, [documents]);

  const handleReorder = async (dragDocId: string, dropDocId: string) => {
    const currentDocs = [...documents];
    const dragIdx = currentDocs.findIndex((d) => d.id === dragDocId);
    const dropIdx = currentDocs.findIndex((d) => d.id === dropDocId);
    if (dragIdx < 0 || dropIdx < 0) return;
    const [moved] = currentDocs.splice(dragIdx, 1);
    currentDocs.splice(dropIdx, 0, moved);
    const updates = currentDocs.map((d, i) => DocumentService.reorderDocument(d.id, i));
    await Promise.all(updates);
  };

  const handleToggleFavorite = async (docId: string) => {
    const now = await FavoriteService.toggle(docId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (now) next.add(docId);
      else next.delete(docId);
      return next;
    });
    onFavorite?.(docId, now);
  };

  if (documents.length === 0) {
    return (
      <div>
        <Header folderName={folderName} onCreateDocument={onCreateDocument} onImport={onImport} />
        <p className="text-neutral-500 dark:text-neutral-400">Aucun document.</p>
      </div>
    );
  }

  return (
    <div>
      <Header folderName={folderName} onCreateDocument={onCreateDocument} onImport={onImport} />
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", doc.id);
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
              const draggedId = e.dataTransfer.getData("text/plain");
              if (draggedId !== doc.id) await handleReorder(draggedId, doc.id);
            }}
          >
            <Link
              href={`/project/${projectId}/document/${doc.id}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-neutral-50 transition-colors dark:border-neutral-700 hover:dark:bg-neutral-800"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, doc });
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical size={14} className="text-neutral-300 cursor-grab active:cursor-grabbing select-none shrink-0" />
                <FileText size={18} className="text-neutral-500 shrink-0" />
                {renamingDoc === doc.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => {
                      if (renameValue.trim() && renameValue !== doc.title) {
                        onRename(doc.id, renameValue.trim());
                      }
                      setRenamingDoc(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (renameValue.trim() && renameValue !== doc.title) {
                          onRename(doc.id, renameValue.trim());
                        }
                        setRenamingDoc(null);
                      }
                      if (e.key === "Escape") {
                        setRenamingDoc(null);
                      }
                    }}
                    className="flex-1 px-2 py-0.5 border dark:border-neutral-700 rounded text-sm outline-none min-w-0"
                    autoFocus
                    onClick={(e) => e.preventDefault()}
                  />
                ) : (
                  <span className="font-medium truncate">{doc.title}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  v{doc.version}
                </span>
                <FavoriteButton
                  favorite={favoriteIds.has(doc.id)}
                  onToggle={() => handleToggleFavorite(doc.id)}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          actions={[
            {
              label: "Renommer",
              icon: <Pencil size={16} />,
              onClick: () => {
                setRenameValue(contextMenu.doc.title);
                setRenamingDoc(contextMenu.doc.id);
              },
            },
            {
              label: "Dupliquer",
              icon: <Copy size={16} />,
              onClick: () => {
                onDuplicate(contextMenu.doc.id);
                setContextMenu(null);
              },
            },
            {
              label: "Supprimer",
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => {
                setConfirmDeleteDoc(contextMenu.doc);
              },
            },
          ]}
        />
      )}
      {confirmDeleteDoc && (
        <ConfirmDialog
          open
          title="Supprimer le document"
          message={`Supprimer "${confirmDeleteDoc.title}" ?`}
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            onDelete(confirmDeleteDoc.id);
            setContextMenu(null);
          }}
          onClose={() => setConfirmDeleteDoc(null)}
        />
      )}
    </div>
  );
}

function Header({
  folderName,
  onCreateDocument,
  onImport,
}: {
  folderName?: string;
  onCreateDocument: () => void;
  onImport?: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
      <h2 className="text-lg font-semibold">
        {folderName ?? "Documents"}
      </h2>
      <div className="flex items-center gap-2">
        {onImport && (
          <button
            onClick={onImport}
            className="px-3 py-2 border dark:border-neutral-700 rounded-lg text-sm hover:bg-neutral-50 hover:dark:bg-neutral-800 whitespace-nowrap"
          >
            Importer
          </button>
        )}
        <button
          onClick={onCreateDocument}
          className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 hover:dark:bg-neutral-200 whitespace-nowrap"
        >
          + Nouveau document
        </button>
      </div>
    </div>
  );
}
