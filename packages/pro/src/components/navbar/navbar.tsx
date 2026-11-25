"use client";

import type {NavbarVariants} from "./navbar.styles";
import type {SpringOptions} from "./spring";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  HTMLAttributeAnchorTarget,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from "react";

import {Separator} from "@heroui/react";
import {use, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {shouldClientNavigate, useRouter} from "react-aria/private/utils/openLink";
import {usePreventScroll} from "react-aria/usePreventScroll";
import {ToggleButton as ToggleButtonPrimitive} from "react-aria-components/ToggleButton";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {NavbarContext, NavbarLayoutContext} from "./navbar-context";
import {navbarVariants} from "./navbar.styles";
import {getSpringCurve, prefersReducedMotion} from "./spring";

/* -------------------------------------------------------------------------------------------------
 * Motion constants (measured on the Pro demos)
 * -----------------------------------------------------------------------------------------------*/
/** Spring that slides the bar out of / back into view with `hideOnScroll` (critically damped). */
const HIDE_SPRING: SpringOptions = {damping: 40, stiffness: 400};
/** Spring that opens the mobile menu (height + opacity, ~0.4% overshoot). */
const MENU_ENTER_SPRING: SpringOptions = {damping: 30, stiffness: 300};
/** Tween that closes the mobile menu. */
const MENU_EXIT_TIMING = {duration: 200, easing: "ease-out"};
/**
 * The menu height (a layout property) starts one frame after its opacity, both when opening and
 * closing; measured on the demos (height trails opacity by ~16ms at 60Hz).
 */
const MENU_HEIGHT_DELAY = 1000 / 60;

const EXTERNAL_HREF = /^https?:\/\//i;

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
function useControllableBoolean(
  value: boolean | undefined,
  defaultValue: boolean,
  onChange: ((value: boolean) => void) | undefined,
) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const currentRef = useRef(current);

  // eslint-disable-next-line react-hooks/refs -- latest-value ref for the stable public setter (useNavbar().setMenuOpen); descendants may call it from their own layout effects, which run before this hook's effects, so it is assigned during render to keep the dedupe check current
  currentRef.current = current;

  const setValue = useCallback(
    (next: boolean) => {
      if (next === currentRef.current) return;
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue] as const;
}

function getScrollTop(target: HTMLElement | Window) {
  return target instanceof Window ? target.scrollY : target.scrollTop;
}

/**
 * Tracks the scroll direction of `parentRef` (or the window). The bar hides on any downward scroll
 * once the offset is past its own height, and comes back on any upward scroll (even 1px).
 */
function useHideOnScroll(
  isEnabled: boolean,
  navRef: RefObject<HTMLElement | null>,
  parentRef?: RefObject<HTMLElement | null>,
) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tearing down the scroll subscription resets its derived state (same commit timing as the original)
      setIsHidden(false);

      return;
    }

    const target: HTMLElement | Window = parentRef?.current ?? window;
    let previous = getScrollTop(target);

    const onScroll = () => {
      const current = getScrollTop(target);
      const delta = current - previous;

      previous = current;
      if (delta === 0) return;
      setIsHidden(delta > 0 && current > (navRef.current?.offsetHeight ?? 0));
    };

    target.addEventListener("scroll", onScroll, {passive: true});

    return () => target.removeEventListener("scroll", onScroll);
  }, [isEnabled, navRef, parentRef]);

  return isHidden;
}

type AnimationTiming = {duration: number; easing: string};

type AnimateOptions = {
  /** Start values used when nothing is running (otherwise the currently shown values are used). */
  initial?: Record<string, string>;
  /** Per-property start delay in ms (the start value is held during the delay). */
  delays?: Record<string, number>;
};

function pickKeyframe(values: Record<string, string>, properties: string[]) {
  return Object.fromEntries(properties.map((property) => [property, values[property]]));
}

/**
 * Animates `element` to `to` (inline styles are committed first, so the final state survives the
 * animation). Running `previous` animations are replaced from the values they currently show,
 * which keeps interrupted transitions continuous. Returns the started animations, ordered by start
 * delay (the last one finishes last).
 */
function animateTo(
  element: HTMLElement,
  to: Record<string, string>,
  timing: AnimationTiming,
  previous: Animation[],
  {delays, initial}: AnimateOptions = {},
): Animation[] {
  const isRunning = previous.some((animation) => animation.playState === "running");
  const computed = getComputedStyle(element);
  const from: Record<string, string> = {};

  for (const property of Object.keys(to)) {
    from[property] =
      !isRunning && initial?.[property] !== undefined
        ? initial[property]
        : computed.getPropertyValue(property);
  }
  for (const animation of previous) animation.cancel();

  for (const [property, value] of Object.entries(to)) {
    element.style.setProperty(property, value);
  }

  if (prefersReducedMotion(element) || typeof element.animate !== "function") return [];

  const groups = new Map<number, string[]>();

  for (const property of Object.keys(to)) {
    const delay = delays?.[property] ?? 0;

    groups.set(delay, [...(groups.get(delay) ?? []), property]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([delay, properties]) =>
      element.animate([pickKeyframe(from, properties), pickKeyframe(to, properties)], {
        ...timing,
        delay,
        fill: delay > 0 ? "backwards" : "none",
      }),
    );
}

/* -------------------------------------------------------------------------------------------------
 * Navbar Root
 * -----------------------------------------------------------------------------------------------*/
interface NavbarRootProps extends ComponentPropsWithRef<"nav">, NavbarVariants {
  /** CSS height for the bar. Sets `--navbar-height` inline. @default "4rem" */
  height?: string;
  /** Hide the navbar when scrolling down and reveal it on scroll up. @default false */
  hideOnScroll?: boolean;
  /** Scroll container used by `hideOnScroll`. Defaults to the window. */
  parentRef?: RefObject<HTMLElement | null>;
  /** Controlled mobile menu open state. */
  isMenuOpen?: boolean;
  /** Initial mobile menu open state (uncontrolled). @default false */
  defaultMenuOpen?: boolean;
  /** Called when the mobile menu state changes. */
  onMenuOpenChange?: (isOpen: boolean) => void;
  /** Lock body scroll while the mobile menu is open. @default true */
  shouldBlockScroll?: boolean;
  /** Programmatic navigation used by `Navbar.Item` / `Navbar.MenuItem` when pressed. */
  navigate?: (href: string) => void;
}

const NavbarRoot = ({
  children,
  className,
  defaultMenuOpen = false,
  height = "4rem",
  hideOnScroll = false,
  isMenuOpen: isMenuOpenProp,
  maxWidth,
  navigate: navigateProp,
  onMenuOpenChange,
  parentRef,
  position,
  ref,
  shouldBlockScroll = true,
  size,
  style,
  ...rest
}: NavbarRootProps) => {
  const layout = use(NavbarLayoutContext);
  const navRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRef(ref, navRef);
  const animationsRef = useRef<Animation[]>([]);
  const isFirstRenderRef = useRef(true);

  const [isMenuOpen, setMenuOpen] = useControllableBoolean(
    isMenuOpenProp,
    defaultMenuOpen,
    onMenuOpenChange,
  );
  const isHidden = useHideOnScroll(hideOnScroll, navRef, parentRef);
  const navigate = navigateProp ?? layout.navigate;

  usePreventScroll({isDisabled: !(isMenuOpen && shouldBlockScroll)});

  // Slide the bar out of view (and back) with a spring; layout is never affected.
  useLayoutEffect(() => {
    const element = navRef.current;

    if (!element || !hideOnScroll) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      if (!isHidden) return;
    }

    animationsRef.current = animateTo(
      element,
      {transform: isHidden ? "translateY(-100%)" : "none"},
      getSpringCurve(HIDE_SPRING),
      animationsRef.current,
    );
  }, [hideOnScroll, isHidden]);

  useEffect(
    () => () => {
      for (const animation of animationsRef.current) animation.cancel();
    },
    [],
  );

  const slots = useMemo(
    () => navbarVariants({maxWidth, position, size}),
    [maxWidth, position, size],
  );

  const contextValue = useMemo<NavbarContext>(
    () => ({height, isHidden, isMenuOpen, navigate, setMenuOpen, slots}),
    [height, isHidden, isMenuOpen, navigate, setMenuOpen, slots],
  );

  const rootStyle = useMemo(
    () =>
      ({
        "--navbar-height": height,
        ...(hideOnScroll ? {transform: "none"} : null),
        ...style,
      }) as CSSProperties,
    [height, hideOnScroll, style],
  );

  return (
    <NavbarContext value={contextValue}>
      <nav
        ref={mergedRef}
        className={slots.base({className})}
        data-hidden={isHidden ? "true" : undefined}
        data-in-app-layout={layout.isInAppLayout ? "true" : undefined}
        data-menu-open={isMenuOpen ? "true" : undefined}
        data-slot="navbar"
        style={rootStyle}
        {...rest}
      >
        {children}
      </nav>
    </NavbarContext>
  );
};

NavbarRoot.displayName = "HeroUI.Navbar";

/* -------------------------------------------------------------------------------------------------
 * Navbar Header
 * -----------------------------------------------------------------------------------------------*/
interface NavbarHeaderProps extends ComponentPropsWithRef<"header"> {}

const NavbarHeader = ({className, ...rest}: NavbarHeaderProps) => {
  const {slots} = use(NavbarContext);

  return <header className={slots.header({className})} data-slot="navbar-header" {...rest} />;
};

NavbarHeader.displayName = "HeroUI.Navbar.Header";

/* -------------------------------------------------------------------------------------------------
 * Navbar Brand (polymorphic)
 * -----------------------------------------------------------------------------------------------*/
type NavbarBrandRenderProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  "data-slot": string;
};

interface NavbarBrandProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  /** Override the rendered element (e.g. to render a framework `<Link>`). */
  render?: (props: NavbarBrandRenderProps) => ReactElement;
}

const NavbarBrand = ({className, render, ...rest}: NavbarBrandProps) => {
  const {slots} = use(NavbarContext);
  const props: NavbarBrandRenderProps = {
    ...rest,
    className: slots.brand({className}),
    "data-slot": "navbar-brand",
  };

  if (render) return render(props);

  const {ref, ...divProps} = props;

  return <div ref={ref as Ref<HTMLDivElement>} {...divProps} />;
};

NavbarBrand.displayName = "HeroUI.Navbar.Brand";

/* -------------------------------------------------------------------------------------------------
 * Navbar Content
 * -----------------------------------------------------------------------------------------------*/
interface NavbarContentProps extends ComponentPropsWithRef<"div"> {}

const NavbarContent = ({className, ...rest}: NavbarContentProps) => {
  const {slots} = use(NavbarContext);

  return <div className={slots.content({className})} data-slot="navbar-content" {...rest} />;
};

NavbarContent.displayName = "HeroUI.Navbar.Content";

/* -------------------------------------------------------------------------------------------------
 * Shared link behaviour (Navbar.Item / Navbar.MenuItem)
 * -----------------------------------------------------------------------------------------------*/
type NavbarLinkRenderProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  href?: string;
  target?: HTMLAttributeAnchorTarget;
  rel?: string;
  download?: boolean | string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "data-slot": string;
  "data-current"?: "true";
};

interface NavbarLinkProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
  /** Destination URL. Renders an `<a>` when set, otherwise a `<button>`. */
  href?: string;
  /** Anchor target. External `http(s)://` links default to `_blank`. */
  target?: HTMLAttributeAnchorTarget;
  /** Anchor rel. External links default to `noopener noreferrer`. */
  rel?: string;
  /** Anchor download attribute. */
  download?: boolean | string;
  /** Button type when no `href` is set. @default "button" */
  type?: "button" | "submit" | "reset";
  /** Marks the item as the current page (`aria-current="page"`, `data-current="true"`). */
  isCurrent?: boolean;
  /** Skip the navigate callback and use `window.location.href` for this item. */
  forceReload?: boolean;
  /** Disables the item. */
  isDisabled?: boolean;
  /** Override the rendered element (e.g. to render a Next.js / React Router `<Link>`). */
  render?: (props: NavbarLinkRenderProps) => ReactElement;
}

function hasModifier(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
}

function useNavbarLink(
  {
    children,
    download,
    forceReload = false,
    href,
    isCurrent = false,
    isDisabled = false,
    onClick,
    ref,
    rel,
    render,
    target,
    type = "button",
    ...rest
  }: NavbarLinkProps,
  className: string,
  slot: string,
  onAfterPress?: () => void,
) {
  const {navigate} = use(NavbarContext);
  const router = useRouter();
  const resolvedHref = router.useHref(href ?? "");
  const isExternal = !!href && EXTERNAL_HREF.test(href);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    onClick?.(event);

    if (isDisabled) {
      event.preventDefault();

      return;
    }

    // A handler that prevented the default opts out of navigation and keeps the menu open.
    if (event.defaultPrevented) return;

    const element = event.currentTarget;

    if (href && !isExternal) {
      const isPlainClick = event.button === 0 && !hasModifier(event);

      if (forceReload) {
        if (isPlainClick && (!target || target === "_self")) {
          event.preventDefault();
          window.location.assign(href);
        }
      } else if (element instanceof HTMLAnchorElement && shouldClientNavigate(element, event)) {
        if (navigate) {
          event.preventDefault();
          navigate(href);
        } else if (!router.isNative) {
          event.preventDefault();
          router.open(element, event, href, undefined);
        }
      }
    }

    onAfterPress?.();
  };

  const props: NavbarLinkRenderProps = {
    ...rest,
    "aria-current": isCurrent ? "page" : undefined,
    "aria-disabled": isDisabled && href ? true : undefined,
    children,
    className,
    "data-current": isCurrent ? "true" : undefined,
    "data-slot": slot,
    onClick: handleClick,
    ref,
  } as NavbarLinkRenderProps;

  if (href) {
    props.href = isDisabled ? undefined : forceReload ? href : resolvedHref || href;
    props.target = target ?? (isExternal ? "_blank" : undefined);
    props.rel = rel ?? (isExternal ? "noopener noreferrer" : undefined);
    if (download !== undefined) props.download = download;
  } else {
    props.type = type;
    if (isDisabled) props.disabled = true;
  }

  if (render) return render(props);

  const {children: content, ref: elementRef, ...domProps} = props;

  if (href) {
    return (
      <a ref={elementRef as Ref<HTMLAnchorElement>} {...domProps}>
        {content}
      </a>
    );
  }

  return (
    <button ref={elementRef as Ref<HTMLButtonElement>} {...domProps}>
      {content}
    </button>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Navbar Item
 * -----------------------------------------------------------------------------------------------*/
interface NavbarItemProps extends NavbarLinkProps {}

const NavbarItem = ({className, ...rest}: NavbarItemProps) => {
  const {slots} = use(NavbarContext);

  return useNavbarLink(rest, slots.item({className}), "navbar-item");
};

NavbarItem.displayName = "HeroUI.Navbar.Item";

/* -------------------------------------------------------------------------------------------------
 * Navbar Label
 * -----------------------------------------------------------------------------------------------*/
interface NavbarLabelProps extends ComponentPropsWithRef<"span"> {}

const NavbarLabel = ({className, ...rest}: NavbarLabelProps) => {
  const {slots} = use(NavbarContext);

  return <span className={slots.label({className})} data-slot="navbar-label" {...rest} />;
};

NavbarLabel.displayName = "HeroUI.Navbar.Label";

/* -------------------------------------------------------------------------------------------------
 * Navbar Separator (OSS Separator, vertical)
 * -----------------------------------------------------------------------------------------------*/
interface NavbarSeparatorProps extends Omit<
  ComponentPropsWithRef<typeof Separator>,
  "orientation"
> {}

const NavbarSeparator = ({className, ...rest}: NavbarSeparatorProps) => {
  const {slots} = use(NavbarContext);

  return (
    <Separator
      className={slots.separator({className})}
      data-slot="navbar-separator"
      orientation="vertical"
      {...rest}
    />
  );
};

NavbarSeparator.displayName = "HeroUI.Navbar.Separator";

/* -------------------------------------------------------------------------------------------------
 * Navbar Spacer
 * -----------------------------------------------------------------------------------------------*/
interface NavbarSpacerProps extends ComponentPropsWithRef<"div"> {}

const NavbarSpacer = ({className, ...rest}: NavbarSpacerProps) => {
  const {slots} = use(NavbarContext);

  return (
    <div
      aria-hidden="true"
      className={slots.spacer({className})}
      data-slot="navbar-spacer"
      {...rest}
    />
  );
};

NavbarSpacer.displayName = "HeroUI.Navbar.Spacer";

/* -------------------------------------------------------------------------------------------------
 * Navbar MenuToggle (RAC ToggleButton bound to the menu state)
 * -----------------------------------------------------------------------------------------------*/
interface NavbarMenuToggleProps extends Omit<
  ComponentPropsWithRef<typeof ToggleButtonPrimitive>,
  "isSelected" | "defaultSelected" | "children"
> {
  /** Screen-reader label for the toggle. @default "Toggle navigation menu" */
  srLabel?: string;
  /** Custom icon. When omitted, the built-in animated hamburger / close icon is used. */
  children?: ReactNode;
}

const NavbarMenuToggle = ({
  children,
  className,
  onChange,
  srLabel = "Toggle navigation menu",
  ...rest
}: NavbarMenuToggleProps) => {
  const {isMenuOpen, setMenuOpen, slots} = use(NavbarContext);
  const resolvedClassName = useResolvedClassName(className, slots.menuToggle());

  const handleChange = useCallback(
    (isSelected: boolean) => {
      setMenuOpen(isSelected);
      onChange?.(isSelected);
    },
    [onChange, setMenuOpen],
  );

  return (
    <ToggleButtonPrimitive
      aria-label={srLabel}
      data-slot="navbar-menu-toggle"
      {...rest}
      className={resolvedClassName}
      isSelected={isMenuOpen}
      onChange={handleChange}
    >
      {children ?? <span className={slots.menuToggleIcon()} data-slot="navbar-menu-toggle-icon" />}
    </ToggleButtonPrimitive>
  );
};

NavbarMenuToggle.displayName = "HeroUI.Navbar.MenuToggle";

/* -------------------------------------------------------------------------------------------------
 * Navbar Menu (animated mobile dropdown)
 * -----------------------------------------------------------------------------------------------*/
interface NavbarMenuProps extends ComponentPropsWithRef<"div"> {}

const MENU_OPEN_HEIGHT = "calc(100dvh - var(--navbar-height))";
const MENU_CLOSED_HEIGHT = "calc(0dvh - var(--navbar-height))";
const MENU_CLOSED_STYLE: CSSProperties = {height: "0px", opacity: 0};

const NavbarMenu = ({className, ref, style, ...rest}: NavbarMenuProps) => {
  const {isMenuOpen, slots} = use(NavbarContext);
  const [isRendered, setIsRendered] = useState(isMenuOpen);
  const menuRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, menuRef);
  const animationsRef = useRef<Animation[]>([]);

  // Mount synchronously when opening; unmount after the exit animation.
  if (isMenuOpen && !isRendered) setIsRendered(true);

  useLayoutEffect(() => {
    const element = menuRef.current;

    if (!element) return;

    if (isMenuOpen) {
      // Grows from `calc(0dvh - h)` so the box stays collapsed to its padding for the first part
      // of the spring, exactly like the original.
      animationsRef.current = animateTo(
        element,
        {height: MENU_OPEN_HEIGHT, opacity: "1"},
        getSpringCurve(MENU_ENTER_SPRING),
        animationsRef.current,
        {
          delays: {height: MENU_HEIGHT_DELAY},
          initial: {height: MENU_CLOSED_HEIGHT, opacity: "0"},
        },
      );

      return;
    }

    const animations = animateTo(
      element,
      {height: MENU_CLOSED_HEIGHT, opacity: "0"},
      MENU_EXIT_TIMING,
      animationsRef.current,
      {delays: {height: MENU_HEIGHT_DELAY}},
    );
    const last = animations[animations.length - 1];

    animationsRef.current = animations;

    if (!last) {
      setIsRendered(false);

      return;
    }

    last.onfinish = () => {
      animationsRef.current = [];
      setIsRendered(false);
    };
  }, [isMenuOpen, isRendered]);

  useEffect(
    () => () => {
      for (const animation of animationsRef.current) animation.cancel();
    },
    [],
  );

  if (!isRendered) return null;

  return (
    <div
      ref={mergedRef}
      className={slots.menu({className})}
      data-slot="navbar-menu"
      style={{...MENU_CLOSED_STYLE, ...style}}
      {...rest}
    />
  );
};

NavbarMenu.displayName = "HeroUI.Navbar.Menu";

/* -------------------------------------------------------------------------------------------------
 * Navbar MenuItem
 * -----------------------------------------------------------------------------------------------*/
interface NavbarMenuItemProps extends NavbarLinkProps {}

const NavbarMenuItem = ({className, ...rest}: NavbarMenuItemProps) => {
  const {setMenuOpen, slots} = use(NavbarContext);
  const closeMenu = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  return useNavbarLink(rest, slots.menuItem({className}), "navbar-menu-item", closeMenu);
};

NavbarMenuItem.displayName = "HeroUI.Navbar.MenuItem";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  NavbarRoot,
  NavbarHeader,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarLabel,
  NavbarSeparator,
  NavbarSpacer,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
};

export type {
  NavbarRootProps,
  NavbarHeaderProps,
  NavbarBrandProps,
  NavbarBrandRenderProps,
  NavbarContentProps,
  NavbarItemProps,
  NavbarLinkRenderProps as NavbarItemRenderProps,
  NavbarLabelProps,
  NavbarSeparatorProps,
  NavbarSpacerProps,
  NavbarMenuToggleProps,
  NavbarMenuProps,
  NavbarMenuItemProps,
};
