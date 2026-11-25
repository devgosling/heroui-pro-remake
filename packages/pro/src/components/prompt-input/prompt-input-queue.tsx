"use client";

import type {QueueSlots} from "./prompt-input-queue-context";
import type {ButtonProps, ScrollShadowProps} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode, PointerEvent as ReactPointerEvent} from "react";

import {Button, ScrollShadow} from "@heroui/react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useLocale} from "react-aria/I18nProvider";

import {mergeRefs, useResolvedClassName} from "../../utils";

import {
  PromptInputEllipsisIcon,
  PromptInputFileTextIcon,
  PromptInputGripIcon,
  PromptInputTrashIcon,
} from "./prompt-input-icons";
import {PromptInputQueueContext} from "./prompt-input-queue-context";
import {promptInputQueueVariants} from "./prompt-input.styles";

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
type QueueListContextValue = {
  axis: "x" | "y";
  isReorderEnabled: boolean;
  /** Registers a row element for `value` (drag measurements and FLIP animations). */
  registerItem: (value: unknown, element: HTMLLIElement | null) => void;
  /** Moves the row holding `value` by `offset` positions (keyboard reordering). */
  moveBy: (value: unknown, offset: number) => void;
  /** Starts a pointer drag from a row's handle. */
  startDrag: (value: unknown, event: ReactPointerEvent<HTMLElement>) => void;
  draggingValue: unknown;
};

const PromptInputQueueListContext = createContext<QueueListContextValue | null>(null);

type QueueItemContextValue = {
  value: unknown;
  hasValue: boolean;
};

const PromptInputQueueItemContext = createContext<QueueItemContextValue>({
  hasValue: false,
  value: undefined,
});

const FALLBACK_SLOTS = promptInputQueueVariants();

function useQueueSlots(): QueueSlots {
  return use(PromptInputQueueContext)?.slots ?? FALLBACK_SLOTS;
}

/* -------------------------------------------------------------------------------------------------
 * Queue (card of queued follow-up prompts above the shell)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputQueueProps extends ComponentPropsWithRef<"div"> {
  /** When queue row actions are visible. @default "hover" */
  actionsVisibility?: "always" | "hover";
}

const PromptInputQueueRoot = ({
  actionsVisibility = "hover",
  className,
  ...rest
}: PromptInputQueueProps) => {
  const slots = useMemo(() => promptInputQueueVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <PromptInputQueueContext value={contextValue}>
      <div
        className={slots.base({className})}
        data-actions-visibility={actionsVisibility}
        data-slot="prompt-input-queue"
        {...rest}
      />
    </PromptInputQueueContext>
  );
};

PromptInputQueueRoot.displayName = "HeroUI.PromptInput.Queue";

/* -------------------------------------------------------------------------------------------------
 * Queue List (scroll area + reordering)
 * -----------------------------------------------------------------------------------------------*/
/**
 * Rows that change slot glide into place on a slightly underdamped spring (stiffness 675,
 * damping 45, mass 1: about 0.7% overshoot, settled after ~300ms), sampled per 60fps frame and
 * played as a linear Web Animation.
 */
const REORDER_FRAME_MS = 1000 / 60;
const REORDER_ANIMATION_ID = "prompt-input-queue-reorder";
const REORDER_SPRING: readonly number[] = (() => {
  const stiffness = 675;
  const damping = 45;
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const frames: number[] = [];

  for (let frame = 0; frame < 120; frame++) {
    const time = (frame * REORDER_FRAME_MS) / 1000;
    const envelope = Math.exp(-zeta * omega * time);

    frames.push(
      envelope * (Math.cos(omegaD * time) + ((zeta * omega) / omegaD) * Math.sin(omegaD * time)),
    );
    if (envelope < 0.001) break;
  }
  frames.push(0);

  return frames;
})();
const REORDER_DURATION = (REORDER_SPRING.length - 1) * REORDER_FRAME_MS;

/** Cancels a running reorder animation on a row. */
function cancelReorderAnimation(element: HTMLElement) {
  element.getAnimations?.().forEach((animation) => {
    if (animation.id === REORDER_ANIMATION_ID) animation.cancel();
  });
}

/** The translation currently drawn on a row (inline drag offset or a running animation). */
function readTranslation(element: HTMLElement, axis: "x" | "y"): number {
  const transform = getComputedStyle(element).transform;

  if (!transform || transform === "none" || typeof DOMMatrixReadOnly === "undefined") return 0;

  const matrix = new DOMMatrixReadOnly(transform);

  return axis === "x" ? matrix.m41 : matrix.m42;
}

/**
 * While a row is dragged within 50px of the list's start or end edge, the list scrolls every
 * frame by up to 25px, ramping quadratically towards the edge.
 */
const AUTO_SCROLL_EDGE = 50;
const AUTO_SCROLL_MAX_SPEED = 25;
/** Pointer travel before the drag counts as moving (and may start auto-scrolling). */
const DRAG_MOVE_THRESHOLD = 3;

type DragState = {
  value: unknown;
  pointerId: number;
  startPointer: number;
  /** Last pointer position, used for the drag direction. */
  lastPointer: number;
  startOffset: number;
  /** Scroll position of the list when the drag started. */
  startScroll: number;
  /** Desired layout offset of the dragged row (start offset + pointer and scroll deltas). */
  desiredOffset: number;
  /** Pending auto-scroll frame. */
  frame: number | null;
  /** Removes the drag listeners and stops auto-scrolling. */
  detach: () => void;
};

interface PromptInputQueueListProps<T = unknown> extends Omit<ScrollShadowProps, "children"> {
  /** Controlled queue values. Pass with `onReorder` to enable reordering. */
  values?: T[];
  /** Called when rows are reordered by dragging or with the handle's arrow keys. */
  onReorder?: (values: T[]) => void;
  /** Reorder axis. @default "y" */
  axis?: "x" | "y";
  children?: ReactNode;
}

const PromptInputQueueList = <T,>({
  axis = "y",
  children,
  className,
  onReorder,
  ref,
  size = 40,
  values,
  ...rest
}: PromptInputQueueListProps<T>) => {
  const slots = useQueueSlots();
  const isReorderEnabled = Array.isArray(values) && typeof onReorder === "function";
  const itemsRef = useRef(new Map<unknown, HTMLLIElement>());
  const offsetsRef = useRef(new Map<unknown, number>());
  const dragRef = useRef<DragState | null>(null);
  const focusAfterMoveRef = useRef<unknown>(undefined);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const itemsListRef = useRef<HTMLUListElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, scrollRef), [ref]);
  const [draggingValue, setDraggingValue] = useState<unknown>(undefined);

  const latest = useRef({axis, onReorder, values});

  // Refreshed before the FLIP layout effect below; the callbacks otherwise only run from pointer,
  // keyboard and animation-frame events, after the commit.
  useLayoutEffect(() => {
    latest.current = {axis, onReorder, values};
  });

  const offsetOf = useCallback(
    (element: HTMLElement) =>
      latest.current.axis === "x" ? element.offsetLeft : element.offsetTop,
    [],
  );
  const scrollOffset = useCallback(() => {
    const scroller = scrollRef.current;

    if (!scroller) return 0;

    return latest.current.axis === "x" ? scroller.scrollLeft : scroller.scrollTop;
  }, []);
  const sizeOf = useCallback(
    (element: HTMLElement) =>
      latest.current.axis === "x" ? element.offsetWidth : element.offsetHeight,
    [],
  );
  const translate = useCallback(
    (amount: number) =>
      latest.current.axis === "x" ? `translateX(${amount}px)` : `translateY(${amount}px)`,
    [],
  );

  const registerItem = useCallback((value: unknown, element: HTMLLIElement | null) => {
    if (element) itemsRef.current.set(value, element);
    else itemsRef.current.delete(value);
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    const {onReorder: handler, values: current} = latest.current;

    if (!current || !handler || from === to || to < 0 || to >= current.length) return false;

    const next = current.slice();
    const [moved] = next.splice(from, 1);

    next.splice(to, 0, moved as T);
    handler(next);

    return true;
  }, []);

  const moveBy = useCallback(
    (value: unknown, offset: number) => {
      const current = latest.current.values;

      if (!current) return;

      const from = current.indexOf(value as T);

      if (from < 0) return;
      focusAfterMoveRef.current = value;
      reorder(from, from + offset);
    },
    [reorder],
  );

  /**
   * Swaps the dragged row with the neighbour it is moving towards once its leading edge passes
   * that neighbour's centre.
   */
  const updateDragOrder = useCallback(
    (direction: number) => {
      const drag = dragRef.current;
      const current = latest.current.values;

      if (!drag || !current || direction === 0) return;

      const element = itemsRef.current.get(drag.value);

      if (!element) return;

      const index = current.indexOf(drag.value as T);

      if (index < 0) return;

      if (direction > 0) {
        const next = index + 1 < current.length ? itemsRef.current.get(current[index + 1]) : null;
        const leadingEdge = drag.desiredOffset + sizeOf(element);

        if (next && leadingEdge > offsetOf(next) + sizeOf(next) / 2) reorder(index, index + 1);
      } else {
        const previous = index > 0 ? itemsRef.current.get(current[index - 1]) : null;

        if (previous && drag.desiredOffset < offsetOf(previous) + sizeOf(previous) / 2) {
          reorder(index, index - 1);
        }
      }
    },
    [offsetOf, reorder, sizeOf],
  );

  const applyDragTransform = useCallback(() => {
    const drag = dragRef.current;
    const element = drag ? itemsRef.current.get(drag.value) : undefined;

    if (!drag || !element) return;
    element.style.transform = translate(drag.desiredOffset - offsetOf(element));
  }, [offsetOf, translate]);

  /** Places the dragged row under the pointer, accounting for the list's scroll since the start. */
  const syncDragOffset = useCallback(
    (drag: DragState) => {
      drag.desiredOffset =
        drag.startOffset +
        (drag.lastPointer - drag.startPointer) +
        (scrollOffset() - drag.startScroll);
      applyDragTransform();
    },
    [applyDragTransform, scrollOffset],
  );

  /** Scrolls the list while the pointer is held near one of its edges (runs every frame). */
  const autoScroll = useCallback(
    function autoScrollFrame() {
      const drag = dragRef.current;
      const scroller = scrollRef.current;

      if (!drag) return;

      if (scroller) {
        const isX = latest.current.axis === "x";
        const rect = scroller.getBoundingClientRect();
        const fromStart = drag.lastPointer - (isX ? rect.left : rect.top);
        const fromEnd = (isX ? rect.right : rect.bottom) - drag.lastPointer;
        const ramp = (distance: number) =>
          AUTO_SCROLL_MAX_SPEED * (1 - Math.max(distance, 0) / AUTO_SCROLL_EDGE) ** 2;
        const amount =
          fromStart < AUTO_SCROLL_EDGE
            ? -ramp(fromStart)
            : fromEnd < AUTO_SCROLL_EDGE
              ? ramp(fromEnd)
              : 0;

        const items = itemsListRef.current;

        if (amount !== 0 && items) {
          const before = scrollOffset();
          // Scroll within the rows themselves: the dragged row's offset must not extend the range.
          const contentEnd = isX
            ? items.offsetLeft + items.offsetWidth
            : items.offsetTop + items.offsetHeight;
          const maxScroll = Math.max(
            0,
            contentEnd - (isX ? scroller.clientWidth : scroller.clientHeight),
          );
          const target = Math.min(Math.max(before + amount, 0), Math.max(maxScroll, before));

          if (isX) scroller.scrollLeft = target;
          else scroller.scrollTop = target;

          const after = scrollOffset();

          if (after !== before) {
            syncDragOffset(drag);
            updateDragOrder(Math.sign(after - before));
          }
        }
      }

      // The named function expression schedules itself (the same function `autoScroll` holds).
      drag.frame = requestAnimationFrame(autoScrollFrame);
    },
    [scrollOffset, syncDragOffset, updateDragOrder],
  );

  const startDrag = useCallback(
    (value: unknown, event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !latest.current.values) return;

      const element = itemsRef.current.get(value);

      if (!element) return;

      const handle = event.currentTarget;
      const pointer = latest.current.axis === "x" ? event.clientX : event.clientY;
      const startOffset = offsetOf(element);

      // The row follows the pointer from where it is drawn, even mid-animation.
      const drawnOffset = startOffset + readTranslation(element, latest.current.axis);

      dragRef.current?.detach();
      cancelReorderAnimation(element);
      dragRef.current = {
        desiredOffset: drawnOffset,
        detach: () => {},
        frame: null,
        lastPointer: pointer,
        pointerId: event.pointerId,
        startOffset: drawnOffset,
        startPointer: pointer,
        startScroll: scrollOffset(),
        value,
      };
      handle.setPointerCapture?.(event.pointerId);
      applyDragTransform();
      setDraggingValue(value);

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;

        if (!drag || moveEvent.pointerId !== drag.pointerId) return;

        const position = latest.current.axis === "x" ? moveEvent.clientX : moveEvent.clientY;
        const direction = Math.sign(position - drag.lastPointer);

        drag.lastPointer = position;
        syncDragOffset(drag);
        updateDragOrder(direction);

        if (drag.frame === null && Math.abs(position - drag.startPointer) >= DRAG_MOVE_THRESHOLD) {
          drag.frame = requestAnimationFrame(autoScroll);
        }
      };

      const onEnd = (endEvent: PointerEvent) => {
        const drag = dragRef.current;

        if (!drag || endEvent.pointerId !== drag.pointerId) return;

        const row = itemsRef.current.get(drag.value);

        drag.detach();
        dragRef.current = null;
        if (handle.hasPointerCapture?.(endEvent.pointerId)) {
          handle.releasePointerCapture(endEvent.pointerId);
        }
        setDraggingValue(undefined);

        // The released row snaps straight into its slot.
        if (row) row.style.transform = "";
      };

      // Listen on the window: moving the dragged row in the DOM drops the handle's pointer capture.
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
      dragRef.current.detach = () => {
        const drag = dragRef.current;

        if (drag?.frame !== null && drag?.frame !== undefined) cancelAnimationFrame(drag.frame);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
      };
    },
    [applyDragTransform, autoScroll, offsetOf, scrollOffset, syncDragOffset, updateDragOrder],
  );

  // Drop the drag listeners and auto-scroll if the list unmounts mid-drag.
  useEffect(
    () => () => {
      dragRef.current?.detach();
      dragRef.current = null;
    },
    [],
  );

  // FLIP: animate rows that changed position; keep the dragged row under the pointer.
  useLayoutEffect(() => {
    const previousOffsets = offsetsRef.current;
    const nextOffsets = new Map<unknown, number>();
    const draggedValue = dragRef.current?.value;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    itemsRef.current.forEach((element, value) => {
      const offset = offsetOf(element);

      nextOffsets.set(value, offset);
      if (dragRef.current && value === draggedValue) return;

      const previous = previousOffsets.get(value);

      if (previous === undefined || previous === offset) return;

      // Start from where the row is drawn now: its old slot plus any running animation.
      const from = previous + readTranslation(element, latest.current.axis) - offset;

      cancelReorderAnimation(element);
      if (reduceMotion || from === 0 || typeof element.animate !== "function") return;

      element.animate(
        REORDER_SPRING.map((progress) => ({transform: translate(from * progress)})),
        {duration: REORDER_DURATION, easing: "linear", id: REORDER_ANIMATION_ID},
      );
    });

    offsetsRef.current = nextOffsets;
    applyDragTransform();

    // Keyboard reordering: keep focus on the moved row's handle.
    if (focusAfterMoveRef.current !== undefined) {
      const element = itemsRef.current.get(focusAfterMoveRef.current);
      const handle = element?.querySelector<HTMLElement>(
        '[data-slot="prompt-input-queue-item-handle"]',
      );

      focusAfterMoveRef.current = undefined;
      if (handle && handle !== document.activeElement) handle.focus();
    }
  });

  const contextValue = useMemo<QueueListContextValue>(
    () => ({axis, draggingValue, isReorderEnabled, moveBy, registerItem, startDrag}),
    [axis, draggingValue, isReorderEnabled, moveBy, registerItem, startDrag],
  );

  return (
    <PromptInputQueueListContext value={contextValue}>
      <ScrollShadow
        ref={mergedRef}
        className={slots.list({className})}
        data-slot="prompt-input-queue-list"
        size={size}
        {...rest}
      >
        <ul ref={itemsListRef} className={slots.listItems()} style={{overflowAnchor: "none"}}>
          {children}
        </ul>
      </ScrollShadow>
    </PromptInputQueueListContext>
  );
};

PromptInputQueueList.displayName = "HeroUI.PromptInput.Queue.List";

/* -------------------------------------------------------------------------------------------------
 * Queue Item (row)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputQueueItemProps<T = unknown> extends Omit<
  ComponentPropsWithRef<"li">,
  "value"
> {
  /** Item value from `values`. Required when reordering is enabled. */
  value?: T;
}

const PromptInputQueueItem = <T,>({
  className,
  ref,
  style,
  value,
  ...rest
}: PromptInputQueueItemProps<T>) => {
  const slots = useQueueSlots();
  const list = use(PromptInputQueueListContext);
  const hasValue = value !== undefined;
  const isDragging = Boolean(list?.isReorderEnabled && hasValue && list.draggingValue === value);
  const registerItem = list?.registerItem;

  const registerRef = useCallback(
    (element: HTMLLIElement | null) => {
      if (!registerItem || !hasValue) return;
      registerItem(value, element);

      return () => registerItem(value, null);
    },
    [hasValue, registerItem, value],
  );
  const mergedRef = useMemo(() => mergeRefs(ref, registerRef), [ref, registerRef]);
  const itemContext = useMemo(() => ({hasValue, value}), [hasValue, value]);

  return (
    <PromptInputQueueItemContext value={itemContext}>
      <li
        ref={mergedRef}
        className={slots.item({className})}
        data-dragging={isDragging ? "true" : undefined}
        data-slot="prompt-input-queue-item"
        style={isDragging ? {position: "relative", zIndex: 1, ...style} : style}
        {...rest}
      />
    </PromptInputQueueItemContext>
  );
};

PromptInputQueueItem.displayName = "HeroUI.PromptInput.Queue.Item";

/* -------------------------------------------------------------------------------------------------
 * Queue Item Handle (drag or arrow keys)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputQueueItemHandleProps extends ButtonProps {}

const PromptInputQueueItemHandle = ({
  "aria-label": ariaLabel = "Reorder queued prompt",
  children,
  className,
  onKeyDown,
  onPointerDown,
  size = "sm",
  style,
  variant = "ghost",
  ...rest
}: PromptInputQueueItemHandleProps) => {
  const slots = useQueueSlots();
  const list = use(PromptInputQueueListContext);
  const {hasValue, value} = use(PromptInputQueueItemContext);
  const {direction} = useLocale();
  const resolvedClassName = useResolvedClassName(className, slots.itemHandle());
  const isReorderEnabled = Boolean(list?.isReorderEnabled && hasValue);

  const handleKeyDown = useCallback(
    (event: Parameters<NonNullable<ButtonProps["onKeyDown"]>>[0]) => {
      onKeyDown?.(event);
      if (!isReorderEnabled || !list) return;

      let offset = 0;

      if (list.axis === "y") {
        if (event.key === "ArrowUp") offset = -1;
        else if (event.key === "ArrowDown") offset = 1;
      } else {
        const flip = direction === "rtl" ? -1 : 1;

        if (event.key === "ArrowLeft") offset = -flip;
        else if (event.key === "ArrowRight") offset = flip;
      }

      if (offset === 0) return;
      event.preventDefault();
      list.moveBy(value, offset);
    },
    [direction, isReorderEnabled, list, onKeyDown, value],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (!isReorderEnabled || !list || event.defaultPrevented) return;
      list.startDrag(value, event);
    },
    [isReorderEnabled, list, onPointerDown, value],
  );

  return (
    <Button
      aria-label={ariaLabel}
      className={resolvedClassName}
      data-reorder-enabled={isReorderEnabled ? "true" : undefined}
      data-slot="prompt-input-queue-item-handle"
      size={size}
      style={isReorderEnabled ? {touchAction: "none", ...(style as object)} : style}
      variant={variant}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      {...rest}
    >
      {children ?? <PromptInputGripIcon aria-hidden="true" className={slots.icon()} />}
    </Button>
  );
};

PromptInputQueueItemHandle.displayName = "HeroUI.PromptInput.Queue.Item.Handle";

/* -------------------------------------------------------------------------------------------------
 * Presentational slots
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputQueueItemBodyProps extends ComponentPropsWithRef<"div"> {}

const PromptInputQueueItemBody = ({className, ...rest}: PromptInputQueueItemBodyProps) => {
  const slots = useQueueSlots();

  return (
    <div
      className={slots.itemBody({className})}
      data-slot="prompt-input-queue-item-body"
      {...rest}
    />
  );
};

PromptInputQueueItemBody.displayName = "HeroUI.PromptInput.Queue.Item.Body";

interface PromptInputQueueItemIconProps extends ComponentPropsWithRef<"span"> {}

const PromptInputQueueItemIcon = ({
  children,
  className,
  ...rest
}: PromptInputQueueItemIconProps) => {
  const slots = useQueueSlots();

  return (
    <span
      className={slots.itemIcon({className})}
      data-slot="prompt-input-queue-item-icon"
      {...rest}
    >
      {children ?? <PromptInputFileTextIcon aria-hidden="true" className={slots.icon()} />}
    </span>
  );
};

PromptInputQueueItemIcon.displayName = "HeroUI.PromptInput.Queue.Item.Icon";

interface PromptInputQueueItemContentProps extends ComponentPropsWithRef<"p"> {}

const PromptInputQueueItemContent = ({className, ...rest}: PromptInputQueueItemContentProps) => {
  const slots = useQueueSlots();

  return (
    <p
      className={slots.itemContent({className})}
      data-slot="prompt-input-queue-item-content"
      {...rest}
    />
  );
};

PromptInputQueueItemContent.displayName = "HeroUI.PromptInput.Queue.Item.Content";

interface PromptInputQueueItemDescriptionProps extends ComponentPropsWithRef<"p"> {}

const PromptInputQueueItemDescription = ({
  className,
  ...rest
}: PromptInputQueueItemDescriptionProps) => {
  const slots = useQueueSlots();

  return (
    <p
      className={slots.itemDescription({className})}
      data-slot="prompt-input-queue-item-description"
      {...rest}
    />
  );
};

PromptInputQueueItemDescription.displayName = "HeroUI.PromptInput.Queue.Item.Description";

interface PromptInputQueueItemAttachmentsProps extends ComponentPropsWithRef<"div"> {}

const PromptInputQueueItemAttachments = ({
  className,
  ...rest
}: PromptInputQueueItemAttachmentsProps) => {
  const slots = useQueueSlots();

  return (
    <div
      className={slots.attachments({className})}
      data-slot="prompt-input-queue-item-attachments"
      {...rest}
    />
  );
};

PromptInputQueueItemAttachments.displayName = "HeroUI.PromptInput.Queue.Item.Attachments";

interface PromptInputQueueItemAttachmentsOverflowProps extends ComponentPropsWithRef<"span"> {
  /** Number of attachments hidden beyond the visible previews. */
  hiddenCount: number;
  /** Noun used in the overflow label. @default "files" */
  noun?: string;
}

const PromptInputQueueItemAttachmentsOverflow = ({
  children,
  className,
  hiddenCount,
  noun = "files",
  ...rest
}: PromptInputQueueItemAttachmentsOverflowProps) => {
  const slots = useQueueSlots();

  if (hiddenCount <= 0 && children === undefined) return null;

  return (
    <span
      className={slots.attachmentsOverflow({className})}
      data-slot="prompt-input-queue-item-attachments-overflow"
      {...rest}
    >
      {children ?? `+${hiddenCount} ${noun}`}
    </span>
  );
};

PromptInputQueueItemAttachmentsOverflow.displayName =
  "HeroUI.PromptInput.Queue.Item.AttachmentsOverflow";

interface PromptInputQueueItemActionsProps extends ComponentPropsWithRef<"div"> {}

const PromptInputQueueItemActions = ({className, ...rest}: PromptInputQueueItemActionsProps) => {
  const slots = useQueueSlots();

  return (
    <div
      className={slots.itemActions({className})}
      data-slot="prompt-input-queue-item-actions"
      {...rest}
    />
  );
};

PromptInputQueueItemActions.displayName = "HeroUI.PromptInput.Queue.Item.Actions";

/* -------------------------------------------------------------------------------------------------
 * Row action buttons
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputQueueItemRemoveProps extends ButtonProps {}

const PromptInputQueueItemRemove = ({
  "aria-label": ariaLabel = "Remove queued prompt",
  children,
  isIconOnly = true,
  size = "sm",
  variant = "ghost",
  ...rest
}: PromptInputQueueItemRemoveProps) => {
  const slots = useQueueSlots();

  return (
    <Button
      aria-label={ariaLabel}
      data-slot="prompt-input-queue-item-remove"
      isIconOnly={isIconOnly}
      size={size}
      variant={variant}
      {...rest}
    >
      {children ?? <PromptInputTrashIcon className={slots.icon()} />}
    </Button>
  );
};

PromptInputQueueItemRemove.displayName = "HeroUI.PromptInput.Queue.Item.Remove";

interface PromptInputQueueItemMoreProps extends ButtonProps {}

const PromptInputQueueItemMore = ({
  "aria-label": ariaLabel = "More queue actions",
  children,
  isIconOnly = true,
  size = "sm",
  variant = "ghost",
  ...rest
}: PromptInputQueueItemMoreProps) => {
  const slots = useQueueSlots();

  return (
    <Button
      aria-label={ariaLabel}
      data-slot="prompt-input-queue-item-more"
      isIconOnly={isIconOnly}
      size={size}
      variant={variant}
      {...rest}
    >
      {children ?? <PromptInputEllipsisIcon className={slots.icon()} />}
    </Button>
  );
};

PromptInputQueueItemMore.displayName = "HeroUI.PromptInput.Queue.Item.More";

interface PromptInputQueueItemActionProps extends ButtonProps {}

/** A text action for a queued row; defaults to "↳ Steer" (send the prompt now). */
const PromptInputQueueItemAction = ({
  children,
  size = "sm",
  variant = "ghost",
  ...rest
}: PromptInputQueueItemActionProps) => {
  const slots = useQueueSlots();

  return (
    <Button data-slot="prompt-input-queue-item-action" size={size} variant={variant} {...rest}>
      {children ?? (
        <>
          <span aria-hidden="true" className={slots.steerArrow()}>
            ↳
          </span>
          Steer
        </>
      )}
    </Button>
  );
};

PromptInputQueueItemAction.displayName = "HeroUI.PromptInput.Queue.Item.Action";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PromptInputQueueRoot,
  PromptInputQueueList,
  PromptInputQueueItem,
  PromptInputQueueItemHandle,
  PromptInputQueueItemBody,
  PromptInputQueueItemIcon,
  PromptInputQueueItemContent,
  PromptInputQueueItemDescription,
  PromptInputQueueItemAttachments,
  PromptInputQueueItemAttachmentsOverflow,
  PromptInputQueueItemActions,
  PromptInputQueueItemRemove,
  PromptInputQueueItemMore,
  PromptInputQueueItemAction,
};

export type {
  PromptInputQueueProps,
  PromptInputQueueListProps,
  PromptInputQueueItemProps,
  PromptInputQueueItemHandleProps,
  PromptInputQueueItemBodyProps,
  PromptInputQueueItemIconProps,
  PromptInputQueueItemContentProps,
  PromptInputQueueItemDescriptionProps,
  PromptInputQueueItemAttachmentsProps,
  PromptInputQueueItemAttachmentsOverflowProps,
  PromptInputQueueItemActionsProps,
  PromptInputQueueItemRemoveProps,
  PromptInputQueueItemMoreProps,
  PromptInputQueueItemActionProps,
};
