import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const slideButtonVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    background: "slide-button__background",
    base: "slide-button",
    content: "slide-button__content",
    label: "slide-button__label",
    live: "slide-button__live",
    overlay: "slide-button__overlay",
    overlayContent: "slide-button__overlay-content",
    thumb: "slide-button__thumb",
    thumbIcon: "slide-button__thumb-icon",
    underlay: "slide-button__underlay",
    underlayContent: "slide-button__underlay-content",
  },
  variants: {
    variant: {
      accent: {base: "slide-button--accent"},
      danger: {base: "slide-button--danger"},
      default: {base: "slide-button--default"},
      success: {base: "slide-button--success"},
    },
  },
});

export type SlideButtonVariants = VariantProps<typeof slideButtonVariants>;
