"use client";

import { useState } from "react";
import { ExportService } from "@/services";

interface ExportMenuProps {
  content: unknown;
  filename: string;
}

export function ExportMenu({ content, filename }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: 'html' | 'txt' | 'pdf' | 'docx' | 'md') => {
    const service = ExportService;
    const actions: Record<string, () => Promise<void>> = {
      html: () => service.exportHTML(content, filename),
      txt: () => service.exportTXT(content, filename),
      pdf: () => service.exportPDF(content, filename),
      docx: () => service.exportDOCX(content, filename),
      md: () => service.exportMD(content, filename),
    };
    actions[format]();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-lg text-sm border hover:bg-neutral-50"
      >
        Exporter
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[140px]">
            {[
              { label: "HTML", format: "html" as const },
              { label: "TXT", format: "txt" as const },
              { label: "PDF", format: "pdf" as const },
              { label: "DOCX", format: "docx" as const },
              { label: "MD", format: "md" as const },
            ].map((item) => (
              <button
                key={item.format}
                onClick={() => handleExport(item.format)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {item.label}
              </button>
            ))}
            {"share" in navigator && (
              <button
                onClick={async () => {
                  try {
                    await navigator.share({ title: filename, text: `Document: ${filename}` });
                  } catch {}
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 border-t dark:border-neutral-700"
              >
                Partager
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
