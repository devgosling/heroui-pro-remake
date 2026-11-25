"use client";

import type {NumberFormatOptions} from "@internationalized/number";

import {NumberFormatter} from "@internationalized/number";
import {useMemo} from "react";
import {useLocale} from "react-aria-components/I18nProvider";

/* -------------------------------------------------------------------------------------------------
 * Formatting
 * -----------------------------------------------------------------------------------------------*/
export interface NumberValueFormatProps {
  /** Intl format style. */
  style?: "decimal" | "currency" | "percent" | "unit";
  /** ISO 4217 currency code, required when `style="currency"`. */
  currency?: string;
  /** Intl unit identifier (e.g. `"kilometer"`), required when `style="unit"`. */
  unit?: string;
  /** Intl notation. */
  notation?: "standard" | "compact" | "scientific" | "engineering";
  /** Intl sign display. */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Overrides the locale of the nearest `I18nProvider`. */
  locale?: string;
  /** Raw formatter options; win over the convenience props above. */
  formatOptions?: NumberFormatOptions;
}

/**
 * Formats a number with the same rules as `NumberValue`. Exposed so composed components
 * (e.g. `KPI.Value`) share one formatting implementation.
 */
export function useFormattedNumber(value: number, props: NumberValueFormatProps): string {
  const {locale: contextLocale} = useLocale();
  const {
    currency,
    formatOptions,
    locale,
    maximumFractionDigits,
    minimumFractionDigits,
    notation,
    signDisplay,
    style,
    unit,
  } = props;

  const formatter = useMemo(() => {
    const convenience: NumberFormatOptions = {
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
      notation,
      signDisplay,
      style,
      unit,
    };
    const options = Object.fromEntries(
      Object.entries({...convenience, ...formatOptions}).filter(([, v]) => v !== undefined),
    ) as NumberFormatOptions;

    return new NumberFormatter(locale ?? contextLocale, options);
  }, [
    contextLocale,
    currency,
    formatOptions,
    locale,
    maximumFractionDigits,
    minimumFractionDigits,
    notation,
    signDisplay,
    style,
    unit,
  ]);

  return formatter.format(value);
}
