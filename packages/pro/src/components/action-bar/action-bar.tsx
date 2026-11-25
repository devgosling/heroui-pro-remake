"use client";

import type {ToolbarProps} from "@heroui/react";
import type {ComponentPropsWithRef} from "react";

import {Toolbar} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {useResolvedClassName} from "../../utils";

import {actionBarVariants} from "./action-bar.styles";
import {useActionBarPresence} from "./use-action-bar-presence";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
const defaultSlots = actionBarVariants();

type ActionBarContext = {
  slots: ReturnType<typeof actionBarVariants>;
};

const ActionBarContext = createContext<ActionBarContext>({slots: defaultSlots});

/* -------------------------------------------------------------------------------------------------
 * Root
 * Outer `div.action-bar` pins the bar to the viewport bottom and runs the enter/exit transition;
 * the visible pill is the OSS Toolbar (`toolbar--attached` + `action-bar__wrapper`).
 * -----------------------------------------------------------------------------------------------*/
interface ActionBarRootProps extends ToolbarProps {
  /** Controls visibility with an animated enter/exit. */
  isOpen: boolean;
  /**
   * Accessible label for the toolbar.
   * @default "Actions"
   */
  "aria-label"?: string;
  /**
   * Whether the toolbar has a surface background with full rounding.
   * @default true
   */
  isAttached?: boolean;
  /**
   * The orientation of the toolbar.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

const ActionBarRoot = ({
  "aria-label": ariaLabel = "Actions",
  children,
  className,
  isAttached = true,
  isOpen,
  orientation = "horizontal",
  ...rest
}: ActionBarRootProps) => {
  const slots = useMemo(() => actionBarVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const wrapperClassName = useResolvedClassName(className, slots.wrapper());
  const {isExiting, isPresent, ref} = useActionBarPresence<HTMLDivElement>(isOpen);

  if (!isPresent) return null;

  return (
    <ActionBarContext value={contextValue}>
      <div
        ref={ref}
        className={slots.base()}
        data-exiting={isExiting ? "true" : undefined}
        data-slot="action-bar"
      >
        <Toolbar
          {...rest}
          aria-label={ariaLabel}
          className={wrapperClassName}
          isAttached={isAttached}
          orientation={orientation}
        >
          {children}
        </Toolbar>
      </div>
    </ActionBarContext>
  );
};

ActionBarRoot.displayName = "HeroUI.ActionBar";

/* -------------------------------------------------------------------------------------------------
 * Prefix
 * -----------------------------------------------------------------------------------------------*/
interface ActionBarPrefixProps extends ComponentPropsWithRef<"div"> {}

const ActionBarPrefix = ({className, ...rest}: ActionBarPrefixProps) => {
  const {slots} = use(ActionBarContext);

  return <div className={slots.prefix({className})} data-slot="action-bar-prefix" {...rest} />;
};

ActionBarPrefix.displayName = "HeroUI.ActionBar.Prefix";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
interface ActionBarContentProps extends ComponentPropsWithRef<"div"> {}

const ActionBarContent = ({className, ...rest}: ActionBarContentProps) => {
  const {slots} = use(ActionBarContext);

  return <div className={slots.content({className})} data-slot="action-bar-content" {...rest} />;
};

ActionBarContent.displayName = "HeroUI.ActionBar.Content";

/* -------------------------------------------------------------------------------------------------
 * Suffix
 * -----------------------------------------------------------------------------------------------*/
interface ActionBarSuffixProps extends ComponentPropsWithRef<"div"> {}

const ActionBarSuffix = ({className, ...rest}: ActionBarSuffixProps) => {
  const {slots} = use(ActionBarContext);

  return <div className={slots.suffix({className})} data-slot="action-bar-suffix" {...rest} />;
};

ActionBarSuffix.displayName = "HeroUI.ActionBar.Suffix";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ActionBarRoot, ActionBarPrefix, ActionBarContent, ActionBarSuffix, ActionBarContext};

export type {ActionBarRootProps, ActionBarPrefixProps, ActionBarContentProps, ActionBarSuffixProps};
