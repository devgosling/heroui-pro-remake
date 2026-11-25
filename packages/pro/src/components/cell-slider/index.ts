import type {ComponentProps} from "react";

import {
  CellSliderFill,
  CellSliderLabel,
  CellSliderOutput,
  CellSliderRoot,
  CellSliderThumb,
  CellSliderTrack,
} from "./cell-slider";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CellSlider = Object.assign(CellSliderRoot, {
  Fill: CellSliderFill,
  Label: CellSliderLabel,
  Output: CellSliderOutput,
  Root: CellSliderRoot,
  Thumb: CellSliderThumb,
  Track: CellSliderTrack,
});

export type CellSlider = {
  Props: ComponentProps<typeof CellSliderRoot>;
  RootProps: ComponentProps<typeof CellSliderRoot>;
  TrackProps: ComponentProps<typeof CellSliderTrack>;
  FillProps: ComponentProps<typeof CellSliderFill>;
  ThumbProps: ComponentProps<typeof CellSliderThumb>;
  LabelProps: ComponentProps<typeof CellSliderLabel>;
  OutputProps: ComponentProps<typeof CellSliderOutput>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CellSliderRoot,
  CellSliderTrack,
  CellSliderFill,
  CellSliderThumb,
  CellSliderLabel,
  CellSliderOutput,
  CellSliderContext,
} from "./cell-slider";

export type {
  CellSliderRootProps,
  CellSliderRootProps as CellSliderProps,
  CellSliderTrackProps,
  CellSliderFillProps,
  CellSliderThumbProps,
  CellSliderLabelProps,
  CellSliderOutputProps,
} from "./cell-slider";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {cellSliderVariants, type CellSliderVariants} from "./cell-slider.styles";
