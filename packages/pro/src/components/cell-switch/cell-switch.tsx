"use client";

import type {CellSwitchVariants} from "./cell-switch.styles";
import type {ComponentPropsWithRef} from "react";

import {Switch} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {useResolvedClassName} from "../../utils";

import {cellSwitchVariants} from "./cell-switch.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type CellSwitchContext = {
  slots: ReturnType<typeof cellSwitchVariants>;
};

const CellSwitchContext = createContext<CellSwitchContext>({slots: cellSwitchVariants()});

/* -------------------------------------------------------------------------------------------------
 * Root (OSS Switch)
 * -----------------------------------------------------------------------------------------------*/
interface CellSwitchRootProps
  extends Omit<ComponentPropsWithRef<typeof Switch.Root>, "variant">, CellSwitchVariants {}

const CellSwitchRoot = ({className, variant, ...rest}: CellSwitchRootProps) => {
  const slots = useMemo(() => cellSwitchVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <CellSwitchContext value={contextValue}>
      <Switch.Root {...rest} className={resolvedClassName} data-slot="cell-switch" />
    </CellSwitchContext>
  );
};

CellSwitchRoot.displayName = "HeroUI.CellSwitch";

/* -------------------------------------------------------------------------------------------------
 * Trigger (OSS Switch.Content - the clickable row)
 * -----------------------------------------------------------------------------------------------*/
interface CellSwitchTriggerProps extends ComponentPropsWithRef<typeof Switch.Content> {}

const CellSwitchTrigger = ({className, ...rest}: CellSwitchTriggerProps) => {
  const {slots} = use(CellSwitchContext);
  const resolvedClassName = useResolvedClassName(className, slots.trigger());

  return <Switch.Content {...rest} className={resolvedClassName} data-slot="cell-switch-trigger" />;
};

CellSwitchTrigger.displayName = "HeroUI.CellSwitch.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Label (leading text)
 * -----------------------------------------------------------------------------------------------*/
interface CellSwitchLabelProps extends ComponentPropsWithRef<"span"> {}

const CellSwitchLabel = ({className, ...rest}: CellSwitchLabelProps) => {
  const {slots} = use(CellSwitchContext);

  return <span className={slots.label({className})} data-slot="cell-switch-label" {...rest} />;
};

CellSwitchLabel.displayName = "HeroUI.CellSwitch.Label";

/* -------------------------------------------------------------------------------------------------
 * Control (OSS Switch.Control, default Switch.Thumb)
 * -----------------------------------------------------------------------------------------------*/
type CellSwitchControlProps = ComponentPropsWithRef<typeof Switch.Control>;

const CellSwitchControl = ({children, className, ...rest}: CellSwitchControlProps) => {
  const {slots} = use(CellSwitchContext);

  return (
    <Switch.Control
      {...rest}
      className={slots.control({className})}
      data-slot="cell-switch-control"
    >
      {children ?? <Switch.Thumb />}
    </Switch.Control>
  );
};

CellSwitchControl.displayName = "HeroUI.CellSwitch.Control";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {CellSwitchRoot, CellSwitchTrigger, CellSwitchLabel, CellSwitchControl, CellSwitchContext};

export type {
  CellSwitchRootProps,
  CellSwitchTriggerProps,
  CellSwitchLabelProps,
  CellSwitchControlProps,
};
