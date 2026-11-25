import type {ComponentProps} from "react";

import {ResizableHandle, ResizableIndicator, ResizablePanel, ResizableRoot} from "./resizable";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/resizable`) because it depends on `react-resizable-panels`.
 * -----------------------------------------------------------------------------------------------*/
export const Resizable = Object.assign(ResizableRoot, {
  Handle: ResizableHandle,
  Indicator: ResizableIndicator,
  Panel: ResizablePanel,
  Root: ResizableRoot,
});

export type Resizable = {
  Props: ComponentProps<typeof ResizableRoot>;
  RootProps: ComponentProps<typeof ResizableRoot>;
  PanelProps: ComponentProps<typeof ResizablePanel>;
  HandleProps: ComponentProps<typeof ResizableHandle>;
  IndicatorProps: ComponentProps<typeof ResizableIndicator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ResizableRoot,
  ResizablePanel,
  ResizableHandle,
  ResizableIndicator,
  ResizableContext,
} from "./resizable";

export type {
  ResizableRootProps,
  ResizableRootProps as ResizableProps,
  ResizablePanelProps,
  ResizableHandleProps,
  ResizableIndicatorProps,
  ResizableOrientation,
  ResizableHandleType,
  ResizableHandleVariant,
  ResizableSize,
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from "./resizable";

export type {Layout, LayoutStorage, PanelSize} from "react-resizable-panels";

/* -------------------------------------------------------------------------------------------------
 * Storage
 * -----------------------------------------------------------------------------------------------*/
export {
  createCookieStorage,
  type CookieLayoutStorage,
  type CreateCookieStorageOptions,
} from "./create-cookie-storage";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  resizableVariants,
  resizableHandleVariants,
  resizableIndicatorVariants,
  type ResizableVariants,
  type ResizableHandleVariants,
  type ResizableIndicatorVariants,
} from "./resizable.styles";
