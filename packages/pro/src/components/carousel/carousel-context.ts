"use client";

import type {CarouselVariants} from "./carousel.styles";
import type {EmblaCarouselType, EmblaOptionsType, EmblaPluginType} from "embla-carousel";
import type {EmblaViewportRefType} from "embla-carousel-react";

import {createContext, use} from "react";

import {carouselVariants} from "./carousel.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
export type CarouselApi = EmblaCarouselType;
export type CarouselOptions = EmblaOptionsType;
export type CarouselPlugin = EmblaPluginType;
export type CarouselType = NonNullable<CarouselVariants["type"]>;
export type CarouselOrientation = "horizontal" | "vertical";

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
export interface CarouselContextValue {
  /** The Embla API instance (undefined until Embla has initialised). */
  api: CarouselApi | undefined;
  /** Currently selected scroll snap index. */
  selectedIndex: number;
  /** Total number of scroll snap points. */
  scrollSnapCount: number;
  /** Whether scrolling backward is possible. */
  canScrollPrev: boolean;
  /** Whether scrolling forward is possible. */
  canScrollNext: boolean;
  /** Scrolls to the previous snap. */
  scrollPrev: () => void;
  /** Scrolls to the next snap. */
  scrollNext: () => void;
  /** Scrolls to a snap by index. */
  scrollTo: (index: number) => void;
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export interface CarouselSlotsContextValue {
  slots: ReturnType<typeof carouselVariants>;
  type: CarouselType;
  orientation: CarouselOrientation;
  viewportRef?: EmblaViewportRefType;
  /** The mounted viewport wrapper. Previous / Next portal into it in the overlay layouts. */
  navigationContainer?: HTMLDivElement | null;
  /** Ref callback for the viewport wrapper (set by Carousel.Content). */
  setNavigationContainer?: (node: HTMLDivElement | null) => void;
}

export const CarouselSlotsContext = createContext<CarouselSlotsContextValue>({
  orientation: "horizontal",
  slots: carouselVariants(),
  type: "in-place",
});

/**
 * Returns the carousel state and controls. Must be used inside `<Carousel>`.
 */
export function useCarousel(): CarouselContextValue {
  const context = use(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel /> component.");
  }

  return context;
}
