/**
 * Default icons of `AppLayout.MenuToggle` (`bars`) and `AppLayout.AsideTrigger`
 * (`layout-side-content-right`).
 *
 * Path data from Gravity UI Icons (https://github.com/gravity-ui/icons), MIT License,
 * Copyright (c) 2022 YANDEX LLC.
 */
import type {SVGProps} from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const BarsIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M1.25 3.25A.75.75 0 0 1 2 2.5h12A.75.75 0 0 1 14 4H2a.75.75 0 0 1-.75-.75m0 4.75A.75.75 0 0 1 2 7.25h12a.75.75 0 0 1 0 1.5H2A.75.75 0 0 1 1.25 8M2 12a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const LayoutSideContentRightIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M10 3.5H4A1.5 1.5 0 0 0 2.5 5v6A1.5 1.5 0 0 0 4 12.5h6zm1.5 0h.5A1.5 1.5 0 0 1 13.5 5v6a1.5 1.5 0 0 1-1.5 1.5h-.5zM15 5a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
