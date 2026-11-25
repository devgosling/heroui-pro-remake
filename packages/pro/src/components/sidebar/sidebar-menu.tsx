"use client";

import type {SidebarMenuItemTooltipProps} from "./sidebar-tooltip";
import type {ComponentProps, ComponentPropsWithRef, ReactElement, ReactNode} from "react";
import type {CollectionRenderer} from "react-aria-components/CollectionBuilder";
import type {
  TreeHeaderProps,
  TreeItemContentRenderProps,
  TreeItemProps,
  TreeProps,
  TreeSectionProps,
} from "react-aria-components/Tree";

import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {
  CollectionRendererContext,
  DefaultCollectionRenderer,
} from "react-aria-components/CollectionBuilder";
import {
  Tree,
  TreeHeader,
  TreeItem,
  TreeItemContent,
  TreeSection,
  TreeStateContext,
} from "react-aria-components/Tree";
import {cx} from "tailwind-variants";

import {composeTwRenderProps, useMergedRef} from "../../utils";

import {
  SIDEBAR_RAIL_DURATION,
  SidebarMenuSettingsContext,
  SidebarMobileContext,
  SidebarRailContext,
  prefersReducedMotion,
  useSidebarContext,
} from "./sidebar-context";
import {SidebarRowTooltip} from "./sidebar-tooltip";

/* -------------------------------------------------------------------------------------------------
 * Motion timings (measured on the HeroUI Pro demos)
 * -----------------------------------------------------------------------------------------------*/
const ENTER_DURATION = 220;
const ENTER_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const EXIT_HEIGHT_DURATION = 200;
const EXIT_HEIGHT_EASING = "cubic-bezier(0.42, 0, 0.58, 1)";
const EXIT_OPACITY_DURATION = 100;
const EXIT_OPACITY_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
function isElementOfType(
  node: ReactNode,
  type: unknown,
): node is ReactElement<{
  children?: ReactNode;
  className?: string;
}> {
  return isValidElement(node) && node.type === type;
}

/** Plain text of a React subtree, skipping the given component types. */
function getTextContent(node: ReactNode, skip: ReadonlyArray<unknown>): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => getTextContent(child, skip)).join("");

  if (isValidElement<{children?: ReactNode}>(node)) {
    if (skip.includes(node.type)) return "";

    return getTextContent(node.props.children, skip);
  }

  return "";
}

/** Whether a React subtree contains an element of the given component type. */
function containsElementOfType(node: ReactNode, type: unknown): boolean {
  let found = false;

  const visit = (child: ReactNode) => {
    if (found || !isValidElement<{children?: ReactNode}>(child)) return;
    if (child.type === type) {
      found = true;

      return;
    }
    Children.forEach(child.props.children, visit);
  };

  Children.forEach(node, visit);

  return found;
}

/** Finds the first `Sidebar.MenuLabel` in an item's content and returns its text. */
function findLabelText(node: ReactNode): string | undefined {
  let result: string | undefined;

  const visit = (child: ReactNode) => {
    if (result !== undefined || !isValidElement<{children?: ReactNode}>(child)) return;

    if (child.type === SidebarMenuLabel) {
      result = getTextContent(child.props.children, [SidebarMenuTrigger, SidebarMenuIndicator]);

      return;
    }

    // Do not descend into nested items or actions.
    if (child.type === SidebarSubmenu || child.type === SidebarMenuActions) return;

    Children.forEach(child.props.children, visit);
  };

  Children.forEach(node, visit);

  return result?.trim() || undefined;
}

/* -------------------------------------------------------------------------------------------------
 * Animated submenu sections (`[data-tree-motion-section]`)
 * React Aria renders a Tree as a flat list of rows. This renderer groups the rows of every
 * expanded item in a wrapper so their height and opacity can be animated on expand / collapse.
 * -----------------------------------------------------------------------------------------------*/
type SidebarCollection = ComponentProps<CollectionRenderer["CollectionRoot"]>["collection"];
type SidebarCollectionNode = NonNullable<ReturnType<SidebarCollection["getItem"]>>;

function getNode(
  collection: SidebarCollection,
  key: SidebarCollectionNode["key"] | null | undefined,
) {
  return key == null ? null : collection.getItem(key);
}

function hasChildRows(collection: SidebarCollection, node: SidebarCollectionNode) {
  let child = getNode(collection, node.firstChildKey);

  while (child) {
    if (child.type === "item" || child.type === "loader") return true;
    child = getNode(collection, child.nextKey);
  }

  return false;
}

interface SidebarTreeMotionSectionProps {
  /** Grow in when mounted open (submenus coming back while the icon rail expands). */
  appear?: boolean;
  children: ReactNode;
  isExpanded: boolean;
}

const SidebarTreeMotionSection = ({
  appear,
  children,
  isExpanded,
}: SidebarTreeMotionSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const animationsRef = useRef<Animation[]>([]);
  const previousRef = useRef<boolean | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const [isPresent, setIsPresent] = useState(isExpanded);
  const [isExiting, setIsExiting] = useState(false);

  if (isExpanded && !isPresent) setIsPresent(true);

  useLayoutEffect(() => {
    const element = ref.current;
    const previous = previousRef.current;
    const isNewElement = element !== lastElementRef.current;

    previousRef.current = isExpanded;
    lastElementRef.current = element;

    if (!element) return;

    // Sections that are open when they first mount appear without animation, except submenus that
    // come back while the icon rail expands: those unfold together with the panel.
    if (previous === null ? !(appear && isExpanded) : previous === isExpanded) return;

    // A freshly mounted section grows from nothing; an interrupted one continues from where it is.
    const fromHeight = isNewElement ? 0 : element.getBoundingClientRect().height;
    const fromOpacity = isNewElement
      ? 0
      : Number.parseFloat(getComputedStyle(element).opacity) || 0;

    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];

    if (prefersReducedMotion(element) || typeof element.animate !== "function") {
      element.style.removeProperty("overflow");
      setIsExiting(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion is read from the DOM (matchMedia / data-reduce-motion ancestor), so the section unmounts right after that check instead of after the exit animation
      if (!isExpanded) setIsPresent(false);

      return;
    }

    element.style.overflow = "hidden";

    if (isExpanded) {
      setIsExiting(false);

      // Unfolding with the icon rail follows the panel's width transition.
      const timing =
        previous === null
          ? {duration: SIDEBAR_RAIL_DURATION, easing: "ease"}
          : {duration: ENTER_DURATION, easing: ENTER_EASING};
      const toHeight = element.getBoundingClientRect().height;
      const height = element.animate(
        [{height: `${fromHeight}px`}, {height: `${toHeight}px`}],
        timing,
      );
      const opacity = element.animate([{opacity: fromOpacity}, {opacity: 1}], timing);

      height.onfinish = () => element.style.removeProperty("overflow");
      animationsRef.current = [height, opacity];
    } else {
      setIsExiting(true);

      const height = element.animate([{height: `${fromHeight}px`}, {height: "0px"}], {
        duration: EXIT_HEIGHT_DURATION,
        easing: EXIT_HEIGHT_EASING,
        fill: "forwards",
      });
      const opacity = element.animate([{opacity: fromOpacity}, {opacity: 0}], {
        duration: EXIT_OPACITY_DURATION,
        easing: EXIT_OPACITY_EASING,
        fill: "forwards",
      });

      height.onfinish = () => {
        animationsRef.current = [];
        setIsPresent(false);
        setIsExiting(false);
      };
      animationsRef.current = [height, opacity];
    }
  }, [appear, isExpanded]);

  useEffect(
    () => () => {
      animationsRef.current.forEach((animation) => animation.cancel());
      animationsRef.current = [];
      // A remount (React StrictMode re-runs effects) starts over like a fresh section, so an
      // appearing submenu still unfolds instead of keeping its cancelled animation.
      previousRef.current = null;
      lastElementRef.current = null;
    },
    [],
  );

  if (!isPresent) return null;

  const isHidden = isExiting || !isExpanded;

  return (
    <div
      ref={ref}
      aria-hidden={isHidden || undefined}
      data-tree-motion-section=""
      inert={isHidden || undefined}
      role="presentation"
      style={isHidden ? {pointerEvents: "none"} : undefined}
    >
      {children}
    </div>
  );
};

interface SidebarCollectionLevelProps {
  collection: SidebarCollection;
  firstKey: SidebarCollectionNode["key"] | null | undefined;
}

const SidebarCollectionLevel = ({collection, firstKey}: SidebarCollectionLevelProps) => {
  const state = use(TreeStateContext);
  const sidebar = useSidebarContext();
  const railPhase = use(SidebarRailContext);
  const mobile = use(SidebarMobileContext);
  // Open submenus fold away as soon as the panel starts collapsing to the icon rail; their rows
  // leave the tree once the width transition is over (see Sidebar.MenuItem).
  const isIconCollapsed =
    sidebar.collapsible === "icon" && sidebar.state === "collapsed" && !mobile.isInMobile;
  const rendered: ReactNode[] = [];
  let node = getNode(collection, firstKey);

  while (node) {
    // Content nodes are rendered by their TreeItem.
    if (node.type !== "content") {
      rendered.push(<Fragment key={String(node.key)}>{node.render?.(node)}</Fragment>);

      if (node.type === "item" && hasChildRows(collection, node)) {
        rendered.push(
          <SidebarTreeMotionSection
            key={`${String(node.key)}:children`}
            appear={railPhase === "expanding"}
            isExpanded={!!state?.expandedKeys.has(node.key) && !isIconCollapsed}
          >
            <SidebarCollectionLevel collection={collection} firstKey={node.firstChildKey} />
          </SidebarTreeMotionSection>,
        );
      }
    }

    node = getNode(collection, node.nextKey);
  }

  return <>{rendered}</>;
};

const SidebarCollectionRenderer: CollectionRenderer = {
  CollectionBranch: ({collection, parent}) => (
    <SidebarCollectionLevel collection={collection} firstKey={parent.firstChildKey} />
  ),
  CollectionRoot: ({collection}) => (
    <SidebarCollectionLevel collection={collection} firstKey={collection.getFirstKey()} />
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Menu
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuProps<T extends object = object> extends Omit<
  TreeProps<T>,
  | "selectionMode"
  | "selectionBehavior"
  | "selectedKeys"
  | "defaultSelectedKeys"
  | "onSelectionChange"
  | "disallowEmptySelection"
> {
  /**
   * Whether pressing a menu item closes the mobile sidebar sheet.
   * @default inherited from Sidebar.Group, otherwise true
   */
  closeMobileOnAction?: boolean;
  /** Disables submenu expand/collapse animations for this menu. @default inherited */
  reduceMotion?: boolean;
  /** Submenu guide lines: `true` = always, `false` = never, `"hover"` = on menu hover. */
  showGuideLines?: boolean | "hover";
}

const SidebarMenu = <T extends object = object>({
  children,
  className,
  closeMobileOnAction,
  reduceMotion,
  showGuideLines = true,
  ...rest
}: SidebarMenuProps<T> & {ref?: React.Ref<HTMLDivElement>}) => {
  const {reduceMotion: providerReduceMotion, slots} = useSidebarContext();
  const parent = use(SidebarMenuSettingsContext);
  const resolvedReduceMotion = reduceMotion ?? parent.reduceMotion ?? providerReduceMotion;
  const resolvedCloseMobile = closeMobileOnAction ?? parent.closeMobileOnAction;
  const settings = useMemo(
    () => ({closeMobileOnAction: resolvedCloseMobile, reduceMotion: resolvedReduceMotion}),
    [resolvedCloseMobile, resolvedReduceMotion],
  );

  return (
    <SidebarMenuSettingsContext value={settings}>
      <CollectionRendererContext
        value={resolvedReduceMotion ? DefaultCollectionRenderer : SidebarCollectionRenderer}
      >
        <Tree
          {...rest}
          className={composeTwRenderProps(className, slots.menu())}
          data-sidebar="menu"
          data-slot="sidebar-menu"
          data-guide-lines={
            showGuideLines === "hover" ? "hover" : showGuideLines ? "always" : "never"
          }
        >
          {children}
        </Tree>
      </CollectionRendererContext>
    </SidebarMenuSettingsContext>
  );
};

SidebarMenu.displayName = "HeroUI.Sidebar.Menu";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuSection / Sidebar.MenuHeader
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuSectionProps<T extends object = object> extends TreeSectionProps<T> {
  ref?: React.Ref<HTMLDivElement>;
}

const SidebarMenuSection = <T extends object = object>({
  className,
  ...rest
}: SidebarMenuSectionProps<T>) => {
  const {slots} = useSidebarContext();

  return (
    <TreeSection
      {...rest}
      className={cx(slots.menuSection(), className)}
      data-slot="sidebar-menu-section"
    />
  );
};

SidebarMenuSection.displayName = "HeroUI.Sidebar.MenuSection";

interface SidebarMenuHeaderProps extends TreeHeaderProps {
  className?: string;
  children?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

const SidebarMenuHeader = ({className, ...rest}: SidebarMenuHeaderProps) => {
  const {slots} = useSidebarContext();

  return (
    <TreeHeader
      {...rest}
      className={cx(slots.menuHeader(), className)}
      data-slot="sidebar-menu-header"
    />
  );
};

SidebarMenuHeader.displayName = "HeroUI.Sidebar.MenuHeader";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuItem
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuItemProps<T extends object = object> extends Omit<
  TreeItemProps<T>,
  "children" | "textValue"
> {
  /** Item content (icon, label, chip, actions) plus an optional `Sidebar.Submenu`. */
  children?: ReactNode;
  /** Text used for typeahead and as the default tooltip. Defaults to the label text. */
  textValue?: string;
  /** Overrides the inherited `closeMobileOnAction` for this item. */
  closeMobileOnAction?: boolean;
  /** Forces a full page reload instead of client-side navigation. @default false */
  forceReload?: boolean;
  /** Marks the item as the current page (`aria-current="page"`). @default false */
  isCurrent?: boolean;
  /** Tooltip shown while the sidebar is collapsed to its icon rail. @default label text */
  tooltip?: ReactNode;
  /** Shows a tooltip on hover / keyboard focus even when the sidebar is expanded. */
  tooltipProps?: SidebarMenuItemTooltipProps;
  ref?: React.Ref<HTMLDivElement>;
}

const EXTERNAL_HREF = /^https?:\/\//i;

const SidebarMenuItem = <T extends object = object>({
  children,
  className,
  closeMobileOnAction,
  forceReload = false,
  href,
  isCurrent = false,
  onAction,
  ref,
  rel,
  routerOptions,
  target,
  textValue,
  tooltip,
  tooltipProps,
  ...rest
}: SidebarMenuItemProps<T>) => {
  const {collapsible, side, slots, state} = useSidebarContext();
  const settings = use(SidebarMenuSettingsContext);
  const mobile = use(SidebarMobileContext);
  const rowRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rowRef);

  const content: ReactNode[] = [];
  const submenus: ReactNode[] = [];

  Children.toArray(children).forEach((child) => {
    if (isElementOfType(child, SidebarSubmenu)) submenus.push(child);
    else content.push(child);
  });

  const isIconCollapsed = collapsible === "icon" && state === "collapsed" && !mobile.isInMobile;
  // On the icon rail nested items are dropped from the tree (the expanded keys are kept). That
  // happens once the panel has finished collapsing, so an open submenu can fold away with it.
  // Only rows with submenus subscribe to the rail phase (React's `use` may run conditionally).
  const railPhase = submenus.length > 0 ? use(SidebarRailContext) : null;
  const isOnIconRail = isIconCollapsed && railPhase !== "collapsing";
  const hasSubmenu = submenus.length > 0 && !isOnIconRail;
  // React Aria requires an expand button on expandable rows for screen reader users. Items that
  // only show a `Sidebar.MenuIndicator` get a visually hidden one.
  const needsHiddenTrigger = hasSubmenu && !containsElementOfType(content, SidebarMenuTrigger);
  const labelText = textValue ?? findLabelText(content) ?? rest["aria-label"] ?? "";
  const shouldCloseMobile = closeMobileOnAction ?? settings.closeMobileOnAction ?? true;

  // Links and items with an `onAction` handler are actionable (and close the mobile sheet). Items
  // with children keep React Aria's default "press toggles expansion" behavior, and plain rows
  // without a link or handler stay non-pressable, like Pro.
  const handleAction =
    onAction || (href && !hasSubmenu)
      ? () => {
          onAction?.();
          if (mobile.isInMobile && shouldCloseMobile) mobile.close();
        }
      : undefined;

  const isExternal = !!href && EXTERNAL_HREF.test(href);
  const showTooltip = !!tooltipProps || isIconCollapsed;

  const itemContent =
    content.length === 1 && isElementOfType(content[0], SidebarMenuItemContent) ? (
      content[0]
    ) : (
      <SidebarMenuItemContent>{content}</SidebarMenuItemContent>
    );

  // `aria-current` is not a TreeItem prop; add it through React Aria's `render` hook.
  const renderRow = (domProps: ComponentPropsWithRef<"div">) => (
    <div {...domProps} aria-current={isCurrent ? "page" : undefined} />
  );

  return (
    <TreeItem
      {...rest}
      {...({render: renderRow} as object)}
      ref={mergedRef}
      className={composeTwRenderProps(className, slots.menuItem())}
      data-current={isCurrent || undefined}
      data-slot="sidebar-menu-item"
      href={href}
      rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
      target={target ?? (isExternal ? "_blank" : undefined)}
      textValue={labelText}
      routerOptions={
        forceReload
          ? ({...(routerOptions as object | undefined), forceReload: true} as never)
          : routerOptions
      }
      onAction={handleAction}
    >
      <TreeItemContent>
        {(renderProps: TreeItemContentRenderProps) => (
          <>
            {itemContent}
            {needsHiddenTrigger ? (
              <ButtonPrimitive
                className="sr-only"
                data-slot="sidebar-menu-hidden-trigger"
                slot="chevron"
              />
            ) : null}
            {showTooltip ? (
              <SidebarRowTooltip
                {...tooltipProps}
                content={tooltipProps?.content ?? tooltip ?? labelText}
                isFocusVisible={renderProps.isFocusVisible}
                placement={tooltipProps?.placement ?? (side === "right" ? "left" : "right")}
                triggerRef={rowRef}
              />
            ) : null}
          </>
        )}
      </TreeItemContent>
      {hasSubmenu ? submenus : null}
    </TreeItem>
  );
};

SidebarMenuItem.displayName = "HeroUI.Sidebar.MenuItem";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuItemContent
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuItemContentProps extends ComponentPropsWithRef<"div"> {}

const SidebarMenuItemContent = ({children, className, ...rest}: SidebarMenuItemContentProps) => {
  const {slots} = useSidebarContext();

  return (
    <div
      className={slots.menuItemContent({className})}
      data-slot="sidebar-menu-item-content"
      {...rest}
    >
      {children}
    </div>
  );
};

SidebarMenuItemContent.displayName = "HeroUI.Sidebar.MenuItemContent";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuIcon / Sidebar.MenuChip / Sidebar.MenuActions
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuIconProps extends ComponentPropsWithRef<"span"> {}

const SidebarMenuIcon = ({children, className, ...rest}: SidebarMenuIconProps) => {
  const {slots} = useSidebarContext();

  return (
    <span className={slots.menuIcon({className})} data-slot="sidebar-menu-icon" {...rest}>
      {children}
    </span>
  );
};

SidebarMenuIcon.displayName = "HeroUI.Sidebar.MenuIcon";

interface SidebarMenuChipProps extends ComponentPropsWithRef<"span"> {}

const SidebarMenuChip = ({children, className, ...rest}: SidebarMenuChipProps) => {
  const {slots} = useSidebarContext();

  return (
    <span className={slots.menuChip({className})} data-slot="sidebar-menu-chip" {...rest}>
      {children}
    </span>
  );
};

SidebarMenuChip.displayName = "HeroUI.Sidebar.MenuChip";

interface SidebarMenuActionsProps extends ComponentPropsWithRef<"div"> {}

const SidebarMenuActions = ({children, className, ...rest}: SidebarMenuActionsProps) => {
  const {slots} = useSidebarContext();

  return (
    <div className={slots.menuActions({className})} data-slot="sidebar-menu-actions" {...rest}>
      {children}
    </div>
  );
};

SidebarMenuActions.displayName = "HeroUI.Sidebar.MenuActions";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuAction
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuActionProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const SidebarMenuAction = ({children, className, ...rest}: SidebarMenuActionProps) => {
  const {slots} = useSidebarContext();

  return (
    <ButtonPrimitive
      data-slot="sidebar-menu-action"
      {...rest}
      className={composeTwRenderProps(className, slots.menuAction())}
    >
      {children}
    </ButtonPrimitive>
  );
};

SidebarMenuAction.displayName = "HeroUI.Sidebar.MenuAction";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuIndicator
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuIndicatorProps extends ComponentPropsWithRef<"svg"> {}

const SidebarMenuIndicator = ({children, className, ...rest}: SidebarMenuIndicatorProps) => {
  const {slots} = useSidebarContext();

  if (isValidElement<{className?: string}>(children)) {
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      "aria-hidden": true,
      className: slots.menuIndicator({className: cx(children.props.className, className)}),
      "data-slot": "sidebar-menu-indicator",
    });
  }

  return (
    <svg
      aria-hidden="true"
      className={slots.menuIndicator({className})}
      data-slot="sidebar-menu-indicator"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="m6 3.5 4.5 4.5L6 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};

SidebarMenuIndicator.displayName = "HeroUI.Sidebar.MenuIndicator";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuTrigger (React Aria `slot="chevron"` button of the tree row)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const SidebarMenuTrigger = ({children, className, ...rest}: SidebarMenuTriggerProps) => {
  const {slots} = useSidebarContext();

  return (
    <ButtonPrimitive
      data-slot="sidebar-menu-trigger"
      slot="chevron"
      {...rest}
      className={composeTwRenderProps(className, slots.menuTrigger())}
    >
      {children ?? <SidebarMenuIndicator />}
    </ButtonPrimitive>
  );
};

SidebarMenuTrigger.displayName = "HeroUI.Sidebar.MenuTrigger";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.MenuLabel (moves trailing Sidebar.MenuTrigger elements out of the label)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarMenuLabelProps extends ComponentPropsWithRef<"span"> {}

const SidebarMenuLabel = ({children, className, ...rest}: SidebarMenuLabelProps) => {
  const {slots} = useSidebarContext();
  const text: ReactNode[] = [];
  const indicators: ReactNode[] = [];
  const triggers: ReactNode[] = [];

  Children.toArray(children).forEach((child) => {
    if (isElementOfType(child, SidebarMenuTrigger)) triggers.push(child);
    else if (isElementOfType(child, SidebarMenuIndicator)) indicators.push(child);
    else text.push(child);
  });

  return (
    <>
      <span
        className={slots.menuLabel({className})}
        data-sidebar="label"
        data-slot="sidebar-menu-label"
        {...rest}
      >
        <span className={slots.menuLabelText()} data-slot="sidebar-menu-label-text">
          {text}
        </span>
        {indicators}
      </span>
      {triggers}
    </>
  );
};

SidebarMenuLabel.displayName = "HeroUI.Sidebar.MenuLabel";

/* -------------------------------------------------------------------------------------------------
 * Sidebar.Submenu (nested items become child rows of the tree item)
 * -----------------------------------------------------------------------------------------------*/
interface SidebarSubmenuProps {
  children?: ReactNode;
}

const SidebarSubmenu = ({children}: SidebarSubmenuProps) => <>{children}</>;

SidebarSubmenu.displayName = "HeroUI.Sidebar.Submenu";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SidebarMenu,
  SidebarMenuSection,
  SidebarMenuHeader,
  SidebarMenuItem,
  SidebarMenuItemContent,
  SidebarMenuIcon,
  SidebarMenuLabel,
  SidebarMenuChip,
  SidebarMenuActions,
  SidebarMenuAction,
  SidebarMenuTrigger,
  SidebarMenuIndicator,
  SidebarSubmenu,
};

export type {
  SidebarMenuProps,
  SidebarMenuSectionProps,
  SidebarMenuHeaderProps,
  SidebarMenuItemProps,
  SidebarMenuItemContentProps,
  SidebarMenuIconProps,
  SidebarMenuLabelProps,
  SidebarMenuChipProps,
  SidebarMenuActionsProps,
  SidebarMenuActionProps,
  SidebarMenuTriggerProps,
  SidebarMenuIndicatorProps,
  SidebarSubmenuProps,
};
