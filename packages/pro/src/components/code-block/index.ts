import type {ComponentProps} from "react";

import {CodeBlockCode, CodeBlockCopyButton, CodeBlockHeader, CodeBlockRoot} from "./code-block";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/code-block`) because CodeBlock.Code depends on `shiki`.
 * -----------------------------------------------------------------------------------------------*/
export const CodeBlock = Object.assign(CodeBlockRoot, {
  Code: CodeBlockCode,
  CopyButton: CodeBlockCopyButton,
  Header: CodeBlockHeader,
  Root: CodeBlockRoot,
});

export type CodeBlock = {
  Props: ComponentProps<typeof CodeBlockRoot>;
  RootProps: ComponentProps<typeof CodeBlockRoot>;
  HeaderProps: ComponentProps<typeof CodeBlockHeader>;
  CodeProps: ComponentProps<typeof CodeBlockCode>;
  CopyButtonProps: ComponentProps<typeof CodeBlockCopyButton>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CodeBlockRoot,
  CodeBlockHeader,
  CodeBlockCode,
  CodeBlockCopyButton,
  CodeBlockContext,
} from "./code-block";

export type {
  CodeBlockRootProps,
  CodeBlockRootProps as CodeBlockProps,
  CodeBlockHeaderProps,
  CodeBlockCodeProps,
  CodeBlockCopyButtonProps,
} from "./code-block";

export {highlightCode} from "./use-highlighted-code";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {codeBlockVariants, type CodeBlockVariants} from "./code-block.styles";
