import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const swipeableRowVariants = tv({
  defaultVariants: {
    variant: "standalone",
  },
  slots: {
    a11yActions: "swipeable-row__a11y-actions",
    base: "swipeable-row",
    content: "swipeable-row__content",
    contentBackground: "swipeable-row__content-background",
  },
  variants: {
    variant: {
      inline: {
        base: "swipeable-row--inline",
        content: "swipeable-row__content--inline",
      },
      standalone: {
        base: "swipeable-row--standalone",
        content: "swipeable-row__content--standalone",
      },
    },
  },
});

export const swipeableRowActionsVariants = tv({
  base: "swipeable-row__actions",
  variants: {
    side: {
      end: "swipeable-row__actions--end",
      start: "swipeable-row__actions--start",
    },
  },
});

export const swipeableRowActionVariants = tv({
  defaultVariants: {
    isAnimated: true,
    variant: "default",
  },
  slots: {
    base: "swipeable-row__action",
    content: "swipeable-row__action-content",
  },
  variants: {
    isAnimated: {
      false: {base: "swipeable-row__action--static"},
      true: {},
    },
    variant: {
      accent: {base: "swipeable-row__action--accent"},
      danger: {base: "swipeable-row__action--danger"},
      default: {base: "swipeable-row__action--default"},
      success: {base: "swipeable-row__action--success"},
    },
  },
});

export const swipeableRowActionLabelVariants = tv({
  base: "swipeable-row__action-label",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      accent: "swipeable-row__action-label--accent",
      danger: "swipeable-row__action-label--danger",
      default: "swipeable-row__action-label--default",
      success: "swipeable-row__action-label--success",
    },
  },
});

export type SwipeableRowVariants = VariantProps<typeof swipeableRowVariants>;
export type SwipeableRowActionsVariants = VariantProps<typeof swipeableRowActionsVariants>;
export type SwipeableRowActionVariants = VariantProps<typeof swipeableRowActionVariants>;
export type SwipeableRowActionLabelVariants = VariantProps<typeof swipeableRowActionLabelVariants>;
