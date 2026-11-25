import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const swipeableTabsVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "swipeable-tabs",
    content: "swipeable-tabs__content",
    indicator: "swipeable-tabs__indicator",
    label: "swipeable-tabs__label",
    lazyPlaceholder: "swipeable-tabs__lazy-placeholder",
    list: "swipeable-tabs__list",
    listBackground: "swipeable-tabs__list-background",
    pager: "swipeable-tabs__pager",
    pagerTrack: "swipeable-tabs__pager-track",
    scrollView: "swipeable-tabs__scroll-view",
    scrollViewContent: "swipeable-tabs__scroll-view-content",
    separator: "swipeable-tabs__separator",
    trigger: "swipeable-tabs__trigger",
  },
  variants: {
    variant: {
      primary: {},
      secondary: {
        base: "swipeable-tabs--secondary",
        indicator: "swipeable-tabs__indicator--secondary",
        list: "swipeable-tabs__list--secondary",
        scrollViewContent: "swipeable-tabs__scroll-view-content--secondary",
        trigger: "swipeable-tabs__trigger--secondary",
      },
    },
  },
});

export type SwipeableTabsVariants = VariantProps<typeof swipeableTabsVariants>;
