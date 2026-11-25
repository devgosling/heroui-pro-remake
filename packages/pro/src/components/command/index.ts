import type {ComponentProps} from "react";

import {
  CommandBackdrop,
  CommandContainer,
  CommandDialog,
  CommandFooter,
  CommandGroup,
  CommandHeader,
  CommandInputGroupClearButton,
  CommandInputGroupInput,
  CommandInputGroupPrefix,
  CommandInputGroupRoot,
  CommandInputGroupSuffix,
  CommandItem,
  CommandList,
  CommandRoot,
  CommandSeparator,
} from "./command";

/* -------------------------------------------------------------------------------------------------
 * Compound Components
 * -----------------------------------------------------------------------------------------------*/
export const CommandInputGroup = Object.assign(CommandInputGroupRoot, {
  ClearButton: CommandInputGroupClearButton,
  Input: CommandInputGroupInput,
  Prefix: CommandInputGroupPrefix,
  Root: CommandInputGroupRoot,
  Suffix: CommandInputGroupSuffix,
});

export const Command = Object.assign(CommandRoot, {
  Backdrop: CommandBackdrop,
  Container: CommandContainer,
  Dialog: CommandDialog,
  Footer: CommandFooter,
  Group: CommandGroup,
  Header: CommandHeader,
  InputGroup: CommandInputGroup,
  Item: CommandItem,
  List: CommandList,
  Root: CommandRoot,
  Separator: CommandSeparator,
});

export type Command = {
  Props: ComponentProps<typeof CommandRoot>;
  RootProps: ComponentProps<typeof CommandRoot>;
  BackdropProps: ComponentProps<typeof CommandBackdrop>;
  ContainerProps: ComponentProps<typeof CommandContainer>;
  DialogProps: ComponentProps<typeof CommandDialog>;
  HeaderProps: ComponentProps<typeof CommandHeader>;
  InputGroupProps: ComponentProps<typeof CommandInputGroupRoot>;
  InputGroupPrefixProps: ComponentProps<typeof CommandInputGroupPrefix>;
  InputGroupInputProps: ComponentProps<typeof CommandInputGroupInput>;
  InputGroupSuffixProps: ComponentProps<typeof CommandInputGroupSuffix>;
  InputGroupClearButtonProps: ComponentProps<typeof CommandInputGroupClearButton>;
  ListProps: ComponentProps<typeof CommandList>;
  ItemProps: ComponentProps<typeof CommandItem>;
  GroupProps: ComponentProps<typeof CommandGroup>;
  SeparatorProps: ComponentProps<typeof CommandSeparator>;
  FooterProps: ComponentProps<typeof CommandFooter>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CommandRoot,
  CommandBackdrop,
  CommandContainer,
  CommandDialog,
  CommandHeader,
  CommandInputGroupRoot,
  CommandInputGroupPrefix,
  CommandInputGroupInput,
  CommandInputGroupSuffix,
  CommandInputGroupClearButton,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandSeparator,
  CommandFooter,
  CommandContext,
} from "./command";

export type {
  CommandRootProps,
  CommandRootProps as CommandProps,
  CommandBackdropProps,
  CommandContainerProps,
  CommandDialogProps,
  CommandHeaderProps,
  CommandInputGroupProps,
  CommandInputGroupPrefixProps,
  CommandInputGroupInputProps,
  CommandInputGroupSuffixProps,
  CommandInputGroupClearButtonProps,
  CommandListProps,
  CommandItemProps,
  CommandGroupProps,
  CommandSeparatorProps,
  CommandFooterProps,
} from "./command";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {commandVariants, type CommandVariants} from "./command.styles";
