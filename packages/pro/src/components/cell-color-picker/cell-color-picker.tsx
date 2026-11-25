"use client";

import type {CellColorPickerVariants} from "./cell-color-picker.styles";
import type {
  ColorPickerPopoverProps,
  ColorPickerRootProps,
  ColorSwatchRootProps,
} from "@heroui/react";
import type {ComponentPropsWithRef} from "react";

import {ColorPicker, ColorSwatch} from "@heroui/react";
import {createContext, use, useMemo} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {ColorPickerStateContext} from "react-aria-components/ColorPicker";

import {useResolvedClassName} from "../../utils";

import {cellColorPickerVariants} from "./cell-color-picker.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type CellColorPickerContext = {
  slots: ReturnType<typeof cellColorPickerVariants>;
};

const CellColorPickerContext = createContext<CellColorPickerContext>({
  slots: cellColorPickerVariants(),
});

/* -------------------------------------------------------------------------------------------------
 * Root (OSS ColorPicker: RAC ColorPicker + DialogTrigger + wrapper div)
 * -----------------------------------------------------------------------------------------------*/
interface CellColorPickerRootProps extends ColorPickerRootProps, CellColorPickerVariants {}

const CellColorPickerRoot = ({className, variant, ...rest}: CellColorPickerRootProps) => {
  const slots = useMemo(() => cellColorPickerVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <CellColorPickerContext value={contextValue}>
      <ColorPicker.Root {...rest} className={slots.base({className})} />
    </CellColorPickerContext>
  );
};

CellColorPickerRoot.displayName = "HeroUI.CellColorPicker";

/* -------------------------------------------------------------------------------------------------
 * Trigger (RAC Button - the visible cell row, wired to the picker's DialogTrigger)
 * -----------------------------------------------------------------------------------------------*/
interface CellColorPickerTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const CellColorPickerTrigger = ({className, ...rest}: CellColorPickerTriggerProps) => {
  const {slots} = use(CellColorPickerContext);
  const resolvedClassName = useResolvedClassName(className, slots.trigger());

  return (
    <ButtonPrimitive
      data-slot="cell-color-picker-trigger"
      {...rest}
      className={resolvedClassName}
    />
  );
};

CellColorPickerTrigger.displayName = "HeroUI.CellColorPicker.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Label (leading text)
 * -----------------------------------------------------------------------------------------------*/
interface CellColorPickerLabelProps extends ComponentPropsWithRef<"span"> {}

const CellColorPickerLabel = ({className, ...rest}: CellColorPickerLabelProps) => {
  const {slots} = use(CellColorPickerContext);

  return (
    <span className={slots.label({className})} data-slot="cell-color-picker-label" {...rest} />
  );
};

CellColorPickerLabel.displayName = "HeroUI.CellColorPicker.Label";

/* -------------------------------------------------------------------------------------------------
 * ValueDisplay (current color as #RRGGBB, read from the RAC ColorPicker state)
 * -----------------------------------------------------------------------------------------------*/
interface CellColorPickerValueDisplayProps extends ComponentPropsWithRef<"span"> {}

const CellColorPickerValueDisplay = ({
  children,
  className,
  ...rest
}: CellColorPickerValueDisplayProps) => {
  const {slots} = use(CellColorPickerContext);
  const state = use(ColorPickerStateContext);

  return (
    <span
      className={slots.valueDisplay({className})}
      data-slot="cell-color-picker-value-display"
      {...rest}
    >
      {children ?? state?.color.toString("hex")}
    </span>
  );
};

CellColorPickerValueDisplay.displayName = "HeroUI.CellColorPicker.ValueDisplay";

/* -------------------------------------------------------------------------------------------------
 * Swatch (OSS ColorSwatch - picks the current color up from the RAC ColorPicker)
 * -----------------------------------------------------------------------------------------------*/
interface CellColorPickerSwatchProps extends ColorSwatchRootProps {}

const CellColorPickerSwatch = ({className, ...rest}: CellColorPickerSwatchProps) => {
  const {slots} = use(CellColorPickerContext);
  const resolvedClassName = useResolvedClassName(className, slots.swatch());

  return <ColorSwatch {...rest} className={resolvedClassName} />;
};

CellColorPickerSwatch.displayName = "HeroUI.CellColorPicker.Swatch";

/* -------------------------------------------------------------------------------------------------
 * Popover (OSS ColorPicker.Popover, anchored to the trailing edge of the cell)
 * -----------------------------------------------------------------------------------------------*/
interface CellColorPickerPopoverProps extends ColorPickerPopoverProps {}

const CellColorPickerPopover = ({
  className,
  placement = "bottom end",
  ...rest
}: CellColorPickerPopoverProps) => {
  const {slots} = use(CellColorPickerContext);
  const resolvedClassName = useResolvedClassName(className, slots.popover());

  return <ColorPicker.Popover {...rest} className={resolvedClassName} placement={placement} />;
};

CellColorPickerPopover.displayName = "HeroUI.CellColorPicker.Popover";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CellColorPickerRoot,
  CellColorPickerTrigger,
  CellColorPickerLabel,
  CellColorPickerValueDisplay,
  CellColorPickerSwatch,
  CellColorPickerPopover,
  CellColorPickerContext,
};

export type {
  CellColorPickerRootProps,
  CellColorPickerTriggerProps,
  CellColorPickerLabelProps,
  CellColorPickerValueDisplayProps,
  CellColorPickerSwatchProps,
  CellColorPickerPopoverProps,
};
