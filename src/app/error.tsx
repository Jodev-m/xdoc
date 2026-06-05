"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <span className="text-2xl">!</span>
      </div>
      <h1 className="text-xl font-bold mb-2">Une erreur est survenue</h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        Quelque chose s&apos;est mal passé. Tu peux réessayer ou retourner à l&apos;accueil.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg text-sm font-medium border dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
