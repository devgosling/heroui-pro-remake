"use client";

import type {CheckboxButtonGroupVariants} from "./checkbox-button-group.styles";
import type {
  CheckboxButtonRenderProps,
  CheckboxContentProps,
  CheckboxGroupProps,
  CheckboxRootProps,
} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Checkbox, CheckboxGroup} from "@heroui/react";
import {createContext, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {useResolvedClassName} from "../../utils";

import {checkboxButtonGroupVariants} from "./checkbox-button-group.styles";

/* -------------------------------------------------------------------------------------------------
 * CheckboxButtonGroup Context
 * -----------------------------------------------------------------------------------------------*/
type CheckboxButtonGroupContext = {
  slots?: ReturnType<typeof checkboxButtonGroupVariants>;
};

const CheckboxButtonGroupContext = createContext<CheckboxButtonGroupContext>({});

/* -------------------------------------------------------------------------------------------------
 * CheckboxButtonGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxButtonGroupRootProps extends CheckboxGroupProps, CheckboxButtonGroupVariants {}

/**
 * Multi-selection group of card-style checkboxes. Wraps the HeroUI `CheckboxGroup`, so `variant`,
 * `value`, `defaultValue`, `onChange`, `isDisabled`, `name`, validation props etc. all apply.
 */
const CheckboxButtonGroupRoot = ({
  children,
  className,
  layout,
  ...rest
}: CheckboxButtonGroupRootProps) => {
  const slots = useMemo(() => checkboxButtonGroupVariants({layout}), [layout]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <CheckboxButtonGroupContext value={contextValue}>
      <CheckboxGroup data-slot="checkbox-button-group" {...rest} className={resolvedClassName}>
        {children}
      </CheckboxGroup>
    </CheckboxButtonGroupContext>
  );
};

CheckboxButtonGroupRoot.displayName = "HeroUI.CheckboxButtonGroup";

/* -------------------------------------------------------------------------------------------------
 * CheckboxButtonGroup Item
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxButtonGroupItemProps extends Omit<CheckboxRootProps, "children" | "className"> {
  /**
   * Card content, or a render function receiving the checkbox state (`isSelected`, `isHovered`,
   * `isPressed`, `isFocusVisible`, `isDisabled`, ...).
   */
  children?: ReactNode | ((renderProps: CheckboxButtonRenderProps) => ReactNode);
  /**
   * Classes for the card. The item root is `display: contents`, so the class lands on the
   * clickable card (`Checkbox.Content`), next to `checkbox-button-group__item`.
   */
  className?: CheckboxContentProps["className"];
}

const CheckboxButtonGroupItem = ({children, className, ...rest}: CheckboxButtonGroupItemProps) => {
  const {slots} = use(CheckboxButtonGroupContext);
  const resolvedClassName = useResolvedClassName(className, slots?.item());

  return (
    <Checkbox data-slot="checkbox-button-group-item" {...rest}>
      <Checkbox.Content className={resolvedClassName}>{children}</Checkbox.Content>
    </Checkbox>
  );
};

CheckboxButtonGroupItem.displayName = "HeroUI.CheckboxButtonGroup.Item";

/* -------------------------------------------------------------------------------------------------
 * CheckboxButtonGroup Indicator
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxButtonGroupIndicatorProps extends ComponentPropsWithRef<"span"> {
  /**
   * Custom indicator icon, only visible while the item is selected. Without children the default
   * HeroUI checkbox (`Checkbox.Control` + `Checkbox.Indicator`) is rendered.
   */
  children?: ReactNode;
}

const CheckboxButtonGroupIndicator = ({
  children,
  className,
  ...rest
}: CheckboxButtonGroupIndicatorProps) => {
  const {slots} = use(CheckboxButtonGroupContext);

  if (children === undefined || children === null) {
    return (
      <Checkbox.Control
        className={cx(slots?.indicator(), className)}
        data-slot="checkbox-button-group-indicator"
        {...rest}
      >
        <Checkbox.Indicator />
      </Checkbox.Control>
    );
  }

  return (
    <span
      className={slots?.indicator({className}) ?? className}
      data-custom="true"
      data-slot="checkbox-button-group-indicator"
      {...rest}
    >
      {children}
    </span>
  );
};

CheckboxButtonGroupIndicator.displayName = "HeroUI.CheckboxButtonGroup.Indicator";

/* -------------------------------------------------------------------------------------------------
 * CheckboxButtonGroup ItemContent
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxButtonGroupItemContentProps extends ComponentPropsWithRef<"div"> {}

const CheckboxButtonGroupItemContent = ({
  className,
  ...rest
}: CheckboxButtonGroupItemContentProps) => {
  const {slots} = use(CheckboxButtonGroupContext);

  return (
    <div
      className={slots?.itemContent({className}) ?? className}
      data-slot="checkbox-button-group-item-content"
      {...rest}
    />
  );
};

CheckboxButtonGroupItemContent.displayName = "HeroUI.CheckboxButtonGroup.ItemContent";

/* -------------------------------------------------------------------------------------------------
 * CheckboxButtonGroup ItemIcon
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxButtonGroupItemIconProps extends ComponentPropsWithRef<"div"> {}

const CheckboxButtonGroupItemIcon = ({className, ...rest}: CheckboxButtonGroupItemIconProps) => {
  const {slots} = use(CheckboxButtonGroupContext);

  return (
    <div
      className={slots?.itemIcon({className}) ?? className}
      data-slot="checkbox-button-group-item-icon"
      {...rest}
    />
  );
};

CheckboxButtonGroupItemIcon.displayName = "HeroUI.CheckboxButtonGroup.ItemIcon";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CheckboxButtonGroupRoot,
  CheckboxButtonGroupItem,
  CheckboxButtonGroupIndicator,
  CheckboxButtonGroupItemContent,
  CheckboxButtonGroupItemIcon,
  CheckboxButtonGroupContext,
};

export type {
  CheckboxButtonGroupRootProps,
  CheckboxButtonGroupItemProps,
  CheckboxButtonGroupIndicatorProps,
  CheckboxButtonGroupItemContentProps,
  CheckboxButtonGroupItemIconProps,
};
