import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import React, {useEffect, useState} from "react";

import {NumberPad} from "./index";

const meta = {
  argTypes: {
    animation: {control: {type: "select"}, options: [undefined, "disable-all"]},
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {control: "boolean"},
    maxLength: {control: {min: 1, step: 1, type: "number"}},
  },
  component: NumberPad,
  parameters: {layout: "centered"},
  title: "Pro/Forms/NumberPad",
} satisfies Meta<typeof NumberPad>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/

/** Phone-width column, like the Native demo screen (20px side padding). */
const Column = ({children}: {children: ReactNode}) => (
  <div className="flex w-[390px] max-w-full flex-col gap-6 px-5">{children}</div>
);

const Readout = ({
  hint,
  placeholder = "0",
  value,
}: {
  hint?: ReactNode;
  placeholder?: string;
  value: string;
}) => (
  <div className="flex flex-col items-center gap-1">
    <output
      aria-live="polite"
      className={`text-3xl font-semibold tabular-nums ${value ? "text-foreground" : "text-muted"}`}
    >
      {value || placeholder}
    </output>
    {hint ? <span className="text-xs text-muted">{hint}</span> : null}
  </div>
);

const FingerprintIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="28"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="28"
  >
    <path d="M4.8 6.2a9.2 9.2 0 0 1 14.4 0" />
    <path d="M6.4 8.6a6.6 6.6 0 0 1 12.2 3.5v1.4c0 1.5-.2 2.9-.6 4.2" />
    <path d="M5.5 11.6v1.6c0 2-.4 3.8-1.2 5.4" />
    <path d="M8.6 11.8a3.4 3.4 0 0 1 6.8.3v1.6c0 2.6-.6 5-1.8 7" />
    <path d="M8.6 14.4c0 1.9-.5 3.7-1.4 5.2" />
    <path d="M12 12.2v1.8c0 2.4-.6 4.6-1.7 6.5" />
  </svg>
);

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

/* -------------------------------------------------------------------------------------------------
 * Basic usage: the default 3 x 4 keypad (children omitted)
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {"aria-label": "Quantity"},
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <Column>
        <Readout hint="Type with the keypad or your keyboard" value={value} />
        <NumberPad {...args} value={value} onValueChange={setValue} />
      </Column>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Manual composition: explicit rows; a decimal key replaces the spacer
 * -----------------------------------------------------------------------------------------------*/
const formatAmount = (next: string) => {
  // One decimal separator, at most two decimals, no leading zeros.
  const [whole = "", ...fractions] = next.split(".");
  const fraction = fractions.join("").slice(0, 2);
  const integer = whole.replace(/^0+(?=\d)/, "");

  return next.includes(".") ? `${integer || "0"}.${fraction}` : integer;
};

export const ManualComposition: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <Column>
        <Readout hint="Tip amount" placeholder="$0" value={value ? `$${value}` : ""} />
        <NumberPad
          aria-label="Tip amount"
          value={value}
          onValueChange={(next) => setValue(formatAmount(next))}
        >
          {DIGIT_ROWS.map((row) => (
            <NumberPad.Row key={row.join("")}>
              {row.map((digit) => (
                <NumberPad.Key key={digit} value={digit} />
              ))}
            </NumberPad.Row>
          ))}
          <NumberPad.Row>
            <NumberPad.Key aria-label="Decimal point" value="." />
            <NumberPad.Key value="0" />
            <NumberPad.Backspace />
          </NumberPad.Row>
        </NumberPad>
      </Column>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Max length: a 6-digit verification code with onComplete
 * -----------------------------------------------------------------------------------------------*/
const VALID_CODE = "314159";

export const MaxLength: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");

    useEffect(() => {
      if (status !== "checking") return;

      const timer = setTimeout(() => {
        setStatus(value === VALID_CODE ? "valid" : "invalid");
        if (value !== VALID_CODE) setValue("");
      }, 700);

      return () => clearTimeout(timer);
    }, [status, value]);

    const hint = {
      checking: "Checking code…",
      idle: `Enter the 6-digit code we texted you (try ${VALID_CODE})`,
      invalid: "That code did not match. Try again.",
      valid: "Code confirmed",
    }[status];

    return (
      <Column>
        <div className="flex flex-col items-center gap-2">
          <div aria-hidden="true" className="flex gap-2">
            {Array.from({length: 6}, (_, index) => (
              <span
                key={index}
                className={`flex h-12 w-10 items-center justify-center rounded-xl text-xl font-semibold tabular-nums ${
                  status === "valid" ? "bg-success-soft text-success" : "bg-default text-foreground"
                }`}
              >
                {value[index] ?? ""}
              </span>
            ))}
          </div>
          <span
            aria-live="polite"
            className={`text-xs ${status === "invalid" ? "text-danger" : "text-muted"}`}
          >
            {hint}
          </span>
        </div>
        <NumberPad
          aria-label="Verification code"
          isDisabled={status === "checking" || status === "valid"}
          maxLength={6}
          value={value}
          onComplete={() => setStatus("checking")}
          onValueChange={(next) => {
            setValue(next);
            setStatus("idle");
          }}
        />
      </Column>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Custom key content: render function with the pressed state
 * -----------------------------------------------------------------------------------------------*/
const AccentKey = ({digit}: {digit: string}) => (
  <NumberPad.Key className="data-[pressed=true]:bg-accent" value={digit}>
    {({isPressed}) => (
      <NumberPad.KeyLabel className={isPressed ? "text-accent-foreground" : "text-foreground"}>
        {digit}
      </NumberPad.KeyLabel>
    )}
  </NumberPad.Key>
);

export const CustomKeyContent: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <Column>
        <Readout hint="Room number" value={value} />
        <NumberPad aria-label="Room number" maxLength={4} value={value} onValueChange={setValue}>
          {DIGIT_ROWS.map((row) => (
            <NumberPad.Row key={row.join("")}>
              {row.map((digit) => (
                <AccentKey key={digit} digit={digit} />
              ))}
            </NumberPad.Row>
          ))}
          <NumberPad.Row>
            <NumberPad.Spacer />
            <AccentKey digit="0" />
            <NumberPad.Backspace />
          </NumberPad.Row>
        </NumberPad>
      </Column>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Spacer action: the bottom-left cell becomes a biometric shortcut
 * -----------------------------------------------------------------------------------------------*/
export const SpacerAction: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [message, setMessage] = useState("Enter your passcode");

    return (
      <Column>
        <Readout
          hint={<span aria-live="polite">{message}</span>}
          placeholder="••••••"
          value={"•".repeat(value.length)}
        />
        <NumberPad
          aria-label="Passcode"
          maxLength={6}
          value={value}
          onComplete={() => setMessage("Passcode entered")}
          onSpacerPress={() => {
            setValue("");
            setMessage("Unlocked with fingerprint");
          }}
          onValueChange={(next) => {
            setValue(next);
            setMessage("Enter your passcode");
          }}
        >
          {DIGIT_ROWS.map((row) => (
            <NumberPad.Row key={row.join("")}>
              {row.map((digit) => (
                <NumberPad.Key key={digit} value={digit} />
              ))}
            </NumberPad.Row>
          ))}
          <NumberPad.Row>
            <NumberPad.Spacer aria-label="Unlock with fingerprint">
              <FingerprintIcon />
            </NumberPad.Spacer>
            <NumberPad.Key value="0" />
            <NumberPad.Backspace />
          </NumberPad.Row>
        </NumberPad>
      </Column>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
export const Disabled: Story = {
  render: () => (
    <Column>
      <Readout hint="Keypad locked" value="5678" />
      <NumberPad isDisabled aria-label="Locked keypad" defaultValue="5678" />
    </Column>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example: PIN entry screen (phone frame, like the Native demo)
 * -----------------------------------------------------------------------------------------------*/
const PIN_LENGTH = 4;

export const Example: Story = {
  parameters: {layout: "centered"},
  render: () => {
    const [value, setValue] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    return (
      <div className="relative flex h-[780px] w-[390px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[2.75rem] border border-separator bg-background px-5">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col items-center gap-1">
            <span
              aria-hidden="true"
              className="text-center text-2xl font-semibold tracking-[0.4em] text-foreground"
            >
              {value.padEnd(PIN_LENGTH, "•")}
            </span>
            <span aria-live="polite" className="text-xs text-muted">
              {isComplete
                ? "Passcode saved"
                : `Choose a ${PIN_LENGTH}-digit passcode (${value.length} of ${PIN_LENGTH})`}
            </span>
          </div>
          <NumberPad
            aria-label="Passcode"
            maxLength={PIN_LENGTH}
            value={value}
            onComplete={() => setIsComplete(true)}
            onValueChange={(next) => {
              setValue(next);
              setIsComplete(false);
            }}
          />
        </div>
      </div>
    );
  },
};
