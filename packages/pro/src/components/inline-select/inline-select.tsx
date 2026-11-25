"use client";

import type {
  SelectIndicatorProps,
  SelectPopoverProps,
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
} from "@heroui/react";
import type {ReactNode, SVGProps} from "react";

import {Select} from "@heroui/react";
import {createContext, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {useResolvedClassName} from "../../utils";

import {inlineSelectVariants} from "./inline-select.styles";

/* -------------------------------------------------------------------------------------------------
 * InlineSelect Context
 * -----------------------------------------------------------------------------------------------*/
type InlineSelectContext = {
  slots?: ReturnType<typeof inlineSelectVariants>;
};

const InlineSelectContext = createContext<InlineSelectContext>({});

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
 * InlineSelect Root
 * -----------------------------------------------------------------------------------------------*/
type InlineSelectRootProps<
  T extends object = object,
  M extends "single" | "multiple" = "single",
> = SelectRootProps<T, M> & {
  /** Trigger (with Value and Indicator) and Popover (with the list items). */
  children?: SelectRootProps<T, M>["children"];
};

const InlineSelectRoot = <T extends object = object, M extends "single" | "multiple" = "single">({
  children,
  className,
  ...rest
}: InlineSelectRootProps<T, M>) => {
  const slots = useMemo(() => inlineSelectVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <InlineSelectContext value={contextValue}>
      <Select<T, M> data-slot="inline-select" {...rest} className={resolvedClassName}>
        {children}
      </Select>
    </InlineSelectContext>
  );
};

InlineSelectRoot.displayName = "HeroUI.InlineSelect";

/* -------------------------------------------------------------------------------------------------
 * InlineSelect Trigger
 * -----------------------------------------------------------------------------------------------*/
interface InlineSelectTriggerProps extends SelectTriggerProps {}

const InlineSelectTrigger = ({children, className, ...rest}: InlineSelectTriggerProps) => {
  const {slots} = use(InlineSelectContext);
  const resolvedClassName = useResolvedClassName(className, slots?.trigger());

  return (
    <Select.Trigger data-slot="inline-select-trigger" {...rest} className={resolvedClassName}>
      {children}
    </Select.Trigger>
  );
};

InlineSelectTrigger.displayName = "HeroUI.InlineSelect.Trigger";

/* -------------------------------------------------------------------------------------------------
 * InlineSelect Value
 * -----------------------------------------------------------------------------------------------*/
interface InlineSelectValueProps extends SelectValueProps {}

const InlineSelectValue = ({className, ...rest}: InlineSelectValueProps) => {
  const {slots} = use(InlineSelectContext);
  const resolvedClassName = useResolvedClassName(className, slots?.value());

  return <Select.Value data-slot="inline-select-value" {...rest} className={resolvedClassName} />;
};

InlineSelectValue.displayName = "HeroUI.InlineSelect.Value";

/* -------------------------------------------------------------------------------------------------
 * InlineSelect Indicator
 * -----------------------------------------------------------------------------------------------*/
type InlineSelectIndicatorProps = Omit<SelectIndicatorProps, "children"> &
  Omit<SVGProps<SVGSVGElement>, keyof SelectIndicatorProps> & {
    /** Custom indicator icon. Defaults to vertical expand chevrons. */
    children?: ReactNode;
  };

const InlineSelectIndicator = ({children, className, ...rest}: InlineSelectIndicatorProps) => {
  const {slots} = use(InlineSelectContext);

  // The OSS indicator clones a custom element and stamps `data-slot="select-indicator"` and
  // `data-open` onto it, so the default icon goes through the same path as a custom one.
  return (
    <Select.Indicator className={cx(slots?.indicator(), className)} {...rest}>
      {children ?? <ChevronsExpandVerticalIcon />}
    </Select.Indicator>
  );
};

InlineSelectIndicator.displayName = "HeroUI.InlineSelect.Indicator";

/* -------------------------------------------------------------------------------------------------
 * InlineSelect Popover
 * -----------------------------------------------------------------------------------------------*/
interface InlineSelectPopoverProps extends SelectPopoverProps {}

const InlineSelectPopover = ({
  children,
  className,
  placement = "bottom end",
  ...rest
}: InlineSelectPopoverProps) => {
  const {slots} = use(InlineSelectContext);
  const resolvedClassName = useResolvedClassName(className, slots?.popover());

  return (
    <Select.Popover
      data-slot="inline-select-popover"
      {...rest}
      className={resolvedClassName}
      placement={placement}
    >
      {children}
    </Select.Popover>
  );
};

InlineSelectPopover.displayName = "HeroUI.InlineSelect.Popover";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  InlineSelectRoot,
  InlineSelectTrigger,
  InlineSelectValue,
  InlineSelectIndicator,
  InlineSelectPopover,
  InlineSelectContext,
};

export type {
  InlineSelectRootProps,
  InlineSelectTriggerProps,
  InlineSelectValueProps,
  InlineSelectIndicatorProps,
  InlineSelectPopoverProps,
};
