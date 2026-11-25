import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const areaChartVariants = tv({
  base: "area-chart",
});

export type AreaChartVariants = VariantProps<typeof areaChartVariants>;
