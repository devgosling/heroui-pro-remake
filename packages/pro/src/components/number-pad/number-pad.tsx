"use client";

import type {
  NumberPadContextValue,
  NumberPadKeyAnimation,
  NumberPadRootAnimation,
} from "./number-pad-context";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  FocusEvent,
  KeyboardEvent,
  ReactNode,
} from "react";
import type {ButtonRenderProps} from "react-aria-components/Button";

import {use, useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import {ButtonContext, Button as ButtonPrimitive} from "react-aria-components/Button";
import {composeRenderProps} from "react-aria-components/composeRenderProps";

import {useMergedRef, useResolvedClassName} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {
  NUMBER_PAD_BACKSPACE,
  NUMBER_PAD_LONG_PRESS_DELAY,
  NumberPadContext,
  NumberPadKeyContext,
  resolveKeyAnimation,
} from "./number-pad-context";
import {numberPadVariants} from "./number-pad.styles";

/** Slots used when a part is rendered outside of a `NumberPad` root. */
const fallbackSlots = numberPadVariants();

/* -------------------------------------------------------------------------------------------------
 * Icons
 * -----------------------------------------------------------------------------------------------*/
interface BackspaceIconProps {
  className?: string;
  color?: string;
  size: number;
}

const BackspaceIcon = ({className, color, size}: BackspaceIconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    data-slot="number-pad-backspace-icon"
    fill="none"
    focusable="false"
    height={size}
    style={color ? {color} : undefined}
    viewBox="0 0 24 24"
    width={size}
  >
    {/* 18 x 12 arrow (20 x 14 with the stroke), as measured on the Native key */}
    <path
      d="M21 12H3M9 6l-6 6 6 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Shared pressable cell (Key, Backspace and the Spacer action)
 * -----------------------------------------------------------------------------------------------*/
type ButtonPrimitiveProps = ComponentPropsWithRef<typeof ButtonPrimitive>;

interface NumberPadCellProps extends Omit<ButtonPrimitiveProps, "children" | "value"> {
  /**
   * Press feedback configuration (scale + timing).
   * @default undefined (scale 0.97 over 150ms)
   */
  animation?: NumberPadKeyAnimation;
  /**
   * Whether the built-in animated press style (scale) is applied.
   * @default true
   */
  isAnimatedStyleActive?: boolean;
  /**
   * Background layer rendered behind the cell content (absolute fill, clipped to the cell).
   * `undefined` renders the default, a node replaces it, `null` removes it.
   */
  background?: ReactNode;
}

interface PadButtonProps extends NumberPadCellProps {
  baseClassName: string;
  children: (renderProps: ButtonRenderProps) => ReactNode;
  isKeyboardPressed: boolean;
  keyValue?: string;
  slotName: string;
}

const PadButton = ({
  animation,
  background,
  baseClassName,
  children,
  className,
  isAnimatedStyleActive = true,
  isDisabled,
  isKeyboardPressed,
  keyValue,
  slotName,
  style,
  ...rest
}: PadButtonProps) => {
  const pad = use(NumberPadContext);
  const resolvedClassName = useResolvedClassName(className, baseClassName);
  const {isAnimationDisabled, style: animationStyle} = resolveKeyAnimation(
    animation,
    pad?.isAnimationDisabled ?? false,
    isAnimatedStyleActive,
  );
  // Custom animation values become CSS custom properties; the user's style wins.
  const resolvedStyle = animationStyle
    ? composeRenderProps(style, (prevStyle: CSSProperties | undefined) => ({
        ...animationStyle,
        ...prevStyle,
      }))
    : style;

  // A physical keyboard press (handled by the root) shows the same pressed state as a pointer press.
  const buttonContext = useMemo(() => ({isPressed: isKeyboardPressed}), [isKeyboardPressed]);

  return (
    <ButtonContext value={buttonContext}>
      <ButtonPrimitive
        {...rest}
        className={resolvedClassName}
        data-animation={isAnimationDisabled ? "disabled" : undefined}
        data-slot={slotName}
        data-value={keyValue}
        isDisabled={(pad?.isDisabled ?? false) || isDisabled}
        style={resolvedStyle}
      >
        {(renderProps) => (
          <NumberPadKeyContext
            value={{
              isDisabled: renderProps.isDisabled,
              isPressed: renderProps.isPressed,
              value: keyValue,
            }}
          >
            {background}
            {children(renderProps)}
          </NumberPadKeyContext>
        )}
      </ButtonPrimitive>
    </ButtonContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Row
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadRowProps extends ComponentPropsWithRef<"div"> {}

const NumberPadRow = ({className, ...rest}: NumberPadRowProps) => {
  const pad = use(NumberPadContext);
  const slots = pad?.slots ?? fallbackSlots;

  return <div {...rest} className={slots.row({className})} data-slot="number-pad-row" />;
};

NumberPadRow.displayName = "HeroUI.NumberPad.Row";

/* -------------------------------------------------------------------------------------------------
 * KeyBackground
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadKeyBackgroundProps extends ComponentPropsWithRef<"span"> {}

const NumberPadKeyBackground = ({className, ...rest}: NumberPadKeyBackgroundProps) => {
  const pad = use(NumberPadContext);
  const slots = pad?.slots ?? fallbackSlots;

  return (
    <span
      aria-hidden="true"
      {...rest}
      className={slots.keyBackground({className})}
      data-slot="number-pad-key-background"
    />
  );
};

NumberPadKeyBackground.displayName = "HeroUI.NumberPad.KeyBackground";

/* -------------------------------------------------------------------------------------------------
 * KeyLabel
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadKeyLabelProps extends ComponentPropsWithRef<"span"> {}

const NumberPadKeyLabel = ({children, className, ...rest}: NumberPadKeyLabelProps) => {
  const pad = use(NumberPadContext);
  const keyContext = use(NumberPadKeyContext);
  const slots = pad?.slots ?? fallbackSlots;

  return (
    <span {...rest} className={slots.keyLabel({className})} data-slot="number-pad-key-label">
      {children ?? keyContext.value}
    </span>
  );
};

NumberPadKeyLabel.displayName = "HeroUI.NumberPad.KeyLabel";

/* -------------------------------------------------------------------------------------------------
 * Key
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadKeyRenderProps extends ButtonRenderProps {
  /** The key's value. */
  value: string;
}

interface NumberPadKeyProps extends NumberPadCellProps {
  /** Digit or character appended to the pad value. */
  value: string;
  /** Custom content or a render function. Defaults to a `NumberPad.KeyLabel` showing `value`. */
  children?: ReactNode | ((props: NumberPadKeyRenderProps) => ReactNode);
}

const NumberPadKey = ({children, onPress, onPressStart, value, ...rest}: NumberPadKeyProps) => {
  const pad = use(NumberPadContext);
  const slots = pad?.slots ?? fallbackSlots;

  return (
    <PadButton
      {...rest}
      baseClassName={slots.key()}
      isKeyboardPressed={pad?.pressedKey === value}
      keyValue={value}
      slotName="number-pad-key"
      onPress={(event) => {
        pad?.appendKey(value);
        onPress?.(event);
      }}
      onPressStart={(event) => {
        // Haptics must run inside the user gesture; no feedback when maxLength blocks the input.
        if (pad?.canAppend()) pad.haptic("light");
        onPressStart?.(event);
      }}
    >
      {(renderProps) => {
        if (typeof children === "function") return children({...renderProps, value});

        return children ?? <NumberPadKeyLabel />;
      }}
    </PadButton>
  );
};

NumberPadKey.displayName = "HeroUI.NumberPad.Key";

/* -------------------------------------------------------------------------------------------------
 * Backspace
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadBackspaceIconProps {
  /**
   * Size of the icon in pixels.
   * @default 24
   */
  size?: number;
  /**
   * Color of the icon (any CSS color).
   * @default "var(--foreground)"
   */
  color?: string;
}

interface NumberPadBackspaceProps extends NumberPadCellProps {
  /** Custom content. Defaults to a backspace icon. */
  children?: ReactNode | ((props: ButtonRenderProps) => ReactNode);
  /** Props for the default icon. Ignored when `children` is provided. */
  iconProps?: NumberPadBackspaceIconProps;
}

const NumberPadBackspace = ({
  "aria-describedby": ariaDescribedby,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  background = null,
  children,
  iconProps,
  onPress,
  onPressEnd,
  onPressStart,
  ...rest
}: NumberPadBackspaceProps) => {
  const pad = use(NumberPadContext);
  const slots = pad?.slots ?? fallbackSlots;
  const descriptionId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const didLongPressRef = useRef(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <PadButton
      {...rest}
      aria-describedby={ariaDescribedby ? `${ariaDescribedby} ${descriptionId}` : descriptionId}
      aria-label={ariaLabel ?? (ariaLabelledby ? undefined : "Delete")}
      aria-labelledby={ariaLabelledby}
      background={background}
      baseClassName={slots.backspace()}
      isKeyboardPressed={pad?.pressedKey === NUMBER_PAD_BACKSPACE}
      slotName="number-pad-backspace"
      onPress={(event) => {
        // A long press already cleared the value; the release must not delete again.
        if (didLongPressRef.current) {
          didLongPressRef.current = false;

          return;
        }
        pad?.deleteLast();
        onPress?.(event);
      }}
      onPressEnd={(event) => {
        clearTimeout(timerRef.current);
        onPressEnd?.(event);
      }}
      onPressStart={(event) => {
        didLongPressRef.current = false;
        clearTimeout(timerRef.current);

        if (pad && pad.value !== "") {
          pad.haptic("rigid");
          timerRef.current = setTimeout(() => {
            didLongPressRef.current = true;
            // Runs outside the gesture: plays on Android (sticky activation), best effort on iOS.
            pad.haptic("heavy");
            pad.clear();
          }, NUMBER_PAD_LONG_PRESS_DELAY);
        }
        onPressStart?.(event);
      }}
    >
      {(renderProps) => (
        <>
          {typeof children === "function"
            ? children(renderProps)
            : (children ?? (
                <BackspaceIcon
                  className={slots.backspaceIcon()}
                  color={iconProps?.color}
                  size={iconProps?.size ?? 24}
                />
              ))}
          <span hidden id={descriptionId}>
            Long press to clear
          </span>
        </>
      )}
    </PadButton>
  );
};

NumberPadBackspace.displayName = "HeroUI.NumberPad.Backspace";

/* -------------------------------------------------------------------------------------------------
 * Spacer
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadSpacerProps extends NumberPadCellProps {
  /** Optional content. When provided, the spacer becomes a pressable action key. */
  children?: ReactNode | ((props: ButtonRenderProps) => ReactNode);
}

const NumberPadSpacer = ({
  background = null,
  children,
  className,
  onPress,
  onPressStart,
  ...rest
}: NumberPadSpacerProps) => {
  const pad = use(NumberPadContext);
  const slots = pad?.slots ?? fallbackSlots;

  if (children === undefined || children === null) {
    // Inert cell that only keeps the grid aligned.
    return (
      <div
        aria-hidden="true"
        className={slots.spacer({className: typeof className === "string" ? className : undefined})}
        data-slot="number-pad-spacer"
        id={rest.id}
        style={typeof rest.style === "object" ? rest.style : undefined}
      />
    );
  }

  return (
    <PadButton
      {...rest}
      background={background}
      baseClassName={slots.spacer()}
      className={className}
      data-action="true"
      isKeyboardPressed={false}
      slotName="number-pad-spacer"
      onPress={(event) => {
        if (onPress) onPress(event);
        else pad?.onSpacerPress?.();
      }}
      onPressStart={(event) => {
        if (!pad?.isDisabled) pad?.haptic("light");
        onPressStart?.(event);
      }}
    >
      {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
    </PadButton>
  );
};

NumberPadSpacer.displayName = "HeroUI.NumberPad.Spacer";

/* -------------------------------------------------------------------------------------------------
 * Default 3 x 4 layout
 * -----------------------------------------------------------------------------------------------*/
const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

const DefaultLayout = () => (
  <>
    {DIGIT_ROWS.map((row) => (
      <NumberPadRow key={row.join("")}>
        {row.map((digit) => (
          <NumberPadKey key={digit} value={digit} />
        ))}
      </NumberPadRow>
    ))}
    <NumberPadRow>
      <NumberPadSpacer />
      <NumberPadKey value="0" />
      <NumberPadBackspace />
    </NumberPadRow>
  </>
);

/* -------------------------------------------------------------------------------------------------
 * Keyboard helpers
 * -----------------------------------------------------------------------------------------------*/
const ARROW_KEYS = new Set(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"]);

/** Moves focus to the nearest enabled cell in the arrow's direction (same row / column). */
const focusNeighbour = (root: HTMLElement, from: Element | null, arrow: string): boolean => {
  if (!(from instanceof HTMLElement) || !root.contains(from)) return false;

  const origin = from.getBoundingClientRect();
  const originX = origin.left + origin.width / 2;
  const originY = origin.top + origin.height / 2;
  const isHorizontal = arrow === "ArrowLeft" || arrow === "ArrowRight";
  const sign = arrow === "ArrowLeft" || arrow === "ArrowUp" ? -1 : 1;
  let best: HTMLElement | null = null;
  let bestDistance = Infinity;

  for (const candidate of root.querySelectorAll<HTMLElement>("button:not(:disabled)")) {
    if (candidate === from) continue;

    const rect = candidate.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - originX;
    const dy = rect.top + rect.height / 2 - originY;
    const main = (isHorizontal ? dx : dy) * sign;
    const cross = Math.abs(isHorizontal ? dy : dx);
    const tolerance = (isHorizontal ? origin.height : origin.width) / 2;

    if (main > 1 && cross < tolerance && main < bestDistance) {
      best = candidate;
      bestDistance = main;
    }
  }

  best?.focus();

  return best !== null;
};

const isEditableTarget = (target: EventTarget): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA");

const findKeyElement = (root: HTMLElement, key: string): HTMLElement | null => {
  if (typeof CSS === "undefined" || !CSS.escape) return null;

  return root.querySelector<HTMLElement>(
    `[data-slot="number-pad-key"][data-value="${CSS.escape(key)}"]:not([data-disabled])`,
  );
};

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface NumberPadRootProps extends Omit<
  ComponentPropsWithRef<"div">,
  "children" | "defaultValue" | "onKeyPress"
> {
  /** Pad content. When omitted, the default 3 x 4 digit grid is rendered. */
  children?: ReactNode;
  /** Controlled value. */
  value?: string;
  /**
   * Initial value (uncontrolled).
   * @default ""
   */
  defaultValue?: string;
  /** Maximum number of characters. Extra key presses are ignored once reached. */
  maxLength?: number;
  /**
   * Whether the entire pad is disabled.
   * @default false
   */
  isDisabled?: boolean;
  /** Called when the value changes. */
  onValueChange?: (value: string) => void;
  /** Called when a key appends its value, with the key and the next value. */
  onKeyPress?: (key: string, nextValue: string) => void;
  /** Called when Backspace is pressed, with the value after deletion. */
  onBackspacePress?: (value: string) => void;
  /** Default press handler of a Spacer rendered with children and without its own `onPress`. */
  onSpacerPress?: () => void;
  /** Called when the value is cleared by a Backspace long press (or Ctrl/Cmd + Backspace). */
  onClear?: () => void;
  /** Called when the value reaches `maxLength`. */
  onComplete?: (value: string) => void;
  /** `"disable-all"` turns off the press animation of every key. */
  animation?: NumberPadRootAnimation;
  /**
   * Whether key presses play haptic feedback. Defaults to the nearest `HapticsProvider` (on).
   */
  isHapticFeedbackEnabled?: boolean;
}

const NumberPadRoot = ({
  animation,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  children,
  className,
  defaultValue = "",
  isDisabled = false,
  isHapticFeedbackEnabled,
  maxLength,
  onBackspacePress,
  onBlur,
  onClear,
  onComplete,
  onKeyDown,
  onKeyPress,
  onKeyUp,
  onSpacerPress,
  onValueChange,
  ref,
  value: valueProp,
  ...rest
}: NumberPadRootProps) => {
  const slots = useMemo(() => numberPadVariants(), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;
  const isComplete = maxLength !== undefined && value.length >= maxLength;

  const commit = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const canAppend = useCallback(
    () => !isDisabled && (maxLength === undefined || value.length < maxLength),
    [isDisabled, maxLength, value],
  );

  const appendKey = useCallback(
    (key: string) => {
      if (isDisabled || (maxLength !== undefined && value.length >= maxLength)) return;

      let next = value + key;

      if (maxLength !== undefined && next.length > maxLength) next = next.slice(0, maxLength);
      commit(next);
      onKeyPress?.(key, next);
      if (maxLength !== undefined && next.length >= maxLength) onComplete?.(next);
    },
    [commit, isDisabled, maxLength, onComplete, onKeyPress, value],
  );

  const deleteLast = useCallback(() => {
    if (isDisabled) return;

    const next = value.slice(0, -1);

    if (next !== value) commit(next);
    onBackspacePress?.(next);
  }, [commit, isDisabled, onBackspacePress, value]);

  const clear = useCallback(() => {
    if (isDisabled || value === "") return;

    commit("");
    onClear?.();
  }, [commit, isDisabled, onClear, value]);

  const contextValue = useMemo<NumberPadContextValue>(
    () => ({
      appendKey,
      canAppend,
      clear,
      deleteLast,
      haptic,
      isAnimationDisabled: animation === "disable-all",
      isDisabled,
      maxLength,
      onSpacerPress,
      pressedKey,
      slots,
      value,
    }),
    [
      animation,
      appendKey,
      canAppend,
      clear,
      deleteLast,
      haptic,
      isDisabled,
      maxLength,
      onSpacerPress,
      pressedKey,
      slots,
      value,
    ],
  );

  /* Physical keyboard: digits / key values, Backspace (Ctrl/Cmd + Backspace clears), arrows. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);

    const root = rootRef.current;

    if (!root || event.defaultPrevented || event.altKey || isDisabled) return;
    // Text fields composed inside the pad (e.g. in a Spacer) keep their own typing and Backspace.
    if (isEditableTarget(event.target)) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      setPressedKey(NUMBER_PAD_BACKSPACE);
      if (event.ctrlKey || event.metaKey) {
        if (value !== "") haptic("heavy");
        clear();
      } else {
        if (value !== "") haptic("rigid");
        deleteLast();
      }

      return;
    }

    if (event.ctrlKey || event.metaKey) return;

    if (ARROW_KEYS.has(event.key)) {
      if (focusNeighbour(root, document.activeElement, event.key)) event.preventDefault();

      return;
    }

    const keyElement = findKeyElement(root, event.key);

    if (!keyElement) return;

    event.preventDefault();
    // Holding a digit does not repeat it (PIN entry); Backspace repeats like a text field.
    if (event.repeat) return;
    if (canAppend()) haptic("light");
    setPressedKey(event.key);
    appendKey(event.key);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyUp?.(event);

    if (
      pressedKey !== null &&
      (event.key === pressedKey ||
        (event.key === "Backspace" && pressedKey === NUMBER_PAD_BACKSPACE))
    ) {
      setPressedKey(null);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);

    if (pressedKey !== null && !rootRef.current?.contains(event.relatedTarget as Node | null)) {
      setPressedKey(null);
    }
  };

  return (
    <NumberPadContext value={contextValue}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keyboard shortcuts (digits, Backspace, arrows) bubbling up from the key buttons inside the group; the group itself is not focusable. */}
      <div
        {...rest}
        ref={mergedRef}
        aria-disabled={isDisabled || undefined}
        aria-label={ariaLabel ?? (ariaLabelledby ? undefined : "Number pad")}
        aria-labelledby={ariaLabelledby}
        className={slots.base({className})}
        data-animation={animation}
        data-complete={isComplete || undefined}
        data-disabled={isDisabled || undefined}
        data-slot="number-pad"
        role="group"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      >
        {children ?? <DefaultLayout />}
      </div>
    </NumberPadContext>
  );
};

NumberPadRoot.displayName = "HeroUI.NumberPad";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberPadRoot,
  NumberPadRow,
  NumberPadKey,
  NumberPadKeyBackground,
  NumberPadKeyLabel,
  NumberPadBackspace,
  NumberPadSpacer,
};

export type {
  NumberPadRootProps,
  NumberPadRowProps,
  NumberPadKeyProps,
  NumberPadKeyRenderProps,
  NumberPadKeyBackgroundProps,
  NumberPadKeyLabelProps,
  NumberPadBackspaceProps,
  NumberPadBackspaceIconProps,
  NumberPadSpacerProps,
  NumberPadCellProps,
};
