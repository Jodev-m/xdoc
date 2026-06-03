"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePicker } from "./ImagePicker";
import { PromptDialog } from "@/components/PromptDialog";
import { ColorPicker } from "@/components/ColorPicker";

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
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-white dark:bg-neutral-900 dark:border-neutral-700">
        <ToolbarButton
          label="Gras"
          shortcut="Ctrl+B"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Italique"
          shortcut="Ctrl+I"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Souligné"
          shortcut="Ctrl+U"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 mx-1" />

        <ToolbarButton
          label="Titre 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          label="Titre 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Titre 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>

        <ToolbarButton
          label="Undo"
          shortcut="Ctrl+Z"
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 mx-1" />

        <ToolbarButton
          label="Liste à puces"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •≡
        </ToolbarButton>
        <ToolbarButton
          label="Liste numérotée"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          label="Checklist"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          ☑
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 mx-1" />

        <ToolbarButton
          label="Barré"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          label="Citation"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          label="Code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          {'<>'}
        </ToolbarButton>
        <ToolbarButton
          label="Bloc de code"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          ⎔
        </ToolbarButton>
        <ToolbarButton
          label="Ligne horizontale"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 mx-1" />

        <ToolbarButton
          label="Aligné à gauche"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          ⬷
        </ToolbarButton>
        <ToolbarButton
          label="Centré"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          ⬸
        </ToolbarButton>
        <ToolbarButton
          label="Aligné à droite"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          ⬶
        </ToolbarButton>
        <ToolbarButton
          label="Justifié"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          ⬺
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 mx-1" />

        <ToolbarButton
          label="Surligner"
          active={editor.isActive("highlight")}
          onClick={() =>
            editor.chain().focus().toggleHighlight().run()
          }
        >
          🖈
        </ToolbarButton>
        <ToolbarButton label="Couleur du texte" onClick={() => setShowColorPrompt(true)}>
          A
        </ToolbarButton>
        <ToolbarButton label="Ajouter un lien" active={editor.isActive("link")} onClick={() => setShowLinkPrompt(true)}>
          🔗
        </ToolbarButton>
        <ToolbarButton label="Ajouter une image" onClick={() => setShowImagePicker(true)}>
          🖼️
        </ToolbarButton>
        <ToolbarButton label="Ajouter un tableau" active={editor.isActive("table")} onClick={addTable}>
          ⊞
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 mx-1" />

        <ToolbarButton label="Rechercher" shortcut="Ctrl+F" onClick={() => onFindToggle?.()}>
          🔍
        </ToolbarButton>
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

function ToolbarButton({
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
      onClick={onClick}
      className={`px-2 py-1 text-sm rounded hover:bg-neutral-100 hover:dark:bg-neutral-800 transition-colors ${
        active ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}
