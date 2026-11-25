import type {ComponentProps} from "react";

import {
  NavbarBrand,
  NavbarContent,
  NavbarHeader,
  NavbarItem,
  NavbarLabel,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  NavbarRoot,
  NavbarSeparator,
  NavbarSpacer,
} from "./navbar";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Navbar = Object.assign(NavbarRoot, {
  Brand: NavbarBrand,
  Content: NavbarContent,
  Header: NavbarHeader,
  Item: NavbarItem,
  Label: NavbarLabel,
  Menu: NavbarMenu,
  MenuItem: NavbarMenuItem,
  MenuToggle: NavbarMenuToggle,
  Root: NavbarRoot,
  Separator: NavbarSeparator,
  Spacer: NavbarSpacer,
});

export type Navbar = {
  Props: ComponentProps<typeof NavbarRoot>;
  RootProps: ComponentProps<typeof NavbarRoot>;
  HeaderProps: ComponentProps<typeof NavbarHeader>;
  BrandProps: ComponentProps<typeof NavbarBrand>;
  ContentProps: ComponentProps<typeof NavbarContent>;
  ItemProps: ComponentProps<typeof NavbarItem>;
  LabelProps: ComponentProps<typeof NavbarLabel>;
  SeparatorProps: ComponentProps<typeof NavbarSeparator>;
  SpacerProps: ComponentProps<typeof NavbarSpacer>;
  MenuToggleProps: ComponentProps<typeof NavbarMenuToggle>;
  MenuProps: ComponentProps<typeof NavbarMenu>;
  MenuItemProps: ComponentProps<typeof NavbarMenuItem>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./navbar";

export {NavbarContext, NavbarLayoutContext, useNavbar} from "./navbar-context";

export type {
  NavbarRootProps,
  NavbarRootProps as NavbarProps,
  NavbarHeaderProps,
  NavbarBrandProps,
  NavbarBrandRenderProps,
  NavbarContentProps,
  NavbarItemProps,
  NavbarItemRenderProps,
  NavbarLabelProps,
  NavbarSeparatorProps,
  NavbarSpacerProps,
  NavbarMenuToggleProps,
  NavbarMenuProps,
  NavbarMenuItemProps,
} from "./navbar";

export type {UseNavbarReturn} from "./navbar-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {navbarVariants, type NavbarVariants} from "./navbar.styles";
