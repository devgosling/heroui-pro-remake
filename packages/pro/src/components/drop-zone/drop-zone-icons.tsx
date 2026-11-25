import type {ComponentPropsWithRef} from "react";

/*
 * Glyphs from Gravity UI Icons (https://github.com/gravity-ui/icons), MIT License,
 * Copyright (c) 2023 YANDEX LLC. The no-op 16x16 clip group of the original is dropped.
 */

/** Default `DropZone.Icon` glyph (Gravity UI "cloud-arrow-up-in"). */
export const DropZoneUploadIcon = (props: ComponentPropsWithRef<"svg">) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M4.5 5.25a3.25 3.25 0 0 1 6.398-.811.75.75 0 0 0 .702.563A3 3 0 0 1 11.5 11h-.75a.75.75 0 0 0 0 1.5h.75a4.5 4.5 0 0 0 .687-8.948 4.751 4.751 0 0 0-9.184 1.522A3.751 3.751 0 0 0 3.75 12.5h1.5a.75.75 0 0 0 0-1.5H3.751a2.25 2.25 0 0 1-.003-4.5h.03a.75.75 0 0 0 .747-.843A3 3 0 0 1 4.5 5.25m4.25 3.31.72.72a.75.75 0 1 0 1.06-1.06l-2-2a.75.75 0 0 0-1.06 0l-2 2a.75.75 0 0 0 1.06 1.06l.72-.72v6.69a.75.75 0 0 0 1.5 0z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/** Default `DropZone.FileRemoveTrigger` glyph (Gravity UI "trash-bin"). */
export const DropZoneTrashIcon = (props: ComponentPropsWithRef<"svg">) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M9 2H7a.5.5 0 0 0-.5.5V3h3v-.5A.5.5 0 0 0 9 2m2 1v-.5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2V3H2.251a.75.75 0 0 0 0 1.5h.312l.317 7.625A3 3 0 0 0 5.878 15h4.245a3 3 0 0 0 2.997-2.875l.318-7.625h.312a.75.75 0 0 0 0-1.5zm.936 1.5H4.064l.315 7.562A1.5 1.5 0 0 0 5.878 13.5h4.245a1.5 1.5 0 0 0 1.498-1.438zm-6.186 2v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-1.5 0m3.75-.75a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/*
 * File sheet outline used by `DropZone.FileFormatIcon` (own drawing): a 28.5 x 38.5 sheet with
 * 5.25 rounded corners and a 45 degree dog-ear at the top-right, plus the fold line.
 */
export const FILE_SHEET_PATH =
  "M2.75 6A5.25 5.25 0 0 1 8 .75h9.515a3.5 3.5 0 0 1 2.475 1.025l10.235 10.235a3.5 3.5 0 0 1 1.025 2.475V34A5.25 5.25 0 0 1 26 39.25H8A5.25 5.25 0 0 1 2.75 34Z";

export const FILE_FOLD_PATH = "M19 1v7a4 4 0 0 0 4 4h8";
