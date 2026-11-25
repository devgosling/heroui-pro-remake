"use client";

import type {ComponentPropsWithRef, ElementType, JSX} from "react";
import type {Components} from "react-markdown";
import type {Components as StreamdownComponents} from "streamdown";

import {MarkdownInlineCode, MarkdownPre, StreamMarkdownCode} from "./markdown-renderers";

/* -------------------------------------------------------------------------------------------------
 * Markdown renderers
 * -----------------------------------------------------------------------------------------------*/
/** Element renderers Markdown uses unless they are overridden through `components`. */
const defaultComponents: Partial<Components> = {
  code: MarkdownInlineCode,
  pre: MarkdownPre,
};

/* -------------------------------------------------------------------------------------------------
 * StreamMarkdown renderers
 * -------------------------------------------------------------------------------------------------
 * Streamdown's built-in renderers carry their own Tailwind utility classes (which live in the
 * `utilities` layer and would beat the `.markdown` typography). StreamMarkdown swaps them for plain
 * elements so it renders exactly like `Markdown`, and routes code through the HeroUI code block.
 * `pre` stays Streamdown's own: it tags the fenced `<code>` child with `data-block`.
 * -----------------------------------------------------------------------------------------------*/
type WithNode<T> = T & {node?: unknown};

function plain<T extends keyof JSX.IntrinsicElements>(tag: T) {
  const Element = tag as unknown as ElementType;

  const Renderer = ({node: _node, ...rest}: WithNode<ComponentPropsWithRef<T>>) => (
    <Element {...rest} />
  );

  Renderer.displayName = `HeroUI.StreamMarkdown.${tag}`;

  return Renderer;
}

const streamMarkdownComponents: StreamdownComponents = {
  a: plain("a"),
  blockquote: plain("blockquote"),
  code: StreamMarkdownCode,
  h1: plain("h1"),
  h2: plain("h2"),
  h3: plain("h3"),
  h4: plain("h4"),
  h5: plain("h5"),
  h6: plain("h6"),
  hr: plain("hr"),
  img: plain("img"),
  inlineCode: MarkdownInlineCode,
  li: plain("li"),
  ol: plain("ol"),
  p: plain("p"),
  strong: plain("strong"),
  table: plain("table"),
  tbody: plain("tbody"),
  td: plain("td"),
  th: plain("th"),
  thead: plain("thead"),
  tr: plain("tr"),
  ul: plain("ul"),
};

export {defaultComponents, streamMarkdownComponents};
