import type {ComponentProps} from "react";

import {MarkdownRoot} from "./markdown";
import {StreamMarkdown} from "./stream-markdown";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/markdown`): depends on react-markdown, remark-gfm, marked,
 * streamdown and (through CodeBlock) shiki.
 * -----------------------------------------------------------------------------------------------*/
export const Markdown = Object.assign(MarkdownRoot, {
  Root: MarkdownRoot,
  Stream: StreamMarkdown,
});

export type Markdown = {
  Props: ComponentProps<typeof MarkdownRoot>;
  RootProps: ComponentProps<typeof MarkdownRoot>;
  StreamProps: ComponentProps<typeof StreamMarkdown>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {MarkdownRoot, MarkdownBlock} from "./markdown";
export {
  MarkdownCodeBlock,
  MarkdownInlineCode,
  MarkdownPre,
  StreamMarkdownCode,
} from "./markdown-renderers";
export {
  defaultComponents as markdownComponents,
  streamMarkdownComponents,
} from "./markdown-components";
export {StreamMarkdown} from "./stream-markdown";
export {parseMarkdownIntoBlocks} from "./parse-markdown-blocks";

export type {
  MarkdownRootProps,
  MarkdownRootProps as MarkdownProps,
  MarkdownBlockProps,
} from "./markdown";
export type {MarkdownCodeBlockProps, StreamMarkdownCodeProps} from "./markdown-renderers";
export type {StreamMarkdownProps} from "./stream-markdown";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {markdownVariants, type MarkdownVariants} from "./markdown.styles";
