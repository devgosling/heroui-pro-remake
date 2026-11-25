import type {ComponentProps} from "react";

import {
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerGrid,
  EmojiPickerItem,
  EmojiPickerPopover,
  EmojiPickerRoot,
  EmojiPickerSkinToneContent,
  EmojiPickerSkinToneOption,
  EmojiPickerSkinTonePicker,
  EmojiPickerSkinToneTrigger,
  EmojiPickerTrigger,
  EmojiPickerValue,
} from "./emoji-picker";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const EmojiPicker = Object.assign(EmojiPickerRoot, {
  Content: EmojiPickerContent,
  Footer: EmojiPickerFooter,
  Grid: EmojiPickerGrid,
  Item: EmojiPickerItem,
  Popover: EmojiPickerPopover,
  Root: EmojiPickerRoot,
  SkinToneContent: EmojiPickerSkinToneContent,
  SkinToneOption: EmojiPickerSkinToneOption,
  SkinTonePicker: EmojiPickerSkinTonePicker,
  SkinToneTrigger: EmojiPickerSkinToneTrigger,
  Trigger: EmojiPickerTrigger,
  Value: EmojiPickerValue,
});

export type EmojiPicker = {
  Props: ComponentProps<typeof EmojiPickerRoot>;
  RootProps: ComponentProps<typeof EmojiPickerRoot>;
  TriggerProps: ComponentProps<typeof EmojiPickerTrigger>;
  ValueProps: ComponentProps<typeof EmojiPickerValue>;
  PopoverProps: ComponentProps<typeof EmojiPickerPopover>;
  ContentProps: ComponentProps<typeof EmojiPickerContent>;
  GridProps: ComponentProps<typeof EmojiPickerGrid>;
  ItemProps: ComponentProps<typeof EmojiPickerItem>;
  FooterProps: ComponentProps<typeof EmojiPickerFooter>;
  SkinTonePickerProps: ComponentProps<typeof EmojiPickerSkinTonePicker>;
  SkinToneTriggerProps: ComponentProps<typeof EmojiPickerSkinToneTrigger>;
  SkinToneContentProps: ComponentProps<typeof EmojiPickerSkinToneContent>;
  SkinToneOptionProps: ComponentProps<typeof EmojiPickerSkinToneOption>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./emoji-picker";

export {EmojiPickerContext, useEmojiPicker} from "./emoji-picker-context";
export type {EmojiPickerContextValue} from "./emoji-picker-context";

export type {
  EmojiPickerRootProps,
  EmojiPickerRootProps as EmojiPickerProps,
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
} from "./emoji-picker";

/* -------------------------------------------------------------------------------------------------
 * Data
 * -----------------------------------------------------------------------------------------------*/
export {
  EMOJIS,
  EMOJI_CATEGORIES,
  EMOJI_RECENT_CATEGORY,
  EMOJI_RECENT_LIMIT,
  EMOJI_SKIN_TONES,
  applySkinTone,
  getEmoji,
  getEmojiTextValue,
  stripSkinTone,
} from "./emoji-picker.utils";

export type {
  EmojiCategory,
  EmojiItem,
  EmojiSkinTone,
  EmojiSkinToneItem,
} from "./emoji-picker.utils";

export {EMOJI_DATA_VERSION} from "./emoji-picker.data";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {emojiPickerVariants, type EmojiPickerVariants} from "./emoji-picker.styles";
