"use client";

import type {KPIGroupVariants} from "./kpi-group.styles";

import {createContext, use} from "react";

import {kpiGroupVariants} from "./kpi-group.styles";

type KPIGroupOrientation = NonNullable<KPIGroupVariants["orientation"]>;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type KPIGroupContext = {
  orientation: KPIGroupOrientation;
  slots: ReturnType<typeof kpiGroupVariants>;
};

const KPIGroupContext = createContext<KPIGroupContext>({
  orientation: "horizontal",
  slots: kpiGroupVariants(),
});

/** Reads the orientation and slot classes of the nearest `KPIGroup`. */
const useKPIGroupContext = () => use(KPIGroupContext);

export {KPIGroupContext, useKPIGroupContext};

export type {KPIGroupOrientation};
