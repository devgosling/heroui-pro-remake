import type {ComponentProps} from "react";

import {TrendChipIndicator, TrendChipPrefix, TrendChipRoot, TrendChipSuffix} from "./trend-chip";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TrendChip = Object.assign(TrendChipRoot, {
  Indicator: TrendChipIndicator,
  Prefix: TrendChipPrefix,
  Root: TrendChipRoot,
  Suffix: TrendChipSuffix,
});

export type TrendChip = {
  Props: ComponentProps<typeof TrendChipRoot>;
  RootProps: ComponentProps<typeof TrendChipRoot>;
  IndicatorProps: ComponentProps<typeof TrendChipIndicator>;
  PrefixProps: ComponentProps<typeof TrendChipPrefix>;
  SuffixProps: ComponentProps<typeof TrendChipSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TrendChipRoot, TrendChipIndicator, TrendChipPrefix, TrendChipSuffix} from "./trend-chip";

export type {
  Trend,
  TrendChipRootProps,
  TrendChipRootProps as TrendChipProps,
  TrendChipIndicatorProps,
  TrendChipPrefixProps,
  TrendChipSuffixProps,
} from "./trend-chip";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {trendChipVariants, type TrendChipVariants} from "./trend-chip.styles";
