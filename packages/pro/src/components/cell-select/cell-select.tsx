"use client";

import type {CellSelectVariants} from "./cell-select.styles";
import type {
  SelectIndicatorProps,
  SelectPopoverProps,
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode, SVGProps} from "react";

import {Select} from "@heroui/react";
import {createContext, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {useResolvedClassName} from "../../utils";

import {cellSelectVariants} from "./cell-select.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type CellSelectContext = {
  slots: ReturnType<typeof cellSelectVariants>;
};

const CellSelectContext = createContext<CellSelectContext>({slots: cellSelectVariants()});

/* -------------------------------------------------------------------------------------------------
 * Default indicator icon
 * -----------------------------------------------------------------------------------------------*/

/**
 * Vertical "expand" chevrons (one pointing up, one pointing down).
 * Path from Gravity UI Icons (`chevrons-expand-vertical`), MIT License,
 * Copyright (c) 2023 YANDEX LLC - https://github.com/gravity-ui/icons
 */
const ChevronsExpandVerticalIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M3.58 4.109a.75.75 0 0 0 1.061 1.06L8 1.811l3.354 3.353a.75.75 0 0 0 1.06-1.06L8.53.22a.75.75 0 0 0-1.06 0zm8.84 7.782a.75.75 0 1 0-1.061-1.06l-3.36 3.358-3.353-3.353a.75.75 0 1 0-1.06 1.06L7.47 15.78a.75.75 0 0 0 1.06 0z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Root (OSS Select)
 * -----------------------------------------------------------------------------------------------*/
type CellSelectRootProps<
  T extends object = object,
  M extends "single" | "multiple" = "single",
> = Omit<SelectRootProps<T, M>, "variant"> &
  CellSelectVariants & {
    /** Trigger (Label, Value, Indicator) and Popover (with the list items). */
    children?: SelectRootProps<T, M>["children"];
  };

const CellSelectRoot = <T extends object = object, M extends "single" | "multiple" = "single">({
  children,
  className,
  variant,
  ...rest
}: CellSelectRootProps<T, M>) => {
  const slots = useMemo(() => cellSelectVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  // `variant` only styles the cell row, so the OSS Select keeps its own (primary) variant.
  return (
    <CellSelectContext value={contextValue}>
      <Select<T, M> data-slot="cell-select" {...rest} className={resolvedClassName}>
        {children}
      </Select>
    </CellSelectContext>
  );
};

CellSelectRoot.displayName = "HeroUI.CellSelect";

/* -------------------------------------------------------------------------------------------------
 * Trigger (OSS Select.Trigger - the visible cell row)
 * -----------------------------------------------------------------------------------------------*/
interface CellSelectTriggerProps extends SelectTriggerProps {}

const CellSelectTrigger = ({children, className, ...rest}: CellSelectTriggerProps) => {
  const {slots} = use(CellSelectContext);
  const resolvedClassName = useResolvedClassName(className, slots.trigger());

  return (
    <Select.Trigger data-slot="cell-select-trigger" {...rest} className={resolvedClassName}>
      {children}
    </Select.Trigger>
  );
};

CellSelectTrigger.displayName = "HeroUI.CellSelect.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Label (leading text)
 * -----------------------------------------------------------------------------------------------*/
interface CellSelectLabelProps extends ComponentPropsWithRef<"span"> {
  /** Label text. */
  children?: ReactNode;
}

const CellSelectLabel = ({className, ...rest}: CellSelectLabelProps) => {
  const {slots} = use(CellSelectContext);

  return <span className={slots.label({className})} data-slot="cell-select-label" {...rest} />;
};

CellSelectLabel.displayName = "HeroUI.CellSelect.Label";

/* -------------------------------------------------------------------------------------------------
 * Value (OSS Select.Value - the selected item, trailing and muted)
 * -----------------------------------------------------------------------------------------------*/
interface CellSelectValueProps extends SelectValueProps {}

const CellSelectValue = ({className, ...rest}: CellSelectValueProps) => {
  const {slots} = use(CellSelectContext);
  const resolvedClassName = useResolvedClassName(className, slots.value());

  return <Select.Value data-slot="cell-select-value" {...rest} className={resolvedClassName} />;
};

CellSelectValue.displayName = "HeroUI.CellSelect.Value";

/* -------------------------------------------------------------------------------------------------
 * Indicator (OSS Select.Indicator, default icon = ChevronsExpandVertical)
 * -----------------------------------------------------------------------------------------------*/
type CellSelectIndicatorProps = Omit<SelectIndicatorProps, "children"> &
  Omit<SVGProps<SVGSVGElement>, keyof SelectIndicatorProps> & {
    /** Custom indicator icon. Defaults to vertical expand chevrons. */
    children?: ReactNode;
  };

const CellSelectIndicator = ({children, className, ...rest}: CellSelectIndicatorProps) => {
  const {slots} = use(CellSelectContext);

  // The OSS indicator clones a custom element and stamps `data-slot="select-indicator"` and
  // `data-open` onto it, so the default icon goes through the same path as a custom one.
  return (
    <Select.Indicator className={cx(slots.indicator(), className)} {...rest}>
      {children ?? <ChevronsExpandVerticalIcon />}
    </Select.Indicator>
  );
};

CellSelectIndicator.displayName = "HeroUI.CellSelect.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Popover (OSS Select.Popover)
 * -----------------------------------------------------------------------------------------------*/
interface CellSelectPopoverProps extends SelectPopoverProps {}

const CellSelectPopover = ({
  children,
  className,
  placement = "bottom end",
  ...rest
}: CellSelectPopoverProps) => {
  const {slots} = use(CellSelectContext);
  const resolvedClassName = useResolvedClassName(className, slots.popover());

  // The OSS Select.Popover always stamps `data-slot="select-popover"` (same as Pro).
  return (
    <Select.Popover {...rest} className={resolvedClassName} placement={placement}>
      {children}
    </Select.Popover>
  );
};

CellSelectPopover.displayName = "HeroUI.CellSelect.Popover";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CellSelectRoot,
  CellSelectTrigger,
  CellSelectLabel,
  CellSelectValue,
  CellSelectIndicator,
  CellSelectPopover,
  CellSelectContext,
};

export type {
  CellSelectRootProps,
  CellSelectTriggerProps,
  CellSelectLabelProps,
  CellSelectValueProps,
  CellSelectIndicatorProps,
  CellSelectPopoverProps,
};
