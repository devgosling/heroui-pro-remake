import type {SVGProps} from "react";

/* -------------------------------------------------------------------------------------------------
 * Status icons (16x16 viewBox, drawn with currentColor).
 * Glyphs from Gravity UI Icons (https://github.com/gravity-ui/icons), MIT License,
 * Copyright (c) 2022 YANDEX LLC: circle-check, circle-xmark, circle-exclamation, wrench.
 * -----------------------------------------------------------------------------------------------*/
type IconProps = SVGProps<SVGSVGElement>;

const IconBase = ({d, ...props}: IconProps & {d: string}) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path clipRule="evenodd" d={d} fill="currentColor" fillRule="evenodd" />
  </svg>
);

export const ChatToolCompleteIcon = (props: IconProps) => (
  <IconBase
    d="M13.5 8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0m-3.9-1.55a.75.75 0 1 0-1.2-.9L7.419 8.858 6.03 7.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.13-.08z"
    {...props}
  />
);

export const ChatToolErrorIcon = (props: IconProps) => (
  <IconBase
    d="M13.5 8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0M6.53 5.47a.75.75 0 0 0-1.06 1.06L6.94 8 5.47 9.47a.75.75 0 1 0 1.06 1.06L8 9.06l1.47 1.47a.75.75 0 1 0 1.06-1.06L9.06 8l1.47-1.47a.75.75 0 1 0-1.06-1.06L8 6.94z"
    {...props}
  />
);

export const ChatToolRequiresActionIcon = (props: IconProps) => (
  <IconBase
    d="M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m1-4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0M8.75 5a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0z"
    {...props}
  />
);

export const ChatToolRunningIcon = (props: IconProps) => (
  <IconBase
    d="m8.581 9.298.776.143q.311.059.643.059A3.5 3.5 0 0 0 13.5 6q0-.177-.027-.352l-1.39 1.39a1.58 1.58 0 0 1-1.114.462A2.47 2.47 0 0 1 8.5 5.03c0-.417.166-.817.461-1.112l1.39-1.39A2.4 2.4 0 0 0 10 2.5a3.5 3.5 0 0 0-3.441 4.143l.143.776-3.813 3.813a1.329 1.329 0 0 0 1.879 1.879zm3.817-6.787a.795.795 0 0 0-.411-1.018C11.87 1.432 11.014 1 10 1a5 5 0 0 0-4.916 5.916l-3.256 3.256a2.828 2.828 0 1 0 4 4l3.256-3.256Q9.53 11 10 11a5 5 0 0 0 5-5c0-1.014-.432-1.87-.493-1.987l-.014-.027a.795.795 0 0 0-1.273-.207l-2.198 2.2a.07.07 0 0 1-.053.021.97.97 0 0 1-.969-.97q0-.03.022-.052L12.22 2.78a.8.8 0 0 0 .178-.27"
    {...props}
  />
);
