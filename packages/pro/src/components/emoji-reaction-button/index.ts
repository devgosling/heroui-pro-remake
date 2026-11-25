import type {ComponentProps} from "react";

import {
  EmojiReactionButtonCount,
  EmojiReactionButtonEmoji,
  EmojiReactionButtonRoot,
} from "./emoji-reaction-button";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const EmojiReactionButton = Object.assign(EmojiReactionButtonRoot, {
  Count: EmojiReactionButtonCount,
  Emoji: EmojiReactionButtonEmoji,
  Root: EmojiReactionButtonRoot,
});

export type EmojiReactionButton = {
  Props: ComponentProps<typeof EmojiReactionButtonRoot>;
  RootProps: ComponentProps<typeof EmojiReactionButtonRoot>;
  EmojiProps: ComponentProps<typeof EmojiReactionButtonEmoji>;
  CountProps: ComponentProps<typeof EmojiReactionButtonCount>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  EmojiReactionButtonRoot,
  EmojiReactionButtonEmoji,
  EmojiReactionButtonCount,
  EmojiReactionButtonContext,
} from "./emoji-reaction-button";

export type {
  EmojiReactionButtonRootProps,
  EmojiReactionButtonRootProps as EmojiReactionButtonProps,
  EmojiReactionButtonEmojiProps,
  EmojiReactionButtonCountProps,
} from "./emoji-reaction-button";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  emojiReactionButtonVariants,
  type EmojiReactionButtonVariants,
} from "./emoji-reaction-button.styles";
