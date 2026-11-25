"use client";

import type {ItemCardVariants} from "./item-card.styles";
import type {DOMRenderProps} from "@heroui/react";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";

import {dom} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {itemCardVariants} from "./item-card.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
// Parts read the slots from context, but also work standalone (e.g. inside a custom row).
const defaultSlots = itemCardVariants();

type ItemCardContext = {
  slots: ReturnType<typeof itemCardVariants>;
};

const ItemCardContext = createContext<ItemCardContext>({slots: defaultSlots});

/* -------------------------------------------------------------------------------------------------
 * Root - horizontal row container (a `div` unless `render` swaps the element)
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardRootProps<E extends keyof JSX.IntrinsicElements = "div">
  extends DOMRenderProps<E, undefined>, ItemCardVariants {
  /** Card content: icon, content and action parts. */
  children?: ReactNode;
  /** Additional CSS classes, merged after the BEM classes. */
  className?: string;
}

const ItemCardRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  variant,
  ...rest
}: ItemCardRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof ItemCardRootProps<E>>) => {
  const slots = useMemo(() => itemCardVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <ItemCardContext value={contextValue}>
      {/* `dom.div` hands every prop (ref included) to `render` when it is set. */}
      <dom.div className={slots.base({className})} data-slot="item-card" {...(rest as object)}>
        {children}
      </dom.div>
    </ItemCardContext>
  );
};

ItemCardRoot.displayName = "HeroUI.ItemCard";

/* -------------------------------------------------------------------------------------------------
 * Icon - leading rounded square
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardIconProps extends ComponentPropsWithRef<"div"> {}

const ItemCardIcon = ({className, ...rest}: ItemCardIconProps) => {
  const {slots} = use(ItemCardContext);

  return <div className={slots.icon({className})} data-slot="item-card-icon" {...rest} />;
};

ItemCardIcon.displayName = "HeroUI.ItemCard.Icon";

/* -------------------------------------------------------------------------------------------------
 * Content - title + description column, fills the free space
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardContentProps extends ComponentPropsWithRef<"div"> {}

const ItemCardContent = ({className, ...rest}: ItemCardContentProps) => {
  const {slots} = use(ItemCardContext);

  return <div className={slots.content({className})} data-slot="item-card-content" {...rest} />;
};

ItemCardContent.displayName = "HeroUI.ItemCard.Content";

/* -------------------------------------------------------------------------------------------------
 * Title / Description
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardTitleProps extends ComponentPropsWithRef<"span"> {}

const ItemCardTitle = ({className, ...rest}: ItemCardTitleProps) => {
  const {slots} = use(ItemCardContext);

  return <span className={slots.title({className})} data-slot="item-card-title" {...rest} />;
};

ItemCardTitle.displayName = "HeroUI.ItemCard.Title";

interface ItemCardDescriptionProps extends ComponentPropsWithRef<"span"> {}

const ItemCardDescription = ({className, ...rest}: ItemCardDescriptionProps) => {
  const {slots} = use(ItemCardContext);

  return (
    <span className={slots.description({className})} data-slot="item-card-description" {...rest} />
  );
};

ItemCardDescription.displayName = "HeroUI.ItemCard.Description";

/* -------------------------------------------------------------------------------------------------
 * Action - trailing slot for buttons, switches, selects, chevrons...
 * -----------------------------------------------------------------------------------------------*/
interface ItemCardActionProps extends ComponentPropsWithRef<"div"> {}

const ItemCardAction = ({className, ...rest}: ItemCardActionProps) => {
  const {slots} = use(ItemCardContext);

  return <div className={slots.action({className})} data-slot="item-card-action" {...rest} />;
};

ItemCardAction.displayName = "HeroUI.ItemCard.Action";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ItemCardRoot,
  ItemCardIcon,
  ItemCardContent,
  ItemCardTitle,
  ItemCardDescription,
  ItemCardAction,
  ItemCardContext,
};

export type {
  ItemCardRootProps,
  ItemCardIconProps,
  ItemCardContentProps,
  ItemCardTitleProps,
  ItemCardDescriptionProps,
  ItemCardActionProps,
};
