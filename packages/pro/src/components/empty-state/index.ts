import type {ComponentProps} from "react";

import {
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateHeader,
  EmptyStateMedia,
  EmptyStateRoot,
  EmptyStateTitle,
} from "./empty-state";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Same public name as Pro (`EmptyState`). The OSS `@heroui/react` package also exports a
 * single-part `EmptyState`; both render the `.empty-state` block, Pro only adds parts and sizes.
 * -----------------------------------------------------------------------------------------------*/
export const EmptyState = Object.assign(EmptyStateRoot, {
  Content: EmptyStateContent,
  Description: EmptyStateDescription,
  Header: EmptyStateHeader,
  Media: EmptyStateMedia,
  Root: EmptyStateRoot,
  Title: EmptyStateTitle,
});

export type EmptyState = {
  Props: ComponentProps<typeof EmptyStateRoot>;
  RootProps: ComponentProps<typeof EmptyStateRoot>;
  HeaderProps: ComponentProps<typeof EmptyStateHeader>;
  MediaProps: ComponentProps<typeof EmptyStateMedia>;
  TitleProps: ComponentProps<typeof EmptyStateTitle>;
  DescriptionProps: ComponentProps<typeof EmptyStateDescription>;
  ContentProps: ComponentProps<typeof EmptyStateContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  EmptyStateRoot,
  EmptyStateHeader,
  EmptyStateMedia,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateContent,
  EmptyStateContext,
} from "./empty-state";

export type {
  EmptyStateMediaVariant,
  EmptyStateRootProps,
  EmptyStateRootProps as EmptyStateProps,
  EmptyStateHeaderProps,
  EmptyStateMediaProps,
  EmptyStateTitleProps,
  EmptyStateDescriptionProps,
  EmptyStateContentProps,
} from "./empty-state";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {emptyStateVariants, type EmptyStateVariants} from "./empty-state.styles";
