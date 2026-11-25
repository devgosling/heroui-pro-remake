"use client";

import type {
  CarouselApi,
  CarouselContextValue,
  CarouselOptions,
  CarouselOrientation,
  CarouselPlugin,
  CarouselSlotsContextValue,
  CarouselType,
} from "./carousel-context";
import type {ComponentPropsWithRef, KeyboardEvent, ReactElement, ReactNode} from "react";

import {Button, IconChevronLeft, IconChevronRight, ScrollShadow} from "@heroui/react";
import useEmblaCarousel from "embla-carousel-react";
import {Fragment, use, useCallback, useEffect, useMemo, useState} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {createPortal} from "react-dom";

import {composeTwRenderProps} from "../../utils";

import {CarouselContext, CarouselSlotsContext, useCarousel} from "./carousel-context";
import {carouselVariants} from "./carousel.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * In the overlay layouts (in-place / modal) the arrows are positioned against the slide area, so
 * Previous / Next render into the viewport wrapper (after the viewport) wherever they are placed
 * in the tree. Nothing renders until the wrapper has mounted, so the server output and the first
 * client render carry no arrows. In the miniatures layout they stay where they are placed (e.g.
 * inline with the thumbnail row).
 */
function useNavigationPlacement(element: ReactElement): ReactNode {
  const {navigationContainer, type} = use(CarouselSlotsContext);

  if (type === "miniatures") return element;

  return navigationContainer ? createPortal(element, navigationContainer) : null;
}

interface CarouselState {
  selectedIndex: number;
  scrollSnapCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

const initialState: CarouselState = {
  canScrollNext: false,
  canScrollPrev: false,
  scrollSnapCount: 0,
  selectedIndex: 0,
};

function readState(api: CarouselApi): CarouselState {
  return {
    canScrollNext: api.canScrollNext(),
    canScrollPrev: api.canScrollPrev(),
    scrollSnapCount: api.scrollSnapList().length,
    selectedIndex: api.selectedScrollSnap(),
  };
}

/* -------------------------------------------------------------------------------------------------
 * Carousel Root
 * -----------------------------------------------------------------------------------------------*/
interface CarouselRootProps extends ComponentPropsWithRef<"div"> {
  /** Embla Carousel options. */
  opts?: CarouselOptions;
  /** Embla Carousel plugins. */
  plugins?: CarouselPlugin[];
  /**
   * Layout type controlling navigation button positioning.
   * @default "in-place"
   */
  type?: CarouselType;
  /** Receives the Embla API instance for programmatic control. */
  setApi?: (api: CarouselApi) => void;
}

const CarouselRoot = ({
  children,
  className,
  onKeyDown,
  opts,
  plugins,
  setApi,
  type = "in-place",
  ...rest
}: CarouselRootProps) => {
  const [viewportRef, api] = useEmblaCarousel(opts, plugins);
  const [state, setState] = useState<CarouselState>(initialState);
  const [navigationContainer, setNavigationContainer] = useState<HTMLDivElement | null>(null);

  const orientation: CarouselOrientation = opts?.axis === "y" ? "vertical" : "horizontal";
  const isRtl = opts?.direction === "rtl";

  const slots = useMemo(() => carouselVariants({orientation, type}), [orientation, type]);

  const sync = useCallback((emblaApi: CarouselApi) => {
    const next = readState(emblaApi);

    setState((prev) =>
      prev.selectedIndex === next.selectedIndex &&
      prev.scrollSnapCount === next.scrollSnapCount &&
      prev.canScrollPrev === next.canScrollPrev &&
      prev.canScrollNext === next.canScrollNext
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    if (!api) return;

    // Embla is an external system: read its initial state once the instance exists, then subscribe.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs state from the Embla instance
    sync(api);
    api.on("select", sync).on("reInit", sync).on("slidesChanged", sync);

    return () => {
      api.off("select", sync).off("reInit", sync).off("slidesChanged", sync);
    };
  }, [api, sync]);

  useEffect(() => {
    if (api) setApi?.(api);
  }, [api, setApi]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || isEditableTarget(event.target)) return;

      const [prevKey, nextKey] =
        orientation === "vertical"
          ? ["ArrowUp", "ArrowDown"]
          : isRtl
            ? ["ArrowRight", "ArrowLeft"]
            : ["ArrowLeft", "ArrowRight"];

      if (event.key === prevKey) {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === nextKey) {
        event.preventDefault();
        scrollNext();
      }
    },
    [isRtl, onKeyDown, orientation, scrollNext, scrollPrev],
  );

  const contextValue = useMemo<CarouselContextValue>(
    () => ({...state, api, scrollNext, scrollPrev, scrollTo}),
    [api, scrollNext, scrollPrev, scrollTo, state],
  );

  const slotsValue = useMemo<CarouselSlotsContextValue>(
    () => ({navigationContainer, orientation, setNavigationContainer, slots, type, viewportRef}),
    [navigationContainer, orientation, slots, type, viewportRef],
  );

  return (
    <CarouselContext value={contextValue}>
      <CarouselSlotsContext value={slotsValue}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the carousel region handles arrow keys itself (WAI-ARIA carousel pattern), mirroring the original DOM */}
        <div
          aria-roledescription="carousel"
          role="region"
          // The region is focusable so the arrow keys work without focusing a control first.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- intentional: keyboard users focus the region to use the arrow keys
          tabIndex={0}
          {...rest}
          className={slots.base({className})}
          data-slot="carousel"
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      </CarouselSlotsContext>
    </CarouselContext>
  );
};

CarouselRoot.displayName = "HeroUI.Carousel";

/* -------------------------------------------------------------------------------------------------
 * Carousel Content (viewport wrapper > viewport > content)
 * -----------------------------------------------------------------------------------------------*/
interface CarouselContentProps extends ComponentPropsWithRef<"div"> {}

const CarouselContent = ({children, className, ...rest}: CarouselContentProps) => {
  const {setNavigationContainer, slots, viewportRef} = use(CarouselSlotsContext);

  return (
    <div
      ref={setNavigationContainer}
      className={slots.viewportWrapper()}
      data-slot="carousel-viewport-wrapper"
    >
      <div ref={viewportRef} className={slots.viewport()} data-slot="carousel-viewport">
        <div className={slots.content({className})} data-slot="carousel-content" {...rest}>
          {children}
        </div>
      </div>
    </div>
  );
};

CarouselContent.displayName = "HeroUI.Carousel.Content";

/* -------------------------------------------------------------------------------------------------
 * Carousel Item
 * -----------------------------------------------------------------------------------------------*/
interface CarouselItemProps extends ComponentPropsWithRef<"div"> {}

const CarouselItem = ({className, ...rest}: CarouselItemProps) => {
  const {slots} = use(CarouselSlotsContext);

  return (
    <div
      aria-roledescription="slide"
      className={slots.item({className})}
      data-slot="carousel-item"
      role="group"
      {...rest}
    />
  );
};

CarouselItem.displayName = "HeroUI.Carousel.Item";

/* -------------------------------------------------------------------------------------------------
 * Carousel Previous / Next (OSS Button: tertiary, sm, icon-only)
 * -----------------------------------------------------------------------------------------------*/
interface CarouselNavigationProps extends Omit<ComponentPropsWithRef<typeof Button>, "children"> {
  /** Custom icon to replace the default chevron. */
  icon?: ReactNode;
  /** Custom content; takes precedence over `icon`. */
  children?: ReactNode;
}

interface CarouselPreviousProps extends CarouselNavigationProps {}

const CarouselPrevious = ({
  children,
  className,
  icon,
  isDisabled,
  onPress,
  ...rest
}: CarouselPreviousProps) => {
  const {slots} = use(CarouselSlotsContext);
  const {canScrollPrev, scrollPrev} = useCarousel();

  return useNavigationPlacement(
    <Button
      isIconOnly
      aria-label="Previous slide"
      data-slot="carousel-previous"
      size="sm"
      variant="tertiary"
      {...rest}
      className={composeTwRenderProps(className, slots.previous())}
      isDisabled={isDisabled || !canScrollPrev}
      onPress={(event) => {
        onPress?.(event);
        scrollPrev();
      }}
    >
      {children ?? icon ?? <IconChevronLeft />}
    </Button>,
  );
};

CarouselPrevious.displayName = "HeroUI.Carousel.Previous";

interface CarouselNextProps extends CarouselNavigationProps {}

const CarouselNext = ({
  children,
  className,
  icon,
  isDisabled,
  onPress,
  ...rest
}: CarouselNextProps) => {
  const {slots} = use(CarouselSlotsContext);
  const {canScrollNext, scrollNext} = useCarousel();

  return useNavigationPlacement(
    <Button
      isIconOnly
      aria-label="Next slide"
      data-slot="carousel-next"
      size="sm"
      variant="tertiary"
      {...rest}
      className={composeTwRenderProps(className, slots.next())}
      isDisabled={isDisabled || !canScrollNext}
      onPress={(event) => {
        onPress?.(event);
        scrollNext();
      }}
    >
      {children ?? icon ?? <IconChevronRight />}
    </Button>,
  );
};

CarouselNext.displayName = "HeroUI.Carousel.Next";

/* -------------------------------------------------------------------------------------------------
 * Carousel Dots
 * -----------------------------------------------------------------------------------------------*/
interface CarouselDotRenderProps {
  /** The snap index of this dot (0-based). */
  index: number;
  /** Whether this dot's snap is the selected one. */
  isSelected: boolean;
}

interface CarouselDotsProps extends ComponentPropsWithRef<"div"> {
  /** Custom render function for each dot (replaces the default dot button). */
  renderDot?: (props: CarouselDotRenderProps) => ReactNode;
}

const CarouselDots = ({className, renderDot, ...rest}: CarouselDotsProps) => {
  const {slots} = use(CarouselSlotsContext);
  const {scrollSnapCount, scrollTo, selectedIndex} = useCarousel();

  if (scrollSnapCount <= 1) return null;

  return (
    <div
      aria-label="Slide indicators"
      className={slots.dots({className})}
      data-slot="carousel-dots"
      role="tablist"
      {...rest}
    >
      {Array.from({length: scrollSnapCount}, (_, index) => {
        const isSelected = index === selectedIndex;

        if (renderDot) return <Fragment key={index}>{renderDot({index, isSelected})}</Fragment>;

        return (
          <ButtonPrimitive
            key={index}
            aria-label={`Go to slide ${index + 1}`}
            className={slots.dot()}
            data-selected={isSelected || undefined}
            data-slot="carousel-dot"
            onPress={() => scrollTo(index)}
          />
        );
      })}
    </div>
  );
};

CarouselDots.displayName = "HeroUI.Carousel.Dots";

/* -------------------------------------------------------------------------------------------------
 * Carousel Thumbnails (OSS ScrollShadow, horizontal, hidden scrollbar)
 * -----------------------------------------------------------------------------------------------*/
interface CarouselThumbnailsProps extends ComponentPropsWithRef<typeof ScrollShadow> {}

const CarouselThumbnails = ({className, ...rest}: CarouselThumbnailsProps) => {
  const {slots} = use(CarouselSlotsContext);

  return (
    <ScrollShadow
      hideScrollBar
      aria-label="Slide thumbnails"
      orientation="horizontal"
      role="tablist"
      {...rest}
      className={slots.thumbnails({className})}
      data-slot="carousel-thumbnails"
    />
  );
};

CarouselThumbnails.displayName = "HeroUI.Carousel.Thumbnails";

/* -------------------------------------------------------------------------------------------------
 * Carousel Thumbnail
 * -----------------------------------------------------------------------------------------------*/
interface CarouselThumbnailProps extends Omit<
  ComponentPropsWithRef<typeof ButtonPrimitive>,
  "children"
> {
  /** The slide index this thumbnail navigates to (0-based). */
  index: number;
  /** Image source URL. Alternatively, pass children for custom content. */
  src?: string;
  /**
   * Alt text for the thumbnail image.
   * @default ""
   */
  alt?: string;
  /** Custom thumbnail content (replaces the image). */
  children?: ReactNode;
}

const CarouselThumbnail = ({
  alt = "",
  children,
  className,
  index,
  onPress,
  src,
  ...rest
}: CarouselThumbnailProps) => {
  const {slots} = use(CarouselSlotsContext);
  const {scrollTo, selectedIndex} = useCarousel();
  const isSelected = selectedIndex === index;

  return (
    <ButtonPrimitive
      aria-label={`Go to slide ${index + 1}`}
      data-selected={isSelected || undefined}
      data-slot="carousel-thumbnail"
      {...rest}
      className={composeTwRenderProps(className, slots.thumbnail())}
      onPress={(event) => {
        onPress?.(event);
        scrollTo(index);
      }}
    >
      {children ?? (src ? <img alt={alt} draggable={false} src={src} /> : null)}
    </ButtonPrimitive>
  );
};

CarouselThumbnail.displayName = "HeroUI.Carousel.Thumbnail";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  CarouselThumbnails,
  CarouselThumbnail,
};

export type {
  CarouselApi,
  CarouselOptions,
  CarouselPlugin,
  CarouselType,
  CarouselContextValue,
  CarouselRootProps,
  CarouselContentProps,
  CarouselItemProps,
  CarouselPreviousProps,
  CarouselNextProps,
  CarouselDotsProps,
  CarouselDotRenderProps,
  CarouselThumbnailsProps,
  CarouselThumbnailProps,
};
