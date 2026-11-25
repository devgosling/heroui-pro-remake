"use client";

import type {EmojiReactionButtonVariants} from "./emoji-reaction-button.styles";
import type {ComponentPropsWithRef} from "react";

import {createContext, use, useMemo} from "react";
import {ToggleButton as ToggleButtonPrimitive} from "react-aria-components/ToggleButton";

import {useResolvedClassName} from "../../utils";

import {emojiReactionButtonVariants} from "./emoji-reaction-button.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type EmojiReactionButtonContext = {
  slots?: ReturnType<typeof emojiReactionButtonVariants>;
};

const EmojiReactionButtonContext = createContext<EmojiReactionButtonContext>({});

/** Part classes do not depend on the size, so parts rendered outside a root still get them. */
const defaultSlots = emojiReactionButtonVariants();

/* -------------------------------------------------------------------------------------------------
 * Root (RAC ToggleButton)
 * -----------------------------------------------------------------------------------------------*/
type ToggleButtonPrimitiveProps = ComponentPropsWithRef<typeof ToggleButtonPrimitive>;

interface EmojiReactionButtonRootProps
  extends ToggleButtonPrimitiveProps, EmojiReactionButtonVariants {
  /**
   * Whether the button is read-only: it keeps its selected state, ignores presses and is
   * removed from the tab order.
   */
  isReadOnly?: boolean;
}

const EmojiReactionButtonRoot = ({
  children,
  className,
  excludeFromTabOrder,
  isReadOnly,
  size,
  ...rest
}: EmojiReactionButtonRootProps) => {
  const slots = useMemo(() => emojiReactionButtonVariants({size}), [size]);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  // React Stately's toggle state ignores selection changes while `isReadOnly` is set, so the
  // button keeps its press feedback but never flips. RAC forwards the prop to it at runtime even
  // though `ToggleButtonProps` does not declare it.
  const primitiveProps = {...rest, isReadOnly} as ToggleButtonPrimitiveProps;

  return (
    <EmojiReactionButtonContext value={contextValue}>
      <ToggleButtonPrimitive
        data-readonly={isReadOnly || undefined}
        {...primitiveProps}
        className={resolvedClassName}
        data-slot="emoji-reaction-button"
        excludeFromTabOrder={excludeFromTabOrder ?? isReadOnly}
      >
        {children}
      </ToggleButtonPrimitive>
    </EmojiReactionButtonContext>
  );
};

EmojiReactionButtonRoot.displayName = "HeroUI.EmojiReactionButton";

/* -------------------------------------------------------------------------------------------------
 * Emoji
 * -----------------------------------------------------------------------------------------------*/
interface EmojiReactionButtonEmojiProps extends ComponentPropsWithRef<"span"> {}

const EmojiReactionButtonEmoji = ({className, ...rest}: EmojiReactionButtonEmojiProps) => {
  const {slots = defaultSlots} = use(EmojiReactionButtonContext);

  return (
    <span className={slots.emoji({className})} data-slot="emoji-reaction-button-emoji" {...rest} />
  );
};

EmojiReactionButtonEmoji.displayName = "HeroUI.EmojiReactionButton.Emoji";

/* -------------------------------------------------------------------------------------------------
 * Count
 * -----------------------------------------------------------------------------------------------*/
interface EmojiReactionButtonCountProps extends ComponentPropsWithRef<"span"> {}

const EmojiReactionButtonCount = ({className, ...rest}: EmojiReactionButtonCountProps) => {
  const {slots = defaultSlots} = use(EmojiReactionButtonContext);

  return (
    <span className={slots.count({className})} data-slot="emoji-reaction-button-count" {...rest} />
  );
};

EmojiReactionButtonCount.displayName = "HeroUI.EmojiReactionButton.Count";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  EmojiReactionButtonRoot,
  EmojiReactionButtonEmoji,
  EmojiReactionButtonCount,
  EmojiReactionButtonContext,
};

export type {
  EmojiReactionButtonRootProps,
  EmojiReactionButtonEmojiProps,
  EmojiReactionButtonCountProps,
};
