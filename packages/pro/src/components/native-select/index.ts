import type {ComponentProps} from "react";

import {
  NativeSelectIndicator,
  NativeSelectOptGroup,
  NativeSelectOption,
  NativeSelectRoot,
  NativeSelectTrigger,
} from "./native-select";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const NativeSelect = Object.assign(NativeSelectRoot, {
  Indicator: NativeSelectIndicator,
  OptGroup: NativeSelectOptGroup,
  Option: NativeSelectOption,
  Root: NativeSelectRoot,
  Trigger: NativeSelectTrigger,
});

export type NativeSelect = {
  Props: ComponentProps<typeof NativeSelectRoot>;
  RootProps: ComponentProps<typeof NativeSelectRoot>;
  TriggerProps: ComponentProps<typeof NativeSelectTrigger>;
  IndicatorProps: ComponentProps<typeof NativeSelectIndicator>;
  OptionProps: ComponentProps<typeof NativeSelectOption>;
  OptGroupProps: ComponentProps<typeof NativeSelectOptGroup>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  NativeSelectRoot,
  NativeSelectTrigger,
  NativeSelectIndicator,
  NativeSelectOption,
  NativeSelectOptGroup,
  NativeSelectContext,
} from "./native-select";

export type {
  NativeSelectRootProps,
  NativeSelectRootProps as NativeSelectProps,
  NativeSelectTriggerProps,
  NativeSelectIndicatorProps,
  NativeSelectOptionProps,
  NativeSelectOptGroupProps,
} from "./native-select";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {nativeSelectVariants, type NativeSelectVariants} from "./native-select.styles";
