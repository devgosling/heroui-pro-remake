"use client";

import type {HoloCardSpring} from "./use-spring-values";
import type {CSSProperties, ComponentPropsWithRef, PointerEvent, ReactNode, RefObject} from "react";

import {createContext, use, useCallback, useMemo, useRef} from "react";

import {useMergedRef} from "../../utils";

import {holoCardVariants} from "./holo-card.styles";
import {HOLO_CARD_DEFAULT_MAX_TILT, useHoloCardTilt} from "./use-holo-card-tilt";

// Every part reads its BEM class straight from the slots (no variants).
const slots = holoCardVariants();

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type HoloCardContext = {
  /** Ref of the 3D tilt layer; the root writes its rotation. */
  rotatorRef?: RefObject<HTMLDivElement | null>;
  /** Registers a parallax content layer and returns its cleanup. */
  registerContent?: (element: HTMLElement) => () => void;
};

const HoloCardContext = createContext<HoloCardContext>({});

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
// `patternSrc` is a URL; CSS image values (gradients, url(), image-set(), none) pass through.
const CSS_IMAGE =
  /^(none|(?:repeating-)?(?:linear|radial|conic)-gradient\(|url\(|image-set\(|var\()/i;

const toCssImage = (source: string) =>
  CSS_IMAGE.test(source.trim()) ? source : `url(${JSON.stringify(source)})`;

type PointerHandler = ((event: PointerEvent<HTMLDivElement>) => void) | undefined;

const chain =
  (own: (event: PointerEvent<HTMLDivElement>) => void, user: PointerHandler) =>
  (event: PointerEvent<HTMLDivElement>) => {
    user?.(event);
    own(event);
  };

/* -------------------------------------------------------------------------------------------------
 * Root - owns pointer tracking and every CSS variable
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardRootProps extends ComponentPropsWithRef<"div"> {
  /** CSS background for the surface. Sets `--holo-card-gradient`. */
  gradient?: string;
  /** Texture image URL for both overlays. Sets `--holo-card-pattern`. */
  patternSrc?: string;
  /** `background-size` for both overlays. Sets `--holo-card-pattern-size`. */
  patternSize?: string;
  /**
   * Whether the card stays flat and inert until a mouse pointer is over it. Implies
   * `tiltOnTouch={false}`.
   * @default false
   */
  activateOnHover?: boolean;
  /** Whether touch and pen pointers tilt the card, claiming horizontal drags. @default true */
  tiltOnTouch?: boolean;
  /** Whether the card tilts and lights up on pointer move. @default true */
  isInteractive?: boolean;
  /** Disables pointer tracking, leaving the card flat and unlit. @default false */
  isDisabled?: boolean;
  /** Edge tilt in degrees. Also scales the content parallax. @default 14.29 */
  maxTilt?: number;
  /** Scale the card grows to while the pointer is over it. @default 1.05 */
  hoverScale?: number;
  /** Multiplier for the glare. Sets `--holo-card-shine-opacity`. @default 1 */
  shineOpacity?: number;
  /** Spring the card follows the pointer with, merged over the defaults. @default {damping: 28, stiffness: 180} */
  spring?: HoloCardSpring;
  /** Spring the card returns to rest with, merged over the defaults. @default {damping: 22, stiffness: 120} */
  settleSpring?: HoloCardSpring;
  /** How far `HoloCard.Content` layers drift against the tilt. @default 10 */
  parallaxStrength?: number;
  /** Card layers. */
  children?: ReactNode;
}

const HoloCardRoot = ({
  activateOnHover = false,
  children,
  className,
  gradient,
  hoverScale = 1.05,
  isDisabled = false,
  isInteractive = true,
  maxTilt = HOLO_CARD_DEFAULT_MAX_TILT,
  onPointerCancel,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  parallaxStrength = 10,
  patternSize,
  patternSrc,
  ref,
  settleSpring,
  shineOpacity,
  spring,
  style,
  tiltOnTouch = true,
  ...rest
}: HoloCardRootProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);

  const {handlers, isActive, registerContent, tiltsOnTouch} = useHoloCardTilt({
    activateOnHover,
    hoverScale,
    isDisabled,
    isInteractive,
    maxTilt,
    parallaxStrength,
    rootRef,
    rotatorRef,
    settleSpring,
    spring,
    tiltOnTouch,
  });

  // Prop-driven variables are written after the user's style, like the original.
  const resolvedStyle = useMemo(() => {
    const vars: Record<string, string | number> = {};

    if (gradient !== undefined) vars["--holo-card-gradient"] = gradient;
    if (patternSrc !== undefined) vars["--holo-card-pattern"] = toCssImage(patternSrc);
    if (patternSize !== undefined) vars["--holo-card-pattern-size"] = patternSize;
    if (shineOpacity !== undefined) vars["--holo-card-shine-opacity"] = shineOpacity;

    return Object.keys(vars).length ? ({...style, ...vars} as CSSProperties) : style;
  }, [gradient, patternSize, patternSrc, shineOpacity, style]);

  const contextValue = useMemo(
    () => ({registerContent, rotatorRef}),
    [registerContent, rotatorRef],
  );

  return (
    <HoloCardContext value={contextValue}>
      <div
        ref={mergedRef}
        className={slots.base({className})}
        data-active={isActive ? "true" : "false"}
        data-slot="holo-card"
        data-tilt-on-touch={tiltsOnTouch ? "true" : undefined}
        style={resolvedStyle}
        onPointerCancel={chain(handlers.onPointerCancel, onPointerCancel)}
        onPointerEnter={chain(handlers.onPointerEnter, onPointerEnter)}
        onPointerLeave={chain(handlers.onPointerLeave, onPointerLeave)}
        onPointerMove={chain(handlers.onPointerMove, onPointerMove)}
        {...rest}
      >
        {children}
      </div>
    </HoloCardContext>
  );
};

HoloCardRoot.displayName = "HeroUI.HoloCard";

/* -------------------------------------------------------------------------------------------------
 * Rotator - 3D tilt layer, rotates around the card center
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardRotatorProps extends ComponentPropsWithRef<"div"> {
  /** Frame element. */
  children?: ReactNode;
}

const HoloCardRotator = ({className, ref, ...rest}: HoloCardRotatorProps) => {
  const {rotatorRef} = use(HoloCardContext);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rotatorRef ?? fallbackRef);

  return (
    <div
      ref={mergedRef}
      className={slots.rotator({className})}
      data-slot="holo-card-rotator"
      {...rest}
    />
  );
};

HoloCardRotator.displayName = "HeroUI.HoloCard.Rotator";

/* -------------------------------------------------------------------------------------------------
 * Frame - fixed clipping bounds the scaled, tilted card moves within
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardFrameProps extends ComponentPropsWithRef<"div"> {
  /** Surface element. */
  children?: ReactNode;
}

const HoloCardFrame = ({className, ...rest}: HoloCardFrameProps) => (
  <div className={slots.frame({className})} data-slot="holo-card-frame" {...rest} />
);

HoloCardFrame.displayName = "HeroUI.HoloCard.Frame";

/* -------------------------------------------------------------------------------------------------
 * Surface - card body carrying the gradient, clips every layer to the radius
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardSurfaceProps extends ComponentPropsWithRef<"div"> {
  /** Card layers. */
  children?: ReactNode;
}

const HoloCardSurface = ({className, ...rest}: HoloCardSurfaceProps) => (
  <div className={slots.surface({className})} data-slot="holo-card-surface" {...rest} />
);

HoloCardSurface.displayName = "HeroUI.HoloCard.Surface";

/* -------------------------------------------------------------------------------------------------
 * Image - full-bleed card art beneath every overlay
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardImageProps extends Omit<ComponentPropsWithRef<"img">, "alt"> {
  /** Required. Describe the art, or pass `""` when it is purely decorative. */
  alt: string;
  /** Image URL. */
  src?: string;
  /** Whether the browser may start a native drag of the art. @default false */
  draggable?: boolean;
}

const HoloCardImage = ({alt, className, draggable = false, ...rest}: HoloCardImageProps) => (
  <img
    alt={alt}
    className={slots.image({className})}
    data-slot="holo-card-image"
    draggable={draggable}
    {...rest}
  />
);

HoloCardImage.displayName = "HeroUI.HoloCard.Image";

/* -------------------------------------------------------------------------------------------------
 * Inset - hairline border inside the card edge
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardInsetProps extends Omit<ComponentPropsWithRef<"div">, "children"> {}

const HoloCardInset = ({className, ...rest}: HoloCardInsetProps) => (
  <div className={slots.inset({className})} data-slot="holo-card-inset" {...rest} />
);

HoloCardInset.displayName = "HeroUI.HoloCard.Inset";

/* -------------------------------------------------------------------------------------------------
 * Pattern - static texture beneath the content
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardPatternProps extends Omit<ComponentPropsWithRef<"div">, "children"> {}

const HoloCardPattern = ({className, ...rest}: HoloCardPatternProps) => (
  <div
    aria-hidden="true"
    className={slots.pattern({className})}
    data-slot="holo-card-pattern"
    {...rest}
  />
);

HoloCardPattern.displayName = "HeroUI.HoloCard.Pattern";

/* -------------------------------------------------------------------------------------------------
 * Content - full-bleed parallax layer for the card face
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardContentProps extends ComponentPropsWithRef<"div"> {
  /** Whether the layer drifts against the tilt. @default true */
  parallax?: boolean;
  /** Layer content. */
  children?: ReactNode;
}

const HoloCardContent = ({className, parallax = true, ref, ...rest}: HoloCardContentProps) => {
  const {registerContent} = use(HoloCardContext);

  const parallaxRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || !parallax || !registerContent) return;
      const unregister = registerContent(element);

      return () => {
        unregister();
        element.style.removeProperty("transform");
      };
    },
    [parallax, registerContent],
  );
  const mergedRef = useMergedRef(ref, parallaxRef);

  return (
    <div
      ref={mergedRef}
      className={slots.content({className})}
      data-slot="holo-card-content"
      {...rest}
    />
  );
};

HoloCardContent.displayName = "HeroUI.HoloCard.Content";

/* -------------------------------------------------------------------------------------------------
 * ShinePattern - the texture the glare reveals, parallaxed by the pointer
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardShinePatternProps extends Omit<ComponentPropsWithRef<"div">, "children"> {}

const HoloCardShinePattern = ({className, ...rest}: HoloCardShinePatternProps) => (
  <div className={slots.shinePattern({className})} data-slot="holo-card-shine-pattern" {...rest} />
);

HoloCardShinePattern.displayName = "HeroUI.HoloCard.ShinePattern";

/* -------------------------------------------------------------------------------------------------
 * Shine - pointer-tracked holographic glare
 * -----------------------------------------------------------------------------------------------*/
interface HoloCardShineProps extends ComponentPropsWithRef<"div"> {
  /** Replaces the default texture. @default <HoloCard.ShinePattern /> */
  children?: ReactNode;
}

const HoloCardShine = ({children, className, ...rest}: HoloCardShineProps) => (
  <div
    aria-hidden="true"
    className={slots.shine({className})}
    data-slot="holo-card-shine"
    {...rest}
  >
    {children ?? <HoloCardShinePattern />}
  </div>
);

HoloCardShine.displayName = "HeroUI.HoloCard.Shine";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  HoloCardRoot,
  HoloCardRotator,
  HoloCardFrame,
  HoloCardSurface,
  HoloCardImage,
  HoloCardInset,
  HoloCardPattern,
  HoloCardContent,
  HoloCardShine,
  HoloCardShinePattern,
  HoloCardContext,
};

export type {
  HoloCardRootProps,
  HoloCardRotatorProps,
  HoloCardFrameProps,
  HoloCardSurfaceProps,
  HoloCardImageProps,
  HoloCardInsetProps,
  HoloCardPatternProps,
  HoloCardContentProps,
  HoloCardShineProps,
  HoloCardShinePatternProps,
};
