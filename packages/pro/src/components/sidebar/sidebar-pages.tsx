"use client";

import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {
  Children,
  isValidElement,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {useMergedRef} from "../../utils";

import {useSidebarContext} from "./sidebar-context";
import {
  SidebarPagesContext,
  SidebarPagesReducedMotionContext,
  useSidebarPages,
} from "./sidebar-pages-context";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Pages
 * -----------------------------------------------------------------------------------------------*/
interface SidebarPagesProps extends Omit<ComponentPropsWithRef<"div">, "defaultValue"> {
  /** Controlled active page value. */
  value?: string;
  /** Initial active page (uncontrolled). @default the first Sidebar.Page */
  defaultValue?: string;
  /** Called when the active page changes. */
  onValueChange?: (value: string) => void;
  /** Disables the slide animation. @default inherited from Sidebar.Provider */
  reduceMotion?: boolean;
  children?: ReactNode;
}

function collectPageValues(children: ReactNode, values: string[] = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement<{children?: ReactNode; value?: string}>(child)) return;

    if (child.type === SidebarPage && child.props.value != null) values.push(child.props.value);
    else if (child.type !== SidebarPage) collectPageValues(child.props.children, values);
  });

  return values;
}

const SidebarPages = ({
  children,
  className,
  defaultValue,
  onValueChange,
  reduceMotion,
  value,
  ...rest
}: SidebarPagesProps) => {
  const {reduceMotion: providerReduceMotion, slots} = useSidebarContext();
  // Keyed by the joined values so the array identity only changes when the pages change.
  const orderKey = collectPageValues(children).join("\u0000");
  const stableOrder = useMemo(() => (orderKey ? orderKey.split("\u0000") : []), [orderKey]);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? stableOrder[0] ?? "");
  const activeValue = value ?? uncontrolledValue;
  const activeIndex = Math.max(0, stableOrder.indexOf(activeValue));
  const isReduced = reduceMotion ?? providerReduceMotion;

  const setActiveValue = useCallback(
    (next: string) => {
      if (value === undefined) setUncontrolledValue(next);
      if (next !== activeValue) onValueChange?.(next);
    },
    [activeValue, onValueChange, value],
  );

  const contextValue = useMemo(
    () => ({activeIndex, activeValue, order: stableOrder, setActiveValue}),
    [activeIndex, activeValue, setActiveValue, stableOrder],
  );

  return (
    <SidebarPagesContext value={contextValue}>
      <SidebarPagesReducedMotionContext value={isReduced}>
        <div className={slots.pages({className})} data-slot="sidebar-pages" {...rest}>
          {children}
        </div>
      </SidebarPagesReducedMotionContext>
    </SidebarPagesContext>
  );
};

SidebarPages.displayName = "HeroUI.Sidebar.Pages";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Page
 * -----------------------------------------------------------------------------------------------*/
interface SidebarPageProps extends ComponentPropsWithRef<"div"> {
  /** Unique key identifying this page within Sidebar.Pages. */
  value: string;
}

const SidebarPage = ({children, className, ref, style, value, ...rest}: SidebarPageProps) => {
  const {slots} = useSidebarContext();
  const {activeIndex, order} = useSidebarPages();
  const isReduced = use(SidebarPagesReducedMotionContext);
  const localRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const index = order.indexOf(value);
  const isActive = index === activeIndex;
  const offset = index - activeIndex;
  const wasActiveRef = useRef(isActive);

  // Keep keyboard users in the sidebar: when the focused page slides away, focus the new one.
  useLayoutEffect(() => {
    const wasActive = wasActiveRef.current;

    wasActiveRef.current = isActive;

    if (!isActive || wasActive || !localRef.current) return;

    const pages = localRef.current.parentElement;
    const active = pages?.ownerDocument.activeElement;

    if (!active || !pages?.contains(active)) return;

    const target = localRef.current.querySelector<HTMLElement>(
      '[role="treegrid"], button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );

    target?.focus({preventScroll: true});
  }, [isActive]);

  // Only the slide is disabled by `reduceMotion`; the rest of the sidebar keeps its transitions.
  const pageStyle: CSSProperties = {
    opacity: isActive ? 1 : 0,
    transform: isActive ? "none" : `translateX(${offset * 100}%)`,
    ...(isReduced ? {transition: "none"} : null),
    ...style,
  };

  return (
    <div
      ref={mergedRef}
      aria-hidden={isActive ? undefined : true}
      className={slots.page({className})}
      data-active={isActive ? "true" : "false"}
      data-slot="sidebar-page"
      inert={!isActive || undefined}
      style={pageStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

SidebarPage.displayName = "HeroUI.Sidebar.Page";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SidebarPages, SidebarPage};

export type {SidebarPagesProps, SidebarPageProps};
