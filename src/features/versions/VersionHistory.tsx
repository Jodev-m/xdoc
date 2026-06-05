"use client";

import { useState, useEffect } from "react";
import { VersionService } from "@/services";
import type { Version } from "@/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/Skeleton";

interface VersionHistoryProps {
  documentId: string;
  onRestore: () => void;
}

export function VersionHistory({ documentId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmVersion, setConfirmVersion] = useState<Version | null>(null);

  useEffect(() => {
    VersionService.listVersions(documentId).then((v) => {
      setVersions(v);
      setLoading(false);
    });
  }, [documentId]);

  const handleRestore = (version: Version) => {
    setConfirmVersion(version);
  };

  const doRestore = async () => {
    if (!confirmVersion) return;
    await VersionService.restoreVersion(documentId, confirmVersion.id);
    onRestore();
  };

  if (loading) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (versions.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Aucune version sauvegardée.</p>;
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between p-3 rounded-lg border text-sm dark:border-neutral-700"
        >
          <div>
            <span className="font-medium">Version {v.version}</span>
            <span className="text-neutral-500 dark:text-neutral-400 ml-2">
              {new Date(v.createdAt).toLocaleString("fr-FR")}
            </span>
          </div>
          <button
            onClick={() => handleRestore(v)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
          >
            Restaurer
          </button>
        </div>
      ))}
      {confirmVersion && (
        <ConfirmDialog
          open
          title="Restaurer la version"
          message={`Restaurer la version ${confirmVersion.version} ?`}
          confirmLabel="Restaurer"
          onConfirm={doRestore}
          onClose={() => setConfirmVersion(null)}
        />
      )}
    </div>
  );
}
