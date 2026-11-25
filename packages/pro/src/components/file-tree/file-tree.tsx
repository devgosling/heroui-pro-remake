"use client";

import type {FileTreeVariants} from "./file-tree.styles";
import type {ReactElement, ReactNode, SVGProps} from "react";
import type {
  TreeHeaderProps as TreeHeaderPrimitiveProps,
  TreeItemContentRenderProps,
  TreeItemProps as TreeItemPrimitiveProps,
  TreeProps as TreePrimitiveProps,
  TreeSectionProps as TreeSectionPrimitiveProps,
} from "react-aria-components/Tree";

import {CheckboxContent, CheckboxControl, CheckboxIndicator, CheckboxRoot} from "@heroui/react";
import {Children, cloneElement, createContext, isValidElement, use, useMemo} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {
  CollectionRendererContext,
  DefaultCollectionRenderer,
} from "react-aria-components/CollectionBuilder";
import {
  TreeHeader as TreeHeaderPrimitive,
  TreeItemContent as TreeItemContentPrimitive,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
  TreeSection as TreeSectionPrimitive,
} from "react-aria-components/Tree";
import {cx} from "tailwind-variants";

import {composeTwRenderProps} from "../../utils";

import {FileTreeCollectionRenderer} from "./file-tree-collection-renderer";
import {fileTreeVariants} from "./file-tree.styles";
import {usePrefersReducedMotion} from "./use-prefers-reduced-motion";

/* -------------------------------------------------------------------------------------------------
 * Icons
 * -----------------------------------------------------------------------------------------------*/
const ChevronRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" height="16" viewBox="0 0 16 16" width="16" {...props}>
    <path
      clipRule="evenodd"
      d="M5.47 13.03a.75.75 0 0 1 0-1.06L9.44 8 5.47 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/**
 * Grip handle (6 dots).
 * Geometry follows the "grip-vertical" icon of Lucide (https://lucide.dev), ISC License,
 * Copyright (c) Lucide Contributors.
 */
const GripVerticalIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    width="16"
    {...props}
  >
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type FileTreeContext = {
  slots?: ReturnType<typeof fileTreeVariants>;
};

const FileTreeContext = createContext<FileTreeContext>({});

/** Set while a `FileTree.Indicator` renders inside the chevron button. */
const FileTreeIndicatorSlotContext = createContext(false);

/* -------------------------------------------------------------------------------------------------
 * FileTree (root)
 * -----------------------------------------------------------------------------------------------*/
interface FileTreeRootProps<T extends object = object> extends TreePrimitiveProps<T> {
  /**
   * Disables the expand / collapse animation. The user's reduced-motion preference is respected
   * either way.
   * @default false
   */
  reduceMotion?: boolean;
  /**
   * Indent guide lines: `true` = always, `false` = never, `"hover"` = only while the tree is hovered.
   * @default true
   */
  showGuideLines?: boolean | "hover";
  /**
   * Item padding, font size and indent width.
   * @default "md"
   */
  size?: FileTreeVariants["size"];
  ref?: React.Ref<HTMLDivElement>;
}

const FileTreeRoot = <T extends object = object>({
  children,
  className,
  reduceMotion = false,
  showGuideLines = true,
  size = "md",
  ...rest
}: FileTreeRootProps<T>) => {
  const slots = useMemo(() => fileTreeVariants({showGuideLines, size}), [showGuideLines, size]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const prefersReducedMotion = usePrefersReducedMotion();
  // Without motion the rows render flat (React Aria's default renderer), like the Pro DOM.
  const isMotionDisabled = reduceMotion || prefersReducedMotion;

  return (
    <FileTreeContext value={contextValue}>
      <CollectionRendererContext
        value={isMotionDisabled ? DefaultCollectionRenderer : FileTreeCollectionRenderer}
      >
        <TreePrimitive
          {...rest}
          className={composeTwRenderProps(className, slots.base())}
          data-slot="file-tree"
        >
          {children}
        </TreePrimitive>
      </CollectionRendererContext>
    </FileTreeContext>
  );
};

FileTreeRoot.displayName = "HeroUI.FileTree";

/* -------------------------------------------------------------------------------------------------
 * FileTree.Indicator
 * -----------------------------------------------------------------------------------------------*/
interface FileTreeIndicatorProps {
  /** Custom icon element. When provided, replaces the default chevron. */
  children?: ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

const FileTreeIndicator = ({children, className}: FileTreeIndicatorProps) => {
  const {slots} = use(FileTreeContext);
  const isInChevron = use(FileTreeIndicatorSlotContext);

  // Declared as a child of `FileTree.Item`: the item lifts it into its chevron button.
  if (!isInChevron) return null;

  const indicatorClassName = slots?.indicator({className}) ?? cx("file-tree__indicator", className);

  if (isValidElement<{className?: string}>(children)) {
    return cloneElement(children as ReactElement<{className?: string; "data-slot"?: string}>, {
      className: cx(indicatorClassName, children.props.className),
      "data-slot": "file-tree-indicator",
    });
  }

  if (children != null && children !== false) {
    return (
      <span className={indicatorClassName} data-slot="file-tree-indicator">
        {children}
      </span>
    );
  }

  return <ChevronRightIcon className={indicatorClassName} data-slot="file-tree-indicator" />;
};

FileTreeIndicator.displayName = "HeroUI.FileTree.Indicator";

/* -------------------------------------------------------------------------------------------------
 * FileTree.Item
 * -----------------------------------------------------------------------------------------------*/
type FileTreeItemRenderProps = TreeItemContentRenderProps;

interface FileTreeItemProps<T extends object = object> extends Omit<
  TreeItemPrimitiveProps<T>,
  "children" | "textValue" | "title"
> {
  /** Label content rendered as the item text. */
  title: ReactNode;
  /**
   * Icon rendered before the label. A function receives the item render props
   * (`isExpanded`, `hasChildItems`, `allowsDragging`, ...).
   */
  icon?: ReactNode | ((props: FileTreeItemRenderProps) => ReactNode);
  /**
   * Drag handle icon shown when dragging is allowed. Pass `false` to hide the handle.
   * @default <GripVertical />
   */
  dragIcon?: ReactNode | false;
  /** Text used for typeahead and the row label. Defaults to `title` when it is a string. */
  textValue?: string;
  /** Nested `FileTree.Item`s (or a `Collection`) and an optional `FileTree.Indicator`. */
  children?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

function findIndicator(children: ReactNode) {
  let indicator: ReactElement<FileTreeIndicatorProps> | undefined;

  Children.forEach(children, (child) => {
    if (!indicator && isValidElement<FileTreeIndicatorProps>(child)) {
      if (child.type === FileTreeIndicator) indicator = child;
    }
  });

  return indicator;
}

interface FileTreeItemContentProps {
  dragIcon?: ReactNode | false;
  icon?: FileTreeItemProps["icon"];
  indicator?: ReactElement<FileTreeIndicatorProps>;
  renderProps: FileTreeItemRenderProps;
  title: ReactNode;
}

const FileTreeItemContent = ({
  dragIcon,
  icon,
  indicator,
  renderProps,
  title,
}: FileTreeItemContentProps) => {
  const {slots} = use(FileTreeContext);
  const {allowsDragging, hasChildItems, level, selectionBehavior, selectionMode} = renderProps;
  const resolvedIcon = typeof icon === "function" ? icon(renderProps) : icon;
  // Without an `icon` prop, folders keep an empty icon slot (same DOM as Pro); files have none.
  const hasIcon =
    icon === undefined ? hasChildItems : resolvedIcon != null && resolvedIcon !== false;
  const showCheckbox = selectionMode !== "none" && selectionBehavior === "toggle";
  const guideLineClassName = slots?.guideLine() ?? "file-tree__guide-line";

  return (
    <div className={slots?.itemContent()} data-slot="file-tree-item-content">
      {Array.from({length: Math.max(0, level - 1)}, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={guideLineClassName}
          data-slot="file-tree-guide-line"
          style={{
            insetInlineStart: `calc(var(--file-tree-item-px) + var(--file-tree-chevron-offset, 0px) + ${index} * var(--file-tree-indent) + var(--file-tree-indent) / 2)`,
          }}
        />
      ))}
      {allowsDragging && dragIcon !== false ? (
        <ButtonPrimitive
          className={slots?.dragHandle()}
          data-slot="file-tree-drag-handle"
          slot="drag"
        >
          {dragIcon ?? <GripVerticalIcon />}
        </ButtonPrimitive>
      ) : null}
      {showCheckbox ? (
        <span className={slots?.checkbox()} data-slot="file-tree-checkbox">
          <CheckboxRoot slot="selection">
            <CheckboxContent>
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
            </CheckboxContent>
          </CheckboxRoot>
        </span>
      ) : null}
      <ButtonPrimitive className={slots?.chevron()} data-slot="file-tree-chevron" slot="chevron">
        <FileTreeIndicatorSlotContext value>
          {indicator ?? <FileTreeIndicator />}
        </FileTreeIndicatorSlotContext>
      </ButtonPrimitive>
      {hasIcon ? (
        <span className={slots?.icon()} data-slot="file-tree-icon">
          {resolvedIcon}
        </span>
      ) : null}
      <span className={slots?.label()} data-slot="file-tree-label">
        {title}
      </span>
    </div>
  );
};

const FileTreeItem = <T extends object = object>({
  children,
  className,
  dragIcon,
  icon,
  textValue,
  title,
  ...rest
}: FileTreeItemProps<T>) => {
  const {slots} = use(FileTreeContext);
  const indicator = findIndicator(children);
  const resolvedTextValue =
    textValue ?? (typeof title === "string" || typeof title === "number" ? String(title) : "");

  return (
    <TreeItemPrimitive
      {...rest}
      className={composeTwRenderProps(className, slots?.item())}
      data-slot="file-tree-item"
      textValue={resolvedTextValue}
    >
      <TreeItemContentPrimitive>
        {(renderProps) => (
          <FileTreeItemContent
            dragIcon={dragIcon}
            icon={icon}
            indicator={indicator}
            renderProps={renderProps}
            title={title}
          />
        )}
      </TreeItemContentPrimitive>
      {children}
    </TreeItemPrimitive>
  );
};

FileTreeItem.displayName = "HeroUI.FileTree.Item";

/* -------------------------------------------------------------------------------------------------
 * FileTree.Section
 * -----------------------------------------------------------------------------------------------*/
interface FileTreeSectionProps<T extends object = object> extends TreeSectionPrimitiveProps<T> {
  ref?: React.Ref<HTMLDivElement>;
}

const FileTreeSection = <T extends object = object>({
  className,
  ...rest
}: FileTreeSectionProps<T>) => {
  const {slots} = use(FileTreeContext);

  return (
    <TreeSectionPrimitive
      {...rest}
      className={slots?.section({className}) ?? className}
      data-slot="file-tree-section"
    />
  );
};

FileTreeSection.displayName = "HeroUI.FileTree.Section";

/* -------------------------------------------------------------------------------------------------
 * FileTree.Header
 * -----------------------------------------------------------------------------------------------*/
interface FileTreeHeaderProps extends TreeHeaderPrimitiveProps {
  className?: string;
  children?: ReactNode;
  ref?: React.Ref<HTMLElement>;
}

const FileTreeHeader = ({className, ...rest}: FileTreeHeaderProps) => {
  const {slots} = use(FileTreeContext);

  return (
    <TreeHeaderPrimitive
      {...rest}
      className={slots?.sectionHeader({className}) ?? className}
      data-slot="file-tree-section-header"
    />
  );
};

FileTreeHeader.displayName = "HeroUI.FileTree.Header";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  FileTreeRoot,
  FileTreeItem,
  FileTreeIndicator,
  FileTreeSection,
  FileTreeHeader,
  FileTreeContext,
};

export type {
  FileTreeRootProps,
  FileTreeItemProps,
  FileTreeItemRenderProps,
  FileTreeIndicatorProps,
  FileTreeSectionProps,
  FileTreeHeaderProps,
};
