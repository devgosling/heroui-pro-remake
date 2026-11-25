import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const holoCardVariants = tv({
  slots: {
    base: "holo-card",
    content: "holo-card__content",
    frame: "holo-card__frame",
    image: "holo-card__image",
    inset: "holo-card__inset",
    pattern: "holo-card__pattern",
    rotator: "holo-card__rotator",
    shine: "holo-card__shine",
    shinePattern: "holo-card__shine-pattern",
    surface: "holo-card__surface",
  },
});

export type HoloCardVariants = VariantProps<typeof holoCardVariants>;
