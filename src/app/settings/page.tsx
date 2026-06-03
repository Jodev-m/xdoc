"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { db } from "@/db";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [localFontSize, setLocalFontSize] = useState(settings.fontSize);
  const [localAutoSave, setLocalAutoSave] = useState(settings.autoSaveInterval);
  const [localLineHeight, setLocalLineHeight] = useState(settings.lineHeight);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings({
      fontSize: localFontSize,
      autoSaveInterval: localAutoSave,
      lineHeight: localLineHeight,
    });
  };

  const handleExport = async () => {
    setExporting(true);
    const data = {
      projects: await db.projects.toArray(),
      folders: await db.folders.toArray(),
      documents: await db.documents.toArray(),
      versions: await db.versions.toArray(),
      images: await db.images.toArray(),
      favorites: await db.favorites.toArray(),
      trash: await db.trash.toArray(),
      checklists: await db.checklists.toArray(),
      checklistTasks: await db.checklistTasks.toArray(),
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xdoc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.projects) await db.projects.bulkAdd(data.projects, { allKeys: true });
      if (data.folders) await db.folders.bulkAdd(data.folders, { allKeys: true });
      if (data.documents) await db.documents.bulkAdd(data.documents, { allKeys: true });
      if (data.versions) await db.versions.bulkAdd(data.versions, { allKeys: true });
      if (data.images) await db.images.bulkAdd(data.images, { allKeys: true });
      if (data.favorites) await db.favorites.bulkAdd(data.favorites, { allKeys: true });
      if (data.trash) await db.trash.bulkAdd(data.trash, { allKeys: true });
      if (data.checklists) await db.checklists.bulkAdd(data.checklists, { allKeys: true });
      if (data.checklistTasks) await db.checklistTasks.bulkAdd(data.checklistTasks, { allKeys: true });
      alert("Import terminé. Rechargez la page.");
      window.location.reload();
    } catch {
      alert("Erreur lors de l'import du fichier.");
    }
    setImporting(false);
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-8 text-sm text-neutral-500">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors" title="Retour">←</button>
        <span className="text-neutral-300">|</span>
        <Link href="/" className="hover:underline">Accueil</Link>
        <span>/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">Paramètres</span>
      </div>

      <h1 className="text-2xl font-bold mb-8">Paramètres</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Éditeur</h2>
        <div className="space-y-4 rounded-lg border dark:border-neutral-700 p-4">
          <SettingRow label="Taille de la police">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={12}
                max={28}
                value={localFontSize}
                onChange={(e) => setLocalFontSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm w-8">{localFontSize}px</span>
            </div>
          </SettingRow>
          <SettingRow label="Interlignage">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.1}
                value={localLineHeight}
                onChange={(e) => setLocalLineHeight(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm w-8">{localLineHeight}</span>
            </div>
          </SettingRow>
          <SettingRow label="Auto-save (secondes)">
            <input
              type="number"
              min={5}
              max={300}
              value={localAutoSave}
              onChange={(e) => setLocalAutoSave(Number(e.target.value))}
              className="w-20 px-2 py-1 text-sm border dark:border-neutral-700 rounded outline-none"
            />
          </SettingRow>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 hover:dark:bg-neutral-200"
          >
            Appliquer
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Thème</h2>
        <div className="flex items-center justify-between p-4 rounded-lg border dark:border-neutral-700">
          <span className="text-sm font-medium">Mode sombre</span>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              theme === "dark" ? "bg-blue-600" : "bg-neutral-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                theme === "dark" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Sauvegarde</h2>
        <div className="space-y-3 rounded-lg border dark:border-neutral-700 p-4">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {exporting ? "Export..." : "Exporter toutes les données (JSON)"}
          </button>
          <button
            onClick={() => setConfirmImport(true)}
            disabled={importing}
            className="w-full px-4 py-2 border dark:border-neutral-700 rounded-lg text-sm hover:bg-neutral-50 hover:dark:bg-neutral-800 disabled:opacity-50"
          >
            {importing ? "Import..." : "Importer une sauvegarde (JSON)"}
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">À propos</h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          xdoc-mobile est une application de documents hors ligne conçue pour la
          rédaction, l&rsquo;organisation et l&rsquo;export de documents. Elle permet
          de créer des projets, d&rsquo;organiser des dossiers, d&rsquo;éditer des
          documents avec un éditeur riche (Tiptap), de suivre l&rsquo;avancement via
          des checklists, et d&rsquo;exporter aux formats HTML, TXT, PDF et DOCX.
          Toutes les données sont stockées localement sur l&rsquo;appareil via IndexedDB,
          offrant une expérience entièrement hors ligne.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Auteur</h2>
        <p className="text-neutral-600 dark:text-neutral-400">Mada Joel</p>
      </section>

      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      <ConfirmDialog
        open={confirmImport}
        title="Importer des données"
        message="L'import ajoutera les données au contenu existant. Les doublons éventuels (mêmes IDs) seront ignorés. Continuer ?"
        confirmLabel="Importer"
        onConfirm={() => {
          setConfirmImport(false);
          importRef.current?.click();
        }}
        onClose={() => setConfirmImport(false)}
      />
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      {children}
    </div>
  );
}
