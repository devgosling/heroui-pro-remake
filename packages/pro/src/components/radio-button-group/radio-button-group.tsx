"use client";

import type {RadioButtonGroupVariants} from "./radio-button-group.styles";
import type {
  RadioButtonRenderProps,
  RadioContentProps,
  RadioGroupRootProps,
  RadioRootProps,
} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Radio, RadioGroup} from "@heroui/react";
import {createContext, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {useResolvedClassName} from "../../utils";

import {radioButtonGroupVariants} from "./radio-button-group.styles";

/* -------------------------------------------------------------------------------------------------
 * RadioButtonGroup Context
 * -----------------------------------------------------------------------------------------------*/
type RadioButtonGroupContext = {
  slots?: ReturnType<typeof radioButtonGroupVariants>;
};

const RadioButtonGroupContext = createContext<RadioButtonGroupContext>({});

/* -------------------------------------------------------------------------------------------------
 * RadioButtonGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface RadioButtonGroupRootProps extends RadioGroupRootProps, RadioButtonGroupVariants {}

/**
 * Single-selection group of card-style radios. Wraps the HeroUI `RadioGroup`, so `variant`,
 * `value`, `defaultValue`, `onChange`, `isDisabled`, `name`, `orientation`, validation props etc.
 * all apply.
 */
const RadioButtonGroupRoot = ({
  children,
  className,
  layout,
  ...rest
}: RadioButtonGroupRootProps) => {
  const slots = useMemo(() => radioButtonGroupVariants({layout}), [layout]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <RadioButtonGroupContext value={contextValue}>
      <RadioGroup data-slot="radio-button-group" {...rest} className={resolvedClassName}>
        {children}
      </RadioGroup>
    </RadioButtonGroupContext>
  );
};

RadioButtonGroupRoot.displayName = "HeroUI.RadioButtonGroup";

/* -------------------------------------------------------------------------------------------------
 * RadioButtonGroup Item
 * -----------------------------------------------------------------------------------------------*/
interface RadioButtonGroupItemProps extends Omit<RadioRootProps, "children" | "className"> {
  /**
   * Card content, or a render function receiving the radio state (`isSelected`, `isHovered`,
   * `isPressed`, `isFocusVisible`, `isDisabled`, ...).
   */
  children?: ReactNode | ((renderProps: RadioButtonRenderProps) => ReactNode);
  /**
   * Classes for the card. The item root is `display: contents`, so the class lands on the
   * clickable card (`Radio.Content`), next to `radio-button-group__item`.
   */
  className?: RadioContentProps["className"];
}

const RadioButtonGroupItem = ({children, className, ...rest}: RadioButtonGroupItemProps) => {
  const {slots} = use(RadioButtonGroupContext);
  const resolvedClassName = useResolvedClassName(className, slots?.item());

  return (
    <Radio data-slot="radio-button-group-item" {...rest}>
      <Radio.Content className={resolvedClassName}>{children}</Radio.Content>
    </Radio>
  );
};

RadioButtonGroupItem.displayName = "HeroUI.RadioButtonGroup.Item";

/* -------------------------------------------------------------------------------------------------
 * RadioButtonGroup Indicator
 * -----------------------------------------------------------------------------------------------*/
interface RadioButtonGroupIndicatorProps extends ComponentPropsWithRef<"span"> {
  /**
   * Custom indicator icon, only visible while the item is selected. Without children the default
   * HeroUI radio (`Radio.Control` + `Radio.Indicator`) is rendered.
   */
  children?: ReactNode;
}

const RadioButtonGroupIndicator = ({
  children,
  className,
  ...rest
}: RadioButtonGroupIndicatorProps) => {
  const {slots} = use(RadioButtonGroupContext);

  if (children === undefined || children === null) {
    return (
      <Radio.Control
        className={cx(slots?.indicator(), className)}
        data-slot="radio-button-group-indicator"
        {...rest}
      >
        <Radio.Indicator />
      </Radio.Control>
    );
  }

  return (
    <span
      className={slots?.indicator({className}) ?? className}
      data-custom="true"
      data-slot="radio-button-group-indicator"
      {...rest}
    >
      {children}
    </span>
  );
};

RadioButtonGroupIndicator.displayName = "HeroUI.RadioButtonGroup.Indicator";

/* -------------------------------------------------------------------------------------------------
 * RadioButtonGroup ItemContent
 * -----------------------------------------------------------------------------------------------*/
interface RadioButtonGroupItemContentProps extends ComponentPropsWithRef<"div"> {}

const RadioButtonGroupItemContent = ({className, ...rest}: RadioButtonGroupItemContentProps) => {
  const {slots} = use(RadioButtonGroupContext);

  return (
    <div
      className={slots?.itemContent({className}) ?? className}
      data-slot="radio-button-group-item-content"
      {...rest}
    />
  );
};

RadioButtonGroupItemContent.displayName = "HeroUI.RadioButtonGroup.ItemContent";

/* -------------------------------------------------------------------------------------------------
 * RadioButtonGroup ItemIcon
 * -----------------------------------------------------------------------------------------------*/
interface RadioButtonGroupItemIconProps extends ComponentPropsWithRef<"div"> {}

const RadioButtonGroupItemIcon = ({className, ...rest}: RadioButtonGroupItemIconProps) => {
  const {slots} = use(RadioButtonGroupContext);

  return (
    <div
      className={slots?.itemIcon({className}) ?? className}
      data-slot="radio-button-group-item-icon"
      {...rest}
    />
  );
};

RadioButtonGroupItemIcon.displayName = "HeroUI.RadioButtonGroup.ItemIcon";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  RadioButtonGroupRoot,
  RadioButtonGroupItem,
  RadioButtonGroupIndicator,
  RadioButtonGroupItemContent,
  RadioButtonGroupItemIcon,
  RadioButtonGroupContext,
};

export type {
  RadioButtonGroupRootProps,
  RadioButtonGroupItemProps,
  RadioButtonGroupIndicatorProps,
  RadioButtonGroupItemContentProps,
  RadioButtonGroupItemIconProps,
};
