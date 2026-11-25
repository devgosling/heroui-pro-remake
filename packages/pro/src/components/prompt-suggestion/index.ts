import type {ComponentProps} from "react";

import {
  PromptSuggestionDescription,
  PromptSuggestionGroup,
  PromptSuggestionHeader,
  PromptSuggestionItem,
  PromptSuggestionItemDescription,
  PromptSuggestionItemFooter,
  PromptSuggestionItemHeader,
  PromptSuggestionItemMeta,
  PromptSuggestionItemTags,
  PromptSuggestionItemTitle,
  PromptSuggestionItems,
  PromptSuggestionRoot,
  PromptSuggestionTitle,
} from "./prompt-suggestion";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const PromptSuggestion = Object.assign(PromptSuggestionRoot, {
  Description: PromptSuggestionDescription,
  Group: PromptSuggestionGroup,
  Header: PromptSuggestionHeader,
  Item: PromptSuggestionItem,
  ItemDescription: PromptSuggestionItemDescription,
  ItemFooter: PromptSuggestionItemFooter,
  ItemHeader: PromptSuggestionItemHeader,
  ItemMeta: PromptSuggestionItemMeta,
  ItemTags: PromptSuggestionItemTags,
  ItemTitle: PromptSuggestionItemTitle,
  Items: PromptSuggestionItems,
  Root: PromptSuggestionRoot,
  Title: PromptSuggestionTitle,
});

export type PromptSuggestion = {
  Props: ComponentProps<typeof PromptSuggestionRoot>;
  RootProps: ComponentProps<typeof PromptSuggestionRoot>;
  HeaderProps: ComponentProps<typeof PromptSuggestionHeader>;
  TitleProps: ComponentProps<typeof PromptSuggestionTitle>;
  DescriptionProps: ComponentProps<typeof PromptSuggestionDescription>;
  GroupProps: ComponentProps<typeof PromptSuggestionGroup>;
  ItemsProps: ComponentProps<typeof PromptSuggestionItems>;
  ItemProps: ComponentProps<typeof PromptSuggestionItem>;
  ItemHeaderProps: ComponentProps<typeof PromptSuggestionItemHeader>;
  ItemTitleProps: ComponentProps<typeof PromptSuggestionItemTitle>;
  ItemDescriptionProps: ComponentProps<typeof PromptSuggestionItemDescription>;
  ItemMetaProps: ComponentProps<typeof PromptSuggestionItemMeta>;
  ItemTagsProps: ComponentProps<typeof PromptSuggestionItemTags>;
  ItemFooterProps: ComponentProps<typeof PromptSuggestionItemFooter>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  PromptSuggestionRoot,
  PromptSuggestionHeader,
  PromptSuggestionTitle,
  PromptSuggestionDescription,
  PromptSuggestionGroup,
  PromptSuggestionItems,
  PromptSuggestionItem,
  PromptSuggestionItemHeader,
  PromptSuggestionItemTitle,
  PromptSuggestionItemDescription,
  PromptSuggestionItemMeta,
  PromptSuggestionItemTags,
  PromptSuggestionItemFooter,
  PromptSuggestionContext,
} from "./prompt-suggestion";

export type {
  PromptSuggestionRootProps,
  PromptSuggestionRootProps as PromptSuggestionProps,
  PromptSuggestionHeaderProps,
  PromptSuggestionTitleProps,
  PromptSuggestionDescriptionProps,
  PromptSuggestionGroupProps,
  PromptSuggestionItemsProps,
  PromptSuggestionItemProps,
  PromptSuggestionItemButtonProps,
  PromptSuggestionItemLinkProps,
  PromptSuggestionItemHeaderProps,
  PromptSuggestionItemTitleProps,
  PromptSuggestionItemDescriptionProps,
  PromptSuggestionItemMetaProps,
  PromptSuggestionItemTagsProps,
  PromptSuggestionItemFooterProps,
} from "./prompt-suggestion";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {promptSuggestionVariants, type PromptSuggestionVariants} from "./prompt-suggestion.styles";
