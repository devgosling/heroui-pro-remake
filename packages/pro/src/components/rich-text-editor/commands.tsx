import type {Editor} from "@tiptap/react";
import type {ReactNode} from "react";

import {
  IconBold,
  IconClearContent,
  IconClearFormatting,
  IconCode,
  IconCodeBlock,
  IconHeading1,
  IconHeading2,
  IconHeading3,
  IconItalic,
  IconListOl,
  IconListUl,
  IconQuote,
  IconRedo,
  IconStrikethrough,
  IconUnderline,
  IconUndo,
} from "./icons";

/* -------------------------------------------------------------------------------------------------
 * Formatting commands (RichTextEditor.ToggleButton)
 * -----------------------------------------------------------------------------------------------*/
type RichTextEditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "blockquote"
  | "bulletList"
  | "orderedList"
  | "codeBlock"
  | "heading-1"
  | "heading-2"
  | "heading-3";

type CommandDefinition = {
  label: string;
  icon: ReactNode;
  isActive: (editor: Editor) => boolean;
  canRun: (editor: Editor) => boolean;
  run: (editor: Editor) => boolean;
};

const heading = (level: 1 | 2 | 3): CommandDefinition => ({
  canRun: (editor) => editor.can().chain().toggleHeading({level}).run(),
  icon: level === 1 ? <IconHeading1 /> : level === 2 ? <IconHeading2 /> : <IconHeading3 />,
  isActive: (editor) => editor.isActive("heading", {level}),
  label: `Heading ${level}`,
  run: (editor) => editor.chain().focus().toggleHeading({level}).run(),
});

const COMMANDS: Record<RichTextEditorCommand, CommandDefinition> = {
  blockquote: {
    canRun: (editor) => editor.can().chain().toggleBlockquote().run(),
    icon: <IconQuote />,
    isActive: (editor) => editor.isActive("blockquote"),
    label: "Blockquote",
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  bold: {
    canRun: (editor) => editor.can().chain().toggleBold().run(),
    icon: <IconBold />,
    isActive: (editor) => editor.isActive("bold"),
    label: "Bold",
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  bulletList: {
    canRun: (editor) => editor.can().chain().toggleBulletList().run(),
    icon: <IconListUl />,
    isActive: (editor) => editor.isActive("bulletList"),
    label: "Bulleted list",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  code: {
    canRun: (editor) => editor.can().chain().toggleCode().run(),
    icon: <IconCode />,
    isActive: (editor) => editor.isActive("code"),
    label: "Inline code",
    run: (editor) => editor.chain().focus().toggleCode().run(),
  },
  codeBlock: {
    canRun: (editor) => editor.can().chain().toggleCodeBlock().run(),
    icon: <IconCodeBlock />,
    isActive: (editor) => editor.isActive("codeBlock"),
    label: "Code block",
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  "heading-1": heading(1),
  "heading-2": heading(2),
  "heading-3": heading(3),
  italic: {
    canRun: (editor) => editor.can().chain().toggleItalic().run(),
    icon: <IconItalic />,
    isActive: (editor) => editor.isActive("italic"),
    label: "Italic",
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  orderedList: {
    canRun: (editor) => editor.can().chain().toggleOrderedList().run(),
    icon: <IconListOl />,
    isActive: (editor) => editor.isActive("orderedList"),
    label: "Numbered list",
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  strike: {
    canRun: (editor) => editor.can().chain().toggleStrike().run(),
    icon: <IconStrikethrough />,
    isActive: (editor) => editor.isActive("strike"),
    label: "Strikethrough",
    run: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  underline: {
    canRun: (editor) => editor.can().chain().toggleUnderline().run(),
    icon: <IconUnderline />,
    isActive: (editor) => editor.isActive("underline"),
    label: "Underline",
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
};

/* -------------------------------------------------------------------------------------------------
 * Editor actions (RichTextEditor.ActionButton)
 * -----------------------------------------------------------------------------------------------*/
type RichTextEditorAction = "undo" | "redo" | "clearFormatting" | "clearContent";

type ActionDefinition = {
  label: string;
  icon: ReactNode;
  canRun: (editor: Editor) => boolean;
  run: (editor: Editor) => boolean;
};

const ACTIONS: Record<RichTextEditorAction, ActionDefinition> = {
  clearContent: {
    canRun: (editor) => !editor.isEmpty,
    icon: <IconClearContent />,
    label: "Clear content",
    run: (editor) => editor.chain().focus().clearContent(true).run(),
  },
  clearFormatting: {
    canRun: (editor) => !editor.isEmpty && editor.can().chain().unsetAllMarks().clearNodes().run(),
    icon: <IconClearFormatting />,
    label: "Clear formatting",
    run: (editor) => editor.chain().focus().unsetAllMarks().clearNodes().run(),
  },
  redo: {
    canRun: (editor) => editor.can().chain().redo().run(),
    icon: <IconRedo />,
    label: "Redo",
    run: (editor) => editor.chain().focus().redo().run(),
  },
  undo: {
    canRun: (editor) => editor.can().chain().undo().run(),
    icon: <IconUndo />,
    label: "Undo",
    run: (editor) => editor.chain().focus().undo().run(),
  },
};

export {ACTIONS, COMMANDS};

export type {ActionDefinition, CommandDefinition, RichTextEditorAction, RichTextEditorCommand};
