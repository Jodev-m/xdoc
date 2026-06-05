"use client";

import type { Editor } from "@tiptap/react";

interface WordCounterProps {
  editor: Editor;
}

export function WordCounter({ editor }: WordCounterProps) {
  const characterCount = editor.storage.characterCount?.characters?.() ?? 0;
  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex items-center justify-end gap-4 px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 border-t bg-neutral-50 dark:bg-neutral-800">
      <span>{wordCount} mots</span>
      <span>{characterCount} caractères</span>
    </div>
  );
}
