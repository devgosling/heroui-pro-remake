import type {ComponentProps} from "react";

import {
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  CarouselThumbnail,
  CarouselThumbnails,
} from "./carousel";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/carousel`) because it depends on `embla-carousel-react`.
 * -----------------------------------------------------------------------------------------------*/
export const Carousel = Object.assign(CarouselRoot, {
  Content: CarouselContent,
  Dots: CarouselDots,
  Item: CarouselItem,
  Next: CarouselNext,
  Previous: CarouselPrevious,
  Root: CarouselRoot,
  Thumbnail: CarouselThumbnail,
  Thumbnails: CarouselThumbnails,
});

export type Carousel = {
  Props: ComponentProps<typeof CarouselRoot>;
  RootProps: ComponentProps<typeof CarouselRoot>;
  ContentProps: ComponentProps<typeof CarouselContent>;
  ItemProps: ComponentProps<typeof CarouselItem>;
  PreviousProps: ComponentProps<typeof CarouselPrevious>;
  NextProps: ComponentProps<typeof CarouselNext>;
  DotsProps: ComponentProps<typeof CarouselDots>;
  ThumbnailsProps: ComponentProps<typeof CarouselThumbnails>;
  ThumbnailProps: ComponentProps<typeof CarouselThumbnail>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./carousel";
export {CarouselContext, useCarousel} from "./carousel-context";

export type {
  CarouselApi,
  CarouselOptions,
  CarouselPlugin,
  CarouselType,
  CarouselContextValue,
  CarouselRootProps,
  CarouselRootProps as CarouselProps,
  CarouselContentProps,
  CarouselItemProps,
  CarouselPreviousProps,
  CarouselNextProps,
  CarouselDotsProps,
  CarouselDotRenderProps,
  CarouselThumbnailsProps,
  CarouselThumbnailProps,
} from "./carousel";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {carouselVariants, type CarouselVariants} from "./carousel.styles";
