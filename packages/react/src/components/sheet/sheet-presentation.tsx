"use client";

/**
 * Sheet presentation for dialog-like overlays (Modal, AlertDialog).
 *
 * On small screens these overlays render their shell (backdrop, container, dialog) as a bottom
 * Sheet that slides up from the bottom edge. It can be swiped away - and shows a drag handle -
 * when the overlay is dismissable or offers a close button (an overlay you can close with an X
 * can also be swiped closed). Otherwise it still slides in from the bottom but stays put.
 *
 * Scrolling follows the OSS Sheet: the handle stays fixed at the top and the overlay's content
 * scrolls below it once the sheet is fully open. Pulling down while the content is scrolled to the
 * top hands the gesture to the sheet (native scroll chaining), and dragging the handle closes the
 * sheet from any scroll position.
 *
 * Header, body, footer, heading, icon and close trigger keep their own components and styles, so
 * consumers write the same markup for both presentations.
 */
import type {SheetDialogProps} from "./sheet";
import type {ReactNode} from "react";

import {use, useCallback, useMemo, useState} from "react";
import {OverlayTriggerStateContext} from "react-aria-components/Dialog";
import {cx} from "tailwind-variants";

import {SheetContext, useSheetContext} from "./context";
import {SheetBackdrop, SheetContent, SheetDialog, SheetHandle} from "./sheet";
import {SheetPresentationCloseContext} from "./use-overlay-presentation";

/* -------------------------------------------------------------------------------------------------
 * Backdrop: provides the Sheet context from the surrounding DialogTrigger (or controlled props)
 * -----------------------------------------------------------------------------------------------*/
interface SheetPresentationBackdropProps {
  children?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  /** Swipe-down and outside press close the sheet. */
  isDismissable: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  variant?: "opaque" | "blur" | "transparent";
  slot?: string;
}

export function SheetPresentationBackdrop({
  children,
  className,
  defaultOpen,
  isDismissable,
  isOpen,
  onOpenChange,
  variant,
}: SheetPresentationBackdropProps) {
  const triggerState = use(OverlayTriggerStateContext);
  const usesTrigger = !!triggerState && isOpen === undefined && defaultOpen === undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const open = usesTrigger ? triggerState.isOpen : (isOpen ?? uncontrolledOpen);

  // Close buttons inside the overlay register here (see useRegisterSheetCloseTrigger).
  const [closeTriggerCount, setCloseTriggerCount] = useState(0);
  const registerCloseTrigger = useCallback(() => {
    setCloseTriggerCount((count) => count + 1);

    return () => setCloseTriggerCount((count) => count - 1);
  }, []);
  const canSwipeClose = isDismissable || closeTriggerCount > 0;

  const setOpen = useCallback(
    (next: boolean) => {
      if (usesTrigger) {
        triggerState.setOpen(next);

        return;
      }
      if (isOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isOpen, onOpenChange, triggerState, usesTrigger],
  );

  const context = useMemo(
    () => ({
      closeSheet: () => setOpen(false),
      isDetached: false,
      isDismissable: canSwipeClose,
      isNested: false,
      isOpen: open,
      isTriggerControlled: usesTrigger,
      placement: "bottom" as const,
      setIsOpen: setOpen,
      snapPoints: undefined,
    }),
    [canSwipeClose, open, setOpen, usesTrigger],
  );

  return (
    <SheetPresentationCloseContext value={registerCloseTrigger}>
      <SheetContext.Provider value={context}>
        <SheetBackdrop className={className} data-presentation="sheet" variant={variant}>
          {children}
        </SheetBackdrop>
      </SheetContext.Provider>
    </SheetPresentationCloseContext>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Container: the sliding panel
 * -----------------------------------------------------------------------------------------------*/
export function SheetPresentationContainer({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <SheetContent className={className} data-presentation="sheet">
      {children}
    </SheetContent>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Dialog: sheet surface with a fixed drag handle (when swipeable) and a scroll area for the
 * overlay's own content
 * -----------------------------------------------------------------------------------------------*/
type DialogChildren = ReactNode | ((renderProps: {close: () => void}) => ReactNode);

interface SheetPresentationDialogProps extends Omit<SheetDialogProps, "children"> {
  children?: DialogChildren;
}

export function SheetPresentationDialog({
  children,
  className,
  ...props
}: SheetPresentationDialogProps) {
  const {isDismissable} = useSheetContext();
  const handle = isDismissable ? <SheetHandle /> : null;

  const renderContent = (content: ReactNode) => (
    <>
      {handle}
      <div className="sheet__overlay-scroll" data-slot="sheet-overlay-scroll">
        {content}
      </div>
    </>
  );

  // React Aria dialogs accept render-function children ({close}); keep supporting them.
  const content =
    typeof children === "function"
      ? (renderProps: {close: () => void}) => renderContent(children(renderProps))
      : renderContent(children);

  return (
    <SheetDialog
      {...props}
      className={cx("sheet__dialog--overlay", className)}
      data-dismissable={isDismissable ? "true" : undefined}
      data-presentation="sheet"
    >
      {content as ReactNode}
    </SheetDialog>
  );
}
