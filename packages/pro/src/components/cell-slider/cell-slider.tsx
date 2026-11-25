"use client";

import type {CellSliderVariants} from "./cell-slider.styles";
import type {ComponentPropsWithRef} from "react";

import {Slider} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {useResolvedClassName} from "../../utils";

import {cellSliderVariants} from "./cell-slider.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type CellSliderContext = {
  slots: ReturnType<typeof cellSliderVariants>;
};

const CellSliderContext = createContext<CellSliderContext>({slots: cellSliderVariants()});

/* -------------------------------------------------------------------------------------------------
 * Root (OSS Slider, always horizontal)
 * -----------------------------------------------------------------------------------------------*/
interface CellSliderRootProps
  extends
    Omit<ComponentPropsWithRef<typeof Slider.Root>, "orientation" | "variant">,
    CellSliderVariants {}

const CellSliderRoot = ({className, variant, ...rest}: CellSliderRootProps) => {
  const slots = useMemo(() => cellSliderVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <CellSliderContext value={contextValue}>
      <Slider.Root
        {...rest}
        className={resolvedClassName}
        data-slot="cell-slider"
        orientation="horizontal"
      />
    </CellSliderContext>
  );
};

CellSliderRoot.displayName = "HeroUI.CellSlider";

/* -------------------------------------------------------------------------------------------------
 * Track (OSS Slider.Track - the visible cell row)
 * -----------------------------------------------------------------------------------------------*/
interface CellSliderTrackProps extends ComponentPropsWithRef<typeof Slider.Track> {}

const CellSliderTrack = ({className, ...rest}: CellSliderTrackProps) => {
  const {slots} = use(CellSliderContext);
  const resolvedClassName = useResolvedClassName(className, slots.track());

  return <Slider.Track {...rest} className={resolvedClassName} data-slot="cell-slider-track" />;
};

CellSliderTrack.displayName = "HeroUI.CellSlider.Track";

/* -------------------------------------------------------------------------------------------------
 * Fill (OSS Slider.Fill - subtle tint up to the current value)
 * -----------------------------------------------------------------------------------------------*/
type CellSliderFillProps = ComponentPropsWithRef<typeof Slider.Fill>;

const CellSliderFill = ({className, ...rest}: CellSliderFillProps) => {
  const {slots} = use(CellSliderContext);

  return (
    <Slider.Fill
      {...rest}
      className={slots.fill({className: className as string | undefined})}
      data-slot="cell-slider-fill"
    />
  );
};

CellSliderFill.displayName = "HeroUI.CellSlider.Fill";

/* -------------------------------------------------------------------------------------------------
 * Thumb (OSS Slider.Thumb - transparent hit area, the pill is its ::after)
 * -----------------------------------------------------------------------------------------------*/
interface CellSliderThumbProps extends ComponentPropsWithRef<typeof Slider.Thumb> {}

const CellSliderThumb = ({className, ...rest}: CellSliderThumbProps) => {
  const {slots} = use(CellSliderContext);
  const resolvedClassName = useResolvedClassName(className, slots.thumb());

  return <Slider.Thumb {...rest} className={resolvedClassName} data-slot="cell-slider-thumb" />;
};

CellSliderThumb.displayName = "HeroUI.CellSlider.Thumb";

/* -------------------------------------------------------------------------------------------------
 * Label (leading text, absolutely positioned at the start)
 * -----------------------------------------------------------------------------------------------*/
interface CellSliderLabelProps extends ComponentPropsWithRef<"span"> {}

const CellSliderLabel = ({className, ...rest}: CellSliderLabelProps) => {
  const {slots} = use(CellSliderContext);

  return <span className={slots.label({className})} data-slot="cell-slider-label" {...rest} />;
};

CellSliderLabel.displayName = "HeroUI.CellSlider.Label";

/* -------------------------------------------------------------------------------------------------
 * Output (OSS Slider.Output - value display, absolutely positioned at the end)
 * -----------------------------------------------------------------------------------------------*/
interface CellSliderOutputProps extends ComponentPropsWithRef<typeof Slider.Output> {}

const CellSliderOutput = ({className, ...rest}: CellSliderOutputProps) => {
  const {slots} = use(CellSliderContext);
  const resolvedClassName = useResolvedClassName(className, slots.output());

  return <Slider.Output {...rest} className={resolvedClassName} data-slot="cell-slider-output" />;
};

CellSliderOutput.displayName = "HeroUI.CellSlider.Output";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CellSliderRoot,
  CellSliderTrack,
  CellSliderFill,
  CellSliderThumb,
  CellSliderLabel,
  CellSliderOutput,
  CellSliderContext,
};

export type {
  CellSliderRootProps,
  CellSliderTrackProps,
  CellSliderFillProps,
  CellSliderThumbProps,
  CellSliderLabelProps,
  CellSliderOutputProps,
};
