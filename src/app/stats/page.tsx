"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectService, ChecklistService } from "@/services";
import { db } from "@/db";
import { MobileNav } from "@/components/MobileNav";
import { Skeleton } from "@/components/Skeleton";

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    activeProjects: number;
    archivedProjects: number;
    documents: number;
    tasksDone: number;
    tasksTotal: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const allProjects = await ProjectService.getProjects(true);
      const archivedProjects = allProjects.filter((p) => p.archived);
      const allDocs = await db.documents.toArray();
      let tasksDone = 0;
      let tasksTotal = 0;
      for (const p of allProjects) {
        const prog = await ChecklistService.getProjectProgress(p.id);
        tasksDone += prog.done;
        tasksTotal += prog.total;
      }
      setStats({
        activeProjects: allProjects.length - archivedProjects.length,
        archivedProjects: archivedProjects.length,
        documents: allDocs.length,
        tasksDone,
        tasksTotal,
      });
    })();
  }, []);

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 pb-20 sm:pb-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1" title="Retour">←</button>
        <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">|</span>
        <Link href="/" className="hover:underline hidden sm:inline">Accueil</Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">Statistiques</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Statistiques</h1>

      {!stats ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Projets actifs" value={stats.activeProjects} />
          <StatCard label="Projets archivés" value={stats.archivedProjects} />
          <StatCard label="Documents" value={stats.documents} />
          <StatCard
            label="Tâches"
            value={stats.tasksTotal > 0 ? `${stats.tasksDone}/${stats.tasksTotal}` : "0"}
            sub={stats.tasksTotal > 0 ? `${Math.round((stats.tasksDone / stats.tasksTotal) * 100)}%` : undefined}
          />
        </div>
      )}
      <MobileNav />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-5 rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}
