"use client";

import Link from "next/link";
import { WifiOff, Home, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <WifiOff className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
        <h1 className="text-xl font-bold mb-2">Vous êtes hors ligne</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Certaines pages peuvent ne pas être disponibles sans connexion.
          Les projets et documents déjà ouverts restent accessibles.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200"
          >
            <Home size={16} />
            Retour à l&apos;accueil
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border dark:border-neutral-700 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}
