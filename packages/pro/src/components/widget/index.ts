import type {ComponentProps} from "react";

import {
  WidgetContent,
  WidgetDescription,
  WidgetFooter,
  WidgetHeader,
  WidgetLegend,
  WidgetLegendItem,
  WidgetRoot,
  WidgetTitle,
} from "./widget";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Root-safe: Widget is a plain layout shell; charts, tables or KPIs are passed in as children.
 * -----------------------------------------------------------------------------------------------*/
export const Widget = Object.assign(WidgetRoot, {
  Content: WidgetContent,
  Description: WidgetDescription,
  Footer: WidgetFooter,
  Header: WidgetHeader,
  Legend: WidgetLegend,
  LegendItem: WidgetLegendItem,
  Root: WidgetRoot,
  Title: WidgetTitle,
});

export type Widget = {
  Props: ComponentProps<typeof WidgetRoot>;
  RootProps: ComponentProps<typeof WidgetRoot>;
  HeaderProps: ComponentProps<typeof WidgetHeader>;
  TitleProps: ComponentProps<typeof WidgetTitle>;
  DescriptionProps: ComponentProps<typeof WidgetDescription>;
  ContentProps: ComponentProps<typeof WidgetContent>;
  FooterProps: ComponentProps<typeof WidgetFooter>;
  LegendProps: ComponentProps<typeof WidgetLegend>;
  LegendItemProps: ComponentProps<typeof WidgetLegendItem>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  WidgetRoot,
  WidgetHeader,
  WidgetTitle,
  WidgetDescription,
  WidgetContent,
  WidgetFooter,
  WidgetLegend,
  WidgetLegendItem,
} from "./widget";

export type {
  WidgetRootProps,
  WidgetRootProps as WidgetProps,
  WidgetHeaderProps,
  WidgetTitleProps,
  WidgetDescriptionProps,
  WidgetContentProps,
  WidgetFooterProps,
  WidgetLegendProps,
  WidgetLegendItemProps,
} from "./widget";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {widgetVariants, type WidgetVariants} from "./widget.styles";
