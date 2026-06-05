"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectService, FolderService, DocumentService, ExportService, ProjectImageService } from "@/services";
import type { Project, Folder, XDoc } from "@/types";
import { FolderTree, FileList } from "@/features/explorer";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";
import { ChecklistPanel } from "@/features/checklist";
import { PromptDialog } from "@/components/PromptDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { ProjectGallery } from "@/features/project/ProjectGallery";
import { Copy, FileText, Download, FileArchive, Share2, MessageCircle, Mail } from "lucide-react";

export default function ProjectPage() {
  const toast = useToast();
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

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
    toast.showToast(`Document "${title}" créé`, "success");
  };

  const handleRenameDocument = async (docId: string, title: string) => {
    await DocumentService.renameDocument(docId, title);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, title } : d))
    );
    toast.showToast(`Document renommé en "${title}"`, "success");
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    await DocumentService.deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.showToast(`Document "${doc?.title}" supprimé`, "info");
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

  const handleCreateBrief = async () => {
    if (!project) return;
    const doc = await DocumentService.createBriefDocument(project.id, project.name);
    setDocuments((prev) => [...prev, doc]);
    toast.showToast("Brief client créé", "success");
  };

  const openExportDialog = () => {
    setSelectedDocIds(new Set(documents.filter((d) => !selectedFolder || d.folderId === selectedFolder).map((d) => d.id)));
    setShowExportDialog(true);
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelection = () => {
    const visible = documents.filter((d) => !selectedFolder || d.folderId === selectedFolder);
    if (selectedDocIds.size === visible.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(visible.map((d) => d.id)));
    }
  };

  const handleExportSelectedPDF = async () => {
    if (!project) return;
    const docs = documents.filter((d) => selectedDocIds.has(d.id));
    if (docs.length === 0) {
      toast.showToast("Sélectionne au moins un document", "error");
      return;
    }
    setExporting(true);
    const blob = await ExportService.exportProjectPDF(
      docs.map((d) => ({ title: d.title, content: d.content })),
      project.name
    );
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.showToast(`${docs.length} document${docs.length > 1 ? "s" : ""} exporté${docs.length > 1 ? "s" : ""} en PDF`, "success");
    }
    setExporting(false);
    setShowExportDialog(false);
  };

  const handleExportSelectedZIP = async () => {
    if (!project) return;
    const docs = documents.filter((d) => selectedDocIds.has(d.id));
    if (docs.length === 0) {
      toast.showToast("Sélectionne au moins un document", "error");
      return;
    }
    setExporting(true);
    const images = await ProjectImageService.getImages(project.id);
    const blob = await ExportService.exportProjectZIP(
      docs.map((d) => ({ title: d.title, content: d.content })),
      images.map((i) => ({ name: i.name, data: i.data })),
      project.name
    );
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.showToast(`Archive ZIP créée (${docs.length} document${docs.length > 1 ? "s" : ""})`, "success");
    }
    setExporting(false);
    setShowExportDialog(false);
  };

  const handleShareZIP = async () => {
    if (!project) return;
    setSharing(true);
    const allDocs = await DocumentService.getProjectDocuments(project.id);
    const images = await ProjectImageService.getImages(project.id);
    const blob = await ExportService.exportProjectZIP(
      allDocs.map((d) => ({ title: d.title, content: d.content })),
      images.map((i) => ({ name: i.name, data: i.data })),
      project.name
    );
    if (blob) {
      const file = new File([blob], `${project.name}.zip`, { type: 'application/zip' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: project.name, files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.showToast("Archive ZIP téléchargée", "success");
      }
    }
    setSharing(false);
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    if (!project) return;
    const text = `Projet "${project.name}" depuis xdoc-mobile${project.description ? ` : ${project.description}` : ''}`;
    window.open(ExportService.getWhatsAppUrl(text), '_blank');
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    if (!project) return;
    const subject = `Projet : ${project.name}`;
    const body = `Découvre mon projet "${project.name}" sur xdoc-mobile.\n\n${project.description ?? ''}\n\nExporté depuis xdoc-mobile.`;
    window.open(ExportService.getMailToUrl(subject, body), '_blank');
    setShowShareMenu(false);
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
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
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
          <span className="text-neutral-500 dark:text-neutral-400 ml-0 sm:ml-2 truncate max-w-[80px] sm:max-w-xs hidden sm:inline">— {project.description}</span>
        )}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleCreateBrief}
            className="text-xs px-2 py-1.5 rounded border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800 flex items-center gap-1"
            title="Nouveau brief client"
          >
            <FileText size={14} />
            Brief
          </button>
          <button
            onClick={openExportDialog}
            className="text-xs px-2 py-1.5 rounded border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800 flex items-center gap-1"
            title="Exporter des documents"
          >
            <Download size={14} />
            Exporter
          </button>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="text-xs px-2 py-1.5 rounded border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800 flex items-center gap-1"
              title="Partager le projet"
            >
              <Share2 size={14} />
              Partager
            </button>
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[170px]">
                  <button
                    onClick={handleShareZIP}
                    disabled={sharing}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileArchive size={14} className="text-neutral-400" />
                    {sharing ? "Préparation..." : "Partager le ZIP"}
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <MessageCircle size={14} className="text-green-500" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Mail size={14} className="text-blue-500" />
                    Email
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleDuplicateProject}
            className="text-xs p-1.5 rounded border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
            title="Dupliquer le projet"
          >
            <Copy size={14} />
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
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
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

      <div className="mt-8 border-t dark:border-neutral-700 pt-6 space-y-6">
        <ProjectGallery projectId={project.id} />
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

      {showExportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700">
              <h2 className="text-lg font-semibold">Exporter des documents</h2>
              <button onClick={() => setShowExportDialog(false)} className="p-1 text-neutral-500 hover:text-neutral-700">✕</button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-neutral-700 text-xs text-neutral-500">
              <button onClick={toggleAllSelection} className="hover:underline">
                {selectedDocIds.size === documents.filter((d) => !selectedFolder || d.folderId === selectedFolder).length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
              <span className="ml-auto">{selectedDocIds.size} sélectionné{selectedDocIds.size > 1 ? "s" : ""}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {documents.filter((d) => !selectedFolder || d.folderId === selectedFolder).map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocIds.has(doc.id)}
                    onChange={() => toggleDocSelection(doc.id)}
                    className="accent-neutral-900 dark:accent-neutral-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{doc.title}</p>
                    <p className="text-xs text-neutral-500">{new Date(doc.updatedAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t dark:border-neutral-700">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 text-sm rounded-lg border dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleExportSelectedPDF}
                disabled={exporting || selectedDocIds.size === 0}
                className="px-4 py-2 text-sm rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-1"
              >
                <Download size={14} />
                {exporting ? "Export..." : "PDF"}
              </button>
              <button
                onClick={handleExportSelectedZIP}
                disabled={exporting || selectedDocIds.size === 0}
                className="px-4 py-2 text-sm rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-1"
              >
                <FileArchive size={14} />
                {exporting ? "Export..." : "ZIP"}
              </button>
            </div>
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
