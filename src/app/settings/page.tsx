"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { db } from "@/db";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MobileNav } from "@/components/MobileNav";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Wifi,
  Shield,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { permission, requestPermission } = useNotifications();
  const [localFontSize, setLocalFontSize] = useState(settings.fontSize);
  const [localAutoSave, setLocalAutoSave] = useState(settings.autoSaveInterval);
  const [localLineHeight, setLocalLineHeight] = useState(settings.lineHeight);
  const [notifDeadlines, setNotifDeadlines] = useState(false);
  const [notifTasks, setNotifTasks] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNotifDeadlines(localStorage.getItem("notif-deadlines") !== "false");
    setNotifTasks(localStorage.getItem("notif-tasks") !== "false");
  }, []);

  const handleSave = () => {
    updateSettings({
      fontSize: localFontSize,
      autoSaveInterval: localAutoSave,
      lineHeight: localLineHeight,
    });
  };

  const toggleDeadlines = (v: boolean) => {
    setNotifDeadlines(v);
    localStorage.setItem("notif-deadlines", String(v));
  };
  const toggleTasks = (v: boolean) => {
    setNotifTasks(v);
    localStorage.setItem("notif-tasks", String(v));
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
    <div className="flex flex-col flex-1 p-4 sm:p-6 pb-20 sm:pb-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 text-sm text-neutral-500">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1" title="Retour">←</button>
        <span className="text-neutral-300 hidden sm:inline">|</span>
        <Link href="/" className="hover:underline hidden sm:inline">Accueil</Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">Paramètres</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Paramètres</h1>

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
        <h2 className="text-lg font-semibold mb-3">Notifications</h2>
        <div className="rounded-lg border dark:border-neutral-700 divide-y dark:divide-neutral-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell size={16} className="text-neutral-500" />
                Statut
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                permission === "granted" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                permission === "denied" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                permission === "unavailable" ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" :
                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}>
                {permission === "granted" ? <CheckCircle2 size={12} /> :
                 permission === "denied" ? <XCircle size={12} /> :
                 permission === "unavailable" ? <BellOff size={12} /> : null}
                {permission === "granted" ? "Activé" :
                 permission === "denied" ? "Bloqué" :
                 permission === "unavailable" ? "Non supporté" :
                 "Non défini"}
              </span>
            </div>
            {permission === "default" && (
              <button
                onClick={requestPermission}
                className="mt-2 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200"
              >
                Activer les notifications
              </button>
            )}
            {permission === "denied" && (
              <p className="mt-2 text-xs text-neutral-500">
                Les notifications ont été bloquées. Tu peux les réactiver dans les paramètres du navigateur (icône 🔒 ou ℹ️ dans la barre d&apos;adresse).
              </p>
            )}
            {permission === "unavailable" && (
              <p className="mt-2 text-xs text-neutral-500">
                Ce navigateur ne supporte pas les notifications.
              </p>
            )}
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Rappels d&apos;échéances</p>
                <p className="text-xs text-neutral-500 mt-0.5">J-7 et J-1 avant la fin d&apos;un projet</p>
              </div>
            </div>
            <button
              onClick={() => toggleDeadlines(!notifDeadlines)}
              disabled={permission !== "granted"}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                notifDeadlines && permission === "granted" ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-600"
              } disabled:opacity-40`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                notifDeadlines && permission === "granted" ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Tâches en attente</p>
                <p className="text-xs text-neutral-500 mt-0.5">Rappel entre 18h et 22h si des tâches restent à faire</p>
              </div>
            </div>
            <button
              onClick={() => toggleTasks(!notifTasks)}
              disabled={permission !== "granted"}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                notifTasks && permission === "granted" ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-600"
              } disabled:opacity-40`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                notifTasks && permission === "granted" ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">À propos</h2>
        <div className="rounded-lg border dark:border-neutral-700 p-4 space-y-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center text-sm font-bold">
              XD
            </div>
            <div>
              <p className="font-semibold">xdoc-mobile</p>
              <p className="text-xs text-neutral-500">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Application de rédaction et gestion de documents 100 % hors ligne.
            Conçue pour les journalistes, rédacteurs et chefs de projet qui ont
            besoin d&apos;un outil fiable sans connexion internet.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <FileText size={14} /> Rédaction enrichie
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Wifi size={14} /> Hors ligne
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <ExternalLink size={14} /> Export PDF/DOCX/MD/TXT/HTML
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Shield size={14} /> Données locales (IndexedDB)
            </div>
          </div>
          <div className="pt-3 border-t dark:border-neutral-700">
            <p className="text-xs text-neutral-500">
              Développé avec Next.js, Tiptap, Dexie, Serwist, Tailwind CSS
            </p>
            <p className="text-xs text-neutral-500 mt-1">&copy; 2026 Mada Joel</p>
          </div>
        </div>
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
        message="Cela remplacera toutes les données existantes. Cette action est irréversible."
        confirmLabel="Importer"
        danger
        onConfirm={() => {
          setConfirmImport(false);
          importRef.current?.click();
        }}
        onClose={() => setConfirmImport(false)}
      />
      <MobileNav />
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      {children}
    </div>
  );
}
