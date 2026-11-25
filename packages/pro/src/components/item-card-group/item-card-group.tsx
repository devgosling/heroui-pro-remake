"use client";

import type {ItemCardGroupLayout, ItemCardGroupVariant} from "./item-card-group-context";
import type {CSSProperties, ComponentPropsWithRef} from "react";

import {useMemo} from "react";

import {ItemCardGroupContext, useItemCardGroupContext} from "./item-card-group-context";
import {itemCardGroupVariants} from "./item-card-group.styles";

type ItemCardGroupColumns = 2 | 3;

/* -------------------------------------------------------------------------------------------------
 * Root
 * Puts item cards on one shared surface (list) or lays them out as separate cards (grid).
 * The cards are styled through `[data-slot="item-card"]`, so any `ItemCard` (or a custom row
 * carrying that slot) blends in; separators are plain OSS `Separator`s placed between them.
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardGroupRootProps extends ComponentPropsWithRef<"div"> {
  /**
   * Layout mode: a flat vertical stack on one surface, or a grid of separate cards.
   * @default "list"
   */
  layout?: ItemCardGroupLayout;
  /**
   * Visual style of the group surface.
   * @default "default"
   */
  variant?: ItemCardGroupVariant;
  /**
   * Grid column count, used when `layout` is `"grid"` (written to `--item-card-group-columns`).
   * @default 2
   */
  columns?: ItemCardGroupColumns;
}

const ItemCardGroupRoot = ({
  children,
  className,
  columns,
  layout = "list",
  style,
  variant = "default",
  ...rest
}: ItemCardGroupRootProps) => {
  const slots = useMemo(() => itemCardGroupVariants({layout, variant}), [layout, variant]);
  const contextValue = useMemo(() => ({layout, slots, variant}), [layout, slots, variant]);

  // The CSS default is 2 columns; only an explicit `columns` on a grid writes the variable.
  const resolvedStyle = useMemo<CSSProperties | undefined>(
    () =>
      layout === "grid" && columns !== undefined
        ? ({"--item-card-group-columns": columns, ...style} as CSSProperties)
        : style,
    [columns, layout, style],
  );

  return (
    <ItemCardGroupContext value={contextValue}>
      <div
        className={slots.base({className})}
        data-slot="item-card-group"
        role="group"
        style={resolvedStyle}
        {...rest}
      >
        {children}
      </div>
    </ItemCardGroupContext>
  );
};

ItemCardGroupRoot.displayName = "HeroUI.ItemCardGroup";

/* -------------------------------------------------------------------------------------------------
 * Header - optional title + description block (spans every column in the grid layout)
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardGroupHeaderProps extends ComponentPropsWithRef<"div"> {}

const ItemCardGroupHeader = ({className, ...rest}: ItemCardGroupHeaderProps) => {
  const {slots} = useItemCardGroupContext();

  return <div className={slots.header({className})} data-slot="item-card-group-header" {...rest} />;
};

ItemCardGroupHeader.displayName = "HeroUI.ItemCardGroup.Header";

/* -------------------------------------------------------------------------------------------------
 * Title (h3) / Description (p)
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardGroupTitleProps extends ComponentPropsWithRef<"h3"> {}

const ItemCardGroupTitle = ({children, className, ...rest}: ItemCardGroupTitleProps) => {
  const {slots} = useItemCardGroupContext();

  return (
    <h3 className={slots.title({className})} data-slot="item-card-group-title" {...rest}>
      {children}
    </h3>
  );
};

ItemCardGroupTitle.displayName = "HeroUI.ItemCardGroup.Title";

interface ItemCardGroupDescriptionProps extends ComponentPropsWithRef<"p"> {}

const ItemCardGroupDescription = ({className, ...rest}: ItemCardGroupDescriptionProps) => {
  const {slots} = useItemCardGroupContext();

  return (
    <p
      className={slots.description({className})}
      data-slot="item-card-group-description"
      {...rest}
    />
  );
};

ItemCardGroupDescription.displayName = "HeroUI.ItemCardGroup.Description";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ItemCardGroupRoot, ItemCardGroupHeader, ItemCardGroupTitle, ItemCardGroupDescription};

export type {
  ItemCardGroupColumns,
  ItemCardGroupLayout,
  ItemCardGroupVariant,
  ItemCardGroupRootProps,
  ItemCardGroupHeaderProps,
  ItemCardGroupTitleProps,
  ItemCardGroupDescriptionProps,
};
