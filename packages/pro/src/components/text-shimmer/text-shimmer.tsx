"use client";

import type {DOMRenderProps} from "@heroui/react";
import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {dom} from "@heroui/react";
import {useId} from "react";

import {textShimmerVariants} from "./text-shimmer.styles";

// Parts are fixed, so the slot functions can be shared by every instance.
const slots = textShimmerVariants();

/* -------------------------------------------------------------------------------------------------
 * Root
 *
 * Renders two stacked copies of the same content:
 *  - `__text` is the readable layer (45% alpha of `currentColor`).
 *  - `__highlight` is an inert, aria-hidden copy whose glyphs mask a `currentColor` gradient band.
 *    The band only animates `translate`, so the sweep is GPU composited and never repaints.
 * Firefox has no `mask-clip: text`, so the highlight masks itself with `-moz-element(#id)` of the
 * readable layer instead; the id is generated here and handed over through `--_firefox-mask`.
 * -----------------------------------------------------------------------------------------------*/
interface TextShimmerRootProps
  extends Omit<ComponentPropsWithRef<"span">, "children">, DOMRenderProps<"span", undefined> {
  /** Text content. Keep it short: a status label such as "Thinking...". */
  children?: ReactNode;
  /** Additional classes, including colour and text size utilities. */
  className?: string;
}

const TextShimmerRoot = ({children, className, ...rest}: TextShimmerRootProps) => {
  // `-moz-element()` takes a CSS id selector, so keep the generated id selector-safe.
  const textId = `text-shimmer-${useId().replace(/[^\w-]/g, "")}`;
  const highlightStyle = {"--_firefox-mask": `-moz-element(#${textId})`} as CSSProperties;

  return (
    <dom.span {...rest} className={slots.base({className})} data-slot="text-shimmer">
      <span className={slots.text()} data-slot="text-shimmer-text" id={textId}>
        {children}
      </span>
      <span
        inert
        aria-hidden="true"
        className={slots.highlight()}
        data-slot="text-shimmer-highlight"
        style={highlightStyle}
      >
        {children}
      </span>
    </dom.span>
  );
};

TextShimmerRoot.displayName = "HeroUI.TextShimmer";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TextShimmerRoot};

export type {TextShimmerRootProps};
