import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const timelineVariants = tv({
  defaultVariants: {
    axis: "start",
    density: "comfortable",
    size: "md",
  },
  slots: {
    base: "timeline",
    connector: "timeline__connector",
    content: "timeline__content",
    marker: "timeline__marker",
    rail: "timeline__rail",
  },
  // Declared in this order so the root renders `timeline timeline--axis-start timeline--compact
  // timeline--sm` (Pro class order)
  variants: {
    axis: {
      center: {base: "timeline--axis-center"},
      start: {base: "timeline--axis-start"},
    },
    density: {
      comfortable: {base: "timeline--comfortable"},
      compact: {base: "timeline--compact"},
    },
    size: {
      lg: {base: "timeline--lg", marker: "timeline__marker--lg"},
      md: {base: "timeline--md", marker: "timeline__marker--md"},
      sm: {base: "timeline--sm", marker: "timeline__marker--sm"},
    },
  },
});

export const timelineItemVariants = tv({
  base: "timeline__item",
  defaultVariants: {
    align: "start",
  },
  variants: {
    align: {
      center: "timeline__item--align-center",
      start: "timeline__item--align-start",
    },
  },
});

export type TimelineVariants = VariantProps<typeof timelineVariants>;
export type TimelineItemVariants = VariantProps<typeof timelineItemVariants>;
