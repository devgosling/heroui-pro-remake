import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const richTextEditorVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "rich-text-editor",
    bubbleMenu: "rich-text-editor__bubble-menu",
    bubbleMenuToolbar: "rich-text-editor__bubble-menu-toolbar",
    characterCount: "rich-text-editor__character-count",
    content: "rich-text-editor__content",
    floatingMenu: "rich-text-editor__floating-menu",
    floatingMenuToolbar: "rich-text-editor__floating-menu-toolbar",
    footer: "rich-text-editor__footer",
    linkInput: "rich-text-editor__link-input",
    linkPopover: "rich-text-editor__link-popover",
    linkPopoverActions: "rich-text-editor__link-popover-actions",
    linkPopoverContent: "rich-text-editor__link-popover-content",
    linkPopoverTrigger: "rich-text-editor__link-popover-trigger",
    loading: "rich-text-editor__loading",
    prosemirror: "rich-text-editor__prosemirror",
    shell: "rich-text-editor__shell",
    suggestionDecoration: "rich-text-editor__suggestion-decoration",
    suggestionMenu: "rich-text-editor__suggestion-menu",
    suggestionMenuDescription: "rich-text-editor__suggestion-menu-description",
    suggestionMenuEmpty: "rich-text-editor__suggestion-menu-empty",
    suggestionMenuIcon: "rich-text-editor__suggestion-menu-icon",
    suggestionMenuItem: "rich-text-editor__suggestion-menu-item",
    suggestionMenuItemContent: "rich-text-editor__suggestion-menu-item-content",
    suggestionMenuList: "rich-text-editor__suggestion-menu-list",
    suggestionMenuTitle: "rich-text-editor__suggestion-menu-title",
    toolbar: "rich-text-editor__toolbar",
    toolbarButton: "rich-text-editor__toolbar-button",
    toolbarGroup: "rich-text-editor__toolbar-group",
    toolbarSeparator: "rich-text-editor__toolbar-separator",
  },
  variants: {
    variant: {
      primary: {shell: "rich-text-editor__shell--primary"},
      secondary: {shell: "rich-text-editor__shell--secondary"},
    },
  },
});

export type RichTextEditorVariants = VariantProps<typeof richTextEditorVariants>;
