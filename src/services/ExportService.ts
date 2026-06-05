import { PDFDocument, StandardFonts, PDFFont } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel as DocxHeadingLevel } from 'docx';

interface TiptapNode {
  type?: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, string> }[];
  attrs?: Record<string, string | number | undefined>;
}

interface PDFBlock {
  text: string;
  fontSize: number;
  fontName: 'Helvetica' | 'Helvetica-Bold' | 'Helvetica-Oblique';
  indent: number;
  spacingAfter: number;
  _imageBytes?: Uint8Array;
  _imageType?: 'png' | 'jpg';
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
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/ +/g, ' ').trim();
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

function tiptapJsonToPDFBlocks(node: TiptapNode, indent = 0): PDFBlock[] {
  const blocks: PDFBlock[] = [];

  switch (node.type) {
    case 'doc':
      for (const child of node.content || []) {
        blocks.push(...tiptapJsonToPDFBlocks(child, indent));
      }
      break;

    case 'paragraph': {
      const text = extractTextContent(node);
      if (text) blocks.push({ text, fontSize: 11, fontName: 'Helvetica', indent, spacingAfter: 4 });
      break;
    }

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const sizes: Record<number, number> = { 1: 20, 2: 16, 3: 14 };
      const text = extractTextContent(node);
      if (text) blocks.push({ text, fontSize: sizes[level] || 13, fontName: 'Helvetica-Bold', indent, spacingAfter: 6 });
      break;
    }

    case 'bulletList':
      for (const child of node.content || []) {
        const itemBlocks = tiptapJsonToPDFBlocks(child, indent + 15);
        if (itemBlocks.length > 0) {
          itemBlocks[0].text = `•  ${itemBlocks[0].text}`;
        }
        blocks.push(...itemBlocks);
      }
      if (blocks.length > 0) blocks[blocks.length - 1].spacingAfter = 4;
      break;

    case 'orderedList':
      for (let i = 0; i < (node.content || []).length; i++) {
        const child = node.content![i];
        const itemBlocks = tiptapJsonToPDFBlocks(child, indent + 15);
        if (itemBlocks.length > 0) {
          itemBlocks[0].text = `${i + 1}.  ${itemBlocks[0].text}`;
        }
        blocks.push(...itemBlocks);
      }
      if (blocks.length > 0) blocks[blocks.length - 1].spacingAfter = 4;
      break;

    case 'listItem':
      for (const child of node.content || []) {
        blocks.push(...tiptapJsonToPDFBlocks(child, indent));
      }
      break;

    case 'image': {
      const src = node.attrs?.src as string | undefined;
      if (src) {
        const parsed = dataUriToBytes(src);
        if (parsed) {
          blocks.push({ text: '', fontSize: 0, fontName: 'Helvetica', indent, spacingAfter: 0, _imageBytes: parsed.bytes, _imageType: parsed.type });
        }
      }
      break;
    }

    case 'horizontalRule':
      blocks.push({ text: '────────────────────────────────', fontSize: 11, fontName: 'Helvetica', indent, spacingAfter: 6 });
      break;

    case 'blockquote': {
      for (const child of node.content || []) {
        const qBlocks = tiptapJsonToPDFBlocks(child, indent + 10);
        for (const b of qBlocks) {
          b.fontName = 'Helvetica-Oblique';
        }
        blocks.push(...qBlocks);
      }
      if (blocks.length > 0) blocks[blocks.length - 1].spacingAfter = 4;
      break;
    }

    case 'codeBlock': {
      for (const child of node.content || []) {
        if (child.text || (child.type === 'text' && child.text)) {
          blocks.push({ text: child.text || '', fontSize: 9, fontName: 'Helvetica', indent: indent + 5, spacingAfter: 1 });
        }
      }
      blocks.push({ text: '', fontSize: 9, fontName: 'Helvetica', indent, spacingAfter: 4 });
      break;
    }
  }

  return blocks;
}

function extractTextContent(node: TiptapNode): string {
  if (!node.content) return node.text || '';
  return node.content.map((n) => {
    if (n.type === 'text') return n.text || '';
    return extractTextContent(n);
  }).join('');
}

function dataUriToBytes(uri: string): { bytes: Uint8Array; type: 'png' | 'jpg' } | null {
  const match = uri.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  if (!match) return null;
  const type = match[1] === 'png' ? 'png' : 'jpg';
  const binaryStr = atob(match[2]);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return { bytes, type };
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (maxWidth <= 0) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
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
    const blob = await this.exportPDFToBlob(content);
    if (blob) downloadBlob(blob, `${filename}.pdf`);
  },

  async exportPDFToBlob(content: unknown): Promise<Blob | null> {
    const json = content as TiptapNode | null;
    if (!json) return null;

    const blocks = tiptapJsonToPDFBlocks(json);
    const pdfDoc = await PDFDocument.create();
    const fonts = {
      Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
      'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      'Helvetica-Oblique': await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };
    const margin = 50;
    const pageWidth = 595;
    const pageHeight = 842;
    const maxWidth = pageWidth - 2 * margin;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const block of blocks) {
      if (block._imageBytes && block._imageType) {
        const img = block._imageType === 'png'
          ? await pdfDoc.embedPng(block._imageBytes)
          : await pdfDoc.embedJpg(block._imageBytes);
        const maxImgW = maxWidth - block.indent;
        const scale = Math.min(1, maxImgW / img.width);
        const imgW = img.width * scale;
        const imgH = img.height * scale + 6;

        if (y < margin + imgH) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        page.drawImage(img, {
          x: margin + block.indent,
          y: y - (img.height * scale),
          width: imgW,
          height: img.height * scale,
        });
        y -= imgH;
        continue;
      }

      const font = fonts[block.fontName];
      const lines = wrapText(block.text, font, block.fontSize, maxWidth - block.indent);

      for (const line of lines) {
        if (y < margin + block.fontSize) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(line, {
          x: margin + block.indent,
          y,
          size: block.fontSize,
          font,
        });
        y -= block.fontSize * 1.4;
      }

      y -= block.spacingAfter;
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  },

  async exportDOCX(content: unknown, filename: string = 'document'): Promise<void> {
    const blob = await this.exportDOCXToBlob(content);
    if (blob) downloadBlob(blob, `${filename}.docx`);
  },

  async exportDOCXToBlob(content: unknown): Promise<Blob | null> {
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
    return await Packer.toBlob(doc);
  },

  async exportMD(content: unknown, filename: string = 'document'): Promise<void> {
    const md = tiptapJsonToMarkdown(content);
    downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
  },

  async shareViaSystem(blob: Blob, filename: string, title: string): Promise<boolean> {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title, files: [file] });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  getWhatsAppUrl(text: string): string {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  },

  getMailToUrl(subject: string, body: string): string {
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  },

  async exportProjectPDF(documents: { title: string; content: unknown }[], filename: string = 'projet'): Promise<Blob | null> {
    if (documents.length === 0) return null;

    const pdfDoc = await PDFDocument.create();
    const fonts = {
      Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
      'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      'Helvetica-Oblique': await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    for (const doc of documents) {
      if (!doc.content) continue;
      const blocks = tiptapJsonToPDFBlocks(doc.content as TiptapNode);
      if (blocks.length === 0) continue;

      const margin = 50;
      const pageWidth = 595;
      const pageHeight = 842;
      const maxWidth = pageWidth - 2 * margin;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      page.drawText(doc.title, { x: margin, y, size: 18, font: fonts['Helvetica-Bold'] });
      y -= 30;

      for (const block of blocks) {
        if (block._imageBytes && block._imageType) {
          const img = block._imageType === 'png'
            ? await pdfDoc.embedPng(block._imageBytes)
            : await pdfDoc.embedJpg(block._imageBytes);
          const maxImgW = maxWidth - block.indent;
          const scale = Math.min(1, maxImgW / img.width);
          const imgW = img.width * scale;
          const imgH = img.height * scale + 6;

          if (y < margin + imgH) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }

          page.drawImage(img, {
            x: margin + block.indent,
            y: y - (img.height * scale),
            width: imgW,
            height: img.height * scale,
          });
          y -= imgH;
          continue;
        }

        const font = fonts[block.fontName];
        const lines = wrapText(block.text, font, block.fontSize, maxWidth - block.indent);

        for (const line of lines) {
          if (y < margin + block.fontSize) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(line, {
            x: margin + block.indent,
            y,
            size: block.fontSize,
            font,
          });
          y -= block.fontSize * 1.4;
        }

        y -= block.spacingAfter;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  },

  async exportProjectZIP(documents: { title: string; content: unknown }[], projectImages: { name: string; data: string }[], filename: string = 'projet'): Promise<Blob | null> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const docsFolder = zip.folder('documents');
    if (docsFolder) {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const contentDoc = doc.content as TiptapNode | null;
        if (!contentDoc) continue;

        const md = tiptapJsonToMarkdown(contentDoc);
        const safeName = doc.title.replace(/[<>:"/\\|?*]/g, '_') || `document-${i + 1}`;
        docsFolder.file(`${safeName}.md`, md);

        const pdfBlob = await this.exportPDFToBlob(contentDoc);
        if (pdfBlob) {
          docsFolder.file(`${safeName}.pdf`, pdfBlob.arrayBuffer ? await pdfBlob.arrayBuffer() : pdfBlob);
        }
      }
    }

    const imagesFolder = zip.folder('images');
    if (imagesFolder && projectImages.length > 0) {
      for (const img of projectImages) {
        const base64 = img.data.replace(/^data:image\/\w+;base64,/, '');
        const ext = img.data.includes('image/png') ? 'png' : 'jpg';
        const safeName = img.name.replace(/[<>:"/\\|?*]/g, '_') || `image-${Date.now()}`;
        imagesFolder.file(safeName, base64, { base64: true });
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  },
};
