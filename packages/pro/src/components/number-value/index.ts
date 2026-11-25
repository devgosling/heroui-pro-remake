import type {ComponentProps} from "react";

import {NumberValuePrefix, NumberValueRoot, NumberValueSuffix} from "./number-value";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const NumberValue = Object.assign(NumberValueRoot, {
  Prefix: NumberValuePrefix,
  Root: NumberValueRoot,
  Suffix: NumberValueSuffix,
});

export type NumberValue = {
  Props: ComponentProps<typeof NumberValueRoot>;
  RootProps: ComponentProps<typeof NumberValueRoot>;
  PrefixProps: ComponentProps<typeof NumberValuePrefix>;
  SuffixProps: ComponentProps<typeof NumberValueSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {NumberValueRoot, NumberValuePrefix, NumberValueSuffix} from "./number-value";
export {useFormattedNumber, type NumberValueFormatProps} from "./use-formatted-number";

export type {
  NumberValueRootProps,
  NumberValueRootProps as NumberValueProps,
  NumberValuePrefixProps,
  NumberValueSuffixProps,
} from "./number-value";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {numberValueVariants, type NumberValueVariants} from "./number-value.styles";
