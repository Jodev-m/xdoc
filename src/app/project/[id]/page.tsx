"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectService, FolderService, DocumentService } from "@/services";
import type { Project, Folder, XDoc } from "@/types";
import { FolderTree, FileList } from "@/features/explorer";
import { ChecklistPanel } from "@/features/checklist";
import { PromptDialog } from "@/components/PromptDialog";
import { ImportDialog } from "@/components/ImportDialog";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<XDoc[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showDocPrompt, setShowDocPrompt] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      ProjectService.getProject(id),
      FolderService.getFolders(id),
      DocumentService.getDocuments(id),
    ]).then(([proj, flds, docs]) => {
      setProject(proj ?? null);
      setFolders(flds);
      setDocuments(docs);
      setLoading(false);
    });
  }, [id]);

  const filteredDocs = selectedFolder
    ? documents.filter((d) => d.folderId === selectedFolder)
    : documents;

  const handleCreateDocument = async (title: string) => {
    if (!project) return;
    const doc = await DocumentService.createDocument(project.id, title, selectedFolder);
    setDocuments((prev) => [...prev, doc]);
  };

  const handleRenameDocument = async (docId: string, title: string) => {
    await DocumentService.renameDocument(docId, title);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, title } : d))
    );
  };

  const handleDeleteDocument = async (docId: string) => {
    await DocumentService.deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    await FolderService.renameFolder(folderId, name);
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name } : f))
    );
  };

  const handleDeleteFolder = async (folderId: string) => {
    await FolderService.deleteFolder(folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setDocuments((prev) => prev.map((d) => (d.folderId === folderId ? { ...d, folderId: undefined } : d)));
  };

  const handleDuplicateDocument = async (docId: string) => {
    const doc = await DocumentService.duplicateDocument(docId);
    if (doc) setDocuments((prev) => [...prev, doc]);
  };

  const handleRefreshDocuments = async () => {
    const docs = await DocumentService.getDocuments(id);
    setDocuments(docs);
  };

  const handleDuplicateProject = async () => {
    if (!project) return;
    await ProjectService.duplicateProject(project.id);
    router.push("/");
  };

  const handleCreateSubfolder = async (parentId: string, name: string) => {
    if (!project) return;
    const folder = await FolderService.createFolder(project.id, name, parentId || undefined);
    setFolders((prev) => [...prev, folder]);
  };

  const openEditProject = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditStartDate(project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "");
    setEditEndDate(project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "");
    setShowEditProject(true);
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editName.trim()) return;
    const start = editStartDate ? new Date(editStartDate).getTime() : undefined;
    const end = editEndDate ? new Date(editEndDate).getTime() : undefined;
    await ProjectService.updateProject(project.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      startDate: start,
      endDate: end,
    });
    setProject({
      ...project,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      startDate: start,
      endDate: end,
    });
    setShowEditProject(false);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-neutral-500">Chargement...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Projet introuvable</h1>
          <Link href="/" className="text-blue-600 hover:underline">Retour &agrave; l&rsquo;accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 pb-20 sm:pb-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-1 sm:gap-2 mb-2 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1" title="Retour">←</button>
        <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">|</span>
        <Link href="/" className="hover:underline hidden sm:inline">Accueil</Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate max-w-[120px] sm:max-w-xs">{project.name}</span>
        {project.description && (
          <span className="text-neutral-400 ml-0 sm:ml-2 truncate max-w-[80px] sm:max-w-xs hidden sm:inline">— {project.description}</span>
        )}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleDuplicateProject}
            className="text-xs px-2 py-1.5 rounded border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
            title="Dupliquer le projet"
          >
            📋
          </button>
          <button
            onClick={openEditProject}
            className="text-xs px-2 py-1.5 rounded border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
          >
            Modifier
          </button>
        </div>
      </div>
      {(project.startDate || project.endDate) && (
        <p className="text-xs text-neutral-400 mb-4">
          {project.startDate && new Date(project.startDate).toLocaleDateString("fr-FR")}
          {project.startDate && project.endDate && " — "}
          {project.endDate && new Date(project.endDate).toLocaleDateString("fr-FR")}
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <aside className="w-full md:w-56 shrink-0">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolder}
            onSelect={setSelectedFolder}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolder}
            onCreateSubfolder={handleCreateSubfolder}
            projectId={project.id}
          />
        </aside>

        <main className="flex-1 min-w-0">
          <FileList
            documents={filteredDocs}
            projectId={project.id}
            onRename={handleRenameDocument}
            onDelete={handleDeleteDocument}
            onDuplicate={handleDuplicateDocument}
            onImport={() => setShowImport(true)}
            onCreateDocument={() => setShowDocPrompt(true)}
            folderName={
              selectedFolder
                ? folders.find((f) => f.id === selectedFolder)?.name
                : undefined
            }
          />
        </main>
      </div>

      <div className="mt-8 border-t dark:border-neutral-700 pt-6">
        <ChecklistPanel projectId={project.id} />
      </div>

      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-4">Modifier le projet</h2>
            <form onSubmit={handleEditProject}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nom du projet"
                className="w-full px-4 py-2 border dark:border-neutral-700 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optionnelle)"
                rows={3}
                className="w-full px-4 py-2 border dark:border-neutral-700 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600 resize-none"
              />
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Début</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Fin</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProject(false)}
                  className="px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 hover:dark:bg-neutral-200 disabled:opacity-50"
                  disabled={!editName.trim()}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImportDialog
        open={showImport}
        projectId={project.id}
        folderId={selectedFolder}
        onClose={() => setShowImport(false)}
        onImported={handleRefreshDocuments}
      />

      <PromptDialog
        open={showDocPrompt}
        title="Nouveau document"
        label="Titre du document"
        placeholder="Titre"
        onSubmit={handleCreateDocument}
        onClose={() => setShowDocPrompt(false)}
      />
    </div>
  );
}
