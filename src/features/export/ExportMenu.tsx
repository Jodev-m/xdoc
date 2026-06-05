"use client";

import { useState } from "react";
import { ExportService } from "@/services";
import { Download, Share2, MessageCircle, Mail } from "lucide-react";

interface ExportMenuProps {
  content: unknown;
  filename: string;
}

export function ExportMenu({ content, filename }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  const handleShare = async (format: 'pdf' | 'docx') => {
    setSharing(true);
    const blob = format === 'pdf'
      ? await ExportService.exportPDFToBlob(content)
      : await ExportService.exportDOCXToBlob(content);
    if (!blob) { setSharing(false); return; }

    const ext = format === 'pdf' ? 'pdf' : 'docx';
    const ok = await ExportService.shareViaSystem(blob, `${filename}.${ext}`, filename);
    if (!ok) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setSharing(false);
    setOpen(false);
  };

  const handleShareDirect = (target: 'whatsapp' | 'email') => {
    const text = `Document partagé depuis xdoc-mobile : ${filename}`;
    const url = target === 'whatsapp'
      ? ExportService.getWhatsAppUrl(text)
      : ExportService.getMailToUrl(filename, text);
    window.open(url, '_blank');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={sharing}
        className="px-3 py-2 rounded-lg text-sm border hover:bg-neutral-50 disabled:opacity-50"
      >
        {sharing ? "Partage..." : "Exporter"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[160px]">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Télécharger
            </div>
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
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Download size={14} className="text-neutral-400" />
                {item.label}
              </button>
            ))}
            <div className="border-t dark:border-neutral-700 mt-1 pt-1">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Partager
              </div>
              <button
                onClick={() => handleShare('pdf')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Share2 size={14} className="text-neutral-400" />
                Partager en PDF
              </button>
              <button
                onClick={() => handleShare('docx')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Share2 size={14} className="text-neutral-400" />
                Partager en DOCX
              </button>
              <button
                onClick={() => handleShareDirect('whatsapp')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <MessageCircle size={14} className="text-green-500" />
                WhatsApp
              </button>
              <button
                onClick={() => handleShareDirect('email')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Mail size={14} className="text-blue-500" />
                Email
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
