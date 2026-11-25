import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* -------------------------------------------------------------------------------------------------
 * Group (root) + Panel
 * -----------------------------------------------------------------------------------------------*/
export const resizableVariants = tv({
  defaultVariants: {
    orientation: "horizontal",
  },
  slots: {
    base: "resizable",
    panel: "resizable__panel",
  },
  variants: {
    orientation: {
      horizontal: {base: "resizable--horizontal"},
      vertical: {base: "resizable--vertical"},
    },
  },
});

export type ResizableVariants = VariantProps<typeof resizableVariants>;

/* -------------------------------------------------------------------------------------------------
 * Handle (separator)
 * -----------------------------------------------------------------------------------------------*/
export const resizableHandleVariants = tv({
  defaultVariants: {
    orientation: "horizontal",
    type: "line",
    variant: "primary",
  },
  slots: {
    base: "resizable__handle",
  },
  variants: {
    orientation: {
      horizontal: {base: "resizable__handle--horizontal"},
      vertical: {base: "resizable__handle--vertical"},
    },
    type: {
      drag: {base: "resizable__handle--drag"},
      handle: {base: "resizable__handle--handle"},
      line: {base: "resizable__handle--line"},
      pill: {base: "resizable__handle--pill"},
    },
    variant: {
      primary: {base: "resizable__handle--primary"},
      secondary: {base: "resizable__handle--secondary"},
      tertiary: {base: "resizable__handle--tertiary"},
    },
  },
});

export type ResizableHandleVariants = VariantProps<typeof resizableHandleVariants>;

/* -------------------------------------------------------------------------------------------------
 * Indicator (grip inside a handle)
 * -----------------------------------------------------------------------------------------------*/
// No default `type`: an indicator with custom children and no explicit `type` renders without a
// shape modifier, so the custom content is not boxed into the pill / drag chip.
export const resizableIndicatorVariants = tv({
  slots: {
    base: "resizable__handle-indicator",
    icon: "resizable__handle-indicator-icon",
  },
  variants: {
    type: {
      drag: {base: "resizable__handle-indicator--drag"},
      pill: {base: "resizable__handle-indicator--pill"},
    },
  },
});

export type ResizableIndicatorVariants = VariantProps<typeof resizableIndicatorVariants>;
