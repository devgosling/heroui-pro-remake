"use client";

import type {
  SidebarCollapsible,
  SidebarContextValue,
  SidebarRailPhase,
  SidebarSide,
  SidebarVariant,
} from "./sidebar-context";
import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {Button, RouterProvider, ScrollShadow, Separator, Sheet} from "@heroui/react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {UNSAFE_PortalProvider} from "react-aria/PortalProvider";

import {
  SIDEBAR_RAIL_DURATION,
  SidebarContext,
  SidebarMenuSettingsContext,
  SidebarMobileContext,
  SidebarRailContext,
  useIsMobile,
  useSidebarContext,
  useSidebarShortcut,
  writeSidebarCookie,
} from "./sidebar-context";
import {sidebarVariants} from "./sidebar.styles";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Provider
 * -----------------------------------------------------------------------------------------------*/
interface SidebarProviderProps extends ComponentPropsWithRef<"div"> {
  /** Controlled open/expanded state. */
  open?: boolean;
  /** Initial open state (uncontrolled). @default true */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Which side the sidebar is on. @default "left" */
  side?: SidebarSide;
  /** Visual style variant. @default "sidebar" */
  variant?: SidebarVariant;
  /** Collapse behavior. @default "icon" */
  collapsible?: SidebarCollapsible;
  /** Client-side navigation for `Sidebar.MenuItem` hrefs (e.g. `router.push`). */
  navigate?: (href: string) => void;
  /** Disables nested `Sidebar.Menu` expand/collapse animations. @default false */
  reduceMotion?: boolean;
  /** Shortcut that toggles the sidebar; `false` / `null` disables it. @default "mod+b" */
  toggleShortcut?: string | false | null;
}

const SidebarProvider = ({
  children,
  className,
  collapsible = "icon",
  defaultOpen = true,
  navigate,
  onOpenChange,
  open,
  reduceMotion = false,
  side = "left",
  toggleShortcut = "mod+b",
  variant = "sidebar",
  ...rest
}: SidebarProviderProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const isMobile = useIsMobile();
  const [isMobileOpen, setMobileOpen] = useState(false);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
        writeSidebarCookie(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setMobileOpen((current) => !current);
    else setOpen(!isOpen);
  }, [isMobile, isOpen, setOpen]);

  useSidebarShortcut(toggleShortcut, toggleSidebar);

  // The mobile sheet never outlives the mobile layout.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with the matchMedia breakpoint (external store); closes the sheet after leaving the mobile layout
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const state = collapsible === "none" || isOpen ? "expanded" : "collapsed";
  const slots = useMemo(() => sidebarVariants({side, variant}), [side, variant]);

  // While the panel width animates, open submenus fold away (or unfold) with it instead of being
  // dropped from / added to the tree at once (see Sidebar.MenuItem).
  const [railState, setRailState] = useState(state);
  const [railPhase, setRailPhase] = useState<SidebarRailPhase>(null);

  if (railState !== state) {
    setRailState(state);
    setRailPhase(state === "collapsed" ? "collapsing" : "expanding");
  }

  useEffect(() => {
    if (!railPhase) return;

    const timer = window.setTimeout(() => setRailPhase(null), SIDEBAR_RAIL_DURATION);

    return () => window.clearTimeout(timer);
  }, [railPhase, railState]);

  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      collapsible,
      isMobile,
      isMobileOpen,
      isOpen,
      reduceMotion,
      setMobileOpen,
      setOpen,
      side,
      slots,
      state,
      toggleSidebar,
      variant,
    }),
    [
      collapsible,
      isMobile,
      isMobileOpen,
      isOpen,
      reduceMotion,
      setOpen,
      side,
      slots,
      state,
      toggleSidebar,
      variant,
    ],
  );

  // `forceReload` items reach the router with `{forceReload: true}` and bypass `navigate`.
  const routerNavigate = useCallback(
    (href: string, routerOptions?: unknown) => {
      if ((routerOptions as {forceReload?: boolean} | undefined)?.forceReload) {
        window.location.href = href;
      } else {
        navigate?.(href);
      }
    },
    [navigate],
  );

  const provider = (
    <div
      className={slots.provider({className})}
      data-sidebar="provider"
      data-slot="sidebar-provider"
      data-state={state}
      {...rest}
    >
      {children}
    </div>
  );

  return (
    <SidebarContext value={contextValue}>
      <SidebarRailContext value={railPhase}>
        {navigate ? (
          <RouterProvider navigate={routerNavigate as (href: string) => void}>
            {provider}
          </RouterProvider>
        ) : (
          provider
        )}
      </SidebarRailContext>
    </SidebarContext>
  );
};

SidebarProvider.displayName = "HeroUI.Sidebar.Provider";

/* -------------------------------------------------------------------------------------------------
 * Sidebar (panel)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarRootProps extends ComponentPropsWithRef<"aside"> {}

const SidebarRoot = ({children, className, ...rest}: SidebarRootProps) => {
  const {collapsible, side, slots, state, variant} = useSidebarContext();

  const panel = (
    <aside
      className={slots.base({className})}
      data-collapsible={collapsible}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
      {...rest}
    >
      {children}
    </aside>
  );

  if (collapsible !== "offcanvas") return panel;

  // Offcanvas: a spacer animates its width to 0 while the panel slides out of view.
  return (
    <div className={slots.offcanvasWrapper()} data-side={side} data-state={state}>
      {panel}
    </div>
  );
};

SidebarRoot.displayName = "HeroUI.Sidebar";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Header / Sidebar.Footer
 * -----------------------------------------------------------------------------------------------*/
interface SidebarHeaderProps extends ComponentPropsWithRef<"div"> {}

const SidebarHeader = ({children, className, ...rest}: SidebarHeaderProps) => {
  const {slots} = useSidebarContext();

  return (
    <div className={slots.header({className})} data-slot="sidebar-header" {...rest}>
      {children}
    </div>
  );
};

SidebarHeader.displayName = "HeroUI.Sidebar.Header";

interface SidebarFooterProps extends ComponentPropsWithRef<"div"> {}

const SidebarFooter = ({children, className, ...rest}: SidebarFooterProps) => {
  const {slots} = useSidebarContext();

  return (
    <div className={slots.footer({className})} data-slot="sidebar-footer" {...rest}>
      {children}
    </div>
  );
};

SidebarFooter.displayName = "HeroUI.Sidebar.Footer";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Content (HeroUI ScrollShadow with a hidden scrollbar)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarContentProps extends ComponentProps<typeof ScrollShadow> {}

const SidebarContent = ({
  children,
  className,
  hideScrollBar = true,
  ...rest
}: SidebarContentProps) => {
  const {slots} = useSidebarContext();

  return (
    <ScrollShadow
      className={slots.content({className})}
      data-slot="sidebar-content"
      hideScrollBar={hideScrollBar}
      {...rest}
    >
      {children}
    </ScrollShadow>
  );
};

SidebarContent.displayName = "HeroUI.Sidebar.Content";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Group / Sidebar.GroupLabel
 * -----------------------------------------------------------------------------------------------*/
interface SidebarGroupProps extends ComponentPropsWithRef<"div"> {
  /** Whether pressing a menu item in this group closes the mobile sheet. @default true */
  closeMobileOnAction?: boolean;
}

const SidebarGroup = ({children, className, closeMobileOnAction, ...rest}: SidebarGroupProps) => {
  const {slots} = useSidebarContext();
  const settings = useMemo(() => ({closeMobileOnAction}), [closeMobileOnAction]);

  return (
    <SidebarMenuSettingsContext value={settings}>
      <div className={slots.group({className})} data-slot="sidebar-group" {...rest}>
        {children}
      </div>
    </SidebarMenuSettingsContext>
  );
};

SidebarGroup.displayName = "HeroUI.Sidebar.Group";

interface SidebarGroupLabelProps extends ComponentPropsWithRef<"div"> {}

const SidebarGroupLabel = ({children, className, ...rest}: SidebarGroupLabelProps) => {
  const {slots} = useSidebarContext();

  return (
    <div className={slots.groupLabel({className})} data-slot="sidebar-group-label" {...rest}>
      {children}
    </div>
  );
};

SidebarGroupLabel.displayName = "HeroUI.Sidebar.GroupLabel";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Separator (HeroUI Separator; also valid inside a Sidebar.Menu collection)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarSeparatorProps extends ComponentProps<typeof Separator> {}

const SidebarSeparator = ({className, ...rest}: SidebarSeparatorProps) => {
  const {slots} = useSidebarContext();

  return (
    <Separator className={slots.separator({className})} data-slot="sidebar-separator" {...rest} />
  );
};

SidebarSeparator.displayName = "HeroUI.Sidebar.Separator";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Trigger (HeroUI Button, ghost / sm / icon-only)
 * -----------------------------------------------------------------------------------------------*/
const SidebarToggleIcon = () => (
  <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
    <rect
      height="10.5"
      rx="2.25"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12.5"
      x="1.75"
      y="2.75"
    />
    <path d="M5.25 3v10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

interface SidebarTriggerProps extends ComponentProps<typeof Button> {}

const SidebarTrigger = ({
  "aria-label": ariaLabel = "Toggle sidebar",
  children,
  isIconOnly,
  onPress,
  size = "sm",
  variant = "ghost",
  ...rest
}: SidebarTriggerProps) => {
  const {toggleSidebar} = useSidebarContext();

  return (
    <Button
      aria-label={ariaLabel}
      data-slot="sidebar-trigger"
      isIconOnly={isIconOnly ?? children == null}
      size={size}
      variant={variant}
      onPress={(event) => {
        onPress?.(event);
        toggleSidebar();
      }}
      {...rest}
    >
      {children ?? <SidebarToggleIcon />}
    </Button>
  );
};

SidebarTrigger.displayName = "HeroUI.Sidebar.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Rail (thin edge strip that toggles the sidebar)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarRailProps extends ComponentPropsWithRef<"button"> {}

const SidebarRail = ({className, onClick, ...rest}: SidebarRailProps) => {
  const {slots, toggleSidebar} = useSidebarContext();

  return (
    <button
      aria-label="Toggle sidebar"
      className={slots.rail({className})}
      data-slot="sidebar-rail"
      tabIndex={-1}
      type="button"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleSidebar();
      }}
      {...rest}
    />
  );
};

SidebarRail.displayName = "HeroUI.Sidebar.Rail";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Main
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMainProps extends ComponentPropsWithRef<"main"> {}

const SidebarMain = ({children, className, ...rest}: SidebarMainProps) => {
  const {slots} = useSidebarContext();

  return (
    <main className={slots.main({className})} data-slot="sidebar-main" {...rest}>
      {children}
    </main>
  );
};

SidebarMain.displayName = "HeroUI.Sidebar.Main";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Mobile (HeroUI Sheet below the `md` breakpoint, nothing on desktop)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMobileProps extends ComponentPropsWithRef<"div"> {
  /** Backdrop style for the mobile sheet. @default "blur" */
  backdrop?: "blur" | "opaque" | "transparent";
  children?: ReactNode;
}

const SidebarMobile = ({
  "aria-label": ariaLabel = "Sidebar",
  backdrop = "blur",
  children,
  className,
  ...rest
}: SidebarMobileProps) => {
  const {isMobile, isMobileOpen, setMobileOpen, side, slots} = useSidebarContext();
  const overlayContainerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setMobileOpen(false), [setMobileOpen]);
  const mobileContext = useMemo(() => ({close, isInMobile: true}), [close]);
  const getContainer = useCallback(() => overlayContainerRef.current, []);

  if (!isMobile) return null;

  return (
    <Sheet isOpen={isMobileOpen} placement={side} onOpenChange={setMobileOpen}>
      <Sheet.Backdrop variant={backdrop}>
        <Sheet.Content className={slots.mobileSheet()}>
          <Sheet.Dialog aria-label={ariaLabel} className={slots.mobileDialog()}>
            <UNSAFE_PortalProvider getContainer={getContainer}>
              <SidebarMobileContext value={mobileContext}>
                <div className={slots.mobile({className})} data-slot="sidebar-mobile" {...rest}>
                  {children}
                </div>
              </SidebarMobileContext>
            </UNSAFE_PortalProvider>
          </Sheet.Dialog>
          <div
            ref={overlayContainerRef}
            className={slots.mobileOverlayContainer()}
            data-slot="sidebar-mobile-overlay-container"
          />
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
};

SidebarMobile.displayName = "HeroUI.Sidebar.Mobile";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SidebarProvider,
  SidebarRoot,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  SidebarMain,
  SidebarMobile,
};

export type {
  SidebarProviderProps,
  SidebarRootProps,
  SidebarHeaderProps,
  SidebarContentProps,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarGroupLabelProps,
  SidebarSeparatorProps,
  SidebarTriggerProps,
  SidebarRailProps,
  SidebarMainProps,
  SidebarMobileProps,
};
