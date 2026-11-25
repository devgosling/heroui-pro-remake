import type {ComponentProps} from "react";

import {
  KPIActions,
  KPIChart,
  KPIContent,
  KPIFooter,
  KPIHeader,
  KPIIcon,
  KPIProgress,
  KPIRoot,
  KPISeparator,
  KPITitle,
  KPITrend,
  KPIValue,
} from "./kpi";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/kpi`) because KPI.Chart depends on `recharts`.
 * -----------------------------------------------------------------------------------------------*/
export const KPI = Object.assign(KPIRoot, {
  Actions: KPIActions,
  Chart: KPIChart,
  Content: KPIContent,
  Footer: KPIFooter,
  Header: KPIHeader,
  Icon: KPIIcon,
  Progress: KPIProgress,
  Root: KPIRoot,
  Separator: KPISeparator,
  Title: KPITitle,
  Trend: KPITrend,
  Value: KPIValue,
});

export type KPI = {
  Props: ComponentProps<typeof KPIRoot>;
  RootProps: ComponentProps<typeof KPIRoot>;
  HeaderProps: ComponentProps<typeof KPIHeader>;
  IconProps: ComponentProps<typeof KPIIcon>;
  TitleProps: ComponentProps<typeof KPITitle>;
  ActionsProps: ComponentProps<typeof KPIActions>;
  ContentProps: ComponentProps<typeof KPIContent>;
  ValueProps: ComponentProps<typeof KPIValue>;
  TrendProps: ComponentProps<typeof KPITrend>;
  ProgressProps: ComponentProps<typeof KPIProgress>;
  ChartProps: ComponentProps<typeof KPIChart>;
  SeparatorProps: ComponentProps<typeof KPISeparator>;
  FooterProps: ComponentProps<typeof KPIFooter>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  KPIRoot,
  KPIHeader,
  KPIIcon,
  KPITitle,
  KPIActions,
  KPIContent,
  KPIValue,
  KPITrend,
  KPIProgress,
  KPIChart,
  KPISeparator,
  KPIFooter,
} from "./kpi";

export type {
  KPIStatus,
  KPIRootProps,
  KPIRootProps as KPIProps,
  KPIHeaderProps,
  KPIIconProps,
  KPITitleProps,
  KPIActionsProps,
  KPIContentProps,
  KPIValueProps,
  KPIProgressProps,
  KPIChartProps,
  KPISeparatorProps,
  KPIFooterProps,
} from "./kpi";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {kpiVariants, type KPIVariants} from "./kpi.styles";
