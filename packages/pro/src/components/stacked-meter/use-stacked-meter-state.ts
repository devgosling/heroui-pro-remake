"use client";

import type {
  StackedMeterColor,
  StackedMeterSegment,
  StackedMeterSegmentState,
} from "./stacked-meter-context";

import {NumberFormatter} from "@internationalized/number";
import {useMemo} from "react";
import {useLocale} from "react-aria-components/I18nProvider";

/** Palette assigned, in order, to segments without an explicit `color`. */
const CHART_SEQUENCE: StackedMeterColor[] = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

export const DEFAULT_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  maximumFractionDigits: 1,
  style: "percent",
};

/** Negative and non-finite values count as 0. */
const sanitize = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

interface StackedMeterState {
  segments: StackedMeterSegmentState[];
  total: number;
  remainderPercentage: number;
  summaryText: string;
}

/**
 * Computes every segment's share of the total (the sum of the values, or a larger `maxValue`), its
 * formatted value text and the combined summary that screen readers announce for the track.
 */
export const useStackedMeterState = (
  segments: StackedMeterSegment[],
  maxValue: number | undefined,
  formatOptions: Intl.NumberFormatOptions | undefined,
): StackedMeterState => {
  const {locale} = useLocale();
  const options = formatOptions ?? DEFAULT_FORMAT_OPTIONS;
  // Intl options are usually passed inline; key the memo on their content instead of identity.
  const optionsKey = JSON.stringify(options);

  return useMemo(() => {
    const resolvedOptions = JSON.parse(optionsKey) as Intl.NumberFormatOptions;
    const formatter = new NumberFormatter(locale, resolvedOptions);
    const isPercent = resolvedOptions.style === "percent";

    const values = segments.map((segment) => sanitize(segment.value));
    const sum = values.reduce((acc, value) => acc + value, 0);
    const capacity = maxValue !== undefined && Number.isFinite(maxValue) ? maxValue : 0;
    const total = Math.max(sum, capacity);

    let paletteIndex = 0;

    const states = segments.map<StackedMeterSegmentState>((segment, index) => {
      const value = values[index] ?? 0;
      const percentage = total > 0 ? (value / total) * 100 : 0;
      const color =
        segment.color ?? CHART_SEQUENCE[paletteIndex++ % CHART_SEQUENCE.length] ?? "chart-1";

      return {
        ...segment,
        color,
        index,
        percentage,
        value,
        valueText: formatter.format(isPercent ? percentage / 100 : value),
      };
    });

    const remainderPercentage = total > 0 ? Math.max(0, ((total - sum) / total) * 100) : 100;
    const summaryText = states.map((state) => `${state.label} ${state.valueText}`).join(", ");

    return {remainderPercentage, segments: states, summaryText, total};
  }, [locale, maxValue, optionsKey, segments]);
};
