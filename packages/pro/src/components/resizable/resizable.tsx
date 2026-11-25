"use client";

import type {
  ResizableHandleVariants,
  ResizableIndicatorVariants,
  ResizableVariants,
} from "./resizable.styles";
import type {ComponentPropsWithRef, ReactNode, Ref} from "react";
import type {
  GroupImperativeHandle,
  GroupProps,
  Layout,
  LayoutChangedMeta,
  LayoutStorage,
  PanelImperativeHandle,
  PanelProps,
  PanelSize,
  SeparatorProps,
} from "react-resizable-panels";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {Group, Panel, Separator} from "react-resizable-panels";

import {useMergedRef} from "../../utils";

import {
  resizableHandleVariants,
  resizableIndicatorVariants,
  resizableVariants,
} from "./resizable.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type ResizableOrientation = NonNullable<ResizableVariants["orientation"]>;

/** Imperative group API (`getLayout`, `setLayout`), kept under its react-resizable-panels v2 name. */
type ImperativePanelGroupHandle = GroupImperativeHandle;

/** Imperative panel API (`collapse`, `expand`, `getSize`, `isCollapsed`, `resize`). */
type ImperativePanelHandle = PanelImperativeHandle;

/**
 * A panel size. Numbers are percentages of the group (HeroUI Pro convention); strings accept CSS
 * units such as `"220px"`, `"18rem"`, `"50vh"` or `"30%"`.
 */
type ResizableSize = number | string;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ResizableContext = {
  orientation: ResizableOrientation;
  slots: ReturnType<typeof resizableVariants>;
};

const ResizableContext = createContext<ResizableContext>({
  orientation: "horizontal",
  slots: resizableVariants(),
});

/* -------------------------------------------------------------------------------------------------
 * Persistence helpers (`autoSaveId`)
 * Same storage key and value format as react-resizable-panels' own `useDefaultLayout`
 * (`react-resizable-panels:<id>` -> `{"panelId": percentage}`), but safe to call on the server.
 * -----------------------------------------------------------------------------------------------*/
const STORAGE_KEY_PREFIX = "react-resizable-panels:";

const subscribeToNothing = () => () => {};

function resolveStorage(storage: LayoutStorage | undefined): LayoutStorage | undefined {
  if (storage) return storage;

  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readStoredLayout(storage: LayoutStorage | undefined, key: string | undefined) {
  if (!key) return null;

  try {
    return resolveStorage(storage)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function parseStoredLayout(value: string | null): Layout | undefined {
  if (!value) return undefined;

  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;

    const entries = Object.entries(parsed as Record<string, unknown>);

    if (!entries.length || !entries.every(([, size]) => typeof size === "number")) return undefined;

    return parsed as Layout;
  } catch {
    return undefined;
  }
}

function toPanelSize(size: ResizableSize | undefined) {
  return typeof size === "number" ? `${size}%` : size;
}

/* -------------------------------------------------------------------------------------------------
 * Resizable (root panel group)
 * -----------------------------------------------------------------------------------------------*/
interface ResizableRootProps extends Omit<
  GroupProps,
  "elementRef" | "groupRef" | "id" | "orientation" | "children"
> {
  children?: ReactNode;
  /** Layout direction. @default "horizontal" */
  orientation?: ResizableOrientation;
  /** Unique id used to persist panel sizes (to `localStorage` unless `storage` is given). */
  autoSaveId?: string;
  /** Fires on every layout change (including while dragging) with the panel sizes in percent. */
  onLayout?: (sizes: number[]) => void;
  /** Custom storage implementation for SSR-safe persistence (see `createCookieStorage`). */
  storage?: LayoutStorage;
  /** Unique identifier (required for nested groups). */
  id?: string;
  /** Imperative handle (`setLayout`, `getLayout`). */
  handleRef?: Ref<ImperativePanelGroupHandle | null>;
  /** Ref to the root `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement | null>;
}

const ResizableRoot = ({
  autoSaveId,
  children,
  className,
  defaultLayout,
  handleRef,
  id,
  onLayout,
  onLayoutChange,
  onLayoutChanged,
  orientation = "horizontal",
  ref,
  storage,
  ...rest
}: ResizableRootProps) => {
  const slots = useMemo(() => resizableVariants({orientation}), [orientation]);
  const contextValue = useMemo(() => ({orientation, slots}), [orientation, slots]);

  const storageKey = autoSaveId ? `${STORAGE_KEY_PREFIX}${autoSaveId}` : undefined;
  const getStoredSnapshot = useCallback(
    () => readStoredLayout(storage, storageKey),
    [storage, storageKey],
  );
  const storedValue = useSyncExternalStore(
    subscribeToNothing,
    getStoredSnapshot,
    getStoredSnapshot,
  );
  const storedLayout = useMemo(() => parseStoredLayout(storedValue), [storedValue]);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      onLayoutChange?.(layout);
      onLayout?.(Object.values(layout));
    },
    [onLayout, onLayoutChange],
  );

  const handleLayoutChanged = useCallback(
    (layout: Layout, meta: LayoutChangedMeta) => {
      if (storageKey) {
        try {
          resolveStorage(storage)?.setItem(
            storageKey,
            JSON.stringify(meta.requestedLayout ?? layout),
          );
        } catch {
          // Storage can be full or blocked (private mode); persistence is best effort.
        }
      }

      onLayoutChanged?.(layout, meta);
    },
    [onLayoutChanged, storage, storageKey],
  );

  return (
    <ResizableContext value={contextValue}>
      <Group
        {...rest}
        className={slots.base({className})}
        data-slot="resizable"
        defaultLayout={storedLayout ?? defaultLayout}
        elementRef={ref}
        groupRef={handleRef}
        id={id}
        orientation={orientation}
        onLayoutChange={handleLayoutChange}
        onLayoutChanged={handleLayoutChanged}
      >
        {children}
      </Group>
    </ResizableContext>
  );
};

ResizableRoot.displayName = "HeroUI.Resizable";

/* -------------------------------------------------------------------------------------------------
 * Resizable.Panel
 * -----------------------------------------------------------------------------------------------*/
interface ResizablePanelProps extends Omit<
  PanelProps,
  | "collapsedSize"
  | "collapsedThreshold"
  | "defaultSize"
  | "elementRef"
  | "id"
  | "maxSize"
  | "minSize"
  | "panelRef"
> {
  /** Initial panel size. Numbers are percentages; strings accept CSS units. */
  defaultSize?: ResizableSize;
  /** Minimum panel size. Numbers are percentages; strings accept CSS units. */
  minSize?: ResizableSize;
  /** Maximum panel size. Numbers are percentages; strings accept CSS units. */
  maxSize?: ResizableSize;
  /** Size applied when collapsed. Numbers are percentages; strings accept CSS units. */
  collapsedSize?: ResizableSize;
  /** Distance past `minSize` / `collapsedSize` that collapses / expands the panel. */
  collapsedThreshold?: ResizableSize;
  /** Unique id (required with `autoSaveId` + `collapsible`). */
  id?: string;
  /**
   * Panel render order (for conditional rendering). Kept for API compatibility: react-resizable-panels
   * v4 orders panels by their DOM position, so this value is not needed.
   */
  order?: number;
  /** Fires when the panel collapses. */
  onCollapse?: () => void;
  /** Fires when the panel expands from its collapsed size. */
  onExpand?: () => void;
  /** Imperative panel handle (`collapse`, `expand`, `getSize`, `isCollapsed`, `resize`). */
  handleRef?: Ref<ImperativePanelHandle | null>;
  /** Alias of `handleRef` (react-resizable-panels v4 name). */
  panelRef?: Ref<ImperativePanelHandle | null>;
  /** Ref to the panel's outer `HTMLDivElement` (the flex item). */
  ref?: Ref<HTMLDivElement | null>;
}

const ResizablePanel = ({
  className,
  collapsedSize,
  collapsedThreshold,
  collapsible,
  defaultSize,
  handleRef,
  maxSize,
  minSize,
  onCollapse,
  onExpand,
  onResize,
  order: _order,
  panelRef,
  ref,
  ...rest
}: ResizablePanelProps) => {
  const {slots} = use(ResizableContext);
  const localPanelRef = useRef<ImperativePanelHandle | null>(null);
  // Assignment order (local, handleRef, panelRef) and identity (changes only with the forwarded
  // refs) match a single `mergeRefs(localPanelRef, handleRef, panelRef)`.
  const forwardedPanelRef = useMergedRef<ImperativePanelHandle | null>(handleRef, panelRef ?? null);
  const mergedPanelRef = useMergedRef<ImperativePanelHandle | null>(
    localPanelRef,
    forwardedPanelRef,
  );
  const wasCollapsedRef = useRef<boolean | null>(null);

  const handleResize = useCallback(
    (panelSize: PanelSize, panelId: string | number | undefined, prevPanelSize?: PanelSize) => {
      onResize?.(panelSize, panelId, prevPanelSize);

      if (!collapsible) return;

      const isCollapsed = localPanelRef.current?.isCollapsed() ?? false;
      const wasCollapsed = wasCollapsedRef.current;

      wasCollapsedRef.current = isCollapsed;

      // The first notification (mount) only records the initial state.
      if (wasCollapsed === null || wasCollapsed === isCollapsed) return;

      if (isCollapsed) onCollapse?.();
      else onExpand?.();
    },
    [collapsible, onCollapse, onExpand, onResize],
  );

  return (
    <Panel
      {...rest}
      className={slots.panel({className})}
      collapsedSize={toPanelSize(collapsedSize)}
      collapsedThreshold={toPanelSize(collapsedThreshold)}
      collapsible={collapsible}
      data-slot="resizable-panel"
      defaultSize={toPanelSize(defaultSize)}
      elementRef={ref}
      maxSize={toPanelSize(maxSize)}
      minSize={toPanelSize(minSize)}
      panelRef={mergedPanelRef}
      onResize={handleResize}
    />
  );
};

ResizablePanel.displayName = "HeroUI.Resizable.Panel";

/* -------------------------------------------------------------------------------------------------
 * Resizable.Indicator (grip)
 * -----------------------------------------------------------------------------------------------*/
const GRIP_OFFSETS = [5.5, 10.5];
const GRIP_STEPS = [3, 8, 13];

/** Six-dot grip. Columns of dots for a vertical line, rows of dots for a horizontal line. */
const GripIcon = ({
  className,
  orientation,
}: {
  className?: string;
  orientation: ResizableOrientation;
}) => (
  <svg
    aria-hidden="true"
    className={className}
    data-slot="resizable-handle-indicator-icon"
    fill="currentColor"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    {GRIP_STEPS.flatMap((step) =>
      GRIP_OFFSETS.map((offset) => {
        const [cx, cy] = orientation === "horizontal" ? [offset, step] : [step, offset];

        return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.5} />;
      }),
    )}
  </svg>
);

interface ResizableIndicatorProps
  extends ComponentPropsWithRef<"span">, ResizableIndicatorVariants {
  /**
   * Affordance style when no children are provided. @default "pill"
   * With custom children and no explicit `type`, no shape modifier is applied.
   */
  type?: "pill" | "drag";
  /** Custom content. Overrides the default affordance. */
  children?: ReactNode;
}

const ResizableIndicator = ({children, className, type, ...rest}: ResizableIndicatorProps) => {
  const {orientation} = use(ResizableContext);
  const hasCustomContent = children !== undefined && children !== null;
  const resolvedType = type ?? (hasCustomContent ? undefined : "pill");
  const slots = useMemo(() => resizableIndicatorVariants({type: resolvedType}), [resolvedType]);

  return (
    <span
      aria-hidden="true"
      className={slots.base({className})}
      data-slot="resizable-handle-indicator"
      {...rest}
    >
      {hasCustomContent ? (
        children
      ) : resolvedType === "drag" ? (
        <GripIcon className={slots.icon()} orientation={orientation} />
      ) : null}
    </span>
  );
};

ResizableIndicator.displayName = "HeroUI.Resizable.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Resizable.Handle (separator)
 * -----------------------------------------------------------------------------------------------*/
type ResizableHandleType = NonNullable<ResizableHandleVariants["type"]>;
type ResizableHandleVariant = NonNullable<ResizableHandleVariants["variant"]>;

interface ResizableHandleProps extends Omit<SeparatorProps, "children" | "elementRef"> {
  /**
   * Affordance style. `handle` is a standalone pill grip without the separator line.
   * @default "line"
   */
  type?: ResizableHandleType;
  /** Emphasis level. Maps to the separator tokens. @default "primary" */
  variant?: ResizableHandleVariant;
  /** Sugar: render the default indicator inside a `line` handle. */
  withIndicator?: boolean;
  /** Whether the handle is disabled. @default false */
  disabled?: boolean;
  /** Fires when a pointer drag starts / ends. */
  onDragging?: (isDragging: boolean) => void;
  /** Custom grip, usually a `Resizable.Indicator`. Replaces the default indicator. */
  children?: ReactNode;
  /** Ref to the separator `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
}

const ResizableHandle = ({
  "aria-label": ariaLabel = "Resize handle",
  children,
  className,
  disabled,
  onDragging,
  ref,
  type = "line",
  variant = "primary",
  withIndicator,
  ...rest
}: ResizableHandleProps) => {
  const {orientation} = use(ResizableContext);
  const slots = useMemo(
    () => resizableHandleVariants({orientation, type, variant}),
    [orientation, type, variant],
  );

  const elementRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergedRef(ref, elementRef);

  const onDraggingRef = useRef(onDragging);

  useEffect(() => {
    onDraggingRef.current = onDragging;
  }, [onDragging]);

  // react-resizable-panels reflects the drag state in `data-separator="active"`.
  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    let isDragging = element.getAttribute("data-separator") === "active";
    let wasFocusedWhileDragging = false;

    const observer = new MutationObserver(() => {
      const next = element.getAttribute("data-separator") === "active";
      const ownerDocument = element.ownerDocument;

      if (next) wasFocusedWhileDragging ||= ownerDocument.activeElement === element;
      if (next === isDragging) return;
      isDragging = next;

      if (!next) {
        // The library focuses the separator on pointer down but blurs it again after a drag that
        // moved; HeroUI Pro keeps it focused (with its focus ring), so focus is restored here.
        const activeElement = ownerDocument.activeElement;

        if (
          wasFocusedWhileDragging &&
          (!activeElement || activeElement === ownerDocument.body) &&
          element.isConnected
        ) {
          element.focus({preventScroll: true});
        }
        wasFocusedWhileDragging = false;
      }

      onDraggingRef.current?.(next);
    });

    observer.observe(element, {attributeFilter: ["data-separator"], attributes: true});

    return () => observer.disconnect();
  }, []);

  const showDefaultIndicator = type !== "line" || withIndicator;
  const content =
    children ??
    (showDefaultIndicator ? <ResizableIndicator type={type === "drag" ? "drag" : "pill"} /> : null);

  return (
    <Separator
      {...rest}
      aria-label={ariaLabel}
      className={slots.base({className})}
      data-slot="resizable-handle"
      data-type={type}
      data-variant={variant}
      disabled={disabled}
      elementRef={mergedRef}
    >
      {content}
    </Separator>
  );
};

ResizableHandle.displayName = "HeroUI.Resizable.Handle";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ResizableRoot, ResizablePanel, ResizableHandle, ResizableIndicator, ResizableContext};

export type {
  ResizableRootProps,
  ResizablePanelProps,
  ResizableHandleProps,
  ResizableIndicatorProps,
  ResizableOrientation,
  ResizableHandleType,
  ResizableHandleVariant,
  ResizableSize,
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
};
