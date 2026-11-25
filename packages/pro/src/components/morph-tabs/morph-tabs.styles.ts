import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const morphTabsVariants = tv({
  slots: {
    base: "morph-tabs",
    content: "morph-tabs__content",
    icon: "morph-tabs__icon",
    label: "morph-tabs__label",
    labelText: "morph-tabs__label-text",
    list: "morph-tabs__list",
    pager: "morph-tabs__pager",
    track: "morph-tabs__track",
    trigger: "morph-tabs__trigger",
    triggerBackground: "morph-tabs__trigger-background",
  },
});

export type MorphTabsVariants = VariantProps<typeof morphTabsVariants>;
