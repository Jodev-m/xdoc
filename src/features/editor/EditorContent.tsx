"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent as TiptapEditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useSettings } from "@/contexts/SettingsContext";
import { EditorToolbar } from "./EditorToolbar";
import { FindBar } from "./FindBar";
import { WordCounter } from "./WordCounter";

const lowlight = createLowlight(common);

interface EditorContentProps {
  content: unknown;
  onChange: (json: unknown) => void;
}

export function EditorContent({ content, onChange }: EditorContentProps) {
  const { settings } = useSettings();
  const [initialContent] = useState(content);
  const [showFind, setShowFind] = useState(false);
  const onFindToggle = useCallback(() => setShowFind((v) => !v), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "Écrivez quelque chose…" }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent ?? "",
    onUpdate: useCallback(
      ({ editor }: { editor: { getJSON: () => unknown } }) => {
        const json = editor.getJSON();
        onChange(json);
      },
      [onChange]
    ),
    editorProps: {
      attributes: {
        class:
          "max-w-none focus:outline-none min-h-[400px] px-4 py-4",
        style: `font-size: ${settings.fontSize}px; line-height: ${settings.lineHeight};`,
      },
      handleKeyDown: (_view: unknown, event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "f") {
          onFindToggle();
          return true;
        }
        return false;
      },
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} onFindToggle={onFindToggle} />
      {showFind && <FindBar editor={editor} />}
      <TiptapEditorContent editor={editor} />
      {editor && <WordCounter editor={editor} />}
    </div>
  );
}
