import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const loaderVariants = tv({
  defaultVariants: {
    color: "accent",
    size: "md",
    variant: "ring",
  },
  slots: {
    base: "loader",
    fallback: "loader__fallback",
    indicator: "loader__indicator",
    label: "loader__label",
  },
  variants: {
    color: {
      accent: {base: "loader--accent"},
      current: {base: "loader--current"},
      danger: {base: "loader--danger"},
      success: {base: "loader--success"},
      warning: {base: "loader--warning"},
    },
    size: {
      lg: {base: "loader--lg"},
      // md is the default size: Pro renders no modifier class for it
      md: {},
      sm: {base: "loader--sm"},
    },
    variant: {
      atom: {indicator: "loader__indicator--atom"},
      classic: {indicator: "loader__indicator--classic"},
      dots: {indicator: "loader__indicator--dots"},
      grid: {indicator: "loader__indicator--grid"},
      helix: {indicator: "loader__indicator--helix"},
      infinity: {indicator: "loader__indicator--infinity"},
      morph: {indicator: "loader__indicator--morph"},
      pulse: {indicator: "loader__indicator--pulse"},
      ring: {indicator: "loader__indicator--ring"},
      scan: {indicator: "loader__indicator--scan"},
      shuffle: {indicator: "loader__indicator--shuffle"},
      sparkle: {indicator: "loader__indicator--sparkle"},
      twist: {indicator: "loader__indicator--twist"},
      wave: {indicator: "loader__indicator--wave"},
    },
  },
});

export type LoaderVariants = VariantProps<typeof loaderVariants>;
