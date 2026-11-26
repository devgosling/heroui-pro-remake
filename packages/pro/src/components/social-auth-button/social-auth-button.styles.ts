import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const socialAuthButtonVariants = tv({
  slots: {
    base: "social-auth-button",
    icon: "social-auth-button__icon",
    label: "social-auth-button__label",
  },
});

export type SocialAuthButtonVariants = VariantProps<typeof socialAuthButtonVariants>;
