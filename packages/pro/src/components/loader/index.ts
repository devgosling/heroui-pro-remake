import type {ComponentProps} from "react";

import {LoaderIndicator, LoaderLabel, LoaderRoot} from "./loader";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Loader = Object.assign(LoaderRoot, {
  Indicator: LoaderIndicator,
  Label: LoaderLabel,
  Root: LoaderRoot,
});

export type Loader = {
  Props: ComponentProps<typeof LoaderRoot>;
  RootProps: ComponentProps<typeof LoaderRoot>;
  IndicatorProps: ComponentProps<typeof LoaderIndicator>;
  LabelProps: ComponentProps<typeof LoaderLabel>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {LoaderRoot, LoaderIndicator, LoaderLabel, LoaderContext} from "./loader";

export type {
  LoaderRootProps,
  LoaderRootProps as LoaderProps,
  LoaderIndicatorProps,
  LoaderLabelProps,
} from "./loader";

export type {LoaderVariant} from "./loader-drawings";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {loaderVariants, type LoaderVariants} from "./loader.styles";
