"use client";

import type {NumberStepperVariants} from "./number-stepper.styles";
import type {Format, NumberFlowProps} from "@number-flow/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import NumberFlow from "@number-flow/react";
import {createContext, use, useMemo, useRef, useState} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {useLocale} from "react-aria-components/I18nProvider";
import {Input as InputPrimitive} from "react-aria-components/Input";
import {
  NumberField as NumberFieldPrimitive,
  NumberFieldStateContext,
} from "react-aria-components/NumberField";

import {useResolvedClassName} from "../../utils";

import {numberStepperVariants} from "./number-stepper.styles";

/* -------------------------------------------------------------------------------------------------
 * Icons
 * -----------------------------------------------------------------------------------------------*/
const MinusIcon = () => (
  <svg aria-hidden="true" fill="none" focusable="false" height="16" viewBox="0 0 16 16" width="16">
    <path d="M3.5 8h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);

const PlusIcon = () => (
  <svg aria-hidden="true" fill="none" focusable="false" height="16" viewBox="0 0 16 16" width="16">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type NumberStepperContext = {
  slots?: ReturnType<typeof numberStepperVariants>;
  formatOptions?: Format;
};

const NumberStepperContext = createContext<NumberStepperContext>({});

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface NumberStepperRootProps
  extends
    Omit<ComponentPropsWithRef<typeof NumberFieldPrimitive>, "formatOptions">,
    NumberStepperVariants {
  /**
   * Number formatting options for the animated value (passed to Number Flow).
   * The underlying NumberField keeps working with raw numbers.
   */
  formatOptions?: Format;
}

const NumberStepperRoot = ({
  children,
  className,
  formatOptions,
  size,
  ...rest
}: NumberStepperRootProps) => {
  const slots = useMemo(() => numberStepperVariants({size}), [size]);
  const contextValue = useMemo(() => ({formatOptions, slots}), [formatOptions, slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <NumberStepperContext value={contextValue}>
      <NumberFieldPrimitive {...rest} className={resolvedClassName} data-slot="number-stepper">
        {children}
      </NumberFieldPrimitive>
    </NumberStepperContext>
  );
};

NumberStepperRoot.displayName = "HeroUI.NumberStepper";

/* -------------------------------------------------------------------------------------------------
 * Group (renders the visually hidden input that RAC NumberField needs)
 * -----------------------------------------------------------------------------------------------*/
interface NumberStepperGroupProps extends ComponentPropsWithRef<typeof GroupPrimitive> {}

const NumberStepperGroup = ({children, className, ...rest}: NumberStepperGroupProps) => {
  const {slots} = use(NumberStepperContext);
  const resolvedClassName = useResolvedClassName(className, slots?.group());

  return (
    <GroupPrimitive {...rest} className={resolvedClassName} data-slot="number-stepper-group">
      {composeRenderProps(children, (resolvedChildren) => (
        <>
          {resolvedChildren}
          <InputPrimitive className={slots?.input()} data-slot="number-stepper-input" />
        </>
      ))}
    </GroupPrimitive>
  );
};

NumberStepperGroup.displayName = "HeroUI.NumberStepper.Group";

/* -------------------------------------------------------------------------------------------------
 * Value (animated with Number Flow)
 * -----------------------------------------------------------------------------------------------*/

/**
 * Spin digits by the change of the displayed magnitude instead of the signed value: going from
 * -1 to -2 rolls the digit up (1 -> 2) rather than down through 0 and 9. Equal magnitudes (crossing
 * zero, e.g. -1 -> 1) fall back to the signed direction.
 */
const magnitudeTrend = (oldValue: number, value: number) =>
  Math.sign(Math.abs(value) - Math.abs(oldValue)) || Math.sign(value - oldValue);

interface NumberStepperValueRenderProps {
  value: number;
  formatOptions?: Format;
}

interface NumberStepperValueProps extends Omit<
  NumberFlowProps,
  "value" | "format" | "children" | "ref"
> {
  /** Overrides the value shown (defaults to the stepper's current value). */
  value?: number;
  /** Overrides the root `formatOptions`. */
  format?: Format;
  /** Custom content; replaces the animated number with a plain span. */
  children?: ReactNode | ((props: NumberStepperValueRenderProps) => ReactNode);
}

/**
 * Number Flow animates the digits, but its own box snaps to the new width, so the pill would jump
 * when a digit or the minus sign appears. Mirror the number's natural width onto the value box;
 * the CSS width transition then grows / shrinks the pill smoothly (see .number-stepper__value).
 */
const useSmoothWidth = () => {
  const boxRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState<number>();

  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current;
    const number = numberRef.current;

    if (!box || !number || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const style = window.getComputedStyle(box);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);

      setWidth(Math.ceil(number.getBoundingClientRect().width + padding));
    };

    measure();
    const observer = new ResizeObserver(measure);

    observer.observe(number);

    return () => observer.disconnect();
  }, []);

  return {boxRef, numberRef, width};
};

const NumberStepperValue = ({
  children,
  className,
  format,
  locales,
  trend = magnitudeTrend,
  value,
  ...rest
}: NumberStepperValueProps) => {
  const {formatOptions, slots} = use(NumberStepperContext);
  const state = use(NumberFieldStateContext);
  const {locale} = useLocale();
  const {boxRef, numberRef, width} = useSmoothWidth();

  const rawValue = value ?? state?.numberValue ?? 0;
  const resolvedValue = Number.isNaN(rawValue) ? 0 : rawValue;
  const resolvedFormat = format ?? formatOptions;
  const resolvedClassName = slots?.value({className}) ?? className;

  if (children !== undefined) {
    return (
      <span className={resolvedClassName} data-slot="number-stepper-value">
        {typeof children === "function"
          ? children({formatOptions: resolvedFormat, value: resolvedValue})
          : children}
      </span>
    );
  }

  return (
    <span
      ref={boxRef}
      className={resolvedClassName}
      data-animated-width={width === undefined ? undefined : "true"}
      data-slot="number-stepper-value"
      style={width === undefined ? undefined : {width}}
    >
      <NumberFlow
        {...rest}
        ref={numberRef as never}
        data-slot="number-stepper-number"
        format={resolvedFormat}
        locales={locales ?? locale}
        trend={trend}
        value={resolvedValue}
      />
    </span>
  );
};

NumberStepperValue.displayName = "HeroUI.NumberStepper.Value";

/* -------------------------------------------------------------------------------------------------
 * Decrement / Increment buttons
 * -----------------------------------------------------------------------------------------------*/
interface NumberStepperButtonProps extends Omit<
  ComponentPropsWithRef<typeof ButtonPrimitive>,
  "slot"
> {}

const NumberStepperDecrementButton = ({children, className, ...rest}: NumberStepperButtonProps) => {
  const {slots} = use(NumberStepperContext);
  const resolvedClassName = useResolvedClassName(className, slots?.decrementButton());

  return (
    <ButtonPrimitive
      {...rest}
      className={resolvedClassName}
      data-slot="number-stepper-decrement-button"
      slot="decrement"
    >
      {children ?? <MinusIcon />}
    </ButtonPrimitive>
  );
};

NumberStepperDecrementButton.displayName = "HeroUI.NumberStepper.DecrementButton";

const NumberStepperIncrementButton = ({children, className, ...rest}: NumberStepperButtonProps) => {
  const {slots} = use(NumberStepperContext);
  const resolvedClassName = useResolvedClassName(className, slots?.incrementButton());

  return (
    <ButtonPrimitive
      {...rest}
      className={resolvedClassName}
      data-slot="number-stepper-increment-button"
      slot="increment"
    >
      {children ?? <PlusIcon />}
    </ButtonPrimitive>
  );
};

NumberStepperIncrementButton.displayName = "HeroUI.NumberStepper.IncrementButton";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberStepperRoot,
  NumberStepperGroup,
  NumberStepperValue,
  NumberStepperDecrementButton,
  NumberStepperIncrementButton,
  NumberStepperContext,
};

export type {
  NumberStepperRootProps,
  NumberStepperGroupProps,
  NumberStepperValueProps,
  NumberStepperValueRenderProps,
  NumberStepperButtonProps,
};
