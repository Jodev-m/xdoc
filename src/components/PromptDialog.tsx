"use client";

import { useRef, useEffect } from "react";

interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function PromptDialog({ open, title, label, placeholder, onSubmit, onClose }: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value) return;
    onSubmit(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="w-full px-4 py-2 border dark:border-neutral-700 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-neutral-300 focus:dark:ring-neutral-600"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 hover:dark:bg-neutral-200"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
