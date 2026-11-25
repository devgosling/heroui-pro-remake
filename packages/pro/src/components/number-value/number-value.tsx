"use client";

import type {NumberValueFormatProps} from "./use-formatted-number";
import type {ComponentPropsWithRef, ReactElement, ReactNode} from "react";

import {Children, createContext, isValidElement, use, useMemo} from "react";

import {numberValueVariants} from "./number-value.styles";
import {useFormattedNumber} from "./use-formatted-number";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type NumberValueContext = {
  slots?: ReturnType<typeof numberValueVariants>;
};

const NumberValueContext = createContext<NumberValueContext>({});

/* -------------------------------------------------------------------------------------------------
 * Prefix / Suffix
 * -----------------------------------------------------------------------------------------------*/
interface NumberValuePrefixProps extends ComponentPropsWithRef<"span"> {}

const NumberValuePrefix = ({className, ...rest}: NumberValuePrefixProps) => {
  const {slots} = use(NumberValueContext);

  return (
    <span
      className={slots?.prefix({className}) ?? className}
      data-slot="number-value-prefix"
      {...rest}
    />
  );
};

NumberValuePrefix.displayName = "HeroUI.NumberValue.Prefix";

interface NumberValueSuffixProps extends ComponentPropsWithRef<"span"> {}

const NumberValueSuffix = ({className, ...rest}: NumberValueSuffixProps) => {
  const {slots} = use(NumberValueContext);

  return (
    <span
      className={slots?.suffix({className}) ?? className}
      data-slot="number-value-suffix"
      {...rest}
    />
  );
};

NumberValueSuffix.displayName = "HeroUI.NumberValue.Suffix";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface NumberValueRootProps
  extends Omit<ComponentPropsWithRef<"span">, "children" | "style">, NumberValueFormatProps {
  /** The number to format. */
  value: number;
  /** `Prefix` / `Suffix` parts, or a render function receiving the formatted string. */
  children?: ReactNode | ((formatted: string) => ReactNode);
}

const NumberValueRoot = ({
  children,
  className,
  currency,
  formatOptions,
  locale,
  maximumFractionDigits,
  minimumFractionDigits,
  notation,
  signDisplay,
  style,
  unit,
  value,
  ...rest
}: NumberValueRootProps) => {
  const slots = useMemo(() => numberValueVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const formatted = useFormattedNumber(value, {
    currency,
    formatOptions,
    locale,
    maximumFractionDigits,
    minimumFractionDigits,
    notation,
    signDisplay,
    style,
    unit,
  });

  // Prefix and Suffix always render around the value, wherever they appear in JSX.
  let prefix: ReactElement | undefined;
  let suffix: ReactElement | undefined;

  if (typeof children !== "function") {
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === NumberValuePrefix) prefix = child;
      else if (child.type === NumberValueSuffix) suffix = child;
    });
  }

  return (
    <NumberValueContext value={contextValue}>
      <span className={slots.base({className})} data-slot="number-value" {...rest}>
        {prefix}
        <span className={slots.value()} data-slot="number-value-value">
          {typeof children === "function" ? children(formatted) : formatted}
        </span>
        {suffix}
      </span>
    </NumberValueContext>
  );
};

NumberValueRoot.displayName = "HeroUI.NumberValue";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {NumberValueRoot, NumberValuePrefix, NumberValueSuffix};

export type {NumberValueRootProps, NumberValuePrefixProps, NumberValueSuffixProps};
