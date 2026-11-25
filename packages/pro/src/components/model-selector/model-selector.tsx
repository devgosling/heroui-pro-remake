"use client";

import type {ModelSelectorContextValue} from "./model-selector-context";
import type {ModelSelectorLabels, ModelSelectorModel} from "./model-selector.utils";
import type {Key, SelectRootProps} from "@heroui/react";
import type {ComponentPropsWithRef, ReactElement, ReactNode, RefObject} from "react";
import type {PopoverProps} from "react-aria-components/Popover";

import {Button, Chip, Header, ListBox, ScrollShadow, SearchField, Select} from "@heroui/react";
import {
  Children,
  Fragment,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useIsHidden} from "react-aria/private/collections/Hidden";
import {useFilter} from "react-aria/useFilter";
import {Autocomplete} from "react-aria-components/Autocomplete";
import {useLocale} from "react-aria-components/I18nProvider";
import {SelectStateContext} from "react-aria-components/Select";
import {Text} from "react-aria-components/Text";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {
  ModelSelectorContext,
  ModelSelectorPopoverContext,
  useDetailController,
} from "./model-selector-context";
import {ModelSelectorDetail} from "./model-selector-detail";
import {ModelSelectorEffort} from "./model-selector-effort";
import {modelSelectorVariants} from "./model-selector.styles";
import {
  DEFAULT_LABELS,
  getItemDescription,
  groupModelsByProvider,
  resolveEffort,
} from "./model-selector.utils";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
function useModelSelectorContext(part: string) {
  const context = use(ModelSelectorContext);

  if (!context) throw new Error(`<ModelSelector.${part}> must be rendered inside <ModelSelector>.`);

  return context;
}

/** Whether `children` (looking through fragments) contains an element of the given type. */
function containsElementOfType(children: ReactNode, type: unknown): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    if (child.type === type) return true;
    if (child.type === Fragment) {
      return containsElementOfType((child.props as {children?: ReactNode}).children, type);
    }

    return false;
  });
}

const ChevronIcon = (props: {className?: string}) => (
  <svg
    aria-hidden="true"
    data-slot="model-selector-trigger-indicator"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path d="M4.5 6.25 8 9.75l3.5-3.5" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Effort state (controlled / uncontrolled, with the user's level remembered across models)
 * -----------------------------------------------------------------------------------------------*/
function useEffortState(
  model: ModelSelectorModel | undefined,
  effortProp: string | undefined,
  defaultEffort: string | undefined,
  onEffortChange: ((effort: string) => void) | undefined,
) {
  const isControlled = effortProp !== undefined;
  // The level the user picked last. A model without it falls back to its default level, and
  // switching back to a model that has it restores it.
  const [preferred, setPreferred] = useState(
    () => effortProp ?? defaultEffort ?? model?.defaultEffort,
  );
  // A level reported only because the model lacked the user's level; a controlled parent
  // echoing it back must not overwrite the user's level.
  const [fallback, setFallback] = useState(() => {
    const resolved = resolveEffort(model, effortProp ?? defaultEffort ?? model?.defaultEffort);

    return isControlled && resolved !== effortProp ? resolved : undefined;
  });
  const [prevEffortProp, setPrevEffortProp] = useState(effortProp);
  const [prevModelId, setPrevModelId] = useState(model?.id);

  let nextPreferred = preferred;
  const effortPropChanged = effortProp !== prevEffortProp;
  const modelChanged = model?.id !== prevModelId;

  if (effortPropChanged) {
    setPrevEffortProp(effortProp);

    if (effortProp !== undefined && effortProp !== fallback) {
      nextPreferred = effortProp;
      setPreferred(effortProp);
    }
  }

  const effort = resolveEffort(model, nextPreferred);

  if (effortPropChanged || modelChanged) {
    setPrevModelId(model?.id);
    setFallback(effort !== undefined && effort !== nextPreferred ? effort : undefined);
  }

  const onEffortChangeRef = useRef(onEffortChange);
  const notifiedRef = useRef(isControlled ? effortProp : effort);

  useLayoutEffect(() => {
    onEffortChangeRef.current = onEffortChange;
  });

  // Report levels the component picked itself (fallback / restore after a model switch).
  useEffect(() => {
    const known = isControlled ? effortProp : notifiedRef.current;

    notifiedRef.current = effort;
    if (effort !== undefined && effort !== known) onEffortChangeRef.current?.(effort);
  }, [effort, effortProp, isControlled]);

  const setEffort = useCallback(
    (next: string) => {
      setFallback(undefined);

      if (!isControlled) {
        notifiedRef.current = next;
        setPreferred(next);
      }

      onEffortChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [effort, setEffort] as const;
}

/* -------------------------------------------------------------------------------------------------
 * ModelSelector (root)
 * -----------------------------------------------------------------------------------------------*/
interface ModelSelectorRootProps extends Omit<
  SelectRootProps<object, "single">,
  | "children"
  | "defaultSelectedKey"
  | "defaultValue"
  | "fullWidth"
  | "items"
  | "onChange"
  | "onSelectionChange"
  | "placeholder"
  | "selectedKey"
  | "selectionMode"
  | "value"
  | "variant"
> {
  /** Models to pick from, in display order. */
  models: ModelSelectorModel[];
  /** Selected model id (controlled). */
  value?: string;
  /** Initial model id when uncontrolled. Defaults to the first enabled model. */
  defaultValue?: string;
  /** Called when the user picks a model. */
  onChange?: (value: string) => void;
  /** Selected effort level id (controlled). */
  effort?: string;
  /** Initial level id when uncontrolled. Defaults to the model's `defaultEffort`. */
  defaultEffort?: string;
  /** Called for each slider step, and when the level falls back because the model lacks it. */
  onEffortChange?: (effort: string) => void;
  /** Replaces the visible copy, for example to localize it. */
  labels?: Partial<ModelSelectorLabels>;
  /** `ModelSelector.Trigger` and `ModelSelector.Popover`. */
  children?: ReactNode;
}

const ModelSelectorRoot = ({
  "aria-label": ariaLabel,
  children,
  className,
  defaultEffort,
  defaultValue,
  effort: effortProp,
  labels: labelsProp,
  models,
  onChange,
  onEffortChange,
  value,
  ...rest
}: ModelSelectorRootProps) => {
  const slots = useMemo(() => modelSelectorVariants(), []);
  const labels = useMemo(() => ({...DEFAULT_LABELS, ...labelsProp}), [labelsProp]);
  const modelMap = useMemo(() => new Map(models.map((model) => [model.id, model])), [models]);

  const [uncontrolledValue, setUncontrolledValue] = useState(
    () => defaultValue ?? (models.find((model) => !model.isDisabled) ?? models[0])?.id,
  );
  const selectedId = value ?? uncontrolledValue;
  const selectedModel = selectedId !== undefined ? modelMap.get(selectedId) : undefined;

  const [effort, setEffort] = useEffortState(
    selectedModel,
    effortProp,
    defaultEffort,
    onEffortChange,
  );

  const handleChange = useCallback(
    (key: Key | null) => {
      if (key == null) return;

      const id = String(key);

      if (value === undefined) setUncontrolledValue(id);
      onChange?.(id);
    },
    [onChange, value],
  );

  const contextValue = useMemo<ModelSelectorContextValue>(
    () => ({effort, labels, modelMap, models, selectedModel, setEffort, slots}),
    [effort, labels, modelMap, models, selectedModel, setEffort, slots],
  );

  const triggerLabel = ariaLabel ?? labels.trigger;
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <ModelSelectorContext value={contextValue}>
      <Select
        {...rest}
        aria-label={selectedModel ? `${triggerLabel}, ${selectedModel.name}` : triggerLabel}
        className={resolvedClassName}
        data-slot="model-selector"
        value={selectedId ?? null}
        onChange={handleChange}
      >
        {children ?? (
          <>
            <ModelSelectorTrigger />
            <ModelSelectorPopover />
          </>
        )}
      </Select>
    </ModelSelectorContext>
  );
};

ModelSelectorRoot.displayName = "HeroUI.ModelSelector";

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ModelSelectorTriggerProps extends ComponentPropsWithRef<typeof Button> {}

const ModelSelectorTrigger = ({
  children,
  className,
  size = "md",
  variant = "ghost",
  ...rest
}: ModelSelectorTriggerProps) => {
  const {selectedModel, slots} = useModelSelectorContext("Trigger");
  const resolvedClassName = useResolvedClassName(className, slots.trigger());

  return (
    <Button
      {...rest}
      className={resolvedClassName}
      data-slot="model-selector-trigger"
      size={size}
      variant={variant}
    >
      {children ?? (
        <>
          {selectedModel?.icon ? (
            <span
              aria-hidden="true"
              className={slots.triggerIcon()}
              data-slot="model-selector-trigger-icon"
            >
              {selectedModel.icon}
            </span>
          ) : null}
          <span className={slots.triggerName()} data-slot="model-selector-trigger-name">
            {selectedModel?.shortName ?? selectedModel?.name}
          </span>
          <ChevronIcon className={slots.triggerIndicator()} />
        </>
      )}
    </Button>
  );
};

ModelSelectorTrigger.displayName = "HeroUI.ModelSelector.Trigger";

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Popover
 * -----------------------------------------------------------------------------------------------*/
type PopoverContentProps = {
  children?: ReactNode;
  popoverRef: RefObject<HTMLElement | null>;
  onPlaced: (side: string) => void;
};

/** Mounted only while the popover is open, so the query and the detail card reset on close. */
const ModelSelectorPopoverContent = ({children, onPlaced, popoverRef}: PopoverContentProps) => {
  const {modelMap, models} = useModelSelectorContext("Popover");
  const [query, setQuery] = useState("");
  const [detailState, detail] = useDetailController();
  const {contains} = useFilter({sensitivity: "base"});
  const hasSearch = useMemo(() => containsElementOfType(children, ModelSelectorSearch), [children]);

  const matches = useCallback(
    (model: ModelSelectorModel | undefined, text: string, input: string) =>
      contains(text, input) || Boolean(model?.provider && contains(model.provider, input)),
    [contains],
  );

  const matchCount = useMemo(
    () =>
      query ? models.filter((model) => matches(model, model.name, query)).length : models.length,
    [matches, models, query],
  );

  // Keep the side the popover opened on, so growing content shrinks the list instead of
  // flipping the popover.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const side = popoverRef.current?.getAttribute("data-placement");

      if (side) onPlaced(side);
    });

    return () => cancelAnimationFrame(frame);
  }, [onPlaced, popoverRef]);

  const contextValue = useMemo(
    () => ({detail, detailState, hasSearch, matchCount, query}),
    [detail, detailState, hasSearch, matchCount, query],
  );

  const content = children ?? (
    <>
      <ModelSelectorList />
      <ModelSelectorEffort />
      <ModelSelectorDetail />
    </>
  );

  return (
    <ModelSelectorPopoverContext value={contextValue}>
      {hasSearch ? (
        <Autocomplete
          inputValue={query}
          filter={(textValue, inputValue, node) =>
            matches(modelMap.get(String(node.key)), textValue, inputValue)
          }
          onInputChange={setQuery}
        >
          {content}
        </Autocomplete>
      ) : (
        content
      )}
    </ModelSelectorPopoverContext>
  );
};

interface ModelSelectorPopoverProps extends Omit<
  ComponentPropsWithRef<typeof Select.Popover>,
  "children"
> {
  /** Popover content. Renders the list, effort and detail parts when empty. */
  children?: ReactNode;
}

const ModelSelectorPopover = ({
  children,
  className,
  placement = "top end",
  ref,
  shouldFlip,
  ...rest
}: ModelSelectorPopoverProps) => {
  const {slots} = useModelSelectorContext("Popover");
  const state = use(SelectStateContext);
  const isOpen = Boolean(state?.isOpen);
  const popoverRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRef(ref, popoverRef);
  const [lockedSide, setLockedSide] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setLockedSide(null);
  }

  const resolvedPlacement = useMemo(() => {
    if (!lockedSide) return placement;

    const [, ...alignment] = placement.split(" ");

    return [lockedSide, ...alignment].join(" ") as NonNullable<PopoverProps["placement"]>;
  }, [lockedSide, placement]);

  const resolvedClassName = useResolvedClassName(className, slots.popover());

  return (
    <Select.Popover
      {...rest}
      ref={mergedRef as ComponentPropsWithRef<typeof Select.Popover>["ref"]}
      className={resolvedClassName}
      placement={resolvedPlacement}
      shouldFlip={lockedSide ? false : shouldFlip}
    >
      <ModelSelectorPopoverContent popoverRef={popoverRef} onPlaced={setLockedSide}>
        {children}
      </ModelSelectorPopoverContent>
    </Select.Popover>
  );
};

ModelSelectorPopover.displayName = "HeroUI.ModelSelector.Popover";

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Search
 * -----------------------------------------------------------------------------------------------*/
interface ModelSelectorSearchProps extends Omit<
  ComponentPropsWithRef<typeof SearchField>,
  "defaultValue" | "onChange" | "value"
> {}

const ModelSelectorSearch = ({
  autoFocus = true,
  children,
  className,
  fullWidth = true,
  variant = "secondary",
  ...rest
}: ModelSelectorSearchProps) => {
  const {labels, slots} = useModelSelectorContext("Search");
  const popover = use(ModelSelectorPopoverContext);
  const isHidden = useIsHidden();
  const resolvedClassName = useResolvedClassName(className, slots.search());
  const query = popover?.query ?? "";
  const hasNoMatch = query !== "" && popover?.matchCount === 0;

  return (
    <>
      {isHidden ? null : (
        <SearchField
          aria-label={labels.searchPlaceholder}
          {...rest}
          autoFocus={autoFocus}
          className={resolvedClassName}
          data-slot="model-selector-search"
          fullWidth={fullWidth}
          variant={variant}
        >
          {children ?? (
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={labels.searchPlaceholder} />
              <SearchField.ClearButton />
            </SearchField.Group>
          )}
        </SearchField>
      )}
      {/* Focus stays in the field, so an empty result is announced from here. */}
      <span className={slots.searchStatus()} data-slot="model-selector-search-status" role="status">
        {hasNoMatch ? labels.emptyTitle(query) : ""}
      </span>
    </>
  );
};

ModelSelectorSearch.displayName = "HeroUI.ModelSelector.Search";

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.List
 * -----------------------------------------------------------------------------------------------*/
const ModelSelectorEmpty = () => {
  const {labels, slots} = useModelSelectorContext("List");
  const popover = use(ModelSelectorPopoverContext);
  const query = popover?.query ?? "";

  if (!query) return null;

  return (
    <div className={slots.empty()} data-slot="model-selector-empty">
      <p className={slots.emptyTitle()} data-slot="model-selector-empty-title">
        {labels.emptyTitle(query)}
      </p>
      <p className={slots.emptyHint()} data-slot="model-selector-empty-hint">
        {labels.emptyHint}
      </p>
    </div>
  );
};

interface ModelSelectorListProps extends Omit<
  ComponentPropsWithRef<typeof ListBox>,
  "children" | "title"
> {
  /** Text above the list; `null` removes it. Defaults to `labels.title`. */
  title?: ReactNode;
  /** Groups and items; groups the models by provider when empty. */
  children?: ReactNode;
}

const ModelSelectorList = ({children, className, title, ...rest}: ModelSelectorListProps) => {
  const {labels, models, slots} = useModelSelectorContext("List");
  const popover = use(ModelSelectorPopoverContext);
  const detail = popover?.detail;
  const resolvedTitle = title === undefined ? labels.title : title;

  // The list renders as a ScrollShadow; leaving it ends the detail card's hover.
  const renderList = useCallback(
    (props: ComponentPropsWithRef<"div">): ReactElement => (
      <ScrollShadow
        {...props}
        size={16}
        onPointerLeave={(event) => {
          props.onPointerLeave?.(event);
          if (event.pointerType !== "touch") detail?.listLeave();
        }}
      />
    ),
    [detail],
  );

  const defaultItems = useMemo(
    () =>
      children == null
        ? groupModelsByProvider(models).map((group) =>
            group.provider ? (
              <ModelSelectorGroup key={`group:${group.provider}`} title={group.provider}>
                {group.models.map((model) => (
                  <ModelSelectorItem key={model.id} model={model} />
                ))}
              </ModelSelectorGroup>
            ) : (
              group.models.map((model) => <ModelSelectorItem key={model.id} model={model} />)
            ),
          )
        : null,
    [children, models],
  );

  return (
    <>
      {resolvedTitle != null && resolvedTitle !== false ? (
        <div className={slots.title()} data-slot="model-selector-title">
          {resolvedTitle}
        </div>
      ) : null}
      <ListBox
        {...rest}
        className={slots.list({className})}
        data-searchable={popover?.hasSearch ? "true" : undefined}
        data-slot="model-selector-list"
        render={renderList}
        renderEmptyState={() => <ModelSelectorEmpty />}
      >
        {children ?? defaultItems}
      </ListBox>
    </>
  );
};

ModelSelectorList.displayName = "HeroUI.ModelSelector.List";

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Group
 * -----------------------------------------------------------------------------------------------*/
interface ModelSelectorGroupProps extends Omit<
  ComponentPropsWithRef<typeof ListBox.Section>,
  "children" | "title"
> {
  /** Sticky heading, usually the provider name. */
  title?: ReactNode;
  /** The group's `ModelSelector.Item`s. */
  children?: ReactNode;
}

const ModelSelectorGroup = ({children, className, title, ...rest}: ModelSelectorGroupProps) => {
  const {slots} = useModelSelectorContext("Group");

  return (
    <ListBox.Section
      {...rest}
      className={slots.group({className})}
      data-slot="model-selector-group"
    >
      {title != null && title !== false ? (
        <Header className={slots.groupTitle()} data-slot="model-selector-group-title">
          {title}
        </Header>
      ) : null}
      {children}
    </ListBox.Section>
  );
};

ModelSelectorGroup.displayName = "HeroUI.ModelSelector.Group";

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Item
 * -----------------------------------------------------------------------------------------------*/
type DetailReporterProps = {id: string; isHovered: boolean; isFocusVisible: boolean};

/**
 * Feeds the row's hover and keyboard focus (including Autocomplete virtual focus) to the detail
 * card. It renders from the row's render props, so it runs in the visible popover; the
 * `ModelSelector.Item` wrapper itself only runs while React Aria builds the collection.
 */
const DetailReporter = ({id, isFocusVisible, isHovered}: DetailReporterProps) => {
  const detail = use(ModelSelectorPopoverContext)?.detail;

  // Only entering a row counts: the card follows the last hovered row until the pointer
  // leaves the list, so crossing a group title or a gap between rows keeps it.
  useEffect(() => {
    if (detail && isHovered) detail.hoverStart(id);
  }, [detail, id, isHovered]);

  useEffect(() => {
    if (!detail) return;

    return () => detail.rowRemoved(id);
  }, [detail, id]);

  useEffect(() => {
    if (!detail || !isFocusVisible) return;
    detail.setFocusVisible(id, true);

    return () => detail.setFocusVisible(id, false);
  }, [detail, id, isFocusVisible]);

  return null;
};

interface ModelSelectorItemProps extends Omit<
  ComponentPropsWithRef<typeof ListBox.Item>,
  "children" | "id"
> {
  /** The model this row renders. Must come from the root's `models`. */
  model: ModelSelectorModel;
  /** Shown after the model name, such as a price. */
  children?: ReactNode;
}

const ModelSelectorItem = ({
  children,
  className,
  isDisabled,
  model,
  textValue,
  ...rest
}: ModelSelectorItemProps) => {
  const {labels, slots} = useModelSelectorContext("Item");
  const {locale} = useLocale();
  const description = useMemo(
    () => getItemDescription(model, labels, locale),
    [labels, locale, model],
  );
  const hasMeta = children != null && children !== false;

  return (
    <ListBox.Item
      {...rest}
      className={slots.item({className})}
      data-slot="model-selector-item"
      id={model.id}
      isDisabled={isDisabled ?? model.isDisabled}
      textValue={textValue ?? model.name}
    >
      {({isFocusVisible, isHovered}) => (
        <>
          <DetailReporter id={model.id} isFocusVisible={isFocusVisible} isHovered={isHovered} />
          {model.icon ? (
            <span
              aria-hidden="true"
              className={slots.itemIcon()}
              data-slot="model-selector-item-icon"
            >
              {model.icon}
            </span>
          ) : null}
          <Text className={slots.itemName()} data-slot="model-selector-item-name" slot="label">
            {model.name}
          </Text>
          {model.badge ? (
            <Chip aria-hidden="true" color="accent" size="sm" variant="soft">
              {model.badge}
            </Chip>
          ) : null}
          {hasMeta ? (
            <Text
              className={slots.itemMeta()}
              data-slot="model-selector-item-meta"
              slot="description"
            >
              {description ? (
                <span
                  className={slots.itemDescription()}
                  data-slot="model-selector-item-description"
                >
                  {`${description} `}
                </span>
              ) : null}
              {children}
            </Text>
          ) : description ? (
            <Text
              className={slots.itemDescription()}
              data-slot="model-selector-item-description"
              slot="description"
            >
              {description}
            </Text>
          ) : null}
          <ListBox.ItemIndicator />
        </>
      )}
    </ListBox.Item>
  );
};

ModelSelectorItem.displayName = "HeroUI.ModelSelector.Item";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ModelSelectorRoot,
  ModelSelectorTrigger,
  ModelSelectorPopover,
  ModelSelectorSearch,
  ModelSelectorList,
  ModelSelectorGroup,
  ModelSelectorItem,
};

export type {
  ModelSelectorRootProps,
  ModelSelectorTriggerProps,
  ModelSelectorPopoverProps,
  ModelSelectorSearchProps,
  ModelSelectorListProps,
  ModelSelectorGroupProps,
  ModelSelectorItemProps,
};
