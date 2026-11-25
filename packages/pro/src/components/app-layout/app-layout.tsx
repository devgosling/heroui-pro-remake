"use client";

import type {
  AppLayoutAsideMobile,
  AppLayoutContextValue,
  AppLayoutScrollMode,
} from "./app-layout-context";
import type {ImperativePanelHandle, ResizableSize} from "../resizable";
import type {
  SidebarCollapsible,
  SidebarProviderProps,
  SidebarSide,
  SidebarVariant,
} from "../sidebar";
import type {ComponentProps, ReactElement, ReactNode} from "react";

import {Button, Sheet, Tooltip} from "@heroui/react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {NavbarLayoutContext} from "../navbar";
import {Resizable} from "../resizable";
import {SidebarProvider, useSidebar} from "../sidebar";

import {
  AppLayoutContext,
  BELOW_LG_QUERY,
  MOBILE_QUERY,
  useAppLayoutContext,
  useAsideState,
  useKeyboardShortcut,
  useMediaQuery,
} from "./app-layout-context";
import {BarsIcon, LayoutSideContentRightIcon} from "./app-layout-icons";
import {appLayoutVariants} from "./app-layout.styles";

type ResizeBehavior = "preserve-relative-size" | "preserve-pixel-size";

/* -------------------------------------------------------------------------------------------------
 * Panel ids (stable, so `resizableAutoSaveId` keys stay readable: `{"app-layout-sidebar": 18, …}`)
 * -----------------------------------------------------------------------------------------------*/
const SIDEBAR_PANEL_ID = "app-layout-sidebar";
const MAIN_PANEL_ID = "app-layout-main";
const ASIDE_PANEL_ID = "app-layout-aside";

/** Frames `usePanelSync` waits for the group to register a newly mounted panel. */
const MAX_SYNC_FRAMES = 10;

/* -------------------------------------------------------------------------------------------------
 * AppLayout.MobileAside (marker)
 * -----------------------------------------------------------------------------------------------*/
interface AppLayoutMobileAsideProps {
  /** Mobile-only aside content. Replaces the `aside` prop inside the mobile sheet. */
  children?: ReactNode;
}

/**
 * Marker component: provides alternative content for the mobile aside sheet
 * (`asideMobile="sheet"`). Place it as a direct child of `AppLayout`; it renders nothing in place.
 */
const AppLayoutMobileAside = (_props: AppLayoutMobileAsideProps): ReactNode => null;

AppLayoutMobileAside.displayName = "HeroUI.AppLayout.MobileAside";

/** Splits the `AppLayout.MobileAside` marker out of the main content. */
function splitChildren(children: ReactNode) {
  let mobileAside: ReactNode = undefined;
  let hasMobileAside = false;
  const content: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === AppLayoutMobileAside) {
      hasMobileAside = true;
      mobileAside = (child as ReactElement<AppLayoutMobileAsideProps>).props.children;
    } else {
      content.push(child);
    }
  });

  return {content: hasMobileAside ? content : children, hasMobileAside, mobileAside};
}

/* -------------------------------------------------------------------------------------------------
 * AppLayout (root)
 * -----------------------------------------------------------------------------------------------*/
interface AppLayoutRootProps extends Omit<
  SidebarProviderProps,
  "open" | "defaultOpen" | "onOpenChange" | "side" | "variant" | "collapsible" | "children"
> {
  /** Sidebar content for the full-height side panel (typically `<Sidebar>` + `<Sidebar.Mobile>`). */
  sidebar?: ReactNode;
  /** Navbar rendered inside the sticky header row of the body column. */
  navbar?: ReactNode;
  /** Content of the optional right-side aside panel (full viewport height, hidden below `lg`). */
  aside?: ReactNode;
  /** Main content, rendered inside a `<main>` element. */
  children?: ReactNode;
  /** Optional second sticky row rendered below the navbar. */
  toolbar?: ReactNode;
  /** Optional row pinned to the bottom of the body column. */
  footer?: ReactNode;

  /** Controlled sidebar open state. */
  sidebarOpen?: boolean;
  /** Initial sidebar open state (uncontrolled). @default true */
  defaultSidebarOpen?: boolean;
  /** Called when the sidebar open state changes. */
  onSidebarOpenChange?: (open: boolean) => void;
  /** Which side the sidebar is on. @default "left" */
  sidebarSide?: SidebarSide;
  /** Sidebar visual variant. @default "sidebar" */
  sidebarVariant?: SidebarVariant;
  /** Sidebar collapse behavior. @default "icon" */
  sidebarCollapsible?: SidebarCollapsible;

  /** Controlled aside open state. */
  asideOpen?: boolean;
  /** Initial aside open state (uncontrolled). @default true */
  defaultAsideOpen?: boolean;
  /** Called when the aside open state changes. */
  onAsideOpenChange?: (open: boolean) => void;
  /** Keyboard shortcut that toggles the aside (e.g. `"mod+."`). Disabled by default. */
  asideToggleShortcut?: string | false | null;
  /** How the aside behaves below the `lg` breakpoint (`width < 64rem`). @default "hidden" */
  asideMobile?: AppLayoutAsideMobile;

  /** Make the sidebar user-resizable. Requires `sidebarCollapsible="offcanvas"` or `"none"`. @default false */
  sidebarResizable?: boolean;
  /** Initial sidebar size when resizable. Numbers are percentages; strings accept CSS units. @default 18 */
  sidebarDefaultSize?: ResizableSize;
  /** Minimum sidebar size when resizable. @default 12 */
  sidebarMinSize?: ResizableSize;
  /** Maximum sidebar size when resizable. @default 30 */
  sidebarMaxSize?: ResizableSize;
  /** Whether the sidebar keeps its relative or pixel size when the layout width changes. @default "preserve-relative-size" */
  sidebarResizeBehavior?: ResizeBehavior;
  /** Make the aside user-resizable. @default false */
  asideResizable?: boolean;
  /** Initial aside size when resizable. Numbers are percentages; strings accept CSS units. @default 20 */
  asideDefaultSize?: ResizableSize;
  /** Minimum aside size when resizable. @default 15 */
  asideMinSize?: ResizableSize;
  /** Maximum aside size when resizable. @default 40 */
  asideMaxSize?: ResizableSize;
  /** Whether the aside keeps its relative or pixel size when the layout width changes. @default "preserve-relative-size" */
  asideResizeBehavior?: ResizeBehavior;
  /** `autoSaveId` of the internal Resizable group (persists panel sizes). */
  resizableAutoSaveId?: string;

  /** Which element owns vertical scrolling. @default "page" */
  scrollMode?: AppLayoutScrollMode;
}

const AppLayoutRoot = ({
  aside,
  asideDefaultSize = 20,
  asideMaxSize = 40,
  asideMinSize = 15,
  asideMobile = "hidden",
  asideOpen,
  asideResizable = false,
  asideResizeBehavior = "preserve-relative-size",
  asideToggleShortcut,
  children,
  defaultAsideOpen = true,
  defaultSidebarOpen = true,
  footer,
  navbar,
  navigate,
  onAsideOpenChange,
  onSidebarOpenChange,
  reduceMotion = false,
  resizableAutoSaveId,
  scrollMode = "page",
  sidebar,
  sidebarCollapsible = "icon",
  sidebarDefaultSize = 18,
  sidebarMaxSize = 30,
  sidebarMinSize = 12,
  sidebarOpen,
  sidebarResizable = false,
  sidebarResizeBehavior = "preserve-relative-size",
  sidebarSide = "left",
  sidebarVariant = "sidebar",
  toggleShortcut = "mod+b",
  toolbar,
  ...rest
}: AppLayoutRootProps) => {
  const slots = useMemo(() => appLayoutVariants(), []);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isBelowLg = useMediaQuery(BELOW_LG_QUERY);

  const hasAside = aside != null && aside !== false;
  const usesAsideSheet = asideMobile === "sheet" && isBelowLg;

  /* Aside state: desktop (controlled / uncontrolled + cookie) and the mobile sheet. */
  const [isDesktopAsideOpen, setDesktopAsideOpen] = useAsideState(
    asideOpen,
    defaultAsideOpen,
    onAsideOpenChange,
  );
  const [isMobileAsideOpen, setMobileAsideOpen] = useState(false);

  // The mobile sheet never outlives the mobile layout.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with the matchMedia breakpoint (external store); closes the sheet after leaving the mobile layout
    if (!usesAsideSheet) setMobileAsideOpen(false);
  }, [usesAsideSheet]);

  const isAsideOpen = usesAsideSheet ? isMobileAsideOpen : isDesktopAsideOpen;

  const setAsideOpen = useCallback(
    (open: boolean) => {
      if (usesAsideSheet) setMobileAsideOpen(open);
      else setDesktopAsideOpen(open);
    },
    [setDesktopAsideOpen, usesAsideSheet],
  );

  const toggleAside = useCallback(() => setAsideOpen(!isAsideOpen), [isAsideOpen, setAsideOpen]);

  useKeyboardShortcut(asideToggleShortcut, toggleAside);

  const contextValue = useMemo<AppLayoutContextValue>(
    () => ({
      asideMobile,
      hasAside,
      isAsideOpen,
      isBelowLg,
      setAsideOpen,
      slots,
      toggleAside,
    }),
    [asideMobile, hasAside, isAsideOpen, isBelowLg, setAsideOpen, slots, toggleAside],
  );

  /* Resizable shell: the sidebar joins the group from `md` up (offcanvas / none only), the aside
   * from `lg` up. Anything else falls back to the static layout. */
  const isSidebarResizable = sidebarResizable && sidebarCollapsible !== "icon" && !isMobile;
  const isAsideResizable = asideResizable && hasAside && !isBelowLg;
  const isResizable = isSidebarResizable || isAsideResizable;

  return (
    <SidebarProvider
      collapsible={sidebarCollapsible}
      data-app-layout=""
      data-aside-mobile={asideMobile}
      data-resizable={isResizable ? "" : undefined}
      data-scroll-mode={scrollMode}
      defaultOpen={defaultSidebarOpen}
      navigate={navigate}
      open={sidebarOpen}
      reduceMotion={reduceMotion}
      side={sidebarSide}
      toggleShortcut={toggleShortcut}
      variant={sidebarVariant}
      onOpenChange={onSidebarOpenChange}
      {...rest}
    >
      <AppLayoutContext value={contextValue}>
        <AppLayoutShell
          aside={aside}
          asideDefaultSize={asideDefaultSize}
          asideMaxSize={asideMaxSize}
          asideMinSize={asideMinSize}
          asideResizeBehavior={asideResizeBehavior}
          footer={footer}
          isAsideResizable={isAsideResizable}
          isDesktopAsideOpen={isDesktopAsideOpen}
          isMobileAsideOpen={isMobileAsideOpen}
          isSidebarResizable={isSidebarResizable}
          navbar={navbar}
          navigate={navigate}
          resizableAutoSaveId={resizableAutoSaveId}
          scrollMode={scrollMode}
          setDesktopAsideOpen={setDesktopAsideOpen}
          setMobileAsideOpen={setMobileAsideOpen}
          sidebar={sidebar}
          sidebarDefaultSize={sidebarDefaultSize}
          sidebarMaxSize={sidebarMaxSize}
          sidebarMinSize={sidebarMinSize}
          sidebarResizeBehavior={sidebarResizeBehavior}
          sidebarSide={sidebarSide}
          toolbar={toolbar}
          usesAsideSheet={usesAsideSheet}
        >
          {children}
        </AppLayoutShell>
      </AppLayoutContext>
    </SidebarProvider>
  );
};

AppLayoutRoot.displayName = "HeroUI.AppLayout";

/* -------------------------------------------------------------------------------------------------
 * Shell (inside the provider, so it can read the sidebar state)
 * -----------------------------------------------------------------------------------------------*/
interface AppLayoutShellProps {
  aside: ReactNode;
  asideDefaultSize: ResizableSize;
  asideMaxSize: ResizableSize;
  asideMinSize: ResizableSize;
  asideResizeBehavior: ResizeBehavior;
  children: ReactNode;
  footer: ReactNode;
  isAsideResizable: boolean;
  isDesktopAsideOpen: boolean;
  isMobileAsideOpen: boolean;
  isSidebarResizable: boolean;
  navbar: ReactNode;
  navigate?: (href: string) => void;
  resizableAutoSaveId?: string;
  scrollMode: AppLayoutScrollMode;
  setDesktopAsideOpen: (open: boolean) => void;
  setMobileAsideOpen: (open: boolean) => void;
  sidebar: ReactNode;
  sidebarDefaultSize: ResizableSize;
  sidebarMaxSize: ResizableSize;
  sidebarMinSize: ResizableSize;
  sidebarResizeBehavior: ResizeBehavior;
  sidebarSide: SidebarSide;
  toolbar: ReactNode;
  usesAsideSheet: boolean;
}

/**
 * Keeps a collapsible resizable panel in sync with a boolean open state: state changes collapse /
 * expand the panel, and dragging the panel shut (or open again) updates the state.
 */
function usePanelSync(isEnabled: boolean, isOpen: boolean, setOpen: (open: boolean) => void) {
  const panelRef = useRef<ImperativePanelHandle | null>(null);
  const isOpenRef = useRef(isOpen);

  // Latest value for the stable `onCollapse` / `onExpand` callbacks. They only run from the
  // group's ResizeObserver (after commit), so syncing in a layout effect is early enough.
  useLayoutEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Layout effect: a panel that starts closed collapses before the first paint (no flash).
  useLayoutEffect(() => {
    if (!isEnabled) return;

    /** Returns `false` while the group has not registered the panel yet. */
    const sync = () => {
      const panel = panelRef.current;

      if (!panel) return false;

      try {
        const isCollapsed = panel.isCollapsed();

        if (isOpen && isCollapsed) panel.expand();
        else if (!isOpen && !isCollapsed) panel.collapse();

        return true;
      } catch {
        // A panel that joins an existing group (e.g. the aside when the viewport grows past `lg`)
        // only gets its constraints after the group's own effects ran; retry on the next frame.
        return false;
      }
    };

    sync();

    // The group measures itself (and registers new panels) asynchronously; re-check once it has
    // a size, retrying for a few frames while the panel is still unknown to the group.
    let attempts = 0;
    let frame = 0;
    const tick = () => {
      if (sync() || ++attempts >= MAX_SYNC_FRAMES) return;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isEnabled, isOpen]);

  const onCollapse = useCallback(() => {
    if (isOpenRef.current) setOpen(false);
  }, [setOpen]);

  const onExpand = useCallback(() => {
    if (!isOpenRef.current) setOpen(true);
  }, [setOpen]);

  return {onCollapse, onExpand, panelRef};
}

const AppLayoutShell = ({
  aside,
  asideDefaultSize,
  asideMaxSize,
  asideMinSize,
  asideResizeBehavior,
  children,
  footer,
  isAsideResizable,
  isDesktopAsideOpen,
  isMobileAsideOpen,
  isSidebarResizable,
  navbar,
  navigate,
  resizableAutoSaveId,
  scrollMode,
  setDesktopAsideOpen,
  setMobileAsideOpen,
  sidebar,
  sidebarDefaultSize,
  sidebarMaxSize,
  sidebarMinSize,
  sidebarResizeBehavior,
  sidebarSide,
  toolbar,
  usesAsideSheet,
}: AppLayoutShellProps) => {
  const {collapsible, isOpen: isSidebarOpen, setOpen: setSidebarOpen} = useSidebar();
  const {hasAside, slots} = useAppLayoutContext("Root");
  const {content, hasMobileAside, mobileAside} = splitChildren(children);

  const navbarLayout = useMemo(() => ({isInAppLayout: true, navigate}), [navigate]);
  const isSidebarCollapsible = collapsible === "offcanvas";

  const sidebarSync = usePanelSync(
    isSidebarResizable && isSidebarCollapsible,
    isSidebarOpen,
    setSidebarOpen,
  );
  const asideSync = usePanelSync(isAsideResizable, isDesktopAsideOpen, setDesktopAsideOpen);

  const isContentScroll = scrollMode === "content";

  const body = (
    <div className={slots.body()} data-slot="app-layout-body">
      {navbar != null && navbar !== false ? (
        <header className={slots.header()} data-slot="app-layout-header">
          <NavbarLayoutContext value={navbarLayout}>{navbar}</NavbarLayoutContext>
        </header>
      ) : null}
      {toolbar != null && toolbar !== false ? (
        <div className={slots.toolbar()} data-slot="app-layout-toolbar">
          {toolbar}
        </div>
      ) : null}
      <main
        aria-label={isContentScroll ? "Scrollable main content" : undefined}
        className={slots.main()}
        data-scroll-mode={scrollMode}
        data-slot="app-layout-main"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- in content scroll mode <main> is the scroll container and must be keyboard-focusable to scroll (mirrors the original DOM)
        tabIndex={isContentScroll ? 0 : undefined}
      >
        {content}
      </main>
      {footer != null && footer !== false ? (
        <div className={slots.footer()} data-slot="app-layout-footer">
          {footer}
        </div>
      ) : null}
    </div>
  );

  const staticAside =
    hasAside && !isAsideResizable ? (
      <aside
        className={slots.aside()}
        data-slot="app-layout-aside"
        data-state={isDesktopAsideOpen ? "open" : "closed"}
      >
        {aside}
      </aside>
    ) : null;

  const sheetContent = hasMobileAside ? mobileAside : aside;
  const mobileAsideSheet =
    usesAsideSheet && sheetContent != null && sheetContent !== false ? (
      <Sheet isOpen={isMobileAsideOpen} placement="right" onOpenChange={setMobileAsideOpen}>
        <Sheet.Backdrop>
          <Sheet.Content className={slots.mobileAsideSheet()}>
            <Sheet.Dialog aria-label="Aside panel" className={slots.mobileAsideDialog()}>
              <div className={slots.mobileAside()} data-slot="app-layout-mobile-aside">
                {sheetContent}
              </div>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    ) : null;

  if (!isSidebarResizable && !isAsideResizable) {
    return (
      <>
        {sidebar}
        {body}
        {staticAside}
        {mobileAsideSheet}
      </>
    );
  }

  const sidebarPanel = isSidebarResizable ? (
    <Resizable.Panel
      key="sidebar-panel"
      className={slots.sidebarPanel()}
      collapsedSize={0}
      collapsible={isSidebarCollapsible}
      defaultSize={sidebarDefaultSize}
      groupResizeBehavior={sidebarResizeBehavior}
      handleRef={sidebarSync.panelRef}
      id={SIDEBAR_PANEL_ID}
      maxSize={sidebarMaxSize}
      minSize={sidebarMinSize}
      onCollapse={sidebarSync.onCollapse}
      onExpand={sidebarSync.onExpand}
    >
      {sidebar}
    </Resizable.Panel>
  ) : null;

  const isSidebarRight = sidebarSide === "right";

  return (
    <>
      {isSidebarResizable ? null : sidebar}
      <Resizable autoSaveId={resizableAutoSaveId} className={slots.resizable()}>
        {sidebarPanel && !isSidebarRight ? (
          <>
            {sidebarPanel}
            <Resizable.Handle key="sidebar-handle" />
          </>
        ) : null}
        <Resizable.Panel key="main-panel" className={slots.mainPanel()} id={MAIN_PANEL_ID}>
          {body}
        </Resizable.Panel>
        {isAsideResizable ? (
          <>
            <Resizable.Handle key="aside-handle" />
            <Resizable.Panel
              key="aside-panel"
              collapsible
              className={slots.asidePanel()}
              collapsedSize={0}
              defaultSize={asideDefaultSize}
              groupResizeBehavior={asideResizeBehavior}
              handleRef={asideSync.panelRef}
              id={ASIDE_PANEL_ID}
              maxSize={asideMaxSize}
              minSize={asideMinSize}
              onCollapse={asideSync.onCollapse}
              onExpand={asideSync.onExpand}
            >
              {aside}
            </Resizable.Panel>
          </>
        ) : null}
        {sidebarPanel && isSidebarRight ? (
          <>
            <Resizable.Handle key="sidebar-handle" />
            {sidebarPanel}
          </>
        ) : null}
      </Resizable>
      {staticAside}
      {mobileAsideSheet}
    </>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Shared tooltip wrapper (AppLayout.MenuToggle / AppLayout.AsideTrigger)
 * -----------------------------------------------------------------------------------------------*/
interface AppLayoutTooltipProps {
  /** Tooltip placement relative to the trigger. @default "bottom" */
  placement?: "top" | "bottom" | "left" | "right";
  /** Delay in ms before showing the tooltip. */
  delay?: number;
  /** Delay in ms before hiding the tooltip. */
  closeDelay?: number;
  /** Offset from the trigger element in px. */
  offset?: number;
  /** Whether to show the tooltip arrow. @default false */
  showArrow?: boolean;
  /** Whether the tooltip is disabled. @default false */
  isDisabled?: boolean;
  /** Class name applied to the `Tooltip.Content` element. */
  className?: string;
}

function withTooltip(
  trigger: ReactElement,
  content: ReactNode,
  tooltipProps: AppLayoutTooltipProps | undefined,
) {
  const {
    className,
    closeDelay,
    delay,
    isDisabled = false,
    offset,
    placement = "bottom",
    showArrow = false,
  } = tooltipProps ?? {};
  const hasContent = content != null && content !== false;

  return (
    <Tooltip closeDelay={closeDelay} delay={delay} isDisabled={isDisabled || !hasContent}>
      <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
      <Tooltip.Content
        className={className}
        offset={offset}
        placement={placement}
        showArrow={showArrow}
      >
        {showArrow ? <Tooltip.Arrow /> : null}
        {content}
      </Tooltip.Content>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------------------------------
 * AppLayout.MenuToggle (opens Sidebar.Mobile; visible below `md` only)
 * -----------------------------------------------------------------------------------------------*/
interface AppLayoutMenuToggleProps extends ComponentProps<typeof Button> {
  /** Tooltip content. When omitted, no tooltip is rendered. */
  tooltip?: ReactNode;
  /** Props forwarded to the internal Tooltip. */
  tooltipProps?: AppLayoutTooltipProps;
}

const AppLayoutMenuToggle = ({
  "aria-label": ariaLabel = "Open navigation",
  children,
  className,
  isIconOnly,
  onPress,
  size = "sm",
  tooltip,
  tooltipProps,
  variant = "ghost",
  ...rest
}: AppLayoutMenuToggleProps) => {
  const {slots} = useAppLayoutContext("MenuToggle");
  const {setMobileOpen} = useSidebar();

  const button = (
    <Button
      aria-label={ariaLabel}
      className={composeButtonClassName(className, slots.menuToggle())}
      data-slot="app-layout-menu-toggle"
      isIconOnly={isIconOnly ?? children == null}
      size={size}
      variant={variant}
      onPress={(event) => {
        onPress?.(event);
        setMobileOpen(true);
      }}
      {...rest}
    >
      {children ?? <BarsIcon />}
    </Button>
  );

  return tooltip != null && tooltip !== false ? withTooltip(button, tooltip, tooltipProps) : button;
};

AppLayoutMenuToggle.displayName = "HeroUI.AppLayout.MenuToggle";

/* -------------------------------------------------------------------------------------------------
 * AppLayout.AsideTrigger (toggles the aside; the mobile sheet with `asideMobile="sheet"`)
 * -----------------------------------------------------------------------------------------------*/
interface AppLayoutAsideTriggerProps extends ComponentProps<typeof Button> {
  /** Tooltip content while the aside is closed. */
  closedTooltip?: ReactNode;
  /** Tooltip content while the aside is open. */
  openTooltip?: ReactNode;
  /** Props forwarded to the internal Tooltip (both states). */
  tooltipProps?: AppLayoutTooltipProps;
}

const AppLayoutAsideTrigger = ({
  "aria-label": ariaLabel = "Toggle aside panel",
  children,
  className,
  closedTooltip,
  isIconOnly,
  onPress,
  openTooltip,
  size = "sm",
  tooltipProps,
  variant = "ghost",
  ...rest
}: AppLayoutAsideTriggerProps) => {
  const {isAsideOpen, slots, toggleAside} = useAppLayoutContext("AsideTrigger");

  const button = (
    <Button
      aria-expanded={isAsideOpen}
      aria-label={ariaLabel}
      className={composeButtonClassName(className, slots.asideTrigger())}
      data-slot="app-layout-aside-trigger"
      data-state={isAsideOpen ? "open" : "closed"}
      isIconOnly={isIconOnly ?? children == null}
      size={size}
      variant={variant}
      onPress={(event) => {
        onPress?.(event);
        toggleAside();
      }}
      {...rest}
    >
      {children ?? <LayoutSideContentRightIcon />}
    </Button>
  );

  const hasTooltips =
    (openTooltip != null && openTooltip !== false) ||
    (closedTooltip != null && closedTooltip !== false);

  if (!hasTooltips) return button;

  return withTooltip(button, isAsideOpen ? openTooltip : closedTooltip, tooltipProps);
};

AppLayoutAsideTrigger.displayName = "HeroUI.AppLayout.AsideTrigger";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
type ButtonClassName = ComponentProps<typeof Button>["className"];

/** Prepends the BEM class to a (possibly render-prop) Button className. */
function composeButtonClassName(className: ButtonClassName, bem: string): ButtonClassName {
  if (typeof className === "function") {
    return (renderProps) => {
      const resolved = className(renderProps);

      return resolved ? `${bem} ${resolved}` : bem;
    };
  }

  return className ? `${bem} ${className}` : bem;
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {AppLayoutRoot, AppLayoutMenuToggle, AppLayoutAsideTrigger, AppLayoutMobileAside};

export type {
  AppLayoutRootProps,
  AppLayoutMenuToggleProps,
  AppLayoutAsideTriggerProps,
  AppLayoutMobileAsideProps,
  AppLayoutTooltipProps,
};
