import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const mapVariants = tv({
  slots: {
    base: "map",
    compassIcon: "map__compass-icon",
    controlButton: "map__control-button",
    controlGroup: "map__control-group",
    controlIcon: "map__control-icon",
    controlSeparator: "map__control-separator",
    controlSpinner: "map__control-spinner",
    defaultMarker: "map__default-marker",
    loader: "map__loader",
    loaderSpinner: "map__loader-spinner",
    marker: "map__marker",
    markerContent: "map__marker-content",
    popupCloseButton: "map__popup-close-button",
    popupContent: "map__popup-content",
    tooltip: "map__tooltip",
  },
});

export const mapControlsVariants = tv({
  base: "map__controls",
  defaultVariants: {
    position: "bottom-right",
  },
  variants: {
    position: {
      "bottom-left": "map__controls--bottom-left",
      "bottom-right": "map__controls--bottom-right",
      "top-left": "map__controls--top-left",
      "top-right": "map__controls--top-right",
    },
  },
});

export const mapMarkerLabelVariants = tv({
  base: "map__marker-label",
  defaultVariants: {
    position: "top",
  },
  variants: {
    position: {
      bottom: "map__marker-label--bottom",
      top: "map__marker-label--top",
    },
  },
});

export type MapVariants = VariantProps<typeof mapVariants>;
export type MapControlsVariants = VariantProps<typeof mapControlsVariants>;
export type MapMarkerLabelVariants = VariantProps<typeof mapMarkerLabelVariants>;
