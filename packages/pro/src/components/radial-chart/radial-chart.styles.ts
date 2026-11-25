import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const radialChartVariants = tv({
  base: "radial-chart",
});

export type RadialChartVariants = VariantProps<typeof radialChartVariants>;
