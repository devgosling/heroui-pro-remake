"use client";

import type {EmojiPickerContextValue, EmojiPickerGridApi} from "./emoji-picker-context";
import type {EmojiPickerVariants} from "./emoji-picker.styles";
import type {EmojiItem, EmojiSkinToneItem} from "./emoji-picker.utils";
import type {Key} from "@heroui/react";
import type {
  ComponentPropsWithRef,
  ReactElement,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  Ref,
} from "react";
import type {ButtonProps} from "react-aria-components/Button";
import type {DialogTriggerProps} from "react-aria-components/Dialog";
import type {ListBoxItemProps, ListBoxProps} from "react-aria-components/ListBox";
import type {PopoverProps} from "react-aria-components/Popover";
import type {SelectProps, SelectValueProps} from "react-aria-components/Select";
import type {GridLayoutOptions} from "react-aria-components/Virtualizer";

import {EmptyState, IconSearch, Popover, SearchField} from "@heroui/react";
import {
  Children,
  Fragment,
  isValidElement,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useIsHidden} from "react-aria/private/collections/Hidden";
import {useFilter} from "react-aria/useFilter";
import {Autocomplete} from "react-aria-components/Autocomplete";
import {ButtonContext, Button as ButtonPrimitive} from "react-aria-components/Button";
import {LabelContext} from "react-aria-components/Label";
import {
  ListBoxItem as ListBoxItemPrimitive,
  ListBox as ListBoxPrimitive,
} from "react-aria-components/ListBox";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";
import {
  Select as SelectPrimitive,
  SelectValue as SelectValuePrimitive,
} from "react-aria-components/Select";
import {TextContext} from "react-aria-components/Text";
import {GridLayout, Size, Virtualizer} from "react-aria-components/Virtualizer";
import {cx} from "tailwind-variants";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {
  EmojiPickerContentContext,
  EmojiPickerContext,
  EmojiPickerPopoverContext,
  EmojiPickerSkinToneContext,
} from "./emoji-picker-context";
import {emojiPickerVariants} from "./emoji-picker.styles";
import {
  EMOJI_CATEGORIES,
  EMOJI_RECENT_CATEGORY,
  EMOJI_SKIN_TONES,
  applySkinTone,
  getEmoji,
  getEmojiFromKey,
  getEmojiTextValue,
  getRecentEmojiKey,
  isRecentEmojiKey,
  pushRecentEmoji,
} from "./emoji-picker.utils";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/** An entry of the built-in grid collection. */
interface EmojiPickerGridItem {
  /** Collection key: the (skin toned) emoji, or a `frequent:` key for the recent row. */
  id: string;
  /** The emoji that is rendered. */
  emoji: string;
  /** The text the search filter matches against (name + keywords). */
  textValue: string;
  /** Category id (`"frequent"` for the recent row). */
  category: string;
  /** The dataset entry. */
  data: EmojiItem;
}

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const FALLBACK_SLOTS = emojiPickerVariants();

function useSlots() {
  return use(EmojiPickerContext)?.slots ?? FALLBACK_SLOTS;
}

/** Flattens fragments so compound parts can be found among `children`. */
function flattenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{children?: ReactNode}>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );
}

/** Clears the contexts a RAC Select hands to every descendant (as RAC's own Popover does). */
const ClearSelectContexts = ({children}: {children: ReactNode}) => (
  <ButtonContext value={null}>
    <LabelContext value={null}>
      <TextContext value={null}>{children}</TextContext>
    </LabelContext>
  </ButtonContext>
);

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Root
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerRootProps
  extends Omit<SelectProps<object, "single">, "children">, EmojiPickerVariants {
  children?: SelectProps<object, "single">["children"];
  ref?: Ref<HTMLDivElement>;
}

const EmojiPickerRoot = ({
  children,
  isOpen,
  onChange,
  onOpenChange,
  onSelectionChange,
  size = "md",
  ...rest
}: EmojiPickerRootProps) => {
  const slots = useMemo(() => emojiPickerVariants({size}), [size]);
  const [skinTone, setSkinTone] = useState<string | undefined>(undefined);
  const [recent, setRecent] = useState<string[]>([]);
  // The grid only picks up new recent emoji when the picker opens, so items never shift under
  // the pointer while picking (the inline picker keeps the list it mounted with).
  const [gridRecent, setGridRecent] = useState<string[]>([]);
  const gridApiRef = useRef<EmojiPickerGridApi | null>(null);

  const registerGrid = useCallback((api: EmojiPickerGridApi) => {
    gridApiRef.current = api;

    return () => {
      if (gridApiRef.current === api) gridApiRef.current = null;
    };
  }, []);

  const scrollToKey = useCallback((key: Key) => gridApiRef.current?.scrollToKey(key) ?? false, []);

  const scrollToCategory = useCallback((category: string) => {
    const api = gridApiRef.current;
    const key = api?.getCategoryKey(category);

    return api && key !== undefined ? api.scrollToKey(key) : false;
  }, []);

  const addRecent = useCallback((emoji: string) => {
    setRecent((current) => pushRecentEmoji(current, emoji));
  }, []);
  const clearRecent = useCallback(() => {
    setRecent([]);
    setGridRecent([]);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) setGridRecent(recent);
      onOpenChange?.(open);
    },
    [onOpenChange, recent],
  );

  // A controlled `isOpen` may open the picker without `onOpenChange`.
  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (isOpen && !wasOpenRef.current) setGridRecent(recent);
    wasOpenRef.current = Boolean(isOpen);
  }, [isOpen, recent]);

  const contextValue = useMemo<EmojiPickerContextValue>(
    () => ({
      addRecent,
      clearRecent,
      gridRecent,
      recent,
      registerGrid,
      scrollToCategory,
      scrollToKey,
      setSkinTone,
      size,
      skinTone,
      slots,
    }),
    [
      addRecent,
      clearRecent,
      gridRecent,
      recent,
      registerGrid,
      scrollToCategory,
      scrollToKey,
      size,
      skinTone,
      slots,
    ],
  );

  const handleChange = useCallback(
    (key: Key | null) => {
      const emoji = key == null ? null : getEmojiFromKey(key);

      if (typeof emoji === "string" && getEmoji(emoji)) addRecent(emoji);
      onChange?.(emoji);
    },
    [addRecent, onChange],
  );

  const handleSelectionChange = useCallback(
    (key: Key | null) => onSelectionChange?.(key == null ? null : getEmojiFromKey(key)),
    [onSelectionChange],
  );

  return (
    <EmojiPickerContext value={contextValue}>
      <SelectPrimitive
        data-slot="emoji-picker"
        {...rest}
        isOpen={isOpen}
        onChange={handleChange}
        onOpenChange={handleOpenChange}
        onSelectionChange={handleSelectionChange}
      >
        {children}
      </SelectPrimitive>
    </EmojiPickerContext>
  );
};

EmojiPickerRoot.displayName = "HeroUI.EmojiPicker";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Trigger
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerTriggerProps extends ButtonProps {
  ref?: Ref<HTMLButtonElement>;
}

const EmojiPickerTrigger = ({children, className, ...rest}: EmojiPickerTriggerProps) => {
  const slots = useSlots();

  return (
    <ButtonPrimitive
      data-slot="emoji-picker-trigger"
      {...rest}
      className={useResolvedClassName(className, slots.trigger())}
    >
      {children}
    </ButtonPrimitive>
  );
};

EmojiPickerTrigger.displayName = "HeroUI.EmojiPicker.Trigger";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Value
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerValueProps extends SelectValueProps<object> {
  ref?: Ref<HTMLSpanElement>;
}

const EmojiPickerValue = ({children, className, ...rest}: EmojiPickerValueProps) => {
  const slots = useSlots();

  return (
    <SelectValuePrimitive
      data-slot="emoji-picker-value"
      {...rest}
      className={useResolvedClassName(className, slots.value())}
    >
      {children ??
        (({defaultChildren, isPlaceholder, state}) => {
          // A selected emoji can be missing from the collection (e.g. after a skin tone change):
          // the key is the emoji itself, so show it instead of the placeholder.
          const value = state.value;

          return isPlaceholder && typeof value === "string"
            ? String(getEmojiFromKey(value))
            : defaultChildren;
        })}
    </SelectValuePrimitive>
  );
};

EmojiPickerValue.displayName = "HeroUI.EmojiPicker.Value";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Popover
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerPopoverProps extends PopoverProps {
  ref?: Ref<HTMLElement>;
}

const EmojiPickerPopover = ({
  children,
  className,
  offset = 4,
  placement = "bottom",
  ...rest
}: EmojiPickerPopoverProps) => {
  const slots = useSlots();

  return (
    <EmojiPickerPopoverContext value>
      <PopoverPrimitive
        data-slot="emoji-picker-popover"
        {...rest}
        className={useResolvedClassName(className, slots.popover())}
        offset={offset}
        placement={placement}
      >
        {children}
      </PopoverPrimitive>
    </EmojiPickerPopoverContext>
  );
};

EmojiPickerPopover.displayName = "HeroUI.EmojiPicker.Popover";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Content
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerContentProps extends ComponentPropsWithRef<"div"> {
  /**
   * Custom filter function for emoji search.
   * @default case-insensitive "contains" on the emoji name and keywords
   */
  filter?: (textValue: string, inputValue: string) => boolean;
  /** Accessible label of the search input. @default "Search emoji" */
  searchLabel?: string;
  /** Placeholder of the search input. @default "Search emoji..." */
  searchPlaceholder?: string;
}

const EmojiPickerContent = ({
  children,
  className,
  filter,
  searchLabel = "Search emoji",
  searchPlaceholder = "Search emoji...",
  ...rest
}: EmojiPickerContentProps) => {
  const slots = useSlots();
  const isInPopover = use(EmojiPickerPopoverContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const {contains} = useFilter({sensitivity: "base"});
  const contextValue = useMemo(() => ({inputRef}), []);

  const filterFn = useCallback(
    (textValue: string, inputValue: string, node: {key: Key}) => {
      // The "Frequently Used" row repeats emoji of the categories: hide it while searching.
      if (inputValue && isRecentEmojiKey(node.key)) return false;

      return (filter ?? contains)(textValue, inputValue);
    },
    [contains, filter],
  );

  // Skin tone pickers live inside the search field; everything else follows it.
  const flatChildren = flattenChildren(children);
  const skinTonePickers = flatChildren.filter(
    (child) => isValidElement(child) && child.type === EmojiPickerSkinTonePicker,
  );
  const otherChildren = flatChildren.filter((child) => !skinTonePickers.includes(child));

  return (
    <EmojiPickerContentContext value={contextValue}>
      <ClearSelectContexts>
        <div className={cx(slots.content(), className)} data-slot="emoji-picker-content" {...rest}>
          <Autocomplete filter={filterFn}>
            <SearchField aria-label={searchLabel} autoFocus={isInPopover} variant="secondary">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input ref={inputRef} placeholder={searchPlaceholder} />
                {skinTonePickers}
              </SearchField.Group>
            </SearchField>
            {otherChildren}
          </Autocomplete>
        </div>
      </ClearSelectContexts>
    </EmojiPickerContentContext>
  );
};

EmojiPickerContent.displayName = "HeroUI.EmojiPicker.Content";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Grid
 * -----------------------------------------------------------------------------------------------*/
/** Fixed 36×36 cells (not measured, whatever the emoji line height) with a 2×2 minimum gap. */
const DEFAULT_LAYOUT_OPTIONS: GridLayoutOptions = {
  maxItemSize: new Size(36, 36),
  minItemSize: new Size(36, 36),
  minSpace: new Size(2, 2),
  preserveAspectRatio: true,
};

function buildGridItems(skinTone: string, recent: readonly string[]): EmojiPickerGridItem[] {
  const items: EmojiPickerGridItem[] = [];

  for (const emoji of recent) {
    const data = getEmoji(emoji);

    if (!data) continue;
    items.push({
      category: EMOJI_RECENT_CATEGORY.id,
      data,
      emoji,
      id: getRecentEmojiKey(emoji),
      textValue: getEmojiTextValue(data),
    });
  }

  for (const category of EMOJI_CATEGORIES) {
    for (const data of category.emojis) {
      const emoji = applySkinTone(data, skinTone);

      items.push({
        category: category.id,
        data,
        emoji,
        id: emoji,
        textValue: getEmojiTextValue(data),
      });
    }
  }

  return items;
}

const renderGridItem = (item: EmojiPickerGridItem) => (
  <EmojiPickerItem id={item.id} textValue={item.textValue}>
    {item.emoji}
  </EmojiPickerItem>
);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface EmojiPickerGridProps<T extends object = EmojiPickerGridItem> extends Omit<
  ListBoxProps<T>,
  "layout"
> {
  /**
   * Virtualizer grid layout options for item sizing and spacing.
   * @default 36×36 cells with a 2×2 minimum spacing
   */
  layoutOptions?: GridLayoutOptions;
  /**
   * Prepends a "Frequently Used" row with the recently picked emoji to the built-in dataset
   * (ignored when `items` or `children` are passed). Off by default, like the original picker,
   * whose grid always lists the Unicode categories only.
   * @default false
   */
  showRecent?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const EmojiPickerGrid = <T extends object = EmojiPickerGridItem>({
  "aria-label": ariaLabel = "Emoji grid",
  children,
  className,
  items,
  layoutOptions,
  ref,
  renderEmptyState,
  showRecent = false,
  ...rest
}: EmojiPickerGridProps<T>) => {
  const root = use(EmojiPickerContext);
  const slots = root?.slots ?? FALLBACK_SLOTS;
  const isHidden = useIsHidden();
  const gridRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, gridRef);
  const layout = useMemo(() => new GridLayout(), []);
  const resolvedLayoutOptions = useMemo(
    () => ({...DEFAULT_LAYOUT_OPTIONS, ...layoutOptions}),
    [layoutOptions],
  );

  // Without items or children the grid renders the built-in Unicode dataset.
  const isBuiltIn = items === undefined && children === undefined;
  const skinTone = root?.skinTone ?? "default";
  const recent = showRecent ? root?.gridRecent : undefined;
  const builtInItems = useMemo(
    () => (isBuiltIn ? buildGridItems(skinTone, recent ?? []) : undefined),
    [isBuiltIn, recent, skinTone],
  );
  const resolvedItems = (builtInItems as Iterable<T> | undefined) ?? items;

  // First key of every category, so footers can scroll to a category.
  const categoryKeys = useMemo(() => {
    const keys = new Map<string, Key>();

    for (const item of resolvedItems ?? []) {
      const {category, id} = item as {category?: unknown; id?: unknown};

      if (typeof category === "string" && (typeof id === "string" || typeof id === "number")) {
        if (!keys.has(category)) keys.set(category, id);
      }
    }

    return keys;
  }, [resolvedItems]);

  const scrollToKey = useCallback(
    (key: Key) => {
      const element = gridRef.current;
      const info = layout.getLayoutInfo(key);

      if (!element || !info) return false;

      const gap = resolvedLayoutOptions.minSpace?.height ?? 0;

      element.scrollTo({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        top: Math.max(0, info.rect.y - gap),
      });

      return true;
    },
    [layout, resolvedLayoutOptions],
  );

  const registerGrid = root?.registerGrid;

  useLayoutEffect(() => {
    if (isHidden || !registerGrid) return;

    return registerGrid({
      getCategoryKey: (category) => categoryKeys.get(category),
      scrollToKey,
    });
  }, [categoryKeys, isHidden, registerGrid, scrollToKey]);

  const renderEmpty = useCallback<NonNullable<ListBoxProps<T>["renderEmptyState"]>>(
    (props) => (
      <div className={slots.empty()} data-slot="emoji-picker-empty">
        {renderEmptyState ? (
          renderEmptyState(props)
        ) : (
          <EmptyState>
            <IconSearch />
            No emoji found.
          </EmptyState>
        )}
      </div>
    ),
    [renderEmptyState, slots],
  );

  return (
    <Virtualizer layout={layout} layoutOptions={resolvedLayoutOptions}>
      <ListBoxPrimitive<T>
        ref={mergedRef}
        aria-label={ariaLabel}
        data-slot="emoji-picker-grid"
        {...rest}
        className={useResolvedClassName(className, slots.grid())}
        items={resolvedItems}
        layout="grid"
        renderEmptyState={renderEmpty}
      >
        {children ?? (renderGridItem as unknown as (item: T) => ReactElement)}
      </ListBoxPrimitive>
    </Virtualizer>
  );
};

EmojiPickerGrid.displayName = "HeroUI.EmojiPicker.Grid";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Item
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerItemProps<T extends object = object> extends ListBoxItemProps<T> {
  ref?: Ref<HTMLDivElement>;
}

const EmojiPickerItem = <T extends object = object>({
  className,
  ...rest
}: EmojiPickerItemProps<T>) => {
  const slots = useSlots();

  return (
    <ListBoxItemPrimitive<T>
      data-slot="emoji-picker-item"
      {...rest}
      className={useResolvedClassName(className, slots.item())}
    />
  );
};

EmojiPickerItem.displayName = "HeroUI.EmojiPicker.Item";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker Footer
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerFooterProps extends ComponentPropsWithRef<"div"> {}

const EmojiPickerFooter = ({className, ...rest}: EmojiPickerFooterProps) => {
  const slots = useSlots();

  return (
    <div className={cx(slots.footer(), className)} data-slot="emoji-picker-footer" {...rest} />
  );
};

EmojiPickerFooter.displayName = "HeroUI.EmojiPicker.Footer";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker SkinTonePicker
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerSkinTonePickerProps extends Omit<DialogTriggerProps, "children"> {
  /** Controlled skin tone value. */
  value?: string;
  /**
   * Default skin tone (uncontrolled).
   * @default "default"
   */
  defaultValue?: string;
  /** Callback when the skin tone changes. */
  onChange?: (value: string) => void;
  children?: ReactNode;
}

const EmojiPickerSkinTonePicker = ({
  children,
  defaultOpen = false,
  defaultValue = "default",
  isOpen: isOpenProp,
  onChange,
  onOpenChange,
  value: valueProp,
  ...rest
}: EmojiPickerSkinTonePickerProps) => {
  const root = use(EmojiPickerContext);
  const content = use(EmojiPickerContentContext);
  const isHidden = useIsHidden();
  const [localValue, setLocalValue] = useState(defaultValue);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isOpen = isOpenProp ?? localOpen;
  const setRootSkinTone = root?.setSkinTone;
  const rootSkinTone = root?.skinTone;

  // The root owns the tone so the grid collection (built outside this subtree) can apply it.
  const value = valueProp ?? (root ? (rootSkinTone ?? defaultValue) : localValue);

  useLayoutEffect(() => {
    if (isHidden || !setRootSkinTone) return;
    if (valueProp !== undefined) setRootSkinTone(valueProp);
    else if (rootSkinTone === undefined) setRootSkinTone(defaultValue);
  }, [defaultValue, isHidden, rootSkinTone, setRootSkinTone, valueProp]);

  const setOpen = useCallback(
    (open: boolean) => {
      if (isOpenProp === undefined) setLocalOpen(open);
      onOpenChange?.(open);
    },
    [isOpenProp, onOpenChange],
  );

  const select = useCallback(
    (tone: string) => {
      if (valueProp === undefined) {
        if (setRootSkinTone) setRootSkinTone(tone);
        else setLocalValue(tone);
      }
      if (tone !== value) onChange?.(tone);
      setOpen(false);
      // Hand focus back to the search field, like after picking from the grid.
      content?.inputRef.current?.focus();
    },
    [content, onChange, setOpen, setRootSkinTone, value, valueProp],
  );

  const contextValue = useMemo(() => ({select, value}), [select, value]);

  return (
    <EmojiPickerSkinToneContext value={contextValue}>
      <Popover {...rest} isOpen={isOpen} onOpenChange={setOpen}>
        {children}
      </Popover>
    </EmojiPickerSkinToneContext>
  );
};

EmojiPickerSkinTonePicker.displayName = "HeroUI.EmojiPicker.SkinTonePicker";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker SkinToneTrigger
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerSkinToneTriggerProps extends ButtonProps {
  /**
   * Skin tone data for resolving the current value's emoji.
   * @default EMOJI_SKIN_TONES
   */
  tones?: EmojiSkinToneItem[];
  ref?: Ref<HTMLButtonElement>;
}

const EmojiPickerSkinToneTrigger = ({
  "aria-label": ariaLabel = "Select skin tone",
  children,
  className,
  tones = EMOJI_SKIN_TONES,
  ...rest
}: EmojiPickerSkinToneTriggerProps) => {
  const slots = useSlots();
  const skinTone = use(EmojiPickerSkinToneContext);
  const current = tones.find((tone) => tone.id === skinTone?.value) ?? tones[0];

  return (
    // The search field provides its clear button through ButtonContext: do not inherit it.
    <ButtonContext value={null}>
      <ButtonPrimitive
        data-slot="emoji-picker-skin-tone-picker"
        {...rest}
        aria-label={ariaLabel}
        className={useResolvedClassName(className, slots.skinTonePicker())}
      >
        {children ?? current?.emoji}
      </ButtonPrimitive>
    </ButtonContext>
  );
};

EmojiPickerSkinToneTrigger.displayName = "HeroUI.EmojiPicker.SkinToneTrigger";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker SkinToneContent
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerSkinToneContentProps extends Omit<PopoverProps, "children"> {
  children?: ReactNode;
  /** Accessible label of the swatch dialog. @default "Skin tone" */
  "aria-label"?: string;
}

const EmojiPickerSkinToneContent = ({
  "aria-label": ariaLabel = "Skin tone",
  children,
  className,
  offset = 4,
  placement = "bottom end",
  ...rest
}: EmojiPickerSkinToneContentProps) => {
  const slots = useSlots();

  return (
    <Popover.Content {...rest} className={className} offset={offset} placement={placement}>
      <Popover.Dialog
        aria-label={ariaLabel}
        className={slots.skinToneOptions()}
        data-slot="emoji-picker-skin-tone-options"
      >
        {children ??
          EMOJI_SKIN_TONES.map((tone) => <EmojiPickerSkinToneOption key={tone.id} id={tone.id} />)}
      </Popover.Dialog>
    </Popover.Content>
  );
};

EmojiPickerSkinToneContent.displayName = "HeroUI.EmojiPicker.SkinToneContent";

/* -------------------------------------------------------------------------------------------------
 * EmojiPicker SkinToneOption
 * -----------------------------------------------------------------------------------------------*/
interface EmojiPickerSkinToneOptionProps extends Omit<ComponentPropsWithRef<"button">, "id"> {
  /** Skin tone identifier (e.g. `"default"`, `"light"`, `"dark"`). */
  id: string;
}

const EmojiPickerSkinToneOption = ({
  "aria-label": ariaLabel,
  children,
  className,
  id,
  onClick,
  ...rest
}: EmojiPickerSkinToneOptionProps) => {
  const slots = useSlots();
  const skinTone = use(EmojiPickerSkinToneContext);
  const tone = EMOJI_SKIN_TONES.find((entry) => entry.id === id);
  const isSelected = skinTone?.value === id;

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) skinTone?.select(id);
  };

  return (
    <button
      aria-label={ariaLabel ?? tone?.label ?? id}
      aria-pressed={isSelected}
      className={cx(slots.skinToneOption(), className)}
      data-selected={isSelected || undefined}
      data-slot="emoji-picker-skin-tone-option"
      type="button"
      onClick={handleClick}
      {...rest}
    >
      {children ?? tone?.emoji ?? id}
    </button>
  );
};

EmojiPickerSkinToneOption.displayName = "HeroUI.EmojiPicker.SkinToneOption";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  EmojiPickerRoot,
  EmojiPickerTrigger,
  EmojiPickerValue,
  EmojiPickerPopover,
  EmojiPickerContent,
  EmojiPickerGrid,
  EmojiPickerItem,
  EmojiPickerFooter,
  EmojiPickerSkinTonePicker,
  EmojiPickerSkinToneTrigger,
  EmojiPickerSkinToneContent,
  EmojiPickerSkinToneOption,
};

export type {
  EmojiPickerRootProps,
  EmojiPickerTriggerProps,
  EmojiPickerValueProps,
  EmojiPickerPopoverProps,
  EmojiPickerContentProps,
  EmojiPickerGridProps,
  EmojiPickerGridItem,
  EmojiPickerItemProps,
  EmojiPickerFooterProps,
  EmojiPickerSkinTonePickerProps,
  EmojiPickerSkinToneTriggerProps,
  EmojiPickerSkinToneContentProps,
  EmojiPickerSkinToneOptionProps,
};
