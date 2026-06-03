"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Node } from "@tiptap/pm/model";

interface TextMatch {
  from: number;
  to: number;
}

function findMatches(doc: Node, query: string): TextMatch[] {
  if (!query) return [];
  const matches: TextMatch[] = [];
  const q = query.toLowerCase();

  doc.descendants((node, pos) => {
    if (node.isText) {
      const text = node.text ?? "";
      const lower = text.toLowerCase();
      let idx = 0;
      while ((idx = lower.indexOf(q, idx)) !== -1) {
        matches.push({ from: pos + idx, to: pos + idx + q.length });
        idx += 1;
      }
    }
  });

  return matches;
}

interface FindBarProps {
  editor: Editor | null;
}

export function FindBar({ editor }: FindBarProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<TextMatch[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(
    (q: string) => {
      if (!editor || !q.trim()) {
        setMatches([]);
        return;
      }
      const m = findMatches(editor.state.doc, q);
      setMatches(m);
      setCurrentIdx(0);
      if (m.length > 0) {
        editor.commands.setTextSelection({ from: m[0].from, to: m[0].to });
        editor.commands.scrollIntoView();
      }
    },
    [editor]
  );

  const goTo = useCallback(
    (idx: number) => {
      if (!editor || matches.length === 0) return;
      const i = ((idx % matches.length) + matches.length) % matches.length;
      setCurrentIdx(i);
      editor.commands.setTextSelection({ from: matches[i].from, to: matches[i].to });
      editor.commands.scrollIntoView();
    },
    [editor, matches]
  );

  const goNext = () => goTo(currentIdx + 1);
  const goPrev = () => goTo(currentIdx - 1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) goPrev();
      else goNext();
    }
    if (e.key === "Escape") {
      setQuery("");
      setMatches([]);
      editor?.commands.focus();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          doSearch(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Rechercher…"
        className="flex-1 px-2 py-1 border dark:border-neutral-700 rounded outline-none text-xs focus:ring-1 focus:ring-neutral-300 bg-white dark:bg-neutral-800"
      />
      {matches.length > 0 && (
        <span className="text-xs text-neutral-500 shrink-0">
          {currentIdx + 1}/{matches.length}
        </span>
      )}
      <button
        onClick={goPrev}
        disabled={matches.length === 0}
        className="px-1.5 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-xs"
      >
        ▲
      </button>
      <button
        onClick={goNext}
        disabled={matches.length === 0}
        className="px-1.5 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-xs"
      >
        ▼
      </button>
      <button
        onClick={() => {
          setQuery("");
          setMatches([]);
          editor?.commands.focus();
        }}
        className="px-1.5 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs"
      >
        ✕
      </button>
    </div>
  );
}
