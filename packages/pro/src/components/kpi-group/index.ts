import type {ComponentProps} from "react";

import {KPIGroupRoot, KPIGroupSeparator} from "./kpi-group";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Root-safe: KPIGroup only styles `[data-slot="kpi"]` children and never imports `KPI`
 * (which is subpath-only because of recharts).
 * -----------------------------------------------------------------------------------------------*/
export const KPIGroup = Object.assign(KPIGroupRoot, {
  Root: KPIGroupRoot,
  Separator: KPIGroupSeparator,
});

export type KPIGroup = {
  Props: ComponentProps<typeof KPIGroupRoot>;
  RootProps: ComponentProps<typeof KPIGroupRoot>;
  SeparatorProps: ComponentProps<typeof KPIGroupSeparator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {KPIGroupRoot, KPIGroupSeparator} from "./kpi-group";

export {KPIGroupContext, useKPIGroupContext} from "./kpi-group-context";

export type {
  KPIGroupOrientation,
  KPIGroupRootProps,
  KPIGroupRootProps as KPIGroupProps,
  KPIGroupSeparatorProps,
} from "./kpi-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {kpiGroupVariants, type KPIGroupVariants} from "./kpi-group.styles";
