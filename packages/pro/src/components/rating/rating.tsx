"use client";

import type {RatingVariants} from "./rating.styles";
import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";
import type {RadioProps, RadioRenderProps} from "react-aria-components/RadioGroup";

import {createContext, use, useCallback, useMemo, useState} from "react";
import {
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
} from "react-aria-components/RadioGroup";

import {useResolvedClassName} from "../../utils";

import {ratingVariants} from "./rating.styles";

type HoverEvent = Parameters<NonNullable<RadioProps["onHoverStart"]>>[0];

/* -------------------------------------------------------------------------------------------------
 * Default icon
 * -----------------------------------------------------------------------------------------------*/
/*
 * Filled star glyph ("star-fill") from Gravity UI Icons - https://github.com/gravity-ui/icons
 * MIT License, Copyright (c) 2022 YANDEX LLC.
 */
const RatingStarIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6.886.773C7.29-.231 8.71-.231 9.114.773l1.472 3.667 3.943.268c1.08.073 1.518 1.424.688 2.118L12.185 9.36l.964 3.832c.264 1.05-.886 1.884-1.802 1.31L8 12.4l-3.347 2.101c-.916.575-2.066-.26-1.802-1.309l.964-3.832L.783 6.826c-.83-.694-.391-2.045.688-2.118l3.943-.268z" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Rating Context
 * -----------------------------------------------------------------------------------------------*/
type RatingContext = {
  slots?: ReturnType<typeof ratingVariants>;
  /** The value the items render: the hovered item while previewing, else the current value. */
  displayValue: number;
  icon?: ReactNode;
  isReadOnly?: boolean;
  onItemHoverStart?: (value: number) => void;
  onItemHoverEnd?: (value: number) => void;
};

const RatingContext = createContext<RatingContext>({displayValue: 0});

/* -------------------------------------------------------------------------------------------------
 * Rating Root
 * -----------------------------------------------------------------------------------------------*/
interface RatingRootProps
  extends
    Omit<
      ComponentPropsWithRef<typeof RadioGroupPrimitive>,
      "defaultValue" | "onChange" | "orientation" | "value"
    >,
    RatingVariants {
  /** The current rating value (controlled). */
  value?: number;
  /** The initial rating value (uncontrolled). */
  defaultValue?: number;
  /** Handler called when the rating value changes. */
  onValueChange?: (value: number) => void;
  /** Custom icon element rendered by every rating item (defaults to a filled star). */
  icon?: ReactNode;
}

const RatingRoot = ({
  children,
  className,
  defaultValue,
  icon,
  isDisabled,
  isReadOnly,
  onValueChange,
  size,
  value,
  ...rest
}: RatingRootProps) => {
  const slots = useMemo(() => ratingVariants({size}), [size]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? 0);
  const currentValue = (isControlled ? value : uncontrolledValue) ?? 0;

  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const isInteractive = !isDisabled && !isReadOnly;
  const displayValue = isInteractive && hoveredValue !== null ? hoveredValue : currentValue;

  // The radio of the last whole star is the checked one (4.5 -> "4"). An empty rating maps to
  // `null` so React Aria keeps the group reachable with Tab.
  const wholeValue = Math.floor(currentValue);
  const selectedValue = wholeValue >= 1 ? String(wholeValue) : null;

  const handleChange = useCallback(
    (next: string) => {
      const nextValue = Number(next);

      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const onItemHoverStart = useCallback((itemValue: number) => setHoveredValue(itemValue), []);
  const onItemHoverEnd = useCallback(
    (itemValue: number) => setHoveredValue((prev) => (prev === itemValue ? null : prev)),
    [],
  );

  const contextValue = useMemo<RatingContext>(
    () => ({displayValue, icon, isReadOnly, onItemHoverEnd, onItemHoverStart, slots}),
    [displayValue, icon, isReadOnly, onItemHoverEnd, onItemHoverStart, slots],
  );

  return (
    <RatingContext value={contextValue}>
      <RadioGroupPrimitive
        {...rest}
        className={resolvedClassName}
        data-slot="rating"
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        orientation="horizontal"
        value={selectedValue}
        onChange={handleChange}
      >
        {children}
      </RadioGroupPrimitive>
    </RatingContext>
  );
};

RatingRoot.displayName = "HeroUI.Rating";

/* -------------------------------------------------------------------------------------------------
 * Rating Item
 * -----------------------------------------------------------------------------------------------*/
interface RatingItemRenderProps extends RadioRenderProps {
  /** Whether this item is at or below the current (or hovered) rating. */
  isActive: boolean;
  /** Whether this item shows a partial fill (read-only fractional value). */
  isPartial: boolean;
  /** The fill percentage for partial display (0-100). */
  partialPercent: number;
}

interface RatingItemProps extends Omit<
  ComponentPropsWithRef<typeof RadioPrimitive>,
  "children" | "value"
> {
  /** The numeric value of this item. */
  value: number;
  /** Custom icon content, or a render function receiving the item state. */
  children?: ReactNode | ((props: RatingItemRenderProps) => ReactNode);
}

const RatingItem = ({
  "aria-label": ariaLabel,
  children,
  className,
  onHoverEnd,
  onHoverStart,
  value,
  ...rest
}: RatingItemProps) => {
  const {displayValue, icon, isReadOnly, onItemHoverEnd, onItemHoverStart, slots} =
    use(RatingContext);
  const resolvedClassName = useResolvedClassName(className, slots?.item());

  const isActive = value <= displayValue;
  const isPartial = !!isReadOnly && !isActive && displayValue > value - 1;
  const partialPercent = isActive
    ? 100
    : isPartial
      ? Math.round((displayValue - (value - 1)) * 100)
      : 0;

  const handleHoverStart = useCallback(
    (event: HoverEvent) => {
      onHoverStart?.(event);
      onItemHoverStart?.(value);
    },
    [onHoverStart, onItemHoverStart, value],
  );

  const handleHoverEnd = useCallback(
    (event: HoverEvent) => {
      onHoverEnd?.(event);
      onItemHoverEnd?.(value);
    },
    [onHoverEnd, onItemHoverEnd, value],
  );

  const label =
    ariaLabel ??
    (rest["aria-labelledby"] ? undefined : `${value} ${value === 1 ? "star" : "stars"}`);

  return (
    <RadioPrimitive
      {...rest}
      aria-label={label}
      className={resolvedClassName}
      data-active={isActive ? "true" : undefined}
      data-slot="rating-item"
      value={String(value)}
      onHoverEnd={handleHoverEnd}
      onHoverStart={handleHoverStart}
    >
      {(renderProps) => {
        if (typeof children === "function") {
          return children({...renderProps, isActive, isPartial, partialPercent});
        }

        const content = children ?? icon ?? <RatingStarIcon />;

        return (
          <>
            <span className={slots?.icon()} data-slot="rating-icon">
              {content}
            </span>
            {isPartial ? (
              <span
                className={slots?.iconPartial()}
                data-slot="rating-icon-partial"
                style={{"--rating-partial": `${partialPercent}%`} as CSSProperties}
              >
                {content}
              </span>
            ) : null}
          </>
        );
      }}
    </RadioPrimitive>
  );
};

RatingItem.displayName = "HeroUI.Rating.Item";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {RatingRoot, RatingItem, RatingContext};

export type {RatingRootProps, RatingItemProps, RatingItemRenderProps};
