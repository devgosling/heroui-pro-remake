"use client";

import type {OverlayScrollbarsOptions} from "./create-overlay-scrollbars";

import {useEffect} from "react";

import {createOverlayScrollbars} from "./create-overlay-scrollbars";

interface OverlayScrollbarsProps extends OverlayScrollbarsOptions {}

/**
 * Mount once near the root of the app. Replaces every native scrollbar of the document with thin,
 * theme-aware overlay scrollbars that never take layout space.
 */
const OverlayScrollbars = ({
  hideDelay,
  inset,
  minThumbSize,
  revealDistance,
}: OverlayScrollbarsProps) => {
  useEffect(
    () => createOverlayScrollbars(document, {hideDelay, inset, minThumbSize, revealDistance}),
    [hideDelay, inset, minThumbSize, revealDistance],
  );

  return null;
};

OverlayScrollbars.displayName = "HeroUI.OverlayScrollbars";

export {OverlayScrollbars};

export type {OverlayScrollbarsProps};
