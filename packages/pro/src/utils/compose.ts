"use client";

import {useMemo} from "react";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {cx} from "tailwind-variants";

/**
 * Merges a (possibly render-prop) className with the BEM classes produced by `tv()`.
 * Mirrors the helper used inside `@heroui/react`, which is not part of its public API.
 */
export function composeTwRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tailwind?: string | ((v: T) => string | undefined),
): string | ((v: T) => string) {
  return composeRenderProps(className, (className, renderProps): string => {
    const tw = typeof tailwind === "function" ? (tailwind(renderProps) ?? "") : (tailwind ?? "");

    return cx(tw, className ?? "");
  });
}

export function useResolvedClassName<T>(
  className: string | ((v: T) => string) | undefined,
  styles?: string,
): string | ((v: T) => string) {
  return useMemo(() => {
    if (typeof className === "function") return composeTwRenderProps(className, styles);
    if (!styles) return className ?? "";

    return className ? cx(styles, className) : styles;
  }, [className, styles]);
}
