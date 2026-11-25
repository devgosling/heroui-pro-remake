"use client";

import type {
  CSSProperties,
  ComponentPropsWithRef,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from "react";
import type {Placement} from "react-aria-components/Popover";

import {createContext, use, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useLocale} from "react-aria/I18nProvider";
import {mergeProps} from "react-aria/mergeProps";
import {useHover} from "react-aria/useHover";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {floatingTocVariants} from "./floating-toc.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type FloatingTocPlacement = "left" | "right";
type FloatingTocTriggerMode = "hover" | "press";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
/** Inline `--floating-toc-level` for nested entries (level 1 is the CSS default). */
function getLevelStyle(level: number | undefined, style: CSSProperties | undefined) {
  if (level === undefined || level === 1) return style;

  return {"--floating-toc-level": level, ...style} as CSSProperties;
}

function containsNode(container: Element | null | undefined, node: unknown): boolean {
  return !!container && node instanceof Node && container.contains(node);
}

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type FloatingTocContext = {
  slots: ReturnType<typeof floatingTocVariants>;
  placement: FloatingTocPlacement;
  triggerMode: FloatingTocTriggerMode;
  isOpen: boolean;
  triggerRef: RefObject<HTMLSpanElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  /** Set right before the TOC moves focus back to the trigger, so that focus does not re-open it. */
  restoringFocusRef: RefObject<boolean>;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  scheduleOpen: () => void;
  scheduleClose: () => void;
  cancelPending: () => void;
};

const FloatingTocContext = createContext<FloatingTocContext | null>(null);

function useFloatingTocContext(part: string): FloatingTocContext {
  const context = use(FloatingTocContext);

  if (!context) throw new Error(`<FloatingToc.${part}> must be rendered inside <FloatingToc>.`);

  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Root
 * -------------------------------------------------------------------------------------------------
 * Renders no DOM. Owns the open state (controlled or not), the hover-intent timers and the refs the
 * trigger and the content share.
 * -----------------------------------------------------------------------------------------------*/
interface FloatingTocRootProps {
  /** Side of the page the TOC sits on. The panel opens towards the page. @default "right" */
  placement?: FloatingTocPlacement;
  /** How the trigger opens the content. @default "hover" */
  triggerMode?: FloatingTocTriggerMode;
  /** Whether the content is open (controlled). */
  open?: boolean;
  /** Whether the content is initially open (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Milliseconds before the content opens after the pointer enters the trigger. @default 200 */
  openDelay?: number;
  /** Milliseconds before the content closes after the pointer or focus leaves. @default 300 */
  closeDelay?: number;
  /** Trigger and Content elements. */
  children?: ReactNode;
}

const FloatingTocRoot = ({
  children,
  closeDelay = 300,
  defaultOpen = false,
  onOpenChange,
  open,
  openDelay = 200,
  placement = "right",
  triggerMode = "hover",
}: FloatingTocRootProps) => {
  const slots = useMemo(() => floatingTocVariants(), []);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const restoringFocusRef = useRef(false);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const isOpenRef = useRef(isOpen);
  const onOpenChangeRef = useRef(onOpenChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
    onOpenChangeRef.current = onOpenChange;
  });

  const cancelPending = useCallback(() => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const setOpen = useCallback(
    (next: boolean) => {
      cancelPending();
      if (isOpenRef.current === next) return;

      // Closing while focus is inside the panel: hand focus back to the trigger first, so it is not
      // lost to <body> when the panel unmounts.
      if (!next) {
        const trigger = triggerRef.current;
        const activeElement = trigger?.ownerDocument.activeElement;

        if (trigger && containsNode(contentRef.current, activeElement)) {
          restoringFocusRef.current = true;
          trigger.focus({preventScroll: true});
          restoringFocusRef.current = false;
        }
      }

      // Controlled: the ref follows the `open` prop (synced after render), so a parent that ignores
      // the request keeps the TOC in a consistent state.
      if (!isControlled) {
        isOpenRef.current = next;
        setUncontrolledOpen(next);
      }
      onOpenChangeRef.current?.(next);
    },
    [cancelPending, isControlled],
  );

  const toggle = useCallback(() => setOpen(!isOpenRef.current), [setOpen]);

  const scheduleOpen = useCallback(() => {
    cancelPending();
    if (isOpenRef.current) return;
    if (openDelay <= 0) {
      setOpen(true);

      return;
    }
    timerRef.current = setTimeout(() => setOpen(true), openDelay);
  }, [cancelPending, openDelay, setOpen]);

  const scheduleClose = useCallback(() => {
    cancelPending();
    if (!isOpenRef.current) return;
    if (closeDelay <= 0) {
      setOpen(false);

      return;
    }
    timerRef.current = setTimeout(() => setOpen(false), closeDelay);
  }, [cancelPending, closeDelay, setOpen]);

  const contextValue = useMemo<FloatingTocContext>(
    () => ({
      cancelPending,
      contentRef,
      isOpen,
      placement,
      restoringFocusRef,
      scheduleClose,
      scheduleOpen,
      setOpen,
      slots,
      toggle,
      triggerMode,
      triggerRef,
    }),
    [
      cancelPending,
      isOpen,
      placement,
      scheduleClose,
      scheduleOpen,
      setOpen,
      slots,
      toggle,
      triggerMode,
    ],
  );

  return <FloatingTocContext value={contextValue}>{children}</FloatingTocContext>;
};

FloatingTocRoot.displayName = "HeroUI.FloatingToc";

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -------------------------------------------------------------------------------------------------
 * The column of bars. Hover mode: pointer hover opens after `openDelay`, focus opens at once, a
 * mouse click only opens, Enter / Space toggle. Press mode: click, Enter and Space toggle.
 * Escape closes in both modes.
 * -----------------------------------------------------------------------------------------------*/
interface FloatingTocTriggerProps extends ComponentPropsWithRef<"span"> {}

const FloatingTocTrigger = ({children, className, ref, ...rest}: FloatingTocTriggerProps) => {
  const ctx = useFloatingTocContext("Trigger");
  const mergedRef = useMergedRef(ref, ctx.triggerRef);
  const isHoverMode = ctx.triggerMode === "hover";

  const {hoverProps} = useHover({
    isDisabled: !isHoverMode,
    onHoverEnd: ctx.scheduleClose,
    onHoverStart: ctx.scheduleOpen,
  });

  const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget || !isHoverMode) return;
    if (ctx.restoringFocusRef.current) return;

    ctx.setOpen(true);
  };

  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget || !isHoverMode) return;
    if (containsNode(ctx.contentRef.current, event.relatedTarget)) return;

    ctx.scheduleClose();
  };

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    if (event.defaultPrevented) return;
    if (isHoverMode) ctx.setOpen(true);
    else ctx.toggle();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.defaultPrevented || event.target !== event.currentTarget) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        if (!event.repeat) ctx.toggle();
        break;
      case "Escape":
        if (!ctx.isOpen) return;
        event.preventDefault();
        event.stopPropagation();
        ctx.setOpen(false);
        break;
    }
  };

  return (
    <span
      {...mergeProps(
        hoverProps,
        {
          onBlur: handleBlur,
          onClick: handleClick,
          onFocus: handleFocus,
          onKeyDown: handleKeyDown,
        },
        rest,
      )}
      ref={mergedRef}
      aria-expanded={ctx.isOpen}
      className={ctx.slots.trigger({className})}
      data-placement={ctx.placement}
      data-slot="floating-toc-trigger"
      role="button"
      tabIndex={0}
    >
      {children}
    </span>
  );
};

FloatingTocTrigger.displayName = "HeroUI.FloatingToc.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Bar
 * -----------------------------------------------------------------------------------------------*/
interface FloatingTocBarProps extends ComponentPropsWithRef<"span"> {
  /** Marks the current section. */
  active?: boolean;
  /** Nesting depth (1 = top level). Deeper levels draw shorter bars. */
  level?: number;
}

const FloatingTocBar = ({active, className, level, style, ...rest}: FloatingTocBarProps) => {
  const ctx = useFloatingTocContext("Bar");

  return (
    <span
      className={ctx.slots.bar({className})}
      data-active={active ? "true" : undefined}
      data-slot="floating-toc-bar"
      style={getLevelStyle(level, style)}
      {...rest}
    />
  );
};

FloatingTocBar.displayName = "HeroUI.FloatingToc.Bar";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -------------------------------------------------------------------------------------------------
 * A non-modal React Aria Popover anchored to the trigger: the page stays scrollable and usable,
 * Escape closes it, and moving focus out of it (except back to the trigger) closes it.
 * -----------------------------------------------------------------------------------------------*/
interface FloatingTocContentProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "isOpen" | "triggerRef"
> {
  /** Distance from the trigger in px. @default 8 */
  offset?: number;
  /** Overrides the placement derived from the root (`left` for a right TOC and vice versa). */
  placement?: Placement;
}

const FloatingTocContent = ({
  className,
  offset = 8,
  onOpenChange,
  placement,
  ref,
  shouldCloseOnInteractOutside,
  ...rest
}: FloatingTocContentProps) => {
  const ctx = useFloatingTocContext("Content");
  const {direction} = useLocale();
  const mergedRef = useMergedRef(ref, ctx.contentRef);
  const resolvedClassName = useResolvedClassName(className, ctx.slots.content());
  const isHoverMode = ctx.triggerMode === "hover";
  const resolvedPlacement: Placement = placement ?? (ctx.placement === "right" ? "left" : "right");

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (isHoverMode && event.pointerType !== "touch") ctx.cancelPending();
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (isHoverMode && event.pointerType !== "touch") ctx.scheduleClose();
  };

  return (
    <PopoverPrimitive
      dir={direction}
      {...mergeProps(rest, {
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
      })}
      ref={mergedRef}
      isNonModal
      className={resolvedClassName}
      data-slot="floating-toc-content"
      isOpen={ctx.isOpen}
      offset={offset}
      placement={resolvedPlacement}
      triggerRef={ctx.triggerRef}
      shouldCloseOnInteractOutside={(element) =>
        !containsNode(ctx.triggerRef.current, element) &&
        (shouldCloseOnInteractOutside?.(element) ?? true)
      }
      onOpenChange={(next) => {
        onOpenChange?.(next);
        if (!next) ctx.setOpen(false);
      }}
    />
  );
};

FloatingTocContent.displayName = "HeroUI.FloatingToc.Content";

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/
interface FloatingTocItemProps extends ComponentPropsWithRef<"button"> {
  /** Marks the current section. */
  active?: boolean;
  /** Nesting depth (1 = top level). Deeper levels are indented. */
  level?: number;
}

const FloatingTocItem = ({
  active,
  className,
  level,
  style,
  type = "button",
  ...rest
}: FloatingTocItemProps) => {
  const ctx = useFloatingTocContext("Item");

  return (
    <button
      className={ctx.slots.item({className})}
      data-active={active ? "true" : undefined}
      data-slot="floating-toc-item"
      style={getLevelStyle(level, style)}
      type={type}
      {...rest}
    />
  );
};

FloatingTocItem.displayName = "HeroUI.FloatingToc.Item";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  FloatingTocRoot,
  FloatingTocTrigger,
  FloatingTocBar,
  FloatingTocContent,
  FloatingTocItem,
  FloatingTocContext,
};

export type {
  FloatingTocPlacement,
  FloatingTocTriggerMode,
  FloatingTocRootProps,
  FloatingTocTriggerProps,
  FloatingTocBarProps,
  FloatingTocContentProps,
  FloatingTocItemProps,
};
