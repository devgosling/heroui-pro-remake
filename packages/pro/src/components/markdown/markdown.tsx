"use client";

import type {ComponentPropsWithRef} from "react";
import type {Components} from "react-markdown";

import {memo, useId, useMemo} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {defaultComponents} from "./markdown-components";
import {markdownVariants} from "./markdown.styles";
import {parseMarkdownIntoBlocks} from "./parse-markdown-blocks";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const slots = markdownVariants();

/** Shallow equality for component maps, so inline `components` objects don't defeat `memo`. */
function areComponentsEqual(a: Partial<Components>, b: Partial<Components>): boolean {
  if (a === b) return true;

  const keysA = Object.keys(a) as Array<keyof Components>;

  if (keysA.length !== Object.keys(b).length) return false;

  return keysA.every((key) => a[key] === b[key]);
}

const REMARK_PLUGINS = [remarkGfm];

/* -------------------------------------------------------------------------------------------------
 * Markdown Block (memoized)
 * -----------------------------------------------------------------------------------------------*/
interface MarkdownBlockProps {
  /** Raw markdown of a single top-level block. */
  content: string;
  /** Resolved element renderers. */
  components: Partial<Components>;
}

const MarkdownBlock = memo(
  ({components, content}: MarkdownBlockProps) => (
    <div className={slots.block()} data-slot="markdown-block">
      <ReactMarkdown components={components} remarkPlugins={REMARK_PLUGINS}>
        {content}
      </ReactMarkdown>
    </div>
  ),
  (prev, next) =>
    prev.content === next.content && areComponentsEqual(prev.components, next.components),
);

MarkdownBlock.displayName = "HeroUI.Markdown.Block";

/* -------------------------------------------------------------------------------------------------
 * Markdown Root
 * -----------------------------------------------------------------------------------------------*/
interface MarkdownRootProps extends Omit<ComponentPropsWithRef<"div">, "children" | "id"> {
  /** Markdown content to render. */
  children?: string;
  /** Custom react-markdown component overrides (merged over the HeroUI renderers). */
  components?: Partial<Components>;
  /** Stable id seed used for the memoized block keys. Defaults to a generated id. */
  id?: string;
}

const MarkdownRoot = ({children, className, components, id, ...rest}: MarkdownRootProps) => {
  const generatedId = useId();
  const seed = id ?? generatedId;

  const blocks = useMemo(() => parseMarkdownIntoBlocks(children ?? ""), [children]);

  const resolvedComponents = useMemo(
    () => (components ? {...defaultComponents, ...components} : defaultComponents),
    [components],
  );

  return (
    <div className={slots.base({className})} data-slot="markdown" {...rest}>
      {blocks.map((block, index) => (
        <MarkdownBlock
          // Index keys are intentional: while streaming only the trailing blocks change, so every
          // earlier block keeps its key and skips re-rendering through `memo`.
          key={`${seed}-block_${index}`}
          components={resolvedComponents}
          content={block}
        />
      ))}
    </div>
  );
};

MarkdownRoot.displayName = "HeroUI.Markdown";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MarkdownRoot, MarkdownBlock};

export type {MarkdownRootProps, MarkdownBlockProps};
