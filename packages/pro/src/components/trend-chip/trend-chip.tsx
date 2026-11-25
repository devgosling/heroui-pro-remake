"use client";

import type {TrendChipVariants} from "./trend-chip.styles";
import type {ChipVariants} from "@heroui/react";
import type {ComponentPropsWithRef, ReactElement, ReactNode, SVGProps} from "react";

import {Chip} from "@heroui/react";
import {Children, cloneElement, createContext, isValidElement, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {trendChipVariants} from "./trend-chip.styles";

type Trend = "up" | "down" | "neutral";

const TREND_COLOR: Record<Trend, NonNullable<ChipVariants["color"]>> = {
  down: "danger",
  neutral: "default",
  up: "success",
};

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type TrendChipContext = {
  slots?: ReturnType<typeof trendChipVariants>;
};

const TrendChipContext = createContext<TrendChipContext>({});

/* -------------------------------------------------------------------------------------------------
 * Default arrows
 * -----------------------------------------------------------------------------------------------*/
const ArrowIcon = ({direction, ...props}: SVGProps<SVGSVGElement> & {direction: "up" | "down"}) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    {/* Compact arrowhead (5 units each side) like the Pro chip */}
    {direction === "up" ? <path d="M12 19V5M7 10l5-5 5 5" /> : <path d="M12 5v14M17 14l-5 5-5-5" />}
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Indicator (merges its class/slot onto the provided icon element)
 * -----------------------------------------------------------------------------------------------*/
interface TrendChipIndicatorProps extends SVGProps<SVGSVGElement> {
  /** Custom icon element (usually an `<svg>`). */
  children?: ReactNode;
}

const TrendChipIndicator = ({children, className, ...rest}: TrendChipIndicatorProps) => {
  const {slots} = use(TrendChipContext);
  const indicatorClassName = slots?.indicator({className}) ?? className;

  if (isValidElement<{className?: string}>(children)) {
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...rest,
      className: cx(indicatorClassName, children.props.className),
      "data-slot": "trend-chip-indicator",
    });
  }

  return (
    <span aria-hidden="true" className={indicatorClassName} data-slot="trend-chip-indicator">
      {children}
    </span>
  );
};

TrendChipIndicator.displayName = "HeroUI.TrendChip.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Prefix / Suffix
 * -----------------------------------------------------------------------------------------------*/
interface TrendChipPrefixProps extends ComponentPropsWithRef<"span"> {}

const TrendChipPrefix = ({className, ...rest}: TrendChipPrefixProps) => {
  const {slots} = use(TrendChipContext);

  return (
    <span
      className={slots?.prefix({className}) ?? className}
      data-slot="trend-chip-prefix"
      {...rest}
    />
  );
};

TrendChipPrefix.displayName = "HeroUI.TrendChip.Prefix";

interface TrendChipSuffixProps extends ComponentPropsWithRef<"span"> {}

const TrendChipSuffix = ({className, ...rest}: TrendChipSuffixProps) => {
  const {slots} = use(TrendChipContext);

  return (
    <span
      className={slots?.suffix({className}) ?? className}
      data-slot="trend-chip-suffix"
      {...rest}
    />
  );
};

TrendChipSuffix.displayName = "HeroUI.TrendChip.Suffix";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
type ChipRootProps = ComponentPropsWithRef<typeof Chip>;

interface TrendChipRootProps
  extends Omit<ChipRootProps, "children" | "color" | "size" | "variant">, TrendChipVariants {
  /** Direction of the change; controls arrow and colour. */
  trend?: Trend;
  /** Chip variant. */
  variant?: "primary" | "secondary" | "soft" | "tertiary";
  /** Value text plus optional `Indicator`, `Prefix` and `Suffix`. */
  children?: ReactNode;
}

const TrendChipRoot = ({
  children,
  className,
  size = "sm",
  trend = "up",
  variant = "soft",
  ...rest
}: TrendChipRootProps) => {
  const slots = useMemo(() => trendChipVariants({size}), [size]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  let indicator: ReactNode;
  let prefix: ReactNode;
  let suffix: ReactNode;
  const valueChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TrendChipIndicator) indicator = child;
    else if (isValidElement(child) && child.type === TrendChipPrefix) prefix = child;
    else if (isValidElement(child) && child.type === TrendChipSuffix) suffix = child;
    else valueChildren.push(child);
  });

  if (indicator === undefined && trend !== "neutral") {
    indicator = (
      <ArrowIcon className={slots.indicator()} data-slot="trend-chip-indicator" direction={trend} />
    );
  }

  return (
    <TrendChipContext value={contextValue}>
      <Chip
        {...(rest as Omit<ChipRootProps, "children">)}
        className={slots.base({className})}
        color={TREND_COLOR[trend]}
        data-trend={trend}
        size={size}
        variant={variant}
      >
        {indicator}
        <Chip.Label>
          {prefix}{" "}
          <span className={slots.value()} data-slot="trend-chip-value">
            {valueChildren}
          </span>{" "}
          {suffix}
        </Chip.Label>
      </Chip>
    </TrendChipContext>
  );
};

TrendChipRoot.displayName = "HeroUI.TrendChip";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TrendChipRoot, TrendChipIndicator, TrendChipPrefix, TrendChipSuffix};

export type {
  Trend,
  TrendChipRootProps,
  TrendChipIndicatorProps,
  TrendChipPrefixProps,
  TrendChipSuffixProps,
};
