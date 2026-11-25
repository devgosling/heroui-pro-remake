"use client";

import type {KPIGroupOrientation} from "./kpi-group-context";
import type {ComponentPropsWithRef} from "react";

import {useMemo} from "react";

import {KPIGroupContext, useKPIGroupContext} from "./kpi-group-context";
import {kpiGroupVariants} from "./kpi-group.styles";

/* -------------------------------------------------------------------------------------------------
 * Root
 * Lays KPI cards out on one shared surface. The cards are styled through `[data-slot="kpi"]`,
 * so this component neither imports nor requires `KPI` (and stays free of the recharts peer).
 * -----------------------------------------------------------------------------------------------*/
interface KPIGroupRootProps extends ComponentPropsWithRef<"div"> {
  /**
   * Layout direction of the KPI cards.
   * @default "horizontal"
   */
  orientation?: KPIGroupOrientation;
}

const KPIGroupRoot = ({
  children,
  className,
  orientation = "horizontal",
  ...rest
}: KPIGroupRootProps) => {
  const slots = useMemo(() => kpiGroupVariants({orientation}), [orientation]);
  const contextValue = useMemo(() => ({orientation, slots}), [orientation, slots]);

  return (
    <KPIGroupContext value={contextValue}>
      <div className={slots.base({className})} data-slot="kpi-group" role="group" {...rest}>
        {children}
      </div>
    </KPIGroupContext>
  );
};

KPIGroupRoot.displayName = "HeroUI.KPIGroup";

/* -------------------------------------------------------------------------------------------------
 * Separator
 * Purely decorative 1px divider. The group modifier (`--horizontal` / `--vertical`) decides
 * whether it is drawn as a vertical or a horizontal line, so it needs no orientation prop.
 * -----------------------------------------------------------------------------------------------*/
interface KPIGroupSeparatorProps extends ComponentPropsWithRef<"span"> {}

const KPIGroupSeparator = ({className, ...rest}: KPIGroupSeparatorProps) => {
  const {slots} = useKPIGroupContext();

  return (
    <span
      aria-hidden="true"
      className={slots.separator({className})}
      data-slot="kpi-group-separator"
      {...rest}
    />
  );
};

KPIGroupSeparator.displayName = "HeroUI.KPIGroup.Separator";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {KPIGroupRoot, KPIGroupSeparator};

export type {KPIGroupOrientation, KPIGroupRootProps, KPIGroupSeparatorProps};
