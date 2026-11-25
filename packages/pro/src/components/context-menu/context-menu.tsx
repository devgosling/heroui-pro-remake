"use client";

import type {Key} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode, RefObject} from "react";
import type {RootMenuTriggerState} from "react-aria-components/Menu";

import {
  DropdownItem,
  DropdownItemIndicator,
  DropdownSection,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
  SurfaceContext,
} from "@heroui/react";
import {createContext, use, useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import {mergeProps} from "react-aria/mergeProps";
import {useContextMenu} from "react-aria/useContextMenu";
import {OverlayTriggerStateContext} from "react-aria-components/Dialog";
import {
  Menu as MenuPrimitive,
  Popover as PopoverPrimitive,
  RootMenuTriggerStateContext,
} from "react-aria-components/Menu";
import {PopoverContext} from "react-aria-components/Popover";
import {Separator as SeparatorPrimitive} from "react-aria-components/Separator";
import {Provider, useSlottedContext} from "react-aria-components/slots";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {contextMenuVariants} from "./context-menu.styles";

type FocusStrategy = NonNullable<RootMenuTriggerState["focusStrategy"]>;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ContextMenuContext = {
  isDisabled: boolean;
  menuId: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  slots: ReturnType<typeof contextMenuVariants>;
  state: RootMenuTriggerState;
  triggerId: string;
  triggerRef: RefObject<HTMLDivElement | null>;
};

const ContextMenuContext = createContext<ContextMenuContext | null>(null);

const useContextMenuContext = (part: string) => {
  const context = use(ContextMenuContext);

  if (!context) {
    throw new Error(`<ContextMenu.${part}> must be rendered inside <ContextMenu>.`);
  }

  return context;
};

/** `true` inside a popover opened by a `ContextMenu.SubmenuTrigger`. */
const ContextMenuSubmenuContext = createContext(false);

/* -------------------------------------------------------------------------------------------------
 * State
 * -------------------------------------------------------------------------------------------------
 * Menu trigger state (open flag, pointer position, expanded submenu stack) with the same shape as
 * the one React Aria's `MenuTrigger` creates. RAC `Popover` reads it from
 * `OverlayTriggerStateContext` (its `point` becomes the anchor rectangle) and RAC `SubmenuTrigger`
 * reads it from `RootMenuTriggerStateContext`, while the open state follows the `open` /
 * `defaultOpen` / `onOpenChange` API of this component.
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuStateProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function useContextMenuState({
  defaultOpen = false,
  onOpenChange,
  open,
}: ContextMenuStateProps): RootMenuTriggerState {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [point, setPoint] = useState<{x: number; y: number} | null>(null);
  const [focusStrategy, setFocusStrategy] = useState<FocusStrategy | null>(null);
  const [expandedKeysStack, setExpandedKeysStack] = useState<Key[]>([]);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const isOpenRef = useRef(isOpen);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    isOpenRef.current = isOpen;
    onOpenChangeRef.current = onOpenChange;
  });

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      if (isOpenRef.current === next) return;

      isOpenRef.current = next;
      onOpenChangeRef.current?.(next);
    },
    [isControlled],
  );

  const openMenu = useCallback(
    (strategy: FocusStrategy | null = null) => {
      setFocusStrategy(strategy);
      setOpen(true);
    },
    [setOpen],
  );

  const closeMenu = useCallback(() => {
    setExpandedKeysStack([]);
    setOpen(false);
  }, [setOpen]);

  const toggleMenu = useCallback(
    (strategy: FocusStrategy | null = null) => {
      if (isOpenRef.current) closeMenu();
      else openMenu(strategy);
    },
    [closeMenu, openMenu],
  );

  const setOpenState = useCallback(
    (next: boolean) => (next ? openMenu() : closeMenu()),
    [closeMenu, openMenu],
  );

  const openSubmenu = useCallback((triggerKey: Key, level: number) => {
    setExpandedKeysStack((stack) =>
      level > stack.length ? stack : [...stack.slice(0, level), triggerKey],
    );
  }, []);

  const closeSubmenu = useCallback((triggerKey: Key, level: number) => {
    setExpandedKeysStack((stack) => (stack[level] === triggerKey ? stack.slice(0, level) : stack));
  }, []);

  // A controlled close (`open={false}`) also collapses every open submenu.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled-prop reset: clears submenu state when `open` turns false from outside
    if (!isOpen) setExpandedKeysStack((stack) => (stack.length ? [] : stack));
  }, [isOpen]);

  return useMemo(
    () => ({
      close: closeMenu,
      closeSubmenu,
      expandedKeysStack,
      focusStrategy,
      isOpen,
      open: openMenu,
      openSubmenu,
      point,
      setOpen: setOpenState,
      setPoint,
      toggle: toggleMenu,
    }),
    [
      closeMenu,
      closeSubmenu,
      expandedKeysStack,
      focusStrategy,
      isOpen,
      openMenu,
      openSubmenu,
      point,
      setOpenState,
      toggleMenu,
    ],
  );
}

/* -------------------------------------------------------------------------------------------------
 * Context Menu Root
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuRootProps {
  /** The trigger area and the popover. */
  children?: ReactNode;
  /** Whether the menu is open (controlled). */
  open?: boolean;
  /** Whether the menu is open by default (uncontrolled). @default false */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Whether the context menu is disabled (the browser's native menu shows instead). @default false */
  isDisabled?: boolean;
}

const ContextMenuRoot = ({
  children,
  defaultOpen,
  isDisabled = false,
  onOpenChange,
  open,
}: ContextMenuRootProps) => {
  const state = useContextMenuState({defaultOpen, onOpenChange, open});
  const slots = useMemo(() => contextMenuVariants(), []);
  const triggerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerId = `react-aria-${useId()}`;
  const menuId = `react-aria-${useId()}`;

  const {close, isOpen} = state;

  // Everything outside the open (modal) menu is inert, so a right click outside of it lands on
  // <body>. Close the menu there and let the browser show its own menu, like React Aria does for
  // `MenuTrigger trigger="contextMenu"`.
  useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const isSecondary = event.button === 2 || (event.button === 0 && event.ctrlKey);
      const target = event.composedPath()[0] ?? event.target;

      if (isSecondary && target === document.body) close();
    };

    document.addEventListener("mousedown", onMouseDown);

    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [close, isOpen]);

  const contextValue = useMemo<ContextMenuContext>(
    () => ({isDisabled, menuId, scrollRef, slots, state, triggerId, triggerRef}),
    [isDisabled, menuId, slots, state, triggerId],
  );

  return <ContextMenuContext value={contextValue}>{children}</ContextMenuContext>;
};

ContextMenuRoot.displayName = "HeroUI.ContextMenu";

/* -------------------------------------------------------------------------------------------------
 * Context Menu Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuTriggerProps extends ComponentPropsWithRef<"div"> {
  /** Content that can be right-clicked (or long-pressed on touch devices). */
  children?: ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

const ContextMenuTrigger = ({children, className, ref, ...props}: ContextMenuTriggerProps) => {
  const {isDisabled, slots, state, triggerId, triggerRef} = useContextMenuContext("Trigger");
  const mergedRef = useMergedRef(ref, triggerRef);
  const {open, setPoint} = state;

  // Right click, Shift+F10 / the context-menu key (focusable trigger), Control+Enter on macOS and
  // a long press on iOS (which never fires `contextmenu`).
  const {contextMenuProps} = useContextMenu({
    onContextMenu: isDisabled
      ? undefined
      : (event) => {
          const rect = (event.target as Element).getBoundingClientRect();

          setPoint({x: rect.x + event.x, y: rect.y + event.y});
          open();
        },
  });

  return (
    <div
      className={slots.trigger({className})}
      data-slot="context-menu-trigger"
      id={isDisabled ? undefined : triggerId}
      {...mergeProps(contextMenuProps, props)}
      ref={mergedRef}
    >
      {children}
    </div>
  );
};

ContextMenuTrigger.displayName = "HeroUI.ContextMenu.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Context Menu Popover
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuPopoverProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children" | "isOpen" | "triggerRef"
> {
  children: ReactNode;
  /** Distance from the anchor point in pixels. @default 2 */
  offset?: number;
  /** Preferred placement relative to the cursor. @default "bottom start" */
  placement?: ComponentPropsWithRef<typeof PopoverPrimitive>["placement"];
}

const ContextMenuPopover = ({
  children,
  className,
  offset = 2,
  placement,
  ...props
}: ContextMenuPopoverProps) => {
  const {scrollRef, slots, state, triggerId, triggerRef} = useContextMenuContext("Popover");
  // A submenu popover is configured by RAC `SubmenuTrigger` through `PopoverContext` (trigger
  // item, `end top` placement, non-modal). The root popover is anchored at the pointer.
  const popoverContext = useSlottedContext(PopoverContext, props.slot);
  const isSubmenu = popoverContext?.trigger === "SubmenuTrigger";
  const resolvedClassName = useResolvedClassName(className, slots.popover());

  const popover = (
    <PopoverPrimitive
      {...(isSubmenu
        ? {placement}
        : {
            "aria-labelledby": triggerId,
            placement: placement ?? "bottom start",
            scrollRef,
            trigger: "MenuTrigger",
            triggerRef,
          })}
      {...props}
      className={resolvedClassName}
      data-slot="context-menu-popover"
      offset={offset}
    >
      <ContextMenuSubmenuContext value={isSubmenu}>{children}</ContextMenuSubmenuContext>
    </PopoverPrimitive>
  );

  return (
    <SurfaceContext value={{variant: "default"}}>
      {isSubmenu ? (
        popover
      ) : (
        <Provider
          values={[
            [OverlayTriggerStateContext, state],
            [RootMenuTriggerStateContext, state],
          ]}
        >
          {popover}
        </Provider>
      )}
    </SurfaceContext>
  );
};

ContextMenuPopover.displayName = "HeroUI.ContextMenu.Popover";

/* -------------------------------------------------------------------------------------------------
 * Context Menu Menu
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuMenuProps<T extends object> extends ComponentPropsWithRef<
  typeof MenuPrimitive<T>
> {
  /** Custom close handler. Replaces the default, which closes the context menu. */
  onClose?: () => void;
}

function ContextMenuMenu<T extends object>({
  className,
  onClose,
  ref,
  ...props
}: ContextMenuMenuProps<T>) {
  const {menuId, scrollRef, slots, state, triggerId} = useContextMenuContext("Menu");
  const isSubmenu = use(ContextMenuSubmenuContext);
  const mergedRef = useMergedRef(ref, isSubmenu ? null : scrollRef);
  const resolvedClassName = useResolvedClassName(className, slots.menu());

  // A submenu gets its id, labelling, focus and close wiring from RAC `SubmenuTrigger`.
  const rootProps = isSubmenu
    ? {onClose}
    : {
        "aria-labelledby": triggerId,
        autoFocus: state.focusStrategy || true,
        id: menuId,
        onClose: onClose ?? state.close,
      };

  return (
    <MenuPrimitive<T>
      {...rootProps}
      {...props}
      ref={mergedRef}
      className={resolvedClassName}
      data-slot="context-menu-menu"
    />
  );
}

ContextMenuMenu.displayName = "HeroUI.ContextMenu.Menu";

/* -------------------------------------------------------------------------------------------------
 * Context Menu Item / ItemIndicator / Section / SubmenuTrigger / SubmenuIndicator
 * -------------------------------------------------------------------------------------------------
 * The HeroUI Dropdown parts, so context menu items look and behave exactly like dropdown items.
 * -----------------------------------------------------------------------------------------------*/
type ContextMenuItemProps = ComponentPropsWithRef<typeof DropdownItem>;

const ContextMenuItem = (props: ContextMenuItemProps) => <DropdownItem {...props} />;

ContextMenuItem.displayName = "HeroUI.ContextMenu.Item";

type ContextMenuItemIndicatorProps = ComponentPropsWithRef<typeof DropdownItemIndicator>;

const ContextMenuItemIndicator = (props: ContextMenuItemIndicatorProps) => (
  <DropdownItemIndicator {...props} />
);

ContextMenuItemIndicator.displayName = "HeroUI.ContextMenu.ItemIndicator";

type ContextMenuSectionProps = ComponentPropsWithRef<typeof DropdownSection>;

const ContextMenuSection = (props: ContextMenuSectionProps) => <DropdownSection {...props} />;

ContextMenuSection.displayName = "HeroUI.ContextMenu.Section";

type ContextMenuSubmenuTriggerProps = ComponentPropsWithRef<typeof DropdownSubmenuTrigger>;

const ContextMenuSubmenuTrigger = (props: ContextMenuSubmenuTriggerProps) => (
  <DropdownSubmenuTrigger {...props} />
);

ContextMenuSubmenuTrigger.displayName = "HeroUI.ContextMenu.SubmenuTrigger";

type ContextMenuSubmenuIndicatorProps = ComponentPropsWithRef<typeof DropdownSubmenuIndicator>;

const ContextMenuSubmenuIndicator = (props: ContextMenuSubmenuIndicatorProps) => (
  <DropdownSubmenuIndicator {...props} />
);

ContextMenuSubmenuIndicator.displayName = "HeroUI.ContextMenu.SubmenuIndicator";

/* -------------------------------------------------------------------------------------------------
 * Context Menu Separator
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuSeparatorProps extends ComponentPropsWithRef<typeof SeparatorPrimitive> {}

const ContextMenuSeparator = ({className, ...props}: ContextMenuSeparatorProps) => {
  const slots = useMemo(() => contextMenuVariants(), []);

  return (
    <SeparatorPrimitive
      className={slots.separator({className})}
      data-slot="context-menu-separator"
      {...props}
    />
  );
};

ContextMenuSeparator.displayName = "HeroUI.ContextMenu.Separator";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ContextMenuContext,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuMenu,
  ContextMenuPopover,
  ContextMenuRoot,
  ContextMenuSection,
  ContextMenuSeparator,
  ContextMenuSubmenuIndicator,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
};

export type {
  ContextMenuItemIndicatorProps,
  ContextMenuItemProps,
  ContextMenuMenuProps,
  ContextMenuPopoverProps,
  ContextMenuRootProps,
  ContextMenuSectionProps,
  ContextMenuSeparatorProps,
  ContextMenuSubmenuIndicatorProps,
  ContextMenuSubmenuTriggerProps,
  ContextMenuTriggerProps,
};
