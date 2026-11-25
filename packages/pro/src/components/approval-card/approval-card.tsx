"use client";

import type {
  ApprovalCardAnswer,
  ApprovalCardContextValue,
  ApprovalCardOptionItem,
  ApprovalCardQuestion,
  ApprovalCardValue,
} from "./approval-card-context";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";

import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  CloseButton,
  Description,
  Input,
  Radio,
  RadioGroup,
  ScrollShadow,
} from "@heroui/react";
import {
  Fragment,
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useLocale} from "react-aria/I18nProvider";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusRing} from "react-aria/useFocusRing";
import {useHover} from "react-aria/useHover";
import {useId as useAriaId} from "react-aria/useId";
import {usePress} from "react-aria/usePress";
import {VisuallyHidden} from "react-aria/VisuallyHidden";
import {cx} from "tailwind-variants";

import {mergeRefs, useMergedRef, useResolvedClassName} from "../../utils";

import {ApprovalCardContext, useApprovalCardContext} from "./approval-card-context";
import {approvalCardVariants} from "./approval-card.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardSubmitResult {
  /** The answered questions, with the typed answer trimmed. */
  answers: ApprovalCardValue;
  /** Ids of the questions without an answer, in order. */
  skipped: string[];
}

interface ApprovalCardSkippedCountRenderProps {
  count: number;
}

interface ApprovalCardStepRenderProps {
  /** 0-based index of the question. */
  index: number;
  isAnswered: boolean;
  question: ApprovalCardQuestion;
}

interface ApprovalCardStepCountRenderProps {
  /** 1-based number of the shown question. */
  current: number;
  total: number;
}

interface ApprovalCardContinueRenderProps {
  isLastStep: boolean;
}

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const OPTION_SELECTOR = '[data-slot="approval-card-option"] input';
const CUSTOM_INPUT_SELECTOR = '[data-slot="approval-card-custom-input"]';
const TABBABLE_SELECTOR = [
  "input:not([disabled]):not([type=hidden]):not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "a[href]:not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

const isConfirmation = (question: ApprovalCardQuestion | undefined) =>
  !!question && !question.options?.length && !question.allowCustom;

const isAnswered = (
  question: ApprovalCardQuestion | undefined,
  answer: ApprovalCardAnswer | undefined,
) => {
  if (!question || !answer) return false;
  if (isConfirmation(question)) return true;

  return answer.selected.length > 0 || (answer.custom?.trim() ?? "") !== "";
};

const isTextField = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;

  return target instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(target.type);
};

/** Same id scheme as React Aria tabs: `${listId}-${role}-${key without whitespace}`. */
const tabElementId = (listId: string, key: string, role: "tab" | "tabpanel") =>
  `${listId}-${role}-${key.replace(/\s*/g, "")}`;

const buildResult = (
  questions: ApprovalCardQuestion[],
  value: ApprovalCardValue,
): ApprovalCardSubmitResult => {
  const answers: ApprovalCardValue = {};
  const skipped: string[] = [];

  for (const question of questions) {
    const answer = value[question.id];

    if (!isAnswered(question, answer) || !answer) {
      skipped.push(question.id);
      continue;
    }

    const custom = answer.custom?.trim();

    answers[question.id] = custom
      ? {custom, selected: [...answer.selected]}
      : {selected: [...answer.selected]};
  }

  return {answers, skipped};
};

const isTextLike = (node: ReactNode): node is string | number =>
  typeof node === "string" || typeof node === "number";

function useControllableState<T>(
  prop: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const [inner, setInner] = useState<T>(defaultValue);
  const isControlled = prop !== undefined;
  const current = isControlled ? (prop as T) : inner;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}

/** `tabIndex=0` on a tab panel only while it has no tabbable child (React Aria `useTabPanel`). */
function useHasTabbableChild(element: HTMLElement | null, isEnabled: boolean) {
  const [hasTabbableChild, setHasTabbableChild] = useState(false);

  useLayoutEffect(() => {
    if (!element || !isEnabled) return;

    const update = () => setHasTabbableChild(!!element.querySelector(TABBABLE_SELECTOR));

    update();

    const observer = new MutationObserver(update);

    observer.observe(element, {
      attributeFilter: ["tabindex", "disabled"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [element, isEnabled]);

  return hasTabbableChild;
}

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
type CardProps = ComponentPropsWithRef<typeof Card>;

interface ApprovalCardRootProps extends Omit<
  CardProps,
  "children" | "defaultValue" | "onChange" | "onKeyDown" | "onKeyDownCapture" | "onSubmit"
> {
  /** Questions asked one at a time. */
  questions: ApprovalCardQuestion[];
  /** Answers when controlled. */
  value?: ApprovalCardValue;
  /** Initial answers when uncontrolled. @default {} */
  defaultValue?: ApprovalCardValue;
  /** Called on every answer change. */
  onChange?: (value: ApprovalCardValue) => void;
  /** Index of the shown question when controlled. */
  currentStep?: number;
  /** Index of the first shown question when uncontrolled. @default 0 */
  defaultStep?: number;
  /** Called when the shown question changes. */
  onStepChange?: (step: number) => void;
  /** Called by Send, or by Skip on the last question. */
  onSubmit?: (result: ApprovalCardSubmitResult) => void;
  /** Called with the id of a skipped question. */
  onSkip?: (questionId: string) => void;
  /** Called by the dismiss button. */
  onDismiss?: () => void;
  /** Replaces the default layout with the placed parts. */
  children?: ReactNode;
  /** Keys that reach the card, e.g. Escape to deny an approval (there is no built-in Escape). */
  onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  /**
   * Runs before the card's own keys (1-9, Enter, Cmd/Ctrl+Enter), which are handled in the capture
   * phase so focused controls cannot swallow them; `preventDefault` here skips them.
   */
  onKeyDownCapture?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}

const EMPTY_VALUE: ApprovalCardValue = {};

const ApprovalCardRoot = ({
  "aria-label": ariaLabelProp,
  "aria-labelledby": ariaLabelledbyProp,
  children,
  className,
  currentStep,
  defaultStep = 0,
  defaultValue = EMPTY_VALUE,
  onChange,
  onDismiss,
  onKeyDown,
  onKeyDownCapture,
  onSkip,
  onStepChange,
  onSubmit,
  questions,
  ref,
  value: valueProp,
  variant = "default",
  ...rest
}: ApprovalCardRootProps) => {
  const slots = useMemo(() => approvalCardVariants(), []);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergedRef(ref as never, cardRef);

  const [value, setValue] = useControllableState(valueProp, defaultValue, onChange);
  const [rawStep, setRawStep] = useControllableState(currentStep, defaultStep, onStepChange);

  const total = questions.length;
  const step = Math.min(Math.max(rawStep, 0), Math.max(total - 1, 0));
  const question = questions[step];
  const isLastStep = step >= total - 1;

  // `data-swapped` turns on with the first question change and stays on.
  const [isSwapped, setIsSwapped] = useState(false);
  const [previousStep, setPreviousStep] = useState(step);

  if (previousStep !== step) {
    setPreviousStep(step);
    if (!isSwapped) setIsSwapped(true);
  }

  // Placed parts register themselves; the default layout knows up front which parts it renders,
  // so its first (and server) render already carries the right labels and tab panel roles.
  const hasDefaultLayout = children === undefined;
  const generatedTitleId = useId();
  const [titleState, setTitleState] = useState<{id: string; count: number}>({
    count: 0,
    id: generatedTitleId,
  });
  const [stepsCount, setStepsCount] = useState(0);
  const stepsId = useAriaId();
  const stepFocusRef = useRef<string | null>(null);
  const pendingOptionFocusRef = useRef(false);

  const registerTitle = useCallback(
    (id: string) => {
      setTitleState((state) => ({count: state.count + 1, id}));

      return () => setTitleState((state) => ({count: state.count - 1, id: generatedTitleId}));
    },
    [generatedTitleId],
  );

  const registerSteps = useCallback(() => {
    setStepsCount((count) => count + 1);

    return () => setStepsCount((count) => count - 1);
  }, []);

  const hasTitle = hasDefaultLayout || titleState.count > 0;
  const hasSteps = hasDefaultLayout ? total > 1 : stepsCount > 0;

  const answer = question ? value[question.id] : undefined;
  const canContinue = isConfirmation(question) || isAnswered(question, answer);

  const skippedCount = useMemo(
    () =>
      questions.filter((item, index) => index !== step && !isAnswered(item, value[item.id])).length,
    [questions, step, value],
  );

  const isQuestionAnswered = useCallback(
    (item: ApprovalCardQuestion) => isAnswered(item, value[item.id]),
    [value],
  );

  const updateAnswer = useCallback(
    (next: ApprovalCardAnswer) => {
      if (!question) return;
      setValue({...value, [question.id]: next});
    },
    [question, setValue, value],
  );

  const setSelected = useCallback(
    (selected: string[]) => {
      if (!question) return;
      const previous = value[question.id];
      const isSingle = question.selectionMode !== "multiple";

      // In single mode picking a radio clears the typed answer.
      updateAnswer(
        !isSingle && previous?.custom !== undefined
          ? {custom: previous.custom, selected}
          : {selected},
      );
    },
    [question, updateAnswer, value],
  );

  const setCustom = useCallback(
    (custom: string) => {
      if (!question) return;
      const previous = value[question.id];
      const isSingle = question.selectionMode !== "multiple";

      // In single mode typing an answer clears the radio.
      const selected = isSingle && custom.trim() !== "" ? [] : (previous?.selected ?? []);

      updateAnswer({custom, selected});
    },
    [question, updateAnswer, value],
  );

  const goToStep = useCallback(
    (index: number, options?: {focusStep?: boolean}) => {
      if (index < 0 || index >= total || index === step) return;
      const target = questions[index];

      if (options?.focusStep && target) stepFocusRef.current = target.id;
      setRawStep(index);
    },
    [questions, setRawStep, step, total],
  );

  const advance = useCallback(
    (nextValue: ApprovalCardValue) => {
      if (isLastStep) {
        onSubmit?.(buildResult(questions, nextValue));

        return;
      }

      pendingOptionFocusRef.current = true;
      setRawStep(step + 1);
    },
    [isLastStep, onSubmit, questions, setRawStep, step],
  );

  const submitStep = useCallback(() => {
    if (!question || !canContinue) return;
    let nextValue = value;

    if (isConfirmation(question) && !value[question.id]) {
      nextValue = {...value, [question.id]: {selected: []}};
      setValue(nextValue);
    }

    advance(nextValue);
  }, [advance, canContinue, question, setValue, value]);

  const skipStep = useCallback(() => {
    if (!question) return;
    let nextValue = value;

    if (question.id in value) {
      nextValue = {...value};
      delete nextValue[question.id];
      setValue(nextValue);
    }

    onSkip?.(question.id);
    advance(nextValue);
  }, [advance, onSkip, question, setValue, value]);

  const dismiss = useCallback(() => onDismiss?.(), [onDismiss]);

  // After Continue or Skip, focus the next question's picked (or first) option.
  useEffect(() => {
    if (!pendingOptionFocusRef.current) return;
    pendingOptionFocusRef.current = false;

    const root = cardRef.current;

    if (!root) return;

    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>(OPTION_SELECTOR)).filter(
      (input) => !input.disabled,
    );
    const target =
      inputs.find((input) => input.checked) ??
      inputs[0] ??
      root.querySelector<HTMLElement>(CUSTOM_INPUT_SELECTOR) ??
      root.querySelector<HTMLElement>('[data-slot="approval-card-content"]');

    target?.focus();
  }, [step]);

  const pickOptionAt = useCallback(
    (position: number) => {
      const root = cardRef.current;

      if (!root || !question) return false;

      const inputs = Array.from(root.querySelectorAll<HTMLInputElement>(OPTION_SELECTOR)).filter(
        (input) => !input.disabled,
      );
      const optionId = inputs[position - 1]?.value;

      if (!optionId) return false;

      const selected = value[question.id]?.selected ?? [];

      if (question.selectionMode === "multiple") {
        setSelected(
          selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId],
        );
      } else {
        setSelected([optionId]);
      }

      return true;
    },
    [question, setSelected, value],
  );

  // Capture phase: React Aria controls (radios, buttons) stop the propagation of keys they own.
  const handleKeyDownCapture = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      onKeyDownCapture?.(event);
      if (event.defaultPrevented) return;

      const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;
      const isModEnter = event.key === "Enter" && (event.metaKey || event.ctrlKey);

      if (isModEnter) {
        if (isComposing || !canContinue) return;
        // Keep a focused button (Skip, a step) from also handling the key.
        event.preventDefault();
        event.stopPropagation();
        submitStep();

        return;
      }

      // Plain Enter (Shift and Alt included) on an option or in the custom input acts as Continue.
      if (event.key === "Enter") {
        const target = event.target as HTMLElement;
        const isOption = !!target.closest?.('[data-slot="approval-card-option"]');
        const isCustomInput = !!target.matches?.(CUSTOM_INPUT_SELECTOR);

        if ((!isOption && !isCustomInput) || isComposing) return;
        event.preventDefault();
        if (canContinue) submitStep();

        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (/^[1-9]$/.test(event.key) && !isTextField(event.target)) {
        if (pickOptionAt(Number(event.key))) event.preventDefault();
      }
    },
    [canContinue, onKeyDownCapture, pickOptionAt, submitStep],
  );

  const contextValue = useMemo<ApprovalCardContextValue>(
    () => ({
      canContinue,
      dismiss,
      goToStep,
      hasSteps,
      hasTitle,
      isLastStep,
      isQuestionAnswered,
      isSwapped,
      question,
      questions,
      registerSteps,
      registerTitle,
      setCustom,
      setSelected,
      skipStep,
      skippedCount,
      slots,
      step,
      stepFocusRef,
      stepsId,
      submitStep,
      titleId: titleState.id,
      total,
      value,
    }),
    [
      canContinue,
      dismiss,
      goToStep,
      hasSteps,
      hasTitle,
      isLastStep,
      isQuestionAnswered,
      isSwapped,
      question,
      questions,
      registerSteps,
      registerTitle,
      setCustom,
      setSelected,
      skippedCount,
      skipStep,
      slots,
      step,
      stepsId,
      submitStep,
      titleState.id,
      total,
      value,
    ],
  );

  const labelProps = hasTitle
    ? {"aria-label": ariaLabelProp, "aria-labelledby": ariaLabelledbyProp ?? titleState.id}
    : {"aria-label": ariaLabelProp ?? question?.title, "aria-labelledby": ariaLabelledbyProp};

  return (
    <ApprovalCardContext value={contextValue}>
      <Card
        {...(rest as CardProps)}
        ref={mergedRef}
        className={cx(slots.base(), className as string | undefined)}
        data-slot="approval-card"
        role="group"
        variant={variant}
        onKeyDown={onKeyDown as CardProps["onKeyDown"]}
        onKeyDownCapture={handleKeyDownCapture}
        {...labelProps}
      >
        {hasDefaultLayout ? (
          <>
            <ApprovalCardHeader>
              <ApprovalCardTitle />
              {onDismiss ? <ApprovalCardDismiss /> : null}
            </ApprovalCardHeader>
            <ApprovalCardContent>
              <ApprovalCardOptions />
              <ApprovalCardCustomInput />
            </ApprovalCardContent>
            <ApprovalCardFooter>
              {total > 1 ? (
                <>
                  <ApprovalCardSteps />
                  <ApprovalCardStepCount />
                </>
              ) : null}
              <ApprovalCardSkippedCount />
              <ApprovalCardActions>
                <ApprovalCardSkip />
                <ApprovalCardContinue />
              </ApprovalCardActions>
            </ApprovalCardFooter>
          </>
        ) : (
          children
        )}
      </Card>
    </ApprovalCardContext>
  );
};

ApprovalCardRoot.displayName = "HeroUI.ApprovalCard";

/* -------------------------------------------------------------------------------------------------
 * Layout parts
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardHeaderProps extends ComponentPropsWithRef<"div"> {}

const ApprovalCardHeader = ({className, ...rest}: ApprovalCardHeaderProps) => {
  const {slots} = useApprovalCardContext("Header");

  return <div className={slots.header({className})} data-slot="approval-card-header" {...rest} />;
};

ApprovalCardHeader.displayName = "HeroUI.ApprovalCard.Header";

interface ApprovalCardFooterProps extends ComponentPropsWithRef<"div"> {}

const ApprovalCardFooter = ({className, ...rest}: ApprovalCardFooterProps) => {
  const {slots} = useApprovalCardContext("Footer");

  return <div className={slots.footer({className})} data-slot="approval-card-footer" {...rest} />;
};

ApprovalCardFooter.displayName = "HeroUI.ApprovalCard.Footer";

interface ApprovalCardActionsProps extends ComponentPropsWithRef<"div"> {}

const ApprovalCardActions = ({className, ...rest}: ApprovalCardActionsProps) => {
  const {slots} = useApprovalCardContext("Actions");

  return <div className={slots.actions({className})} data-slot="approval-card-actions" {...rest} />;
};

ApprovalCardActions.displayName = "HeroUI.ApprovalCard.Actions";

/* -------------------------------------------------------------------------------------------------
 * Title
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardTitleProps extends ComponentPropsWithRef<"div"> {}

const ApprovalCardTitle = ({children, className, id, ...rest}: ApprovalCardTitleProps) => {
  const {isSwapped, question, registerTitle, slots, titleId} = useApprovalCardContext("Title");
  const resolvedId = id ?? titleId;

  useLayoutEffect(() => registerTitle(resolvedId), [registerTitle, resolvedId]);

  return (
    <div
      // Remount per question so the enter transition (`@starting-style`) replays.
      key={question?.id}
      className={slots.title({className})}
      data-slot="approval-card-title"
      data-swapped={isSwapped || undefined}
      id={resolvedId}
      {...rest}
    >
      {children ?? question?.title}
    </div>
  );
};

ApprovalCardTitle.displayName = "HeroUI.ApprovalCard.Title";

/* -------------------------------------------------------------------------------------------------
 * Dismiss
 * -----------------------------------------------------------------------------------------------*/
type ApprovalCardDismissProps = ComponentPropsWithRef<typeof CloseButton>;

const ApprovalCardDismiss = ({
  "aria-label": ariaLabel = "Dismiss",
  className,
  onPress,
  ...rest
}: ApprovalCardDismissProps) => {
  const {dismiss, slots} = useApprovalCardContext("Dismiss");
  const resolvedClassName = useResolvedClassName(className, slots.dismiss());

  return (
    <CloseButton
      aria-label={ariaLabel}
      {...rest}
      className={resolvedClassName}
      data-slot="approval-card-dismiss"
      onPress={(event) => {
        onPress?.(event);
        dismiss();
      }}
    />
  );
};

ApprovalCardDismiss.displayName = "HeroUI.ApprovalCard.Dismiss";

/* -------------------------------------------------------------------------------------------------
 * Content (tab panel while Steps is placed)
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardContentProps extends ComponentPropsWithRef<"div"> {}

const ApprovalCardContent = ({className, ref, ...rest}: ApprovalCardContentProps) => {
  const {hasSteps, isSwapped, question, slots, stepsId} = useApprovalCardContext("Content");
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(setElement, ref), [ref]);
  const hasTabbableChild = useHasTabbableChild(element, hasSteps);
  const key = question?.id ?? "";

  const panelProps = hasSteps
    ? {
        "aria-labelledby": tabElementId(stepsId, key, "tab"),
        id: tabElementId(stepsId, key, "tabpanel"),
        role: "tabpanel",
        tabIndex: hasTabbableChild ? undefined : 0,
      }
    : {tabIndex: -1};

  return (
    <div
      // Remount per question so the enter transition (`@starting-style`) replays.
      key={question?.id}
      ref={mergedRef}
      {...panelProps}
      className={slots.content({className})}
      data-slot="approval-card-content"
      data-swapped={isSwapped || undefined}
      {...rest}
    />
  );
};

ApprovalCardContent.displayName = "HeroUI.ApprovalCard.Content";

/* -------------------------------------------------------------------------------------------------
 * Options (OSS RadioGroup / CheckboxGroup)
 * -----------------------------------------------------------------------------------------------*/
type RadioGroupProps = ComponentPropsWithRef<typeof RadioGroup>;
type CheckboxGroupProps = ComponentPropsWithRef<typeof CheckboxGroup>;

interface ApprovalCardOptionsProps extends Omit<
  RadioGroupProps,
  "children" | "className" | "defaultValue" | "onChange" | "render" | "style" | "validate" | "value"
> {
  /** Option elements, or a function that renders one for each option of the shown question. */
  children?: ReactNode | ((option: ApprovalCardOptionItem) => ReactNode);
  className?: string;
  style?: CSSProperties;
}

const OPTION_LIST_STYLE = {
  "--scroll-shadow-size": "var(--approval-card-fade-size)",
} as CSSProperties;

const ApprovalCardOptions = ({
  children,
  className,
  style,
  variant = "secondary",
  ...rest
}: ApprovalCardOptionsProps) => {
  const {hasTitle, question, setSelected, slots, titleId, value} =
    useApprovalCardContext("Options");

  if (!question?.options?.length) return null;

  const selected = value[question.id]?.selected ?? [];
  const options = question.options;
  const items =
    typeof children === "function"
      ? options.map((option) => <Fragment key={option.id}>{children(option)}</Fragment>)
      : (children ??
        options.map((option) => <ApprovalCardOption key={option.id} value={option.id} />));

  const labelProps =
    rest["aria-label"] || rest["aria-labelledby"]
      ? {}
      : hasTitle
        ? {"aria-labelledby": titleId}
        : {"aria-label": question.title};

  const list = (
    <ScrollShadow
      className={slots.optionList()}
      data-slot="approval-card-option-list"
      style={OPTION_LIST_STYLE}
    >
      {items}
    </ScrollShadow>
  );

  if (question.selectionMode === "multiple") {
    return (
      <CheckboxGroup
        {...labelProps}
        {...(rest as Omit<CheckboxGroupProps, "children">)}
        className={slots.options({className})}
        data-slot="approval-card-options"
        style={style}
        value={selected}
        variant={variant}
        onChange={setSelected}
      >
        {list}
      </CheckboxGroup>
    );
  }

  return (
    <RadioGroup
      {...labelProps}
      {...rest}
      className={slots.options({className})}
      data-slot="approval-card-options"
      style={style}
      value={selected[0] ?? null}
      variant={variant}
      onChange={(next) => setSelected([next])}
    >
      {list}
    </RadioGroup>
  );
};

ApprovalCardOptions.displayName = "HeroUI.ApprovalCard.Options";

/* -------------------------------------------------------------------------------------------------
 * Option (OSS Radio / Checkbox)
 * -----------------------------------------------------------------------------------------------*/
type RadioProps = ComponentPropsWithRef<typeof Radio>;
type CheckboxProps = ComponentPropsWithRef<typeof Checkbox>;

interface ApprovalCardOptionProps extends Omit<
  RadioProps,
  "children" | "className" | "render" | "style" | "value"
> {
  /** Id of an option of the current question. */
  value: string;
  /** Replaces the label; the control and the description stay. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const ApprovalCardOption = ({
  children,
  className,
  style,
  value: optionId,
  ...rest
}: ApprovalCardOptionProps) => {
  const {question, slots} = useApprovalCardContext("Option");
  const item = question?.options?.find((option) => option.id === optionId);
  const label = children ?? item?.label ?? optionId;
  const description = item?.description ? (
    <Description className={slots.optionDescription()}>{item.description}</Description>
  ) : null;
  const labelNode = (
    <span className={slots.optionLabel()} data-slot="approval-card-option-label">
      {label}
    </span>
  );

  if (question?.selectionMode === "multiple") {
    return (
      <Checkbox
        {...(rest as Omit<CheckboxProps, "children">)}
        className={slots.option({className})}
        data-slot="approval-card-option"
        style={style}
        value={optionId}
      >
        <Checkbox.Content className={slots.optionContent()}>
          <Checkbox.Control className={slots.optionControl()}>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {labelNode}
        </Checkbox.Content>
        {description}
      </Checkbox>
    );
  }

  return (
    <Radio
      {...rest}
      className={slots.option({className})}
      data-slot="approval-card-option"
      style={style}
      value={optionId}
    >
      <Radio.Content className={slots.optionContent()}>
        <Radio.Control className={slots.optionControl()}>
          <Radio.Indicator />
        </Radio.Control>
        {labelNode}
      </Radio.Content>
      {description}
    </Radio>
  );
};

ApprovalCardOption.displayName = "HeroUI.ApprovalCard.Option";

/* -------------------------------------------------------------------------------------------------
 * Custom input (OSS Input)
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardCustomInputProps extends Omit<
  ComponentPropsWithRef<typeof Input>,
  "defaultValue" | "value"
> {}

const ApprovalCardCustomInput = ({
  "aria-label": ariaLabel = "Other answer",
  className,
  onChange,
  placeholder = "Something else…",
  variant = "secondary",
  ...rest
}: ApprovalCardCustomInputProps) => {
  const {question, setCustom, slots, value} = useApprovalCardContext("CustomInput");
  const resolvedClassName = useResolvedClassName(className, slots.customInput());

  if (!question?.allowCustom) return null;

  return (
    <Input
      aria-label={ariaLabel}
      placeholder={placeholder}
      variant={variant}
      {...rest}
      className={resolvedClassName}
      data-slot="approval-card-custom-input"
      value={value[question.id]?.custom ?? ""}
      onChange={(event) => {
        onChange?.(event);
        setCustom(event.target.value);
      }}
    />
  );
};

ApprovalCardCustomInput.displayName = "HeroUI.ApprovalCard.CustomInput";

/* -------------------------------------------------------------------------------------------------
 * Steps (tab list of dots)
 * -----------------------------------------------------------------------------------------------*/
interface StepsWindow {
  start: number;
  end: number;
}

const StepsWindowContext = createContext<StepsWindow | null>(null);

interface ApprovalCardStepsProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Step elements, or a function that renders one for each question. */
  children?: ReactNode | ((renderProps: ApprovalCardStepRenderProps) => ReactNode);
  /** Dots shown at once; past it, the window follows the current question. @default 7 */
  maxVisible?: number;
}

const ApprovalCardSteps = ({
  "aria-label": ariaLabel = "Questions",
  children,
  className,
  maxVisible = 7,
  onKeyDown,
  ...rest
}: ApprovalCardStepsProps) => {
  const {goToStep, isQuestionAnswered, questions, registerSteps, slots, step, stepsId, total} =
    useApprovalCardContext("Steps");
  const {direction} = useLocale();

  useLayoutEffect(() => registerSteps(), [registerSteps]);

  const visibleRange = useMemo<StepsWindow>(() => {
    const visible = Math.max(1, Math.floor(maxVisible));

    if (total <= visible) return {end: total - 1, start: 0};

    const start = Math.min(Math.max(step - Math.floor(visible / 2), 0), total - visible);

    return {end: start + visible - 1, start};
  }, [maxVisible, step, total]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || total === 0) return;
    if (!(event.target as HTMLElement).closest?.('[role="tab"]')) return;

    const next = (step + 1) % total;
    const previous = (step - 1 + total) % total;
    const isRtl = direction === "rtl";
    let target: number | null = null;

    if (event.key === "ArrowRight") target = isRtl ? previous : next;
    else if (event.key === "ArrowLeft") target = isRtl ? next : previous;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = total - 1;

    if (target === null) return;
    event.preventDefault();
    goToStep(target, {focusStep: true});
  };

  const items =
    typeof children === "function"
      ? questions.map((question, index) => (
          <Fragment key={question.id}>
            {children({index, isAnswered: isQuestionAnswered(question), question})}
          </Fragment>
        ))
      : (children ??
        questions.map((question) => <ApprovalCardStep key={question.id} id={question.id} />));

  return (
    <StepsWindowContext value={visibleRange}>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- arrow keys bubble up from the role="tab" steps (roving tabindex); like React Aria Tabs, the tablist itself is not a tab stop */}
      <div
        {...rest}
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        className={slots.steps({className})}
        data-single={total === 1 || undefined}
        data-slot="approval-card-steps"
        id={stepsId}
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {items}
      </div>
    </StepsWindowContext>
  );
};

ApprovalCardSteps.displayName = "HeroUI.ApprovalCard.Steps";

/* -------------------------------------------------------------------------------------------------
 * Step (one dot)
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardStepProps extends Omit<ComponentPropsWithRef<"div">, "children" | "id"> {
  /** Id of the question. */
  id: string;
}

const ApprovalCardStep = ({
  "aria-label": ariaLabel,
  className,
  id,
  ref,
  ...rest
}: ApprovalCardStepProps) => {
  const {goToStep, isQuestionAnswered, questions, slots, step, stepFocusRef, stepsId} =
    useApprovalCardContext("Step");
  const visibleRange = use(StepsWindowContext);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergedRef(ref, elementRef);

  const index = questions.findIndex((question) => question.id === id);
  const question = questions[index];
  const isCurrent = index === step;
  const answered = question ? isQuestionAnswered(question) : false;
  const isHidden = !!visibleRange && (index < visibleRange.start || index > visibleRange.end);
  const isEdge =
    !!visibleRange &&
    !isCurrent &&
    ((index === visibleRange.start && visibleRange.start > 0) ||
      (index === visibleRange.end && visibleRange.end < questions.length - 1));

  const {pressProps} = usePress({
    onPress: (event) => {
      if (event.pointerType !== "mouse") goToStep(index);
    },
    onPressStart: (event) => {
      if (event.pointerType === "mouse") goToStep(index);
    },
    ref: elementRef,
  });
  const {hoverProps, isHovered} = useHover({});
  const {focusProps, isFocusVisible} = useFocusRing();

  // Arrow keys move selection and focus together.
  useLayoutEffect(() => {
    if (!isCurrent || stepFocusRef.current !== id) return;
    stepFocusRef.current = null;
    elementRef.current?.focus();
  }, [id, isCurrent, stepFocusRef]);

  if (!question) return null;

  return (
    <div
      aria-label={ariaLabel ?? `Question ${index + 1}, ${answered ? "answered" : "not answered"}`}
      data-key={id}
      tabIndex={isCurrent ? 0 : -1}
      {...mergeProps(pressProps, hoverProps, focusProps, rest)}
      ref={mergedRef}
      aria-controls={isCurrent ? tabElementId(stepsId, id, "tabpanel") : undefined}
      aria-selected={isCurrent}
      className={slots.step({className})}
      data-answered={answered || undefined}
      data-current={isCurrent || undefined}
      data-edge={isEdge || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-hidden={isHidden || undefined}
      data-hovered={isHovered || undefined}
      data-slot="approval-card-step"
      id={tabElementId(stepsId, id, "tab")}
      role="tab"
    />
  );
};

ApprovalCardStep.displayName = "HeroUI.ApprovalCard.Step";

/* -------------------------------------------------------------------------------------------------
 * Step count ("2/3")
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardStepCountProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Replaces the announced "Question 2 of 3"; the visible "2/3" stays. */
  children?: ReactNode | ((renderProps: ApprovalCardStepCountRenderProps) => ReactNode);
}

const ApprovalCardStepCount = ({children, className, ...rest}: ApprovalCardStepCountProps) => {
  const {slots, step, total} = useApprovalCardContext("StepCount");
  const current = Math.min(step + 1, total);
  const announcement =
    typeof children === "function"
      ? children({current, total})
      : (children ?? `Question ${current} of ${total}`);

  return (
    <div
      className={slots.stepCount({className})}
      data-single={total === 1 || undefined}
      data-slot="approval-card-step-count"
      {...rest}
    >
      <span aria-hidden="true">
        <span className={slots.stepCountCurrent()} data-slot="approval-card-step-count-current">
          {current}
        </span>
        /{total}
      </span>
      <VisuallyHidden aria-atomic="true" aria-live="polite">
        {announcement}
      </VisuallyHidden>
    </div>
  );
};

ApprovalCardStepCount.displayName = "HeroUI.ApprovalCard.StepCount";

/* -------------------------------------------------------------------------------------------------
 * Skipped count ("N skipped", last question only)
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardSkippedCountProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Replaces the default "N skipped". */
  children?: ReactNode | ((renderProps: ApprovalCardSkippedCountRenderProps) => ReactNode);
}

const ApprovalCardSkippedCount = ({
  children,
  className,
  ...rest
}: ApprovalCardSkippedCountProps) => {
  const {isLastStep, isSwapped, skippedCount, slots} = useApprovalCardContext("SkippedCount");

  return (
    <div
      className={slots.skippedCount({className})}
      data-empty={skippedCount === 0 || undefined}
      data-last-step={isLastStep || undefined}
      data-slot="approval-card-skipped-count"
      data-swapped={isSwapped || undefined}
      {...rest}
    >
      {typeof children === "function"
        ? children({count: skippedCount})
        : (children ?? `${skippedCount} skipped`)}
    </div>
  );
};

ApprovalCardSkippedCount.displayName = "HeroUI.ApprovalCard.SkippedCount";

/* -------------------------------------------------------------------------------------------------
 * Skip (OSS Button, ghost)
 * -----------------------------------------------------------------------------------------------*/
type ButtonProps = ComponentPropsWithRef<typeof Button>;

interface ApprovalCardSkipProps extends ButtonProps {}

const ApprovalCardSkip = ({
  children,
  className,
  onPress,
  size = "sm",
  variant = "ghost",
  ...rest
}: ApprovalCardSkipProps) => {
  const {question, skipStep, slots} = useApprovalCardContext("Skip");
  const resolvedClassName = useResolvedClassName(className, slots.skip());

  if (question?.allowSkip === false) return null;

  return (
    <Button
      size={size}
      variant={variant}
      {...rest}
      className={resolvedClassName}
      data-slot="approval-card-skip"
      onPress={(event) => {
        onPress?.(event);
        skipStep();
      }}
    >
      {children ?? "Skip"}
    </Button>
  );
};

ApprovalCardSkip.displayName = "HeroUI.ApprovalCard.Skip";

/* -------------------------------------------------------------------------------------------------
 * Continue (OSS Button, primary) - "Continue", or "Send" on the last question
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardContinueProps extends Omit<ButtonProps, "children"> {
  /** Replaces "Continue" and "Send". */
  children?: ReactNode | ((renderProps: ApprovalCardContinueRenderProps) => ReactNode);
}

const defaultContinueLabel = ({isLastStep}: ApprovalCardContinueRenderProps) =>
  isLastStep ? "Send" : "Continue";

const ApprovalCardContinue = ({
  children,
  className,
  isDisabled,
  onPress,
  size = "sm",
  variant = "primary",
  ...rest
}: ApprovalCardContinueProps) => {
  const {canContinue, isLastStep, isSwapped, slots, submitStep} =
    useApprovalCardContext("Continue");
  const resolvedClassName = useResolvedClassName(className, slots.continue());

  let content: ReactNode;

  if (children === undefined || typeof children === "function") {
    const renderLabel = typeof children === "function" ? children : defaultContinueLabel;
    const label = renderLabel({isLastStep});
    const reserve = renderLabel({isLastStep: !isLastStep});

    content =
      isTextLike(label) && isTextLike(reserve) ? (
        <span
          // Remount when the label flips so the enter transition replays.
          key={isLastStep ? "last" : "next"}
          className={slots.continueLabel()}
          data-reserve={String(reserve)}
          data-slot="approval-card-continue-label"
          data-swapped={isSwapped || undefined}
        >
          {label}
        </span>
      ) : (
        label
      );
  } else {
    content = children;
  }

  return (
    <Button
      size={size}
      variant={variant}
      {...rest}
      className={resolvedClassName}
      data-slot="approval-card-continue"
      isDisabled={isDisabled || !canContinue}
      onPress={(event) => {
        onPress?.(event);
        submitStep();
      }}
    >
      {content}
    </Button>
  );
};

ApprovalCardContinue.displayName = "HeroUI.ApprovalCard.Continue";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ApprovalCardRoot,
  ApprovalCardHeader,
  ApprovalCardTitle,
  ApprovalCardDismiss,
  ApprovalCardContent,
  ApprovalCardOptions,
  ApprovalCardOption,
  ApprovalCardCustomInput,
  ApprovalCardFooter,
  ApprovalCardSteps,
  ApprovalCardStep,
  ApprovalCardStepCount,
  ApprovalCardSkippedCount,
  ApprovalCardActions,
  ApprovalCardSkip,
  ApprovalCardContinue,
};

export type {
  ApprovalCardRootProps,
  ApprovalCardHeaderProps,
  ApprovalCardTitleProps,
  ApprovalCardDismissProps,
  ApprovalCardContentProps,
  ApprovalCardOptionsProps,
  ApprovalCardOptionProps,
  ApprovalCardCustomInputProps,
  ApprovalCardFooterProps,
  ApprovalCardStepsProps,
  ApprovalCardStepProps,
  ApprovalCardStepCountProps,
  ApprovalCardSkippedCountProps,
  ApprovalCardActionsProps,
  ApprovalCardSkipProps,
  ApprovalCardContinueProps,
  ApprovalCardSubmitResult,
  ApprovalCardSkippedCountRenderProps,
  ApprovalCardStepRenderProps,
  ApprovalCardStepCountRenderProps,
  ApprovalCardContinueRenderProps,
};
