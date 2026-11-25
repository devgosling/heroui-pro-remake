"use client";

import type {ContextType, ReactNode, RefObject} from "react";

import {Tooltip} from "@heroui/react";
import {use, useEffect, useLayoutEffect, useRef, useState} from "react";
import {TooltipContext, TooltipTriggerStateContext} from "react-aria-components/Tooltip";

import {SidebarMobileContext, useSidebarContext} from "./sidebar-context";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type TooltipPlacement = "top" | "bottom" | "left" | "right" | "start" | "end";

/** Props for the tooltip of a `Sidebar.MenuItem` (`tooltipProps`). */
export interface SidebarMenuItemTooltipProps {
  /** Tooltip content. Defaults to the item's `tooltip` prop, then its label text. */
  content?: ReactNode;
  /** Tooltip placement. Defaults to the side facing the main content. */
  placement?: TooltipPlacement;
  /** Delay in ms before showing the tooltip. Defaults to `--tooltip-delay`. */
  delay?: number;
  /** Delay in ms before hiding the tooltip. Defaults to `--tooltip-close-delay`. */
  closeDelay?: number;
  /** Distance between the row and the tooltip. */
  offset?: number;
  /** Whether to render an arrow. */
  showArrow?: boolean;
  /** Whether the tooltip is disabled. */
  isDisabled?: boolean;
  /** Extra classes for the tooltip element. */
  className?: string;
}

/* -------------------------------------------------------------------------------------------------
 * Row tooltip driver
 * React Aria's TreeItem cannot consume TooltipTrigger props, so the row drives the shared tooltip
 * state itself. Using React Aria's own trigger state keeps the global warm-up, cooldown and "one
 * tooltip at a time" behaviour of every other HeroUI tooltip (moving between rows swaps the tooltip
 * immediately; leaving the menu waits for the close delay). Pointer hover and press are read from
 * the row element because React Aria does not report hover for rows without an action.
 * -----------------------------------------------------------------------------------------------*/
interface SidebarRowTooltipDriverProps {
  isDisabled?: boolean;
  isFocusVisible: boolean;
  triggerRef: RefObject<HTMLElement | null>;
}

type TriggerState = NonNullable<ContextType<typeof TooltipTriggerStateContext>>;

const SidebarRowTooltipDriver = ({
  isDisabled,
  isFocusVisible,
  triggerRef,
}: SidebarRowTooltipDriverProps) => {
  const state = use(TooltipTriggerStateContext);
  // The trigger publishes the tooltip id (`useTooltipTrigger`'s tooltipProps) through this context.
  const tooltipId = (use(TooltipContext) as {id?: string} | null)?.id;
  const isOpen = !!state?.isOpen;
  const latest = useRef<{isDisabled?: boolean; state: TriggerState | null}>({isDisabled, state});
  const flags = useRef({focused: false, hovered: false});
  const wasFocusVisible = useRef(false);

  useLayoutEffect(() => {
    latest.current = {isDisabled, state};
  });

  // Same rules as React Aria's `useTooltipTrigger`.
  const [controller] = useState(() => ({
    hide(immediate?: boolean) {
      const {focused, hovered} = flags.current;

      if (!hovered && !focused) latest.current.state?.close(immediate);
    },
    show() {
      const {focused, hovered} = flags.current;

      if (!latest.current.isDisabled && (hovered || focused)) latest.current.state?.open(focused);
    },
  }));

  // Pointer hover and press on the row.
  useEffect(() => {
    const row = triggerRef.current;

    if (!row) return;

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      flags.current.hovered = true;
      controller.show();
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      flags.current = {focused: false, hovered: false};
      controller.hide();
    };
    const onPressStart = () => {
      flags.current = {focused: false, hovered: false};
      controller.hide(true);
    };

    row.addEventListener("pointerenter", onPointerEnter);
    row.addEventListener("pointerleave", onPointerLeave);
    row.addEventListener("pointerdown", onPressStart);
    row.addEventListener("keydown", onPressStart);

    return () => {
      row.removeEventListener("pointerenter", onPointerEnter);
      row.removeEventListener("pointerleave", onPointerLeave);
      row.removeEventListener("pointerdown", onPressStart);
      row.removeEventListener("keydown", onPressStart);
    };
  }, [controller, triggerRef]);

  // Keyboard focus on the row opens the tooltip immediately.
  useEffect(() => {
    if (isFocusVisible === wasFocusVisible.current) return;
    wasFocusVisible.current = isFocusVisible;

    if (isFocusVisible) {
      flags.current.focused = true;
      controller.show();
    } else {
      flags.current = {focused: false, hovered: false};
      controller.hide(true);
    }
  }, [controller, isFocusVisible]);

  useEffect(() => {
    if (!isDisabled) return;
    flags.current = {focused: false, hovered: false};
    latest.current.state?.close(true);
  }, [isDisabled]);

  // Escape dismisses the open tooltip.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      latest.current.state?.close(true);
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen]);

  // The row describes itself with the tooltip while it is open (React Aria trigger behaviour).
  useLayoutEffect(() => {
    const row = triggerRef.current;

    if (!row || !isOpen || !tooltipId) return;

    const previous = row.getAttribute("aria-describedby");

    row.setAttribute("aria-describedby", previous ? `${previous} ${tooltipId}` : tooltipId);

    return () => {
      if (previous) row.setAttribute("aria-describedby", previous);
      else row.removeAttribute("aria-describedby");
    };
  }, [isOpen, tooltipId, triggerRef]);

  return null;
};

/* -------------------------------------------------------------------------------------------------
 * Row tooltip (the tree row is the trigger)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarRowTooltipProps extends SidebarMenuItemTooltipProps {
  triggerRef: RefObject<HTMLElement | null>;
  isFocusVisible: boolean;
}

export const SidebarRowTooltip = ({
  className,
  closeDelay,
  content,
  delay,
  isDisabled,
  isFocusVisible,
  offset,
  placement,
  showArrow,
  triggerRef,
}: SidebarRowTooltipProps) => {
  if (content == null || content === "") return null;

  return (
    <Tooltip closeDelay={closeDelay} delay={delay} isDisabled={isDisabled}>
      <SidebarRowTooltipDriver
        isDisabled={isDisabled}
        isFocusVisible={isFocusVisible}
        triggerRef={triggerRef}
      />
      <Tooltip.Content
        className={className}
        offset={offset}
        placement={placement}
        showArrow={showArrow}
        triggerRef={triggerRef}
      >
        {showArrow ? <Tooltip.Arrow /> : null}
        {content}
      </Tooltip.Content>
    </Tooltip>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Tooltip - only active while the sidebar is collapsed to its icon rail
 * -----------------------------------------------------------------------------------------------*/
interface SidebarTooltipProps {
  /** The trigger. Must be a focusable HeroUI / React Aria element (e.g. a `Button`). */
  children: ReactNode;
  /** Tooltip content shown when the sidebar is collapsed. */
  content?: ReactNode;
  /** Tooltip placement. @default "right" */
  placement?: "top" | "bottom" | "left" | "right";
  /** Delay in ms before showing the tooltip. */
  delay?: number;
  /** Delay in ms before hiding the tooltip. */
  closeDelay?: number;
}

const SidebarTooltip = ({
  children,
  closeDelay,
  content,
  delay,
  placement = "right",
}: SidebarTooltipProps) => {
  const {collapsible, state} = useSidebarContext();
  const {isInMobile} = use(SidebarMobileContext);
  const isActive = collapsible === "icon" && state === "collapsed" && !isInMobile;

  if (!isActive || content == null) return children;

  return (
    <Tooltip closeDelay={closeDelay} delay={delay}>
      {children}
      <Tooltip.Content placement={placement}>{content}</Tooltip.Content>
    </Tooltip>
  );
};

SidebarTooltip.displayName = "HeroUI.Sidebar.Tooltip";

export {SidebarTooltip};

export type {SidebarTooltipProps};
