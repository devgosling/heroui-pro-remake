import type {ReactNode} from "react";

import {isValidElement} from "react";

const LANGUAGE_CLASS_PATTERN = /(?:^|\s)language-([^\s]+)/;

/** Concatenates the text of a React node tree (react-markdown passes code as string children). */
function getTextContent(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (isValidElement<{children?: ReactNode}>(node)) return getTextContent(node.props.children);

  return "";
}

/** Reads the fence language from a `language-xxx` class name. */
function getLanguage(className: unknown): string | undefined {
  if (typeof className !== "string") return undefined;

  return LANGUAGE_CLASS_PATTERN.exec(className)?.[1];
}

export {getLanguage, getTextContent};
