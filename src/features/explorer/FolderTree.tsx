"use client";

import { useState } from "react";
import type { Folder } from "@/types";
import { PromptDialog } from "@/components/PromptDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId?: string;
  onSelect: (folderId: string | undefined) => void;
  onRename: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string, name: string) => void;
  projectId: string;
}

function FolderNode({
  folder,
  allFolders,
  selectedFolderId,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
  depth,
}: {
  folder: Folder;
  allFolders: Folder[];
  selectedFolderId?: string;
  onSelect: (folderId: string | undefined) => void;
  onRename: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string, name: string) => void;
  depth: number;
}) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showSubfolderPrompt, setShowSubfolderPrompt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Folder | null>(null);
  const children = allFolders.filter((f) => f.parentId === folder.id);

  return (
    <li>
      <div
        className={`group flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer hover:bg-neutral-100 hover:dark:bg-neutral-800 ${
          selectedFolderId === folder.id ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <span className="text-xs mr-1">📁</span>
        {renaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => {
              if (newName.trim() && newName !== folder.name) {
                onRename(folder.id, newName.trim());
              }
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (newName.trim() && newName !== folder.name) {
                  onRename(folder.id, newName.trim());
                }
                setRenaming(false);
              }
              if (e.key === "Escape") {
                setNewName(folder.name);
                setRenaming(false);
              }
            }}
            className="flex-1 px-1 py-0.5 border dark:border-neutral-700 rounded text-sm outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{folder.name}</span>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSubfolderPrompt(true);
            }}
            className="text-xs px-1 hover:bg-neutral-200 rounded"
            title="Nouveau sous-dossier"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNewName(folder.name);
              setRenaming(true);
            }}
            className="text-xs px-1 hover:bg-neutral-200 rounded"
            title="Renommer"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(folder);
            }}
            className="text-xs px-1 hover:bg-red-100 hover:dark:bg-red-900/30 rounded"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
      {children.length > 0 && (
        <ul className="space-y-0.5 mt-0.5">
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
      <PromptDialog
        open={showSubfolderPrompt}
        title="Nouveau sous-dossier"
        label="Nom du sous-dossier"
        placeholder="Nom du dossier"
        onSubmit={(name) => onCreateSubfolder(folder.id, name)}
        onClose={() => setShowSubfolderPrompt(false)}
      />
      {confirmDelete && (
        <ConfirmDialog
          open
          title="Supprimer le dossier"
          message={`Supprimer le dossier "${confirmDelete.name}" ?`}
          confirmLabel="Supprimer"
          danger
          onConfirm={() => onDelete(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </li>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
  projectId: _projectId,
}: FolderTreeProps) {
  const [showFolderPrompt, setShowFolderPrompt] = useState(false);
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
        Dossiers
      </h3>
      <ul className="space-y-0.5">
        <li>
          <button
            onClick={() => onSelect(undefined)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm ${
              !selectedFolderId
                ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                : "hover:bg-neutral-50 hover:dark:bg-neutral-800"
            }`}
          >
            📄 Tous les documents
          </button>
        </li>
        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            allFolders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
            onCreateSubfolder={onCreateSubfolder}
            depth={0}
          />
        ))}
      </ul>
      <button
        onClick={() => setShowFolderPrompt(true)}
        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        + Nouveau dossier
      </button>
      <PromptDialog
        open={showFolderPrompt}
        title="Nouveau dossier"
        label="Nom du dossier"
        placeholder="Nom du dossier"
        onSubmit={(name) => onCreateSubfolder("", name)}
        onClose={() => setShowFolderPrompt(false)}
      />
    </div>
  );
}
