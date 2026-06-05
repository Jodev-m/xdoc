"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePicker } from "./ImagePicker";
import { PromptDialog } from "@/components/PromptDialog";
import { ColorPicker } from "@/components/ColorPicker";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  List,
  ListOrdered,
  CheckSquare,
  Strikethrough,
  Quote,
  Code,
  Terminal,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Pen,
  Palette,
  Link,
  Image,
  Table2,
  Search,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  onFindToggle?: () => void;
}

export function EditorToolbar({ editor, onFindToggle }: EditorToolbarProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [showColorPrompt, setShowColorPrompt] = useState(false);

  if (!editor) return null;

  const handleAddLink = (url: string) => {
    editor.chain().focus().setLink({ href: url }).run();
  };

  const handleSetColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleImagePicked = (base64: string) => {
    editor.chain().focus().setImage({ src: base64 }).run();
  };

  return (
    <>
      <div className="flex items-center gap-1 p-2 border-b bg-white dark:bg-neutral-900 dark:border-neutral-700 overflow-x-auto scrollbar-none">
        <Tb label="Gras" shortcut="Ctrl+B" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </Tb>
        <Tb label="Italique" shortcut="Ctrl+I" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </Tb>
        <Tb label="Souligné" shortcut="Ctrl+U" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="w-4 h-4" />
        </Tb>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <Tb label="Titre 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="w-4 h-4" />
        </Tb>
        <Tb label="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </Tb>
        <Tb label="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </Tb>

        <Tb label="Annuler" shortcut="Ctrl+Z" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-4 h-4" />
        </Tb>
        <Tb label="Rétablir" shortcut="Ctrl+Shift+Z" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-4 h-4" />
        </Tb>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <Tb label="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </Tb>
        <Tb label="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </Tb>
        <Tb label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare className="w-4 h-4" />
        </Tb>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <Tb label="Barré" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </Tb>
        <Tb label="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </Tb>
        <Tb label="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-4 h-4" />
        </Tb>
        <Tb label="Bloc de code" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Terminal className="w-4 h-4" />
        </Tb>
        <Tb label="Ligne horizontale" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </Tb>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <Tb label="Aligné à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="w-4 h-4" />
        </Tb>
        <Tb label="Centré" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="w-4 h-4" />
        </Tb>
        <Tb label="Aligné à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="w-4 h-4" />
        </Tb>
        <Tb label="Justifié" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify className="w-4 h-4" />
        </Tb>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <Tb label="Surligner" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Pen className="w-4 h-4" />
        </Tb>
        <Tb label="Couleur du texte" onClick={() => setShowColorPrompt(true)}>
          <Palette className="w-4 h-4" />
        </Tb>
        <Tb label="Ajouter un lien" active={editor.isActive("link")} onClick={() => setShowLinkPrompt(true)}>
          <Link className="w-4 h-4" />
        </Tb>
        <Tb label="Ajouter une image" onClick={() => setShowImagePicker(true)}>
          <Image className="w-4 h-4" />
        </Tb>
        <Tb label="Ajouter un tableau" active={editor.isActive("table")} onClick={addTable}>
          <Table2 className="w-4 h-4" />
        </Tb>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <Tb label="Rechercher" shortcut="Ctrl+F" onClick={() => onFindToggle?.()}>
          <Search className="w-4 h-4" />
        </Tb>
      </div>

      <PromptDialog
        open={showLinkPrompt}
        title="Ajouter un lien"
        label="URL du lien"
        placeholder="https://..."
        onSubmit={handleAddLink}
        onClose={() => setShowLinkPrompt(false)}
      />

      <ColorPicker
        open={showColorPrompt}
        onPick={handleSetColor}
        onClose={() => setShowColorPrompt(false)}
      />

      {showImagePicker && (
        <ImagePicker
          onImagePicked={handleImagePicked}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </>
  );
}

function Tb({
  label,
  shortcut,
  active,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-neutral-100 hover:dark:bg-neutral-800 transition-colors ${
        active ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}
