"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = () => {
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handler);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", handler);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-lg animate-[slideUp_0.3s_ease-out] max-w-sm mx-auto">
      <p className="text-sm font-medium">Mise à jour disponible</p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
      >
        <RefreshCw size={14} />
        Actualiser
      </button>
    </div>
  );
}
