import type {ComponentProps} from "react";

import {
  AppLayoutAsideTrigger,
  AppLayoutMenuToggle,
  AppLayoutMobileAside,
  AppLayoutRoot,
} from "./app-layout";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/app-layout`) because the resizable shell depends on
 * `react-resizable-panels` (through `Resizable`).
 * -----------------------------------------------------------------------------------------------*/
export const AppLayout = Object.assign(AppLayoutRoot, {
  AsideTrigger: AppLayoutAsideTrigger,
  MenuToggle: AppLayoutMenuToggle,
  MobileAside: AppLayoutMobileAside,
  Root: AppLayoutRoot,
});

export type AppLayout = {
  Props: ComponentProps<typeof AppLayoutRoot>;
  RootProps: ComponentProps<typeof AppLayoutRoot>;
  MenuToggleProps: ComponentProps<typeof AppLayoutMenuToggle>;
  AsideTriggerProps: ComponentProps<typeof AppLayoutAsideTrigger>;
  MobileAsideProps: ComponentProps<typeof AppLayoutMobileAside>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AppLayoutRoot,
  AppLayoutMenuToggle,
  AppLayoutAsideTrigger,
  AppLayoutMobileAside,
} from "./app-layout";

export type {
  AppLayoutRootProps,
  AppLayoutRootProps as AppLayoutProps,
  AppLayoutMenuToggleProps,
  AppLayoutAsideTriggerProps,
  AppLayoutMobileAsideProps,
  AppLayoutTooltipProps,
} from "./app-layout";

/* -------------------------------------------------------------------------------------------------
 * Hooks & Context
 * -----------------------------------------------------------------------------------------------*/
export {AppLayoutContext, useAppLayout, ASIDE_COOKIE_NAME} from "./app-layout-context";

export type {
  AppLayoutAsideMobile,
  AppLayoutContextValue,
  AppLayoutScrollMode,
  UseAppLayoutReturn,
} from "./app-layout-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {appLayoutVariants, type AppLayoutVariants} from "./app-layout.styles";
