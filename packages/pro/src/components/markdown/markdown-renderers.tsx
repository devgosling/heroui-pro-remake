"use client";

import type {ComponentPropsWithRef, ReactElement, ReactNode} from "react";
import type {ExtraProps} from "react-markdown";

import {Children, isValidElement} from "react";

import {CodeBlock} from "../code-block";

import {getLanguage, getTextContent} from "./markdown-utils";
import {markdownVariants} from "./markdown.styles";

/* -------------------------------------------------------------------------------------------------
 * Default element renderers (shared by Markdown and StreamMarkdown)
 * -----------------------------------------------------------------------------------------------*/
const slots = markdownVariants();

const TRAILING_NEWLINE_PATTERN = /\n$/;

type InlineCodeProps = ComponentPropsWithRef<"code"> & ExtraProps;

/** Inline `code`. Fenced code is rendered by the `pre` renderer below, which reads these props. */
const MarkdownInlineCode = ({className, node: _node, ...rest}: InlineCodeProps) => (
  <code className={slots.inlineCode({className})} data-slot="markdown-inline-code" {...rest} />
);

MarkdownInlineCode.displayName = "HeroUI.Markdown.InlineCode";

type PreProps = ComponentPropsWithRef<"pre"> & ExtraProps;

interface MarkdownCodeBlockProps {
  /** Code text (without the trailing newline). */
  code: string;
  /** Fence language (`tsx`, `bash`, ...). `text` when the fence has none. */
  language: string;
}

/** Fenced code: a HeroUI Pro CodeBlock whose header shows the language label and a copy button. */
const MarkdownCodeBlock = ({code, language}: MarkdownCodeBlockProps) => (
  <CodeBlock>
    <CodeBlock.Header>
      <span className={slots.codeLanguage()} data-slot="markdown-code-language">
        {language}
      </span>
      <CodeBlock.CopyButton code={code} />
    </CodeBlock.Header>
    <CodeBlock.Code code={code} language={language} />
  </CodeBlock>
);

MarkdownCodeBlock.displayName = "HeroUI.Markdown.CodeBlock";

/** Fenced code block: unwraps the `<code>` child and renders a code block with a language label. */
const MarkdownPre = ({children, node: _node, ...rest}: PreProps) => {
  const [child] = Children.toArray(children);

  if (!isValidElement(child)) return <pre {...rest}>{children}</pre>;

  const codeProps = (child as ReactElement<{className?: string; children?: ReactNode}>).props;

  return (
    <MarkdownCodeBlock
      code={getTextContent(codeProps.children).replace(TRAILING_NEWLINE_PATTERN, "")}
      language={getLanguage(codeProps.className) ?? "text"}
    />
  );
};

MarkdownPre.displayName = "HeroUI.Markdown.Pre";

/* -------------------------------------------------------------------------------------------------
 * StreamMarkdown code renderer
 * -----------------------------------------------------------------------------------------------*/
type WithNode<T> = T & {node?: unknown};

type StreamMarkdownCodeProps = WithNode<ComponentPropsWithRef<"code">> & {"data-block"?: unknown};

/**
 * Streamdown `code` renderer. Streamdown passes `data-block` for fenced code; without an
 * `inlineCode` override it also routes inline code here, which then renders as inline code.
 */
const StreamMarkdownCode = (props: StreamMarkdownCodeProps) => {
  const {children, className, "data-block": _isBlock, node: _node, ...rest} = props;

  if (!("data-block" in props)) {
    return (
      <MarkdownInlineCode className={className} {...rest}>
        {children}
      </MarkdownInlineCode>
    );
  }

  return (
    <MarkdownCodeBlock
      code={getTextContent(children).replace(TRAILING_NEWLINE_PATTERN, "")}
      language={getLanguage(className) ?? "text"}
    />
  );
};

StreamMarkdownCode.displayName = "HeroUI.StreamMarkdown.Code";

export {MarkdownInlineCode, MarkdownCodeBlock, MarkdownPre, StreamMarkdownCode};

export type {MarkdownCodeBlockProps, StreamMarkdownCodeProps};
