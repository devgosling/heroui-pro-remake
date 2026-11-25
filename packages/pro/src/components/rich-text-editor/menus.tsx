"use client";

import type {ToolbarProps} from "@heroui/react";
import type {BubbleMenuProps, FloatingMenuProps} from "@tiptap/react/menus";
import type {ReactNode} from "react";

import {Toolbar} from "@heroui/react";
import {BubbleMenu, FloatingMenu} from "@tiptap/react/menus";

import {useResolvedClassName} from "../../utils";

import {useRichTextEditorContext} from "./rich-text-editor-context";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor BubbleMenu
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorBubbleMenuProps extends Omit<BubbleMenuProps, "editor" | "children"> {
  children?: ReactNode;
  /** Props forwarded to the internal selection toolbar. */
  toolbarProps?: Partial<ToolbarProps>;
}

const RichTextEditorBubbleMenu = ({
  children,
  className,
  pluginKey = "rich-text-editor-bubble-menu",
  toolbarProps,
  ...rest
}: RichTextEditorBubbleMenuProps) => {
  const {editor, slots} = useRichTextEditorContext();
  const toolbarClassName = useResolvedClassName(toolbarProps?.className, slots.bubbleMenuToolbar());

  if (!editor) return null;

  return (
    <BubbleMenu
      className={slots.bubbleMenu({className})}
      data-slot="rich-text-editor-bubble-menu"
      editor={editor}
      pluginKey={pluginKey}
      {...rest}
    >
      <Toolbar
        aria-label="Selection formatting toolbar"
        {...toolbarProps}
        className={toolbarClassName}
        data-slot="rich-text-editor-bubble-menu-toolbar"
      >
        {children}
      </Toolbar>
    </BubbleMenu>
  );
};

RichTextEditorBubbleMenu.displayName = "HeroUI.RichTextEditor.BubbleMenu";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor FloatingMenu
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorFloatingMenuProps extends Omit<FloatingMenuProps, "editor" | "children"> {
  children?: ReactNode;
  /** Props forwarded to the internal insertion toolbar. */
  toolbarProps?: Partial<ToolbarProps>;
}

const RichTextEditorFloatingMenu = ({
  children,
  className,
  pluginKey = "rich-text-editor-floating-menu",
  toolbarProps,
  ...rest
}: RichTextEditorFloatingMenuProps) => {
  const {editor, slots} = useRichTextEditorContext();
  const toolbarClassName = useResolvedClassName(
    toolbarProps?.className,
    slots.floatingMenuToolbar(),
  );

  if (!editor) return null;

  return (
    <FloatingMenu
      className={slots.floatingMenu({className})}
      data-slot="rich-text-editor-floating-menu"
      editor={editor}
      pluginKey={pluginKey}
      {...rest}
    >
      <Toolbar
        aria-label="Insertion toolbar"
        {...toolbarProps}
        className={toolbarClassName}
        data-slot="rich-text-editor-floating-menu-toolbar"
      >
        {children}
      </Toolbar>
    </FloatingMenu>
  );
};

RichTextEditorFloatingMenu.displayName = "HeroUI.RichTextEditor.FloatingMenu";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {RichTextEditorBubbleMenu, RichTextEditorFloatingMenu};

export type {RichTextEditorBubbleMenuProps, RichTextEditorFloatingMenuProps};
