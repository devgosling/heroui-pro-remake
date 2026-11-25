"use client";

import type {ComponentProps} from "react";

import {useMemo} from "react";
import {Streamdown} from "streamdown";
import {cx} from "tailwind-variants";

import {streamMarkdownComponents} from "./markdown-components";
import {markdownVariants} from "./markdown.styles";

const slots = markdownVariants();

/* -------------------------------------------------------------------------------------------------
 * StreamMarkdown
 * -----------------------------------------------------------------------------------------------*/
type StreamMarkdownProps = ComponentProps<typeof Streamdown>;

/**
 * Streamdown-powered markdown (incomplete-markdown repair, streaming animation, caret) with the
 * HeroUI Pro `.markdown` typography and code blocks. Accepts every Streamdown prop.
 */
const StreamMarkdown = ({className, components, ...rest}: StreamMarkdownProps) => {
  const resolvedComponents = useMemo(
    () => (components ? {...streamMarkdownComponents, ...components} : streamMarkdownComponents),
    [components],
  );

  return (
    <Streamdown
      data-slot="markdown"
      {...rest}
      className={cx(slots.base(), className) ?? undefined}
      components={resolvedComponents}
    />
  );
};

StreamMarkdown.displayName = "HeroUI.StreamMarkdown";

export {StreamMarkdown};

export type {StreamMarkdownProps};
