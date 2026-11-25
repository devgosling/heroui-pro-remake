"use client";

import type {EmptyStateVariants} from "./empty-state.styles";
import type {DOMRenderProps} from "@heroui/react";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";

import {dom} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {emptyStateVariants} from "./empty-state.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
// Parts read the slots from context, but also render their BEM class when used standalone.
const defaultSlots = emptyStateVariants();

type EmptyStateContext = {
  slots: ReturnType<typeof emptyStateVariants>;
};

const EmptyStateContext = createContext<EmptyStateContext>({slots: defaultSlots});

/* -------------------------------------------------------------------------------------------------
 * Root - centered column (a `div` unless `render` swaps the element)
 * -----------------------------------------------------------------------------------------------*/
interface EmptyStateRootProps<E extends keyof JSX.IntrinsicElements = "div">
  extends DOMRenderProps<E, undefined>, EmptyStateVariants {
  /** Empty state content: a header and optional actions. */
  children?: ReactNode;
  /** Additional CSS classes, merged after the BEM classes. */
  className?: string;
}

const EmptyStateRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  size,
  ...rest
}: EmptyStateRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof EmptyStateRootProps<E>>) => {
  const slots = useMemo(() => emptyStateVariants({size}), [size]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <EmptyStateContext value={contextValue}>
      {/* `dom.div` hands every prop (ref included) to `render` when it is set. */}
      <dom.div className={slots.base({className})} data-slot="empty-state" {...(rest as object)}>
        {children}
      </dom.div>
    </EmptyStateContext>
  );
};

EmptyStateRoot.displayName = "HeroUI.EmptyState";

/* -------------------------------------------------------------------------------------------------
 * Header - groups media, title and description
 * -----------------------------------------------------------------------------------------------*/
interface EmptyStateHeaderProps extends ComponentPropsWithRef<"div"> {}

const EmptyStateHeader = ({className, ...rest}: EmptyStateHeaderProps) => {
  const {slots} = use(EmptyStateContext);

  return <div className={slots.header({className})} data-slot="empty-state-header" {...rest} />;
};

EmptyStateHeader.displayName = "HeroUI.EmptyState.Header";

/* -------------------------------------------------------------------------------------------------
 * Media - icon, avatar or image container
 * -----------------------------------------------------------------------------------------------*/
type EmptyStateMediaVariant = "default" | "icon";

interface EmptyStateMediaProps extends ComponentPropsWithRef<"div"> {
  /**
   * `"icon"` renders a circular muted background sized by the root `size`.
   * @default "default"
   */
  variant?: EmptyStateMediaVariant;
}

const EmptyStateMedia = ({className, variant = "default", ...rest}: EmptyStateMediaProps) => {
  const {slots} = use(EmptyStateContext);

  return (
    <div
      className={slots.media({className})}
      data-slot="empty-state-media"
      data-variant={variant}
      {...rest}
    />
  );
};

EmptyStateMedia.displayName = "HeroUI.EmptyState.Media";

/* -------------------------------------------------------------------------------------------------
 * Title - primary heading (h3)
 * -----------------------------------------------------------------------------------------------*/
interface EmptyStateTitleProps extends ComponentPropsWithRef<"h3"> {}

const EmptyStateTitle = ({children, className, ...rest}: EmptyStateTitleProps) => {
  const {slots} = use(EmptyStateContext);

  return (
    <h3 className={slots.title({className})} data-slot="empty-state-title" {...rest}>
      {children}
    </h3>
  );
};

EmptyStateTitle.displayName = "HeroUI.EmptyState.Title";

/* -------------------------------------------------------------------------------------------------
 * Description - secondary text (p)
 * -----------------------------------------------------------------------------------------------*/
interface EmptyStateDescriptionProps extends ComponentPropsWithRef<"p"> {}

const EmptyStateDescription = ({className, ...rest}: EmptyStateDescriptionProps) => {
  const {slots} = use(EmptyStateContext);

  return (
    <p className={slots.description({className})} data-slot="empty-state-description" {...rest} />
  );
};

EmptyStateDescription.displayName = "HeroUI.EmptyState.Description";

/* -------------------------------------------------------------------------------------------------
 * Content - action area (buttons, links, inputs)
 * -----------------------------------------------------------------------------------------------*/
interface EmptyStateContentProps extends ComponentPropsWithRef<"div"> {}

const EmptyStateContent = ({className, ...rest}: EmptyStateContentProps) => {
  const {slots} = use(EmptyStateContext);

  return <div className={slots.content({className})} data-slot="empty-state-content" {...rest} />;
};

EmptyStateContent.displayName = "HeroUI.EmptyState.Content";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  EmptyStateContext,
  EmptyStateRoot,
  EmptyStateHeader,
  EmptyStateMedia,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateContent,
};

export type {
  EmptyStateMediaVariant,
  EmptyStateRootProps,
  EmptyStateHeaderProps,
  EmptyStateMediaProps,
  EmptyStateTitleProps,
  EmptyStateDescriptionProps,
  EmptyStateContentProps,
};
