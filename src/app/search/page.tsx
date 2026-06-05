"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchService } from "@/services";
import type { SearchDoc } from "@/services/SearchService";
import { MobileNav } from "@/components/MobileNav";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [ready, setReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    SearchService.init().then(() => setReady(true));
  }, []);

  const doSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const res = await SearchService.search(value);
    setResults(res);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 200);
  };

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 pb-20 sm:pb-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        <button onClick={() => router.back()} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1" title="Retour">←</button>
        <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">|</span>
        <Link href="/" className="hover:underline hidden sm:inline">Accueil</Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">Recherche</span>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Rechercher dans les documents..."
        className="w-full p-3 sm:p-4 text-base sm:text-lg border dark:border-neutral-700 rounded-lg mb-4 sm:mb-6 outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
        autoFocus
      />

      {!ready ? (
        <p className="text-neutral-500 dark:text-neutral-400">Indexation en cours...</p>
      ) : results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                href={`/project/${r.projectId}/document/${r.id}`}
                className="block p-4 rounded-lg border hover:bg-neutral-50 transition-colors dark:border-neutral-700 hover:dark:bg-neutral-800"
              >
                <span className="font-medium">{r.title}</span>
                {r.projectName && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                    — {r.projectName}
                  </span>
                )}
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {r.content.slice(0, 200)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : query && (
        <p className="text-neutral-500 dark:text-neutral-400">Aucun résultat pour &ldquo;{query}&rdquo;.</p>
      )}

      {ready && !query && (
        <p className="text-neutral-500 dark:text-neutral-400">Tapez votre recherche ci-dessus.</p>
      )}
      <MobileNav />
    </div>
  );
}
