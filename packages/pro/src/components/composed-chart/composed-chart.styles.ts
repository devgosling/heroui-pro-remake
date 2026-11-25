import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * Composed Chart has a single styled element: the root that wraps the Recharts
 * `ResponsiveContainer`. Everything inside is themed from CSS by targeting Recharts' own class
 * names (see `css/components/composed-chart.css`).
 */
export const composedChartVariants = tv({
  base: "composed-chart",
});

export type ComposedChartVariants = VariantProps<typeof composedChartVariants>;
