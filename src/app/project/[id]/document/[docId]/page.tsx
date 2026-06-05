"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentService, SearchService } from "@/services";
import type { XDoc } from "@/types";
import { EditorContent } from "@/features/editor";
import { useToast } from "@/components/Toast";
import { VersionHistory } from "@/features/versions";
import { ExportMenu } from "@/features/export";
import { useAutosave } from "@/hooks/useAutosave";
import { useVersionSnapshot } from "@/hooks/useVersionSnapshot";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/Skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DocumentPage() {
  const toast = useToast();
  const params = useParams();
  const router = useRouter();
  const docId = params.docId as string;
  const projectId = params.id as string;

  const [doc, setDoc] = useState<XDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!docId) return;
    DocumentService.openDocument(docId).then((d) => {
      setDoc(d ?? null);
      setLoading(false);
    });
  }, [docId]);

  const doSave = useCallback(async (id: string, content: unknown) => {
    await DocumentService.saveDocument(id, content);
    if (doc) {
      await SearchService.indexDocument({ ...doc, content });
    }
    dirtyRef.current = false;
    setLastSaved(Date.now());
  }, [doc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        doSave(docId, doc?.content);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docId, doc?.content, doSave]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useAutosave(docId, doc?.content, doSave);
  useVersionSnapshot(docId, doc?.content);

  const handleContentChange = useCallback(
    (json: unknown) => {
      setDoc((prev) => (prev ? { ...prev, content: json } : prev));
      dirtyRef.current = true;
    },
    []
  );

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    await doSave(doc.id, doc.content);
    setSaving(false);
    toast.showToast("Document sauvegardé", "success");
  };

  const handleDelete = () => {
    if (!doc) return;
    setConfirmDelete(true);
  };

  const doDelete = async () => {
    if (!doc) return;
    toast.showToast(`Document "${doc.title}" supprimé`, "info");
    await DocumentService.deleteDocument(doc.id);
    router.push(`/project/${projectId}`);
  };

  const handleRestore = async () => {
    const d = await DocumentService.openDocument(docId);
    if (d) {
      setDoc(d);
      setEditorKey((k) => k + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-4 sm:p-6 pb-20 max-w-5xl mx-auto w-full gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Document introuvable</h1>
          <Link href={`/project/${projectId}`} className="text-blue-600 hover:underline">
            Retour au projet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-1 flex-col ${focusMode ? "p-0 max-w-none" : "p-4 sm:p-6 pb-20 sm:pb-6 max-w-5xl"} mx-auto w-full`}>
      {!focusMode && (
        <>
          <div className="flex items-center gap-1 sm:gap-2 mb-4 text-sm text-neutral-500 dark:text-neutral-400 overflow-hidden">
            <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors shrink-0 p-1" title="Retour">←</button>
            <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline shrink-0">|</span>
            <Link href="/" className="hover:underline hidden sm:inline shrink-0">Accueil</Link>
            <span className="hidden sm:inline shrink-0">/</span>
            <Link href={`/project/${projectId}`} className="hover:underline shrink-0">
              Projet
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate min-w-0">{doc.title}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
            <input
              type="text"
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                v{doc.version}
              </span>
              <ExportMenu content={doc.content} filename={doc.title} />
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-2 rounded-lg text-sm border dark:border-neutral-700 ${
                  showHistory ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-400 dark:border-neutral-600" : "hover:bg-neutral-50 hover:dark:bg-neutral-800"
                }`}
              >
                Historique
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 hover:dark:bg-neutral-200 disabled:opacity-50"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 hover:dark:bg-red-900/30"
              >
                Supprimer
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 sm:mb-4">
            {lastSaved
              ? `Dernière sauvegarde : ${new Date(lastSaved).toLocaleTimeString("fr-FR")}`
              : `Dernière modification : ${new Date(doc.updatedAt).toLocaleString("fr-FR")}`}
            <span className="ml-4">Snapshot automatique toutes les 15 min</span>
          </p>
        </>
      )}

      {focusMode && (
        <div className="fixed top-2 right-2 z-50 flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800"
          >
            Sauvegarder
          </button>
          <button
            onClick={() => setFocusMode(false)}
            className="px-3 py-1.5 text-xs border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 hover:dark:bg-neutral-800"
          >
            Quitter le focus
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-end gap-1 px-1">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="text-xs px-2 py-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              title={focusMode ? "Quitter le mode focus" : "Mode focus"}
            >
              {focusMode ? "⊞" : "⛶"}
            </button>
          </div>
          <ErrorBoundary>
            <EditorContent
              key={editorKey}
              content={doc.content}
              onChange={handleContentChange}
            />
          </ErrorBoundary>
        </div>
        {showHistory && !focusMode && (
          <aside className="w-full md:w-72 shrink-0">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              Versions
            </h3>
            <ErrorBoundary>
              <VersionHistory
                documentId={doc.id}
                onRestore={handleRestore}
              />
            </ErrorBoundary>
          </aside>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer le document"
        message={doc ? `Supprimer "${doc.title}" ?` : ""}
        confirmLabel="Supprimer"
        danger
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
