"use client";

import type {RefObject} from "react";

import {useEffect, useRef} from "react";

const isHostDisabled = (host: HTMLElement) =>
  host.matches(":disabled, [aria-disabled='true'], [data-disabled='true']");

const isPressKey = (event: KeyboardEvent) => event.key === "Enter" || event.key === " ";

/* -------------------------------------------------------------------------------------------------
 * Hold tracking (HoldConfirm): pointer/key down -> start, release/leave/cancel -> end
 * -----------------------------------------------------------------------------------------------*/
export interface ParentHoldHandlers {
  onHoldStart: () => void;
  onHoldEnd: () => void;
  isDisabled?: boolean;
}

/**
 * Tracks press-and-hold on the parent element of `ref` with native listeners, so the overlay
 * works inside any host (`PressableFeedback`, OSS `Button`, `Card`, plain elements).
 * Handlers are read through a ref so callers don't need to memoise them.
 */
export function useParentHold(ref: RefObject<HTMLElement | null>, handlers: ParentHoldHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  const isDisabled = handlers.isDisabled;

  useEffect(() => {
    const host = ref.current?.parentElement;

    if (!host || isDisabled) return;

    let activePointer: number | null = null;
    let keyHeld = false;

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || isHostDisabled(host)) return;
      activePointer = event.pointerId;
      handlersRef.current.onHoldStart();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (activePointer !== event.pointerId) return;
      activePointer = null;
      handlersRef.current.onHoldEnd();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !isPressKey(event) || keyHeld || isHostDisabled(host)) return;
      keyHeld = true;
      handlersRef.current.onHoldStart();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!keyHeld || !isPressKey(event)) return;
      keyHeld = false;
      handlersRef.current.onHoldEnd();
    };

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerup", onPointerEnd);
    host.addEventListener("pointercancel", onPointerEnd);
    host.addEventListener("pointerleave", onPointerEnd);
    host.addEventListener("keydown", onKeyDown);
    host.addEventListener("keyup", onKeyUp);

    return () => {
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", onPointerEnd);
      host.removeEventListener("pointercancel", onPointerEnd);
      host.removeEventListener("pointerleave", onPointerEnd);
      host.removeEventListener("keydown", onKeyDown);
      host.removeEventListener("keyup", onKeyUp);
    };
  }, [ref, isDisabled]);
}

/* -------------------------------------------------------------------------------------------------
 * Activation tracking (ProgressFeedback): click or Enter/Space keydown on the parent
 * -----------------------------------------------------------------------------------------------*/
export function useParentActivate(
  ref: RefObject<HTMLElement | null>,
  onActivate: () => void,
  isDisabled?: boolean,
) {
  const handlerRef = useRef(onActivate);

  useEffect(() => {
    handlerRef.current = onActivate;
  });

  useEffect(() => {
    const host = ref.current?.parentElement;

    if (!host || isDisabled) return;

    const onClick = () => {
      if (!isHostDisabled(host)) handlerRef.current();
    };

    // Keydown fires before React Aria swallows the native click of Enter/Space.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !isPressKey(event) || isHostDisabled(host)) return;
      handlerRef.current();
    };

    host.addEventListener("click", onClick);
    host.addEventListener("keydown", onKeyDown);

    return () => {
      host.removeEventListener("click", onClick);
      host.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, isDisabled]);
}
