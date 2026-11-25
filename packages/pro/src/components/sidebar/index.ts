import type {ComponentProps} from "react";

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMobile,
  SidebarProvider,
  SidebarRail,
  SidebarRoot,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuActions,
  SidebarMenuChip,
  SidebarMenuHeader,
  SidebarMenuIcon,
  SidebarMenuIndicator,
  SidebarMenuItem,
  SidebarMenuItemContent,
  SidebarMenuLabel,
  SidebarMenuSection,
  SidebarMenuTrigger,
  SidebarSubmenu,
} from "./sidebar-menu";
import {SidebarPage, SidebarPages} from "./sidebar-pages";
import {SidebarTooltip} from "./sidebar-tooltip";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Sidebar = Object.assign(SidebarRoot, {
  Content: SidebarContent,
  Footer: SidebarFooter,
  Group: SidebarGroup,
  GroupLabel: SidebarGroupLabel,
  Header: SidebarHeader,
  Main: SidebarMain,
  Menu: SidebarMenu,
  MenuAction: SidebarMenuAction,
  MenuActions: SidebarMenuActions,
  MenuChip: SidebarMenuChip,
  MenuHeader: SidebarMenuHeader,
  MenuIcon: SidebarMenuIcon,
  MenuIndicator: SidebarMenuIndicator,
  MenuItem: SidebarMenuItem,
  MenuItemContent: SidebarMenuItemContent,
  MenuLabel: SidebarMenuLabel,
  MenuSection: SidebarMenuSection,
  MenuTrigger: SidebarMenuTrigger,
  Mobile: SidebarMobile,
  Page: SidebarPage,
  Pages: SidebarPages,
  Provider: SidebarProvider,
  Rail: SidebarRail,
  Root: SidebarRoot,
  Separator: SidebarSeparator,
  Submenu: SidebarSubmenu,
  Tooltip: SidebarTooltip,
  Trigger: SidebarTrigger,
});

export type Sidebar = {
  Props: ComponentProps<typeof SidebarRoot>;
  RootProps: ComponentProps<typeof SidebarRoot>;
  ProviderProps: ComponentProps<typeof SidebarProvider>;
  HeaderProps: ComponentProps<typeof SidebarHeader>;
  ContentProps: ComponentProps<typeof SidebarContent>;
  FooterProps: ComponentProps<typeof SidebarFooter>;
  GroupProps: ComponentProps<typeof SidebarGroup>;
  GroupLabelProps: ComponentProps<typeof SidebarGroupLabel>;
  MenuProps: ComponentProps<typeof SidebarMenu>;
  MenuSectionProps: ComponentProps<typeof SidebarMenuSection>;
  MenuHeaderProps: ComponentProps<typeof SidebarMenuHeader>;
  MenuItemProps: ComponentProps<typeof SidebarMenuItem>;
  MenuItemContentProps: ComponentProps<typeof SidebarMenuItemContent>;
  MenuIconProps: ComponentProps<typeof SidebarMenuIcon>;
  MenuLabelProps: ComponentProps<typeof SidebarMenuLabel>;
  MenuChipProps: ComponentProps<typeof SidebarMenuChip>;
  MenuActionsProps: ComponentProps<typeof SidebarMenuActions>;
  MenuActionProps: ComponentProps<typeof SidebarMenuAction>;
  MenuTriggerProps: ComponentProps<typeof SidebarMenuTrigger>;
  MenuIndicatorProps: ComponentProps<typeof SidebarMenuIndicator>;
  SubmenuProps: ComponentProps<typeof SidebarSubmenu>;
  SeparatorProps: ComponentProps<typeof SidebarSeparator>;
  TriggerProps: ComponentProps<typeof SidebarTrigger>;
  RailProps: ComponentProps<typeof SidebarRail>;
  MainProps: ComponentProps<typeof SidebarMain>;
  PagesProps: ComponentProps<typeof SidebarPages>;
  PageProps: ComponentProps<typeof SidebarPage>;
  MobileProps: ComponentProps<typeof SidebarMobile>;
  TooltipProps: ComponentProps<typeof SidebarTooltip>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SidebarRoot,
  SidebarProvider,
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
} from "./sidebar";

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
} from "./sidebar-menu";

export {SidebarPages, SidebarPage} from "./sidebar-pages";
export {SidebarPagesContext, useSidebarPages} from "./sidebar-pages-context";
export {SidebarTooltip} from "./sidebar-tooltip";

export type {
  SidebarRootProps,
  SidebarRootProps as SidebarProps,
  SidebarProviderProps,
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
} from "./sidebar";

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
} from "./sidebar-menu";

export type {SidebarPagesProps, SidebarPageProps} from "./sidebar-pages";
export type {UseSidebarPagesReturn} from "./sidebar-pages-context";
export type {SidebarTooltipProps, SidebarMenuItemTooltipProps} from "./sidebar-tooltip";

/* -------------------------------------------------------------------------------------------------
 * Hooks & Context
 * -----------------------------------------------------------------------------------------------*/
export {SidebarContext, useSidebar, SIDEBAR_COOKIE_NAME} from "./sidebar-context";

export type {
  SidebarCollapsible,
  SidebarContextValue,
  SidebarSide,
  SidebarState,
  SidebarVariant,
  UseSidebarReturn,
} from "./sidebar-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {sidebarVariants, type SidebarVariants} from "./sidebar.styles";
