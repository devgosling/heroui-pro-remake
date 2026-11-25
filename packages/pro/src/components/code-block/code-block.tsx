"use client";

import type {ButtonProps} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Button} from "@heroui/react";
import {createContext, use, useCallback, useEffect, useMemo, useRef, useState} from "react";

import {codeBlockVariants} from "./code-block.styles";
import {DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, useHighlightedCode} from "./use-highlighted-code";

/* -------------------------------------------------------------------------------------------------
 * CodeBlock Context
 * -----------------------------------------------------------------------------------------------*/
type CodeBlockContext = {
  slots?: ReturnType<typeof codeBlockVariants>;
};

const CodeBlockContext = createContext<CodeBlockContext>({});

/** Parts can also be rendered on their own (e.g. a lone CopyButton), so fall back to fresh slots. */
const useSlots = () => use(CodeBlockContext).slots ?? codeBlockVariants();

/* -------------------------------------------------------------------------------------------------
 * CodeBlock Root
 * -----------------------------------------------------------------------------------------------*/
interface CodeBlockRootProps extends ComponentPropsWithRef<"div"> {}

const CodeBlockRoot = ({children, className, ...rest}: CodeBlockRootProps) => {
  const slots = useMemo(() => codeBlockVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <CodeBlockContext value={contextValue}>
      <div className={slots.base({className})} data-slot="code-block" {...rest}>
        {children}
      </div>
    </CodeBlockContext>
  );
};

CodeBlockRoot.displayName = "HeroUI.CodeBlock";

/* -------------------------------------------------------------------------------------------------
 * CodeBlock Header
 * -----------------------------------------------------------------------------------------------*/
interface CodeBlockHeaderProps extends ComponentPropsWithRef<"div"> {}

const CodeBlockHeader = ({children, className, ...rest}: CodeBlockHeaderProps) => {
  const slots = useSlots();

  return (
    <div className={slots.header({className})} data-slot="code-block-header" {...rest}>
      {children}
    </div>
  );
};

CodeBlockHeader.displayName = "HeroUI.CodeBlock.Header";

/* -------------------------------------------------------------------------------------------------
 * CodeBlock Code
 * -----------------------------------------------------------------------------------------------*/
interface CodeBlockCodeProps extends Omit<
  ComponentPropsWithRef<"div">,
  "children" | "dangerouslySetInnerHTML"
> {
  /** Code to render. */
  code: string;
  /** Shiki language id. Unknown ids render as plain text. */
  language?: string;
  /** Shiki theme (used in light mode). */
  theme?: string;
  /** Shiki theme used in dark mode. */
  darkTheme?: string;
}

const CodeBlockCode = ({
  className,
  code,
  darkTheme = DEFAULT_DARK_THEME,
  language = "plaintext",
  theme = DEFAULT_LIGHT_THEME,
  ...rest
}: CodeBlockCodeProps) => {
  const slots = useSlots();
  const html = useHighlightedCode(code, language, theme, darkTheme);
  const resolvedClassName = slots.code({className});

  if (html === undefined) {
    // Plain text until shiki has loaded (same box metrics as the highlighted markup).
    return (
      <div className={resolvedClassName} data-slot="code-block-code" {...rest}>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className={resolvedClassName}
      // Shiki escapes the code; the markup only holds its own <pre>/<code>/<span> elements.
      dangerouslySetInnerHTML={{__html: html}}
      data-slot="code-block-code"
      {...rest}
    />
  );
};

CodeBlockCode.displayName = "HeroUI.CodeBlock.Code";

/* -------------------------------------------------------------------------------------------------
 * CodeBlock CopyButton
 * -----------------------------------------------------------------------------------------------*/
/** How long the check icon stays after a successful copy. */
const COPIED_DURATION = 2000;
/** Matches the icon swap transition in code-block.css. */
const ICON_EXIT_DURATION = 300;

const CopyIcon = () => (
  <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M12 2.5H8A1.5 1.5 0 0 0 6.5 4v1H8a3 3 0 0 1 3 3v1.5h1A1.5 1.5 0 0 0 13.5 8V4A1.5 1.5 0 0 0 12 2.5M11 11h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3zM4 6.5h4A1.5 1.5 0 0 1 9.5 8v4A1.5 1.5 0 0 1 8 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M13.488 3.43a.75.75 0 0 1 .081 1.058l-6 7a.75.75 0 0 1-1.1.042l-3.5-3.5A.75.75 0 0 1 4.03 6.97l2.928 2.927 5.473-6.385a.75.75 0 0 1 1.057-.081"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

type IconEntry = {id: number; isCopied: boolean; status: "idle" | "entering" | "exiting"};

/**
 * Keeps the outgoing icon mounted (popped out of the layout) while it animates away, so the copy and
 * check icons cross-fade in place. Only one icon is mounted once the transition has finished.
 */
function useIconPresence(isCopied: boolean) {
  const [entries, setEntries] = useState<IconEntry[]>(() => [{id: 0, isCopied, status: "idle"}]);
  const [prevIsCopied, setPrevIsCopied] = useState(isCopied);

  if (prevIsCopied !== isCopied) {
    // Adjust state while rendering (no extra commit with the stale icon).
    setPrevIsCopied(isCopied);
    setEntries((prev) => {
      const nextId = Math.max(...prev.map((entry) => entry.id)) + 1;

      return [
        ...prev.map((entry) => ({...entry, status: "exiting" as const})),
        {id: nextId, isCopied, status: "entering"},
      ];
    });
  }

  const hasExiting = entries.some((entry) => entry.status === "exiting");

  useEffect(() => {
    if (!hasExiting) return;

    const timeout = setTimeout(() => {
      // Drop the outgoing icon and settle the incoming one (no transient attributes once idle).
      setEntries((prev) =>
        prev
          .filter((entry) => entry.status !== "exiting")
          .map((entry) => (entry.status === "idle" ? entry : {...entry, status: "idle"})),
      );
    }, ICON_EXIT_DURATION);

    return () => clearTimeout(timeout);
  }, [hasExiting, entries]);

  return entries;
}

interface CodeBlockCopyButtonProps extends Omit<ButtonProps, "children"> {
  /** Code copied to clipboard. */
  code: string;
  /** Accessible label. */
  "aria-label"?: string;
  /** Additional class. */
  className?: string;
  /** Called after the code was written to the clipboard. */
  onCopy?: (code: string) => void;
}

const CodeBlockCopyButton = ({
  "aria-label": ariaLabel = "Copy code",
  className,
  code,
  onCopy,
  onPress,
  ...rest
}: CodeBlockCopyButtonProps) => {
  const slots = useSlots();
  const [isCopied, setIsCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const icons = useIconPresence(isCopied);

  useEffect(() => () => clearTimeout(resetTimeoutRef.current), []);

  const handlePress = useCallback<NonNullable<ButtonProps["onPress"]>>(
    (event) => {
      onPress?.(event);

      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;

      navigator.clipboard.writeText(code).then(
        () => {
          onCopy?.(code);
          setIsCopied(true);
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = setTimeout(() => setIsCopied(false), COPIED_DURATION);
        },
        () => {
          // Clipboard access denied: keep showing the copy icon.
        },
      );
    },
    [code, onCopy, onPress],
  );

  return (
    <Button
      isIconOnly
      aria-label={ariaLabel}
      className={slots.copyButton({className})}
      data-slot="code-block-copy-button"
      size="sm"
      variant="ghost"
      onPress={handlePress}
      {...rest}
    >
      {icons.map((entry): ReactNode => (
        <span
          key={entry.id}
          aria-hidden={entry.status === "exiting" ? true : undefined}
          className={slots.copyButtonIconMotion()}
          data-entering={entry.status === "entering" ? "true" : undefined}
          data-exiting={entry.status === "exiting" ? "true" : undefined}
          data-slot="code-block-copy-button-icon-motion"
        >
          {entry.isCopied ? <CheckIcon /> : <CopyIcon />}
        </span>
      ))}
    </Button>
  );
};

CodeBlockCopyButton.displayName = "HeroUI.CodeBlock.CopyButton";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {CodeBlockRoot, CodeBlockHeader, CodeBlockCode, CodeBlockCopyButton, CodeBlockContext};

export type {
  CodeBlockRootProps,
  CodeBlockHeaderProps,
  CodeBlockCodeProps,
  CodeBlockCopyButtonProps,
};
