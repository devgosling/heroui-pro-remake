"use client";

import type {NativeSelectVariants} from "./native-select.styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {ValidationResult} from "react-aria-components/FieldError";

import {
  Children,
  createContext,
  isValidElement,
  use,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {FieldErrorContext} from "react-aria-components/FieldError";
import {LabelContext} from "react-aria-components/Label";
import {Provider} from "react-aria-components/slots";
import {TextContext} from "react-aria-components/Text";
import {cx} from "tailwind-variants";

import {nativeSelectVariants} from "./native-select.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const EMPTY_ERRORS: string[] = [];

/** Same shape React Aria uses for a field that is (in)valid without native constraint data. */
const createValidityState = (isInvalid: boolean): ValidityState => ({
  badInput: false,
  customError: isInvalid,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: !isInvalid,
  valueMissing: false,
});

/**
 * Returns a stable id for a slot element and, separately, that id only once an element with it is
 * mounted, so `aria-describedby` never points at a missing Description / FieldError.
 */
const useSlotId = (): [id: string, mountedId: string | undefined] => {
  const id = useId();
  const [isMounted, setIsMounted] = useState(false);

  // Runs after every commit: the slot element may mount or unmount with any render of the field.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally dep-less: re-checks the DOM after every commit; the updater bails out when unchanged, so it cannot loop
  useLayoutEffect(() => {
    const next = document.getElementById(id) !== null;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs state with a DOM measurement (is the slot element mounted?)
    setIsMounted((prev) => (prev === next ? prev : next));
  });

  return [id, isMounted ? id : undefined];
};

/* -------------------------------------------------------------------------------------------------
 * Native Select Context
 * -----------------------------------------------------------------------------------------------*/
type NativeSelectContext = {
  slots?: ReturnType<typeof nativeSelectVariants>;
  /** Whether the field is invalid (sets `aria-invalid` on the select). */
  isInvalid?: boolean;
  /** Id the Label points at (`htmlFor`); the Trigger puts it on the `<select>`. */
  selectId?: string;
  /** Ids of the mounted Description / FieldError, for `aria-describedby`. */
  describedBy?: string;
  /** Lets the Trigger report a custom `id` so the Label still points at the select. */
  setCustomSelectId?: (id: string | undefined) => void;
};

const NativeSelectContext = createContext<NativeSelectContext>({});

/* -------------------------------------------------------------------------------------------------
 * Native Select Root
 * -----------------------------------------------------------------------------------------------*/
interface NativeSelectRootProps extends ComponentPropsWithRef<"div">, NativeSelectVariants {
  /** Whether the select is invalid. Shows FieldError, hides Description and applies error styling. */
  isInvalid?: boolean;
  /** Error messages rendered by FieldError when it has no children. */
  validationErrors?: string[];
  /** Native validity details passed to FieldError render props. */
  validationDetails?: ValidityState;
  /** Trigger, Label, Description and FieldError elements. */
  children?: ReactNode;
}

const NativeSelectRoot = ({
  children,
  className,
  fullWidth,
  isInvalid = false,
  validationDetails,
  validationErrors,
  variant,
  ...rest
}: NativeSelectRootProps) => {
  const slots = useMemo(() => nativeSelectVariants({fullWidth, variant}), [fullWidth, variant]);

  const generatedSelectId = useId();
  const [customSelectId, setCustomSelectId] = useState<string>();
  const selectId = customSelectId ?? generatedSelectId;

  const [descriptionId, mountedDescriptionId] = useSlotId();
  const [errorMessageId, mountedErrorMessageId] = useSlotId();

  const describedBy =
    [mountedDescriptionId, mountedErrorMessageId].filter(Boolean).join(" ") || undefined;

  const contextValue = useMemo<NativeSelectContext>(
    () => ({describedBy, isInvalid, selectId, setCustomSelectId, slots}),
    [describedBy, isInvalid, selectId, slots],
  );

  const labelContextValue = useMemo(() => ({htmlFor: selectId}), [selectId]);

  const textContextValue = useMemo(
    () => ({slots: {description: {id: descriptionId}, errorMessage: {id: errorMessageId}}}),
    [descriptionId, errorMessageId],
  );

  const validation = useMemo<ValidationResult>(
    () => ({
      isInvalid,
      validationDetails: validationDetails ?? createValidityState(isInvalid),
      validationErrors: validationErrors ?? EMPTY_ERRORS,
    }),
    [isInvalid, validationDetails, validationErrors],
  );

  return (
    <NativeSelectContext value={contextValue}>
      <Provider
        values={[
          [LabelContext, labelContextValue],
          [TextContext, textContextValue],
          [FieldErrorContext, validation],
        ]}
      >
        <div
          {...rest}
          className={cx(slots.base(), className)}
          data-invalid={isInvalid ? "true" : undefined}
          data-slot="native-select"
        >
          {children}
        </div>
      </Provider>
    </NativeSelectContext>
  );
};

NativeSelectRoot.displayName = "HeroUI.NativeSelect";

/* -------------------------------------------------------------------------------------------------
 * Native Select Indicator
 * -----------------------------------------------------------------------------------------------*/
interface NativeSelectIndicatorProps extends ComponentPropsWithRef<"span"> {
  /** Custom indicator icon. Defaults to a down chevron. */
  children?: ReactNode;
}

/** Chevron-down glyph (geometry from Lucide, ISC License, https://lucide.dev). */
const ChevronDownIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const NativeSelectIndicator = ({children, className, ...rest}: NativeSelectIndicatorProps) => {
  const {slots} = use(NativeSelectContext);
  const indicatorClassName = slots?.indicator() ?? nativeSelectVariants().indicator();

  return (
    <span
      aria-hidden="true"
      {...rest}
      className={cx(indicatorClassName, className)}
      data-slot="native-select-indicator"
    >
      {children ?? <ChevronDownIcon />}
    </span>
  );
};

NativeSelectIndicator.displayName = "HeroUI.NativeSelect.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Native Select Trigger
 * -----------------------------------------------------------------------------------------------*/
interface NativeSelectTriggerProps extends ComponentPropsWithRef<"select"> {
  /** Additional CSS class applied to the `<select>` element. */
  className?: string;
  /** Additional CSS class applied to the wrapper `<div>`. */
  wrapperClassName?: string;
  /** Option, OptGroup and Indicator elements. */
  children?: ReactNode;
}

const NativeSelectTrigger = ({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  children,
  className,
  id,
  wrapperClassName,
  ...rest
}: NativeSelectTriggerProps) => {
  const {describedBy, isInvalid, selectId, setCustomSelectId, slots} = use(NativeSelectContext);
  const resolvedSlots = slots ?? nativeSelectVariants();

  // Keep the Label pointing at the select when a custom id is passed here.
  useLayoutEffect(() => {
    if (!setCustomSelectId || id === undefined) return;
    setCustomSelectId(id);

    return () => setCustomSelectId(undefined);
  }, [id, setCustomSelectId]);

  // Options / groups go inside the <select>; indicators are rendered next to it.
  const {indicators, options} = useMemo(() => {
    const indicatorNodes: ReactNode[] = [];
    const optionNodes: ReactNode[] = [];

    // toArray keys the children, so the split arrays keep stable identities
    Children.toArray(children).forEach((child) => {
      if (isValidElement(child) && child.type === NativeSelectIndicator) {
        indicatorNodes.push(child);
      } else {
        optionNodes.push(child);
      }
    });

    return {indicators: indicatorNodes, options: optionNodes};
  }, [children]);

  return (
    <div
      className={cx(resolvedSlots.trigger(), wrapperClassName)}
      data-slot="native-select-trigger"
    >
      <select
        {...rest}
        aria-describedby={[describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined}
        aria-invalid={isInvalid ? true : ariaInvalid}
        className={cx(resolvedSlots.select(), className)}
        data-slot="native-select-select"
        id={id ?? selectId}
      >
        {options}
      </select>
      {indicators}
    </div>
  );
};

NativeSelectTrigger.displayName = "HeroUI.NativeSelect.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Native Select Option
 * -----------------------------------------------------------------------------------------------*/
interface NativeSelectOptionProps extends ComponentPropsWithRef<"option"> {
  /** Option label text. */
  children?: ReactNode;
}

const NativeSelectOption = ({children, ...rest}: NativeSelectOptionProps) => (
  <option data-slot="native-select-option" {...rest}>
    {children}
  </option>
);

NativeSelectOption.displayName = "HeroUI.NativeSelect.Option";

/* -------------------------------------------------------------------------------------------------
 * Native Select OptGroup
 * -----------------------------------------------------------------------------------------------*/
interface NativeSelectOptGroupProps extends ComponentPropsWithRef<"optgroup"> {
  /** Option elements. */
  children?: ReactNode;
}

const NativeSelectOptGroup = ({children, ...rest}: NativeSelectOptGroupProps) => (
  <optgroup data-slot="native-select-optgroup" {...rest}>
    {children}
  </optgroup>
);

NativeSelectOptGroup.displayName = "HeroUI.NativeSelect.OptGroup";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  NativeSelectRoot,
  NativeSelectTrigger,
  NativeSelectIndicator,
  NativeSelectOption,
  NativeSelectOptGroup,
  NativeSelectContext,
};

export type {
  NativeSelectRootProps,
  NativeSelectTriggerProps,
  NativeSelectIndicatorProps,
  NativeSelectOptionProps,
  NativeSelectOptGroupProps,
};
