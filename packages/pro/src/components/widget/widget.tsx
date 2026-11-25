"use client";

import type {DOMRenderProps} from "@heroui/react";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";

import {dom} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {widgetVariants} from "./widget.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
// Parts read the slots from context, but also render standalone (outside a `Widget`).
const defaultSlots = widgetVariants();

type WidgetContext = {
  slots: ReturnType<typeof widgetVariants>;
};

const WidgetContext = createContext<WidgetContext>({slots: defaultSlots});

/* -------------------------------------------------------------------------------------------------
 * Root - secondary-surface shell (a `div` unless `render` swaps the element)
 * -----------------------------------------------------------------------------------------------*/
interface WidgetRootProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  /** Widget parts: `Widget.Header`, `Widget.Content` and `Widget.Footer`. */
  children?: ReactNode;
  /** Additional CSS classes, merged after the BEM classes. */
  className?: string;
}

const WidgetRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...rest
}: WidgetRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof WidgetRootProps<E>>) => {
  const slots = useMemo(() => widgetVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <WidgetContext value={contextValue}>
      {/* `dom.div` hands every prop (ref included) to `render` when it is set. */}
      <dom.div className={slots.base({className})} data-slot="widget" {...(rest as object)}>
        {children}
      </dom.div>
    </WidgetContext>
  );
};

WidgetRoot.displayName = "HeroUI.Widget";

/* -------------------------------------------------------------------------------------------------
 * Header - row that spaces the title block and the legend apart
 * -----------------------------------------------------------------------------------------------*/
interface WidgetHeaderProps extends ComponentPropsWithRef<"div"> {}

const WidgetHeader = ({className, ...rest}: WidgetHeaderProps) => {
  const {slots} = use(WidgetContext);

  return <div className={slots.header({className})} data-slot="widget-header" {...rest} />;
};

WidgetHeader.displayName = "HeroUI.Widget.Header";

/* -------------------------------------------------------------------------------------------------
 * Title / Description
 * -----------------------------------------------------------------------------------------------*/
interface WidgetTitleProps extends ComponentPropsWithRef<"span"> {}

const WidgetTitle = ({className, ...rest}: WidgetTitleProps) => {
  const {slots} = use(WidgetContext);

  return <span className={slots.title({className})} data-slot="widget-title" {...rest} />;
};

WidgetTitle.displayName = "HeroUI.Widget.Title";

interface WidgetDescriptionProps extends ComponentPropsWithRef<"span"> {}

const WidgetDescription = ({className, ...rest}: WidgetDescriptionProps) => {
  const {slots} = use(WidgetContext);

  return (
    <span className={slots.description({className})} data-slot="widget-description" {...rest} />
  );
};

WidgetDescription.displayName = "HeroUI.Widget.Description";

/* -------------------------------------------------------------------------------------------------
 * Content - elevated inner surface (`p-0` for edge-to-edge tables)
 * -----------------------------------------------------------------------------------------------*/
interface WidgetContentProps extends ComponentPropsWithRef<"div"> {}

const WidgetContent = ({className, ...rest}: WidgetContentProps) => {
  const {slots} = use(WidgetContext);

  return <div className={slots.content({className})} data-slot="widget-content" {...rest} />;
};

WidgetContent.displayName = "HeroUI.Widget.Content";

/* -------------------------------------------------------------------------------------------------
 * Footer - optional bottom row for actions or metadata
 * -----------------------------------------------------------------------------------------------*/
interface WidgetFooterProps extends ComponentPropsWithRef<"div"> {}

const WidgetFooter = ({className, ...rest}: WidgetFooterProps) => {
  const {slots} = use(WidgetContext);

  return <div className={slots.footer({className})} data-slot="widget-footer" {...rest} />;
};

WidgetFooter.displayName = "HeroUI.Widget.Footer";

/* -------------------------------------------------------------------------------------------------
 * Legend / LegendItem - inline colour key for charts
 * -----------------------------------------------------------------------------------------------*/
interface WidgetLegendProps extends ComponentPropsWithRef<"div"> {}

const WidgetLegend = ({className, ...rest}: WidgetLegendProps) => {
  const {slots} = use(WidgetContext);

  return <div className={slots.legend({className})} data-slot="widget-legend" {...rest} />;
};

WidgetLegend.displayName = "HeroUI.Widget.Legend";

interface WidgetLegendItemProps extends Omit<ComponentPropsWithRef<"div">, "color"> {
  /** Dot colour: any CSS colour, e.g. `var(--chart-1)` or `var(--color-accent)`. */
  color: string;
}

const WidgetLegendItem = ({children, className, color, ...rest}: WidgetLegendItemProps) => {
  const {slots} = use(WidgetContext);

  return (
    <div className={slots.legendItem({className})} data-slot="widget-legend-item" {...rest}>
      <span
        aria-hidden="true"
        className={slots.legendItemDot()}
        data-slot="widget-legend-item-dot"
        style={{backgroundColor: color}}
      />
      <span className={slots.legendItemLabel()} data-slot="widget-legend-item-label">
        {children}
      </span>
    </div>
  );
};

WidgetLegendItem.displayName = "HeroUI.Widget.LegendItem";

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  WidgetRootProps,
  WidgetHeaderProps,
  WidgetTitleProps,
  WidgetDescriptionProps,
  WidgetContentProps,
  WidgetFooterProps,
  WidgetLegendProps,
  WidgetLegendItemProps,
};
