import type {ComponentProps} from "react";

import {
  NumberPadBackspace,
  NumberPadKey,
  NumberPadKeyBackground,
  NumberPadKeyLabel,
  NumberPadRoot,
  NumberPadRow,
  NumberPadSpacer,
} from "./number-pad";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const NumberPad = Object.assign(NumberPadRoot, {
  Backspace: NumberPadBackspace,
  Key: NumberPadKey,
  KeyBackground: NumberPadKeyBackground,
  KeyLabel: NumberPadKeyLabel,
  Root: NumberPadRoot,
  Row: NumberPadRow,
  Spacer: NumberPadSpacer,
});

export type NumberPad = {
  Props: ComponentProps<typeof NumberPadRoot>;
  RootProps: ComponentProps<typeof NumberPadRoot>;
  RowProps: ComponentProps<typeof NumberPadRow>;
  KeyProps: ComponentProps<typeof NumberPadKey>;
  KeyBackgroundProps: ComponentProps<typeof NumberPadKeyBackground>;
  KeyLabelProps: ComponentProps<typeof NumberPadKeyLabel>;
  BackspaceProps: ComponentProps<typeof NumberPadBackspace>;
  SpacerProps: ComponentProps<typeof NumberPadSpacer>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberPadRoot,
  NumberPadRow,
  NumberPadKey,
  NumberPadKeyBackground,
  NumberPadKeyLabel,
  NumberPadBackspace,
  NumberPadSpacer,
} from "./number-pad";

export {NumberPadContext, NumberPadKeyContext} from "./number-pad-context";

export type {
  NumberPadRootProps,
  NumberPadRootProps as NumberPadProps,
  NumberPadRowProps,
  NumberPadKeyProps,
  NumberPadKeyRenderProps,
  NumberPadKeyBackgroundProps,
  NumberPadKeyLabelProps,
  NumberPadBackspaceProps,
  NumberPadBackspaceIconProps,
  NumberPadSpacerProps,
  NumberPadCellProps,
} from "./number-pad";

export type {
  NumberPadContextValue,
  NumberPadKeyContextValue,
  NumberPadKeyAnimation,
  NumberPadKeyAnimationConfig,
  NumberPadKeyTimingConfig,
  NumberPadRootAnimation,
} from "./number-pad-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {numberPadVariants, type NumberPadVariants} from "./number-pad.styles";
