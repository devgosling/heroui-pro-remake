import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const radarChartVariants = tv({
  slots: {
    base: "radar-chart",
  },
});

export type RadarChartVariants = VariantProps<typeof radarChartVariants>;
