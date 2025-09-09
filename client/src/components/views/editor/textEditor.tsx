"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import * as Y from "yjs";
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from "y-prosemirror";
import { useEffect, useMemo } from "react";
import { YSocketIOProvider } from "@/lib/ySocket";
import { throttle } from "@/lib/throttle";

interface TextEditorProps {
  docId: string;
  provider: YSocketIOProvider;
}

function createYjsExtension(provider: YSocketIOProvider) {
  return Extension.create({
    name: "Collab",
    addProseMirrorPlugins() {
      const type = provider.ydoc.getXmlFragment("prosemirror");

      const cursorBuilder = (user: any): HTMLElement => {
        const caret = document.createElement("span");
        const color = user?.color ?? "#4f46e5";

        caret.style.borderLeft = `2px solid ${color}`;
        caret.style.marginLeft = "-1px";
        caret.style.height = "1em";
        caret.style.position = "relative";
        caret.style.display = "inline-block";

        const label = document.createElement("div");
        label.style.position = "absolute";
        label.style.transform = "translateY(-100%)";
        label.style.background = color;
        label.style.color = "white";
        label.style.fontSize = "0.65rem";
        label.style.padding = "0 4px";
        label.style.borderRadius = "3px";
        label.style.whiteSpace = "nowrap";
        label.style.zIndex = "10";
        label.textContent = user?.name ?? "Anonymous";

        caret.appendChild(label);
        return caret;
      };

      return [
        ySyncPlugin(type),
        yCursorPlugin(provider.awareness, { cursorBuilder }),
        yUndoPlugin(),
      ];
    },
  });
}

export function TextEditor({ docId, provider }: TextEditorProps) {
  const extensions = useMemo(() => {
    const base = [StarterKit];
    if (provider) base.push(createYjsExtension(provider));
    return base;
  }, [provider]);

  const editor = useEditor({
    extensions,
    autofocus: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none outline-none min-h-[calc(100vh-150px)] sm:min-h-[600px] focus:outline-none p-4 sm:p-6",
      },
    },
  });

  useEffect(() => {
    if (!editor || !provider) return;

    const updateCursor = throttle(({ editor }: any) => {
      const { from, to, empty } = editor.state.selection;
      provider.setCursor(empty ? null : { from, to });
    }, 50);

    const onSelection = (payload: any) => updateCursor(payload);
    const onBlur = () => provider.setCursor(null);
    const onFocus = ({ editor }: any) => {
      const { from, to, empty } = editor.state.selection;
      if (!empty) provider.setCursor({ from, to });
    };

    editor.on("selectionUpdate", onSelection);
    editor.on("blur", onBlur);
    editor.on("focus", onFocus);

    return () => {
      editor.off("selectionUpdate", onSelection);
      editor.off("blur", onBlur);
      editor.off("focus", onFocus);
    };
  }, [editor, provider]);

  if (!editor) return null;

  return (
    <div className="h-full bg-white overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  );
}