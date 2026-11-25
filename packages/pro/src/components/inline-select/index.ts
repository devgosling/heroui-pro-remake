import type {ComponentProps} from "react";

import {
  InlineSelectIndicator,
  InlineSelectPopover,
  InlineSelectRoot,
  InlineSelectTrigger,
  InlineSelectValue,
} from "./inline-select";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const InlineSelect = Object.assign(InlineSelectRoot, {
  Indicator: InlineSelectIndicator,
  Popover: InlineSelectPopover,
  Root: InlineSelectRoot,
  Trigger: InlineSelectTrigger,
  Value: InlineSelectValue,
});

export type InlineSelect<T extends object = object> = {
  Props: ComponentProps<typeof InlineSelectRoot<T>>;
  RootProps: ComponentProps<typeof InlineSelectRoot<T>>;
  TriggerProps: ComponentProps<typeof InlineSelectTrigger>;
  ValueProps: ComponentProps<typeof InlineSelectValue>;
  IndicatorProps: ComponentProps<typeof InlineSelectIndicator>;
  PopoverProps: ComponentProps<typeof InlineSelectPopover>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  InlineSelectRoot,
  InlineSelectTrigger,
  InlineSelectValue,
  InlineSelectIndicator,
  InlineSelectPopover,
  InlineSelectContext,
} from "./inline-select";

export type {
  InlineSelectRootProps,
  InlineSelectRootProps as InlineSelectProps,
  InlineSelectTriggerProps,
  InlineSelectValueProps,
  InlineSelectIndicatorProps,
  InlineSelectPopoverProps,
} from "./inline-select";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {inlineSelectVariants, type InlineSelectVariants} from "./inline-select.styles";
