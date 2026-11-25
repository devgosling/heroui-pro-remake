"use client";

import type {ComponentPropsWithRef, ReactNode} from "react";

import {createContext, use, useMemo, useRef} from "react";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusable} from "react-aria/useFocusable";
import {
  OverlayArrow as OverlayArrowPrimitive,
  Popover as PopoverPrimitive,
} from "react-aria-components/Popover";
import {PreviewTrigger as PreviewTriggerPrimitive} from "react-aria-components/PreviewTrigger";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {hoverCardVariants} from "./hover-card.styles";

/* -------------------------------------------------------------------------------------------------
 * Hover Card Context
 * -----------------------------------------------------------------------------------------------*/
type HoverCardContext = {
  slots: ReturnType<typeof hoverCardVariants>;
};

const HoverCardContext = createContext<HoverCardContext | null>(null);

const defaultSlots = hoverCardVariants();

const useHoverCardSlots = () => use(HoverCardContext)?.slots ?? defaultSlots;

/* -------------------------------------------------------------------------------------------------
 * Hover Card Root
 * -------------------------------------------------------------------------------------------------
 * React Aria's `PreviewTrigger` owns the open state and the timing: the open delay, the close delay,
 * the safe area between the trigger and the card, and the warm-up window it shares with tooltips
 * (once one preview or tooltip has opened, the next opens immediately and skips its animation).
 * It renders no DOM of its own.
 * -----------------------------------------------------------------------------------------------*/
interface HoverCardRootProps {
  /** The `HoverCard.Trigger` and `HoverCard.Content` elements. */
  children?: ReactNode;
  /** Whether the card is open (controlled). */
  open?: boolean;
  /** Whether the card is open by default (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Time in ms before the card opens once the trigger is hovered or focused. @default 700 */
  openDelay?: number;
  /** Time in ms before the card closes once the pointer or focus leaves. @default 300 */
  closeDelay?: number;
  /** Whether the card is prevented from opening. @default false */
  isDisabled?: boolean;
}

const HoverCardRoot = ({
  children,
  closeDelay = 300,
  defaultOpen,
  isDisabled = false,
  onOpenChange,
  open,
  openDelay = 700,
}: HoverCardRootProps) => {
  const slots = useMemo(() => hoverCardVariants(), []);
  const contextValue = useMemo<HoverCardContext>(() => ({slots}), [slots]);

  return (
    <HoverCardContext value={contextValue}>
      <PreviewTriggerPrimitive
        closeDelay={closeDelay}
        defaultOpen={defaultOpen}
        delay={openDelay}
        isDisabled={isDisabled}
        isOpen={open}
        onOpenChange={onOpenChange}
      >
        {children}
      </PreviewTriggerPrimitive>
    </HoverCardContext>
  );
};

HoverCardRoot.displayName = "HeroUI.HoverCard";

/* -------------------------------------------------------------------------------------------------
 * Hover Card Trigger
 * -------------------------------------------------------------------------------------------------
 * An inline `<span>` that consumes the trigger props `PreviewTrigger` provides (hover, focus, long
 * press, Escape / Tab handling and the `aria-*` wiring). It stays out of the tab order; a focusable
 * child such as a Link or a Button receives the same props through React Aria's focusable context,
 * so keyboard focus on the child opens the card.
 * -----------------------------------------------------------------------------------------------*/
interface HoverCardTriggerProps extends ComponentPropsWithRef<"span"> {
  /** The element that previews the card, usually a Link or a Button. */
  children?: ReactNode;
}

const HoverCardTrigger = ({children, className, ref, style, ...props}: HoverCardTriggerProps) => {
  const slots = useHoverCardSlots();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRef(ref, triggerRef);
  const {focusableProps} = useFocusable({excludeFromTabOrder: true}, triggerRef);
  const {style: triggerStyle, ...triggerProps} = focusableProps;

  return (
    <span
      {...mergeProps(triggerProps, props)}
      ref={mergedRef}
      className={slots.trigger({className})}
      data-slot="hover-card-trigger"
      style={style ? {...triggerStyle, ...style} : triggerStyle}
    >
      {children}
    </span>
  );
};

HoverCardTrigger.displayName = "HeroUI.HoverCard.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Hover Card Content
 * -----------------------------------------------------------------------------------------------*/
interface HoverCardContentProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "isOpen" | "defaultOpen" | "onOpenChange" | "triggerRef"
> {
  /** The placement of the card relative to the trigger. @default "top" */
  placement?: ComponentPropsWithRef<typeof PopoverPrimitive>["placement"];
  /** The distance between the card and the trigger, in px. @default 8 */
  offset?: number;
}

const HoverCardContent = ({
  children,
  className,
  offset = 8,
  placement = "top",
  ...props
}: HoverCardContentProps) => {
  const slots = useHoverCardSlots();
  const resolvedClassName = useResolvedClassName(className, slots.content());

  return (
    <PopoverPrimitive
      data-slot="hover-card-content"
      {...props}
      className={resolvedClassName}
      offset={offset}
      placement={placement}
    >
      {children}
    </PopoverPrimitive>
  );
};

HoverCardContent.displayName = "HeroUI.HoverCard.Content";

/* -------------------------------------------------------------------------------------------------
 * Hover Card Arrow
 * -----------------------------------------------------------------------------------------------*/
type HoverCardArrowProps = ComponentPropsWithRef<typeof OverlayArrowPrimitive>;

const HoverCardArrow = ({children, className, ...props}: HoverCardArrowProps) => {
  const slots = useHoverCardSlots();
  const resolvedClassName = useResolvedClassName(className, slots.arrow());

  return (
    <OverlayArrowPrimitive data-slot="hover-card-arrow" {...props} className={resolvedClassName}>
      {children ?? (
        <svg
          fill="none"
          height="12"
          viewBox="0 0 12 12"
          width="12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 0C5.48483 8 6.5 8 12 0Z" />
        </svg>
      )}
    </OverlayArrowPrimitive>
  );
};

HoverCardArrow.displayName = "HeroUI.HoverCard.Arrow";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {HoverCardRoot, HoverCardTrigger, HoverCardContent, HoverCardArrow, HoverCardContext};

export type {HoverCardRootProps, HoverCardTriggerProps, HoverCardContentProps, HoverCardArrowProps};
