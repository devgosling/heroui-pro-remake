"use client";

import type {ItemCardGroupVariants} from "./item-card-group.styles";

import {createContext, use} from "react";

import {itemCardGroupVariants} from "./item-card-group.styles";

type ItemCardGroupLayout = NonNullable<ItemCardGroupVariants["layout"]>;
type ItemCardGroupVariant = NonNullable<ItemCardGroupVariants["variant"]>;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ItemCardGroupContext = {
  layout: ItemCardGroupLayout;
  variant: ItemCardGroupVariant;
  slots: ReturnType<typeof itemCardGroupVariants>;
};

const ItemCardGroupContext = createContext<ItemCardGroupContext>({
  layout: "list",
  slots: itemCardGroupVariants(),
  variant: "default",
});

/** Reads the layout, variant and slot classes of the nearest `ItemCardGroup`. */
const useItemCardGroupContext = () => use(ItemCardGroupContext);

export {ItemCardGroupContext, useItemCardGroupContext};

export type {ItemCardGroupLayout, ItemCardGroupVariant};
