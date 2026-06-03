import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel as DocxHeadingLevel } from 'docx';

interface TiptapNode {
  type?: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, string> }[];
  attrs?: Record<string, string | number | undefined>;
}

function tiptapJsonToHtml(content: unknown): string {
  if (typeof content === 'string') return content;
  const node = content as TiptapNode | null;
  if (!node || !node.type) return '';

  const mapChildren = (): string =>
    (node.content || []).map((n: TiptapNode) => tiptapJsonToHtml(n)).join('');

  switch (node.type) {
    case 'doc':
      return (node.content || []).map((n) => tiptapJsonToHtml(n)).join('\n');
    case 'paragraph':
      return `<p>${mapChildren()}</p>`;
    case 'heading':
      return `<h${node.attrs?.level || 1}>${mapChildren()}</h${node.attrs?.level || 1}>`;
    case 'text': {
      let text = node.text || '';
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'underline') text = `<u>${text}</u>`;
          if (mark.type === 'link') text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`;
        }
      }
      return text;
    }
    case 'bulletList':
      return `<ul>${mapChildren()}</ul>`;
    case 'orderedList':
      return `<ol>${mapChildren()}</ol>`;
    case 'listItem':
      return `<li>${mapChildren()}</li>`;
    case 'table':
      return `<table>${mapChildren()}</table>`;
    case 'tableRow':
      return `<tr>${mapChildren()}</tr>`;
    case 'tableCell':
    case 'tableHeader': {
      const tag = node.type === 'tableHeader' ? 'th' : 'td';
      return `<${tag}>${mapChildren()}</${tag}>`;
    }
    case 'image':
      return `<img src="${(node.attrs?.src as string) || ''}" alt="${(node.attrs?.alt as string) || ''}" />`;
    case 'horizontalRule':
      return '<hr />';
    default:
      return '';
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function tiptapJsonToMarkdown(content: unknown): string {
  if (typeof content === 'string') return content;
  const node = content as TiptapNode | null;
  if (!node || !node.type) return '';

  const mapChildren = (): string =>
    (node.content || []).map((n: TiptapNode) => tiptapJsonToMarkdown(n)).join('');

  switch (node.type) {
    case 'doc':
      return (node.content || []).map((n) => tiptapJsonToMarkdown(n)).join('\n\n');
    case 'paragraph':
      return `${mapChildren()}`;
    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      return `${'#'.repeat(level)} ${mapChildren().trim()}`;
    }
    case 'text': {
      let text = node.text || '';
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `**${text}**`;
          if (mark.type === 'italic') text = `*${text}*`;
          if (mark.type === 'underline') text = `_${text}_`;
          if (mark.type === 'code') text = `\`${text}\``;
          if (mark.type === 'strike') text = `~~${text}~~`;
          if (mark.type === 'link') text = `[${text}](${mark.attrs?.href || '#'})`;
        }
      }
      return text;
    }
    case 'bulletList':
      return (node.content || []).map((n: TiptapNode) => {
        const li = tiptapJsonToMarkdown(n);
        return li.split('\n').map((l) => `- ${l}`).join('\n');
      }).join('\n');
    case 'orderedList':
      return (node.content || []).map((n: TiptapNode, i: number) => {
        const li = tiptapJsonToMarkdown(n);
        return li.split('\n').map((l) => `  ${i + 1}. ${l}`).join('\n');
      }).join('\n');
    case 'listItem':
      return mapChildren();
    case 'horizontalRule':
      return '---';
    case 'image':
      return `![${node.attrs?.alt || ''}](${node.attrs?.src || ''})`;
    case 'blockquote':
      return (node.content || []).map((n) => tiptapJsonToMarkdown(n).split('\n').map((l) => `> ${l}`).join('\n')).join('\n');
    case 'codeBlock':
      return (node.content || []).map((n) => `\`\`\`\n${n.text || ''}\n\`\`\``).join('\n');
    default:
      return '';
  }
}

export const ExportService = {
  async exportHTML(content: unknown, filename: string = 'document'): Promise<void> {
    const html = tiptapJsonToHtml(content);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${html}</body></html>`;
    downloadBlob(new Blob([fullHtml], { type: 'text/html;charset=utf-8' }), `${filename}.html`);
  },

  async exportTXT(content: unknown, filename: string = 'document'): Promise<void> {
    const html = tiptapJsonToHtml(content);
    const text = stripHtml(html);
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`);
  },

  async exportPDF(content: unknown, filename: string = 'document'): Promise<void> {
    const html = tiptapJsonToHtml(content);
    const text = stripHtml(html);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const fontSize = 11;
    const margin = 50;
    let y = height - margin;

    for (const line of text.split('\n')) {
      if (y < margin) {
        page = pdfDoc.addPage([595, 842]);
        y = height - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, maxWidth: width - 2 * margin });
      y -= fontSize * 1.5;
    }

    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), `${filename}.pdf`);
  },

  async exportDOCX(content: unknown, filename: string = 'document'): Promise<void> {
    const children: Paragraph[] = [];
    const json = content as TiptapNode | null;

    if (json?.content) {
      for (const node of json.content) {
        if (node.type === 'paragraph') {
          const texts = (node.content || []).map((n: TiptapNode) => {
            const text = n.text || '';
            const options: Record<string, boolean> = {};
            if (n.marks) {
              for (const mark of n.marks) {
                if (mark.type === 'bold') options.bold = true;
                if (mark.type === 'italic') options.italics = true;
                if (mark.type === 'underline') options.underline = true;
              }
            }
            return new TextRun({ text, ...options });
          });
          children.push(new Paragraph({ children: texts }));
        } else if (node.type === 'heading') {
          const texts = (node.content || []).map((n: TiptapNode) => {
            const text = n.text || '';
            return new TextRun({ text });
          });
          const level = (node.attrs?.level as number) || 1;
          const heading = level === 2 ? DocxHeadingLevel.HEADING_2
            : level === 3 ? DocxHeadingLevel.HEADING_3
            : DocxHeadingLevel.HEADING_1;
          children.push(new Paragraph({ children: texts, heading }));
        }
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${filename}.docx`);
  },

  async exportMD(content: unknown, filename: string = 'document'): Promise<void> {
    const md = tiptapJsonToMarkdown(content);
    downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
  },
};
