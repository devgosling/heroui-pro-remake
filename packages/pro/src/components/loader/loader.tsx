"use client";

import type {LoaderVariant} from "./loader-drawings";
import type {LoaderVariants} from "./loader.styles";
import type {DOMRenderProps} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {dom} from "@heroui/react";
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import {getLoaderDrawing} from "./loader-drawings";
import {loaderVariants} from "./loader.styles";

/* -------------------------------------------------------------------------------------------------
 * Loader Context
 * -----------------------------------------------------------------------------------------------*/
type LoaderContext = {
  /** Lets a `Loader.Label` rendered anywhere inside the root hide the fallback status text. */
  registerLabel?: () => () => void;
  slots: ReturnType<typeof loaderVariants>;
  variant: LoaderVariant;
};

const LoaderContext = createContext<LoaderContext>({
  slots: loaderVariants(),
  variant: "ring",
});

/** True when `node` holds a `Loader.Label` directly or inside fragments (works in server markup). */
function containsLabel(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (!isValidElement(child)) return false;
    if (child.type === LoaderLabel) return true;

    return (
      child.type === Fragment && containsLabel((child.props as {children?: ReactNode}).children)
    );
  });
}

/* -------------------------------------------------------------------------------------------------
 * Loader Root
 * -----------------------------------------------------------------------------------------------*/
interface LoaderRootProps
  extends
    Omit<ComponentPropsWithRef<"span">, "children" | "color">,
    DOMRenderProps<"span", undefined>,
    LoaderVariants {
  /** Indicator style. @default "ring" */
  variant?: LoaderVariant;
  /** Visible text shown in `Loader.Label`. Ignored when `children` is set. */
  label?: string;
  /**
   * Hidden status text when there is no label (defaults to "Loading"); names the root when a label
   * is shown.
   */
  "aria-label"?: string;
  /** Custom mix of `Loader.Indicator` and `Loader.Label`. */
  children?: ReactNode;
}

const LoaderRoot = ({
  "aria-label": ariaLabel,
  children,
  className,
  color,
  label,
  size,
  variant,
  ...rest
}: LoaderRootProps) => {
  const resolvedVariant: LoaderVariant = variant ?? "ring";
  const slots = useMemo(
    () => loaderVariants({color, size, variant: resolvedVariant}),
    [color, size, resolvedVariant],
  );

  // Labels rendered deeper than the root's direct children register themselves after mount.
  const [mountedLabels, setMountedLabels] = useState(0);
  const registerLabel = useCallback(() => {
    setMountedLabels((count) => count + 1);

    return () => setMountedLabels((count) => count - 1);
  }, []);

  const hasChildren = children !== undefined && children !== null;
  const visibleLabel = hasChildren ? undefined : label || undefined;
  const hasLabel =
    visibleLabel !== undefined || (hasChildren && containsLabel(children)) || mountedLabels > 0;

  const contextValue = useMemo<LoaderContext>(
    () => ({registerLabel, slots, variant: resolvedVariant}),
    [registerLabel, slots, resolvedVariant],
  );

  return (
    <LoaderContext value={contextValue}>
      <dom.span
        {...rest}
        aria-label={hasLabel ? ariaLabel : undefined}
        className={slots.base({className})}
        data-size={size ?? "md"}
        data-slot="loader"
        data-variant={resolvedVariant}
        role="status"
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <LoaderIndicator />
            {visibleLabel !== undefined ? <LoaderLabel>{visibleLabel}</LoaderLabel> : null}
          </>
        )}
        {hasLabel ? null : (
          <span className={slots.fallback()} data-slot="loader-fallback">
            {ariaLabel ?? "Loading"}
          </span>
        )}
      </dom.span>
    </LoaderContext>
  );
};

LoaderRoot.displayName = "HeroUI.Loader";

/* -------------------------------------------------------------------------------------------------
 * Loader Indicator
 * -----------------------------------------------------------------------------------------------*/
interface LoaderIndicatorProps extends ComponentPropsWithRef<"svg"> {
  /** SVG content that replaces the default drawing; set `viewBox` to match. */
  children?: ReactNode;
}

const LoaderIndicator = ({children, className, viewBox, ...rest}: LoaderIndicatorProps) => {
  const {slots, variant} = use(LoaderContext);
  const hasChildren = children !== undefined && children !== null;
  const drawing = hasChildren ? undefined : getLoaderDrawing(variant);

  return (
    <svg
      aria-hidden="true"
      className={slots.indicator({className})}
      data-slot="loader-indicator"
      focusable="false"
      viewBox={viewBox ?? drawing?.viewBox ?? "0 0 24 24"}
      {...rest}
    >
      {hasChildren ? children : drawing?.content}
    </svg>
  );
};

LoaderIndicator.displayName = "HeroUI.Loader.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Loader Label
 * -----------------------------------------------------------------------------------------------*/
interface LoaderLabelProps extends ComponentPropsWithRef<"span"> {}

const LoaderLabel = ({children, className, ...rest}: LoaderLabelProps) => {
  const {registerLabel, slots} = use(LoaderContext);

  useLayoutEffect(() => registerLabel?.(), [registerLabel]);

  return (
    <span className={slots.label({className})} data-slot="loader-label" {...rest}>
      {children}
    </span>
  );
};

LoaderLabel.displayName = "HeroUI.Loader.Label";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {LoaderRoot, LoaderIndicator, LoaderLabel, LoaderContext};

export type {LoaderRootProps, LoaderIndicatorProps, LoaderLabelProps};
