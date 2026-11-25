"use client";

import type {SegmentVariants} from "./segment.styles";
import type {Key} from "@heroui/react";
import type {ComponentPropsWithRef} from "react";

import {createContext, use, useCallback, useMemo} from "react";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {SelectionIndicator as SelectionIndicatorPrimitive} from "react-aria-components/SelectionIndicator";
import {ToggleButton as ToggleButtonPrimitive} from "react-aria-components/ToggleButton";
import {ToggleButtonGroup as ToggleButtonGroupPrimitive} from "react-aria-components/ToggleButtonGroup";

import {useResolvedClassName} from "../../utils";

import {segmentVariants} from "./segment.styles";

/* -------------------------------------------------------------------------------------------------
 * Segment Context
 * -----------------------------------------------------------------------------------------------*/
type SegmentContext = {
  slots?: ReturnType<typeof segmentVariants>;
};

const SegmentContext = createContext<SegmentContext>({});

/* -------------------------------------------------------------------------------------------------
 * Segment Root
 * -----------------------------------------------------------------------------------------------*/
interface SegmentRootProps
  extends
    Omit<
      ComponentPropsWithRef<typeof ToggleButtonGroupPrimitive>,
      "selectionMode" | "selectedKeys" | "defaultSelectedKeys" | "onSelectionChange"
    >,
    SegmentVariants {
  /** The selected key (controlled). */
  selectedKey?: Key | null;
  /** The initially selected key (uncontrolled). */
  defaultSelectedKey?: Key;
  /** Called when the selected item changes. */
  onSelectionChange?: (key: Key) => void;
}

const SegmentRoot = ({
  children,
  className,
  defaultSelectedKey,
  onSelectionChange,
  selectedKey,
  size,
  variant,
  ...rest
}: SegmentRootProps) => {
  const slots = useMemo(() => segmentVariants({size, variant}), [size, variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  const selectedKeys = useMemo(() => {
    if (selectedKey === undefined) return undefined;

    return selectedKey === null ? new Set<Key>() : new Set<Key>([selectedKey]);
  }, [selectedKey]);

  const defaultSelectedKeys = useMemo(
    () => (defaultSelectedKey === undefined ? undefined : new Set<Key>([defaultSelectedKey])),
    [defaultSelectedKey],
  );

  const handleSelectionChange = useCallback(
    (keys: Set<Key>) => {
      const [key] = keys;

      if (key !== undefined) onSelectionChange?.(key);
    },
    [onSelectionChange],
  );

  return (
    <SegmentContext value={contextValue}>
      <ToggleButtonGroupPrimitive
        {...rest}
        disallowEmptySelection
        className={resolvedClassName}
        data-slot="segment"
        defaultSelectedKeys={defaultSelectedKeys}
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleSelectionChange}
      >
        {children}
      </ToggleButtonGroupPrimitive>
    </SegmentContext>
  );
};

SegmentRoot.displayName = "HeroUI.Segment";

/* -------------------------------------------------------------------------------------------------
 * Segment Item
 * -----------------------------------------------------------------------------------------------*/
interface SegmentItemProps extends ComponentPropsWithRef<typeof ToggleButtonPrimitive> {}

const SegmentItem = ({children, className, ...rest}: SegmentItemProps) => {
  const {slots} = use(SegmentContext);
  const resolvedClassName = useResolvedClassName(className, slots?.item());

  return (
    <ToggleButtonPrimitive {...rest} className={resolvedClassName} data-slot="segment-item">
      {composeRenderProps(children, (resolvedChildren) => (
        <>
          {/* Rendered only inside the selected item; RAC slides it between items. */}
          <SelectionIndicatorPrimitive
            className={slots?.indicator()}
            data-slot="segment-indicator"
          />
          {resolvedChildren}
        </>
      ))}
    </ToggleButtonPrimitive>
  );
};

SegmentItem.displayName = "HeroUI.Segment.Item";

/* -------------------------------------------------------------------------------------------------
 * Segment Separator
 * -----------------------------------------------------------------------------------------------*/
interface SegmentSeparatorProps extends ComponentPropsWithRef<"span"> {}

const SegmentSeparator = ({className, ...rest}: SegmentSeparatorProps) => {
  const {slots} = use(SegmentContext);

  return (
    <span
      aria-hidden="true"
      className={slots?.separator({className}) ?? className}
      data-slot="segment-separator"
      {...rest}
    />
  );
};

SegmentSeparator.displayName = "HeroUI.Segment.Separator";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SegmentRoot, SegmentItem, SegmentSeparator, SegmentContext};

export type {SegmentRootProps, SegmentItemProps, SegmentSeparatorProps};
