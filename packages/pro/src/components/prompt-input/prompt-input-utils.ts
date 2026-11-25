/** Resolves `maxHeight` (number of px or any CSS length) to pixels for the autosize cap. */
export function resolveMaxHeight(element: HTMLElement, maxHeight: number | string): number {
  if (typeof maxHeight === "number") return maxHeight;

  const trimmed = maxHeight.trim();

  if (/^\d+(\.\d+)?(px)?$/.test(trimmed)) return parseFloat(trimmed);

  // Any other CSS length (rem, vh, calc()...): let the browser resolve it.
  const previous = element.style.maxHeight;

  element.style.maxHeight = trimmed;

  const resolved = parseFloat(getComputedStyle(element).maxHeight);

  element.style.maxHeight = previous;

  return Number.isFinite(resolved) ? resolved : Number.POSITIVE_INFINITY;
}

/** Whether the text in an input no longer fits on a single line. */
export function measureOverflow(
  element: HTMLElement,
  contentHeight: number,
  text: string,
): boolean {
  if (text.includes("\n")) return true;

  const style = getComputedStyle(element);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5 || 20;
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

  return contentHeight - padding > lineHeight * 1.5;
}
