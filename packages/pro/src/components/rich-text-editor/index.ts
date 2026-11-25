import type {ComponentProps} from "react";

import {
  RichTextEditorLinkPopoverActions,
  RichTextEditorLinkPopoverApplyButton,
  RichTextEditorLinkPopoverContent,
  RichTextEditorLinkPopoverInput,
  RichTextEditorLinkPopoverRoot,
  RichTextEditorLinkPopoverTrigger,
  RichTextEditorLinkPopoverUnsetButton,
} from "./link-popover";
import {RichTextEditorBubbleMenu, RichTextEditorFloatingMenu} from "./menus";
import {
  RichTextEditorActionButton,
  RichTextEditorCharacterCount,
  RichTextEditorCommandButton,
  RichTextEditorContent,
  RichTextEditorFooter,
  RichTextEditorRoot,
  RichTextEditorShell,
  RichTextEditorToggleButton,
  RichTextEditorToolbar,
  RichTextEditorToolbarGroup,
  RichTextEditorToolbarSeparator,
} from "./rich-text-editor";
import {RichTextEditorSuggestionMenu} from "./suggestion-menu";

/* -------------------------------------------------------------------------------------------------
 * Compound Components
 * Subpath-only export (`@heroui/pro/rich-text-editor`) because it depends on the `@tiptap/*` peers.
 * -----------------------------------------------------------------------------------------------*/
export const RichTextEditorLinkPopover = Object.assign(RichTextEditorLinkPopoverRoot, {
  Actions: RichTextEditorLinkPopoverActions,
  ApplyButton: RichTextEditorLinkPopoverApplyButton,
  Content: RichTextEditorLinkPopoverContent,
  Input: RichTextEditorLinkPopoverInput,
  Root: RichTextEditorLinkPopoverRoot,
  Trigger: RichTextEditorLinkPopoverTrigger,
  UnsetButton: RichTextEditorLinkPopoverUnsetButton,
});

export const RichTextEditor = Object.assign(RichTextEditorRoot, {
  ActionButton: RichTextEditorActionButton,
  BubbleMenu: RichTextEditorBubbleMenu,
  CharacterCount: RichTextEditorCharacterCount,
  CommandButton: RichTextEditorCommandButton,
  Content: RichTextEditorContent,
  FloatingMenu: RichTextEditorFloatingMenu,
  Footer: RichTextEditorFooter,
  LinkPopover: RichTextEditorLinkPopover,
  Root: RichTextEditorRoot,
  Shell: RichTextEditorShell,
  SuggestionMenu: RichTextEditorSuggestionMenu,
  ToggleButton: RichTextEditorToggleButton,
  Toolbar: RichTextEditorToolbar,
  ToolbarGroup: RichTextEditorToolbarGroup,
  ToolbarSeparator: RichTextEditorToolbarSeparator,
});

export type RichTextEditor = {
  Props: ComponentProps<typeof RichTextEditorRoot>;
  RootProps: ComponentProps<typeof RichTextEditorRoot>;
  ShellProps: ComponentProps<typeof RichTextEditorShell>;
  ToolbarProps: ComponentProps<typeof RichTextEditorToolbar>;
  ToolbarGroupProps: ComponentProps<typeof RichTextEditorToolbarGroup>;
  ToolbarSeparatorProps: ComponentProps<typeof RichTextEditorToolbarSeparator>;
  ToggleButtonProps: ComponentProps<typeof RichTextEditorToggleButton>;
  ActionButtonProps: ComponentProps<typeof RichTextEditorActionButton>;
  CommandButtonProps: ComponentProps<typeof RichTextEditorCommandButton>;
  LinkPopoverProps: ComponentProps<typeof RichTextEditorLinkPopoverRoot>;
  LinkPopoverTriggerProps: ComponentProps<typeof RichTextEditorLinkPopoverTrigger>;
  LinkPopoverContentProps: ComponentProps<typeof RichTextEditorLinkPopoverContent>;
  LinkPopoverInputProps: ComponentProps<typeof RichTextEditorLinkPopoverInput>;
  LinkPopoverActionsProps: ComponentProps<typeof RichTextEditorLinkPopoverActions>;
  LinkPopoverUnsetButtonProps: ComponentProps<typeof RichTextEditorLinkPopoverUnsetButton>;
  LinkPopoverApplyButtonProps: ComponentProps<typeof RichTextEditorLinkPopoverApplyButton>;
  ContentProps: ComponentProps<typeof RichTextEditorContent>;
  BubbleMenuProps: ComponentProps<typeof RichTextEditorBubbleMenu>;
  FloatingMenuProps: ComponentProps<typeof RichTextEditorFloatingMenu>;
  SuggestionMenuProps: ComponentProps<typeof RichTextEditorSuggestionMenu>;
  FooterProps: ComponentProps<typeof RichTextEditorFooter>;
  CharacterCountProps: ComponentProps<typeof RichTextEditorCharacterCount>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  RichTextEditorRoot,
  RichTextEditorShell,
  RichTextEditorToolbar,
  RichTextEditorToolbarGroup,
  RichTextEditorToolbarSeparator,
  RichTextEditorToggleButton,
  RichTextEditorActionButton,
  RichTextEditorCommandButton,
  RichTextEditorContent,
  RichTextEditorFooter,
  RichTextEditorCharacterCount,
} from "./rich-text-editor";
export {
  RichTextEditorLinkPopoverRoot,
  RichTextEditorLinkPopoverTrigger,
  RichTextEditorLinkPopoverContent,
  RichTextEditorLinkPopoverInput,
  RichTextEditorLinkPopoverActions,
  RichTextEditorLinkPopoverUnsetButton,
  RichTextEditorLinkPopoverApplyButton,
} from "./link-popover";
export {RichTextEditorBubbleMenu, RichTextEditorFloatingMenu} from "./menus";
export {RichTextEditorSuggestionMenu} from "./suggestion-menu";
export {filterRichTextEditorSuggestionItems} from "./rich-text-editor-utils";

export type {
  RichTextEditorRootProps,
  RichTextEditorRootProps as RichTextEditorProps,
  RichTextEditorValueDetails,
  RichTextEditorShellProps,
  RichTextEditorToolbarProps,
  RichTextEditorToolbarGroupProps,
  RichTextEditorToolbarSeparatorProps,
  RichTextEditorToggleButtonProps,
  RichTextEditorActionButtonProps,
  RichTextEditorCommandButtonProps,
  RichTextEditorContentProps,
  RichTextEditorFooterProps,
  RichTextEditorCharacterCountProps,
  RichTextEditorCharacterCountStats,
} from "./rich-text-editor";
export type {
  RichTextEditorLinkPopoverProps,
  RichTextEditorLinkPopoverTriggerProps,
  RichTextEditorLinkPopoverContentProps,
  RichTextEditorLinkPopoverInputProps,
  RichTextEditorLinkPopoverActionsProps,
  RichTextEditorLinkPopoverUnsetButtonProps,
  RichTextEditorLinkPopoverApplyButtonProps,
} from "./link-popover";
export type {RichTextEditorBubbleMenuProps, RichTextEditorFloatingMenuProps} from "./menus";
export type {
  RichTextEditorSuggestionItem,
  RichTextEditorSuggestionCommandProps,
  RichTextEditorSuggestionSelectProps,
  RichTextEditorSuggestionMenuProps,
  RichTextEditorSuggestionMenuRenderProps,
} from "./suggestion-menu";
export type {RichTextEditorAction, RichTextEditorCommand} from "./commands";

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export {useRichTextEditor, useRichTextEditorState} from "./rich-text-editor-context";

export type {
  RichTextEditorStateSnapshot,
  UseRichTextEditorReturn,
} from "./rich-text-editor-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {richTextEditorVariants, type RichTextEditorVariants} from "./rich-text-editor.styles";
