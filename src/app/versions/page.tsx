"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/db";
import type { Version, XDoc } from "@/types";

interface VersionWithDoc extends Version {
  docTitle?: string;
  projectId?: string;
}

export default function VersionsPage() {
  const router = useRouter();
  const [versions, setVersions] = useState<VersionWithDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await db.versions.orderBy("createdAt").reverse().toArray();
      const docs = await db.documents.toArray();
      const docMap = new Map(docs.map((d: XDoc) => [d.id, d]));

      const withDocs = all.map((v) => ({
        ...v,
        docTitle: docMap.get(v.documentId)?.title ?? "Document supprimé",
        projectId: docMap.get(v.documentId)?.projectId,
      }));

      setVersions(withDocs);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-1 flex-col p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6 text-sm text-neutral-500">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors" title="Retour">←</button>
        <span className="text-neutral-300">|</span>
        <Link href="/" className="hover:underline">Accueil</Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">Historique</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Historique des versions</h1>

      {loading ? (
        <p className="text-neutral-500">Chargement...</p>
      ) : versions.length === 0 ? (
        <p className="text-neutral-400">Aucune version enregistrée.</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <span className="font-medium">{v.docTitle}</span>
                <span className="text-neutral-400 ml-2">v{v.version}</span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(v.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              {v.projectId ? (
                <Link
                  href={`/project/${v.projectId}/document/${v.documentId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ouvrir
                </Link>
              ) : (
                <span className="text-sm text-neutral-400">Document supprimé</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
