import type {ComponentProps} from "react";

import {
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuMenu,
  ContextMenuPopover,
  ContextMenuRoot,
  ContextMenuSection,
  ContextMenuSeparator,
  ContextMenuSubmenuIndicator,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from "./context-menu";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ContextMenu = Object.assign(ContextMenuRoot, {
  Item: ContextMenuItem,
  ItemIndicator: ContextMenuItemIndicator,
  Menu: ContextMenuMenu,
  Popover: ContextMenuPopover,
  Root: ContextMenuRoot,
  Section: ContextMenuSection,
  Separator: ContextMenuSeparator,
  SubmenuIndicator: ContextMenuSubmenuIndicator,
  SubmenuTrigger: ContextMenuSubmenuTrigger,
  Trigger: ContextMenuTrigger,
});

export type ContextMenu<T extends object = object> = {
  Props: ComponentProps<typeof ContextMenuRoot>;
  RootProps: ComponentProps<typeof ContextMenuRoot>;
  TriggerProps: ComponentProps<typeof ContextMenuTrigger>;
  PopoverProps: ComponentProps<typeof ContextMenuPopover>;
  MenuProps: ComponentProps<typeof ContextMenuMenu<T>>;
  SectionProps: ComponentProps<typeof ContextMenuSection>;
  ItemProps: ComponentProps<typeof ContextMenuItem>;
  ItemIndicatorProps: ComponentProps<typeof ContextMenuItemIndicator>;
  SeparatorProps: ComponentProps<typeof ContextMenuSeparator>;
  SubmenuTriggerProps: ComponentProps<typeof ContextMenuSubmenuTrigger>;
  SubmenuIndicatorProps: ComponentProps<typeof ContextMenuSubmenuIndicator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPopover,
  ContextMenuMenu,
  ContextMenuSection,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuSeparator,
  ContextMenuSubmenuTrigger,
  ContextMenuSubmenuIndicator,
  ContextMenuContext,
} from "./context-menu";

export type {
  ContextMenuRootProps,
  ContextMenuRootProps as ContextMenuProps,
  ContextMenuTriggerProps,
  ContextMenuPopoverProps,
  ContextMenuMenuProps,
  ContextMenuSectionProps,
  ContextMenuItemProps,
  ContextMenuItemIndicatorProps,
  ContextMenuSeparatorProps,
  ContextMenuSubmenuTriggerProps,
  ContextMenuSubmenuIndicatorProps,
} from "./context-menu";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {contextMenuVariants, type ContextMenuVariants} from "./context-menu.styles";
