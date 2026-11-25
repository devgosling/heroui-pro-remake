import type {CarouselApi, CarouselPlugin} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Card} from "@heroui/react";
import React from "react";

import {Carousel} from "./index";

const meta = {
  argTypes: {
    type: {control: {type: "select"}, options: ["in-place", "modal", "miniatures"]},
  },
  component: Carousel,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/Carousel",
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story data (Lorem Picsum photos, free to use under the Unsplash licence)
 * -----------------------------------------------------------------------------------------------*/
const photos = [
  {alt: "Mountain lake at dawn", id: 1015},
  {alt: "River valley from above", id: 1016},
  {alt: "Snowy summit ridge", id: 1018},
  {alt: "Coastline at low tide", id: 1019},
  {alt: "Misty pine forest", id: 1036},
  {alt: "Waterfall in a canyon", id: 1039},
];

const photoUrl = (id: number, width: number, height: number) =>
  `https://picsum.photos/id/${id}/${width}/${height}`;

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

const LetterCard = ({label, size = "text-4xl"}: {label: string; size?: string}) => (
  <div className="p-1">
    <Card className="select-none">
      <Card.Content className="flex aspect-square items-center justify-center">
        <span className={`${size} font-semibold tabular-nums`}>{label}</span>
      </Card.Content>
    </Card>
  </div>
);

const PhotoSlides = ({aspect}: {aspect: string}) => (
  <Carousel.Content>
    {photos.map((photo) => (
      <Carousel.Item key={photo.id}>
        <div className="overflow-hidden rounded-3xl">
          <img
            alt={photo.alt}
            className={`${aspect} w-full object-cover select-none`}
            draggable={false}
            src={photoUrl(photo.id, 800, 800)}
          />
        </div>
      </Carousel.Item>
    ))}
  </Carousel.Content>
);

const PhotoThumbnails = () => (
  <Carousel.Thumbnails>
    {photos.map((photo, index) => (
      <Carousel.Thumbnail
        key={photo.id}
        alt={photo.alt}
        index={index}
        src={photoUrl(photo.id, 160, 160)}
      />
    ))}
  </Carousel.Thumbnails>
);

/**
 * Minimal autoplay plugin for the story (own code; Pro's demo uses `embla-carousel-autoplay`,
 * which is not installed here). Advances every `delay` ms and stops on pointer interaction.
 */
function createAutoplay({delay = 2000, stopOnInteraction = true} = {}): CarouselPlugin {
  let api: CarouselApi | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const schedule = () => {
    stop();
    timer = setTimeout(() => {
      if (!api) return;
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
      schedule();
    }, delay);
  };

  const onPointerDown = () => {
    if (stopOnInteraction) stop();
  };

  return {
    destroy() {
      stop();
      api?.off("pointerDown", onPointerDown);
      api = undefined;
    },
    init(emblaApi) {
      api = emblaApi;
      api.on("pointerDown", onPointerDown);
      schedule();
    },
    name: "autoplay",
    options: {delay, stopOnInteraction},
  } as CarouselPlugin;
}

const AutoplayCarousel = () => {
  const plugins = React.useMemo(() => [createAutoplay({delay: 2000})], []);

  return (
    <div className="w-full max-w-xs">
      <Carousel opts={{loop: true}} plugins={plugins}>
        <Carousel.Content>
          {letters.slice(0, 5).map((label) => (
            <Carousel.Item key={label}>
              <LetterCard label={label} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Dots />
      </Carousel>
    </div>
  );
};

const ApiAccessCarousel = () => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const update = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);
    };

    update();
    api.on("select", update).on("reInit", update);

    return () => {
      api.off("select", update).off("reInit", update);
    };
  }, [api]);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Carousel setApi={setApi}>
        <Carousel.Content>
          {letters.slice(0, 5).map((label) => (
            <Carousel.Item key={label}>
              <LetterCard label={label} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>
      <p className="text-center text-sm text-muted tabular-nums">
        Card {current} / {count}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {opts: {loop: true}, type: "in-place"},
  render: (args) => (
    <div className="w-full max-w-sm">
      <Carousel {...args}>
        <PhotoSlides aspect="aspect-[1/1]" />
        <Carousel.Previous />
        <Carousel.Next />
        <Carousel.Dots />
        <PhotoThumbnails />
      </Carousel>
    </div>
  ),
};

export const ModalType: Story = {
  args: {opts: {loop: true}, type: "modal"},
  name: "Type: Modal",
  render: (args) => (
    <div className="w-full max-w-sm px-16">
      <Carousel {...args}>
        <PhotoSlides aspect="aspect-[4/3]" />
        <Carousel.Previous />
        <Carousel.Next />
        <PhotoThumbnails />
      </Carousel>
    </div>
  ),
};

export const MiniaturesType: Story = {
  args: {opts: {loop: true}, type: "miniatures"},
  name: "Type: Miniatures",
  render: (args) => (
    <div className="w-full max-w-sm">
      <Carousel {...args}>
        <PhotoSlides aspect="aspect-[4/3]" />
        <div className="mt-4 flex w-full items-center justify-center gap-2">
          <Carousel.Previous />
          <Carousel.Thumbnails className="min-w-0">
            {photos.map((photo, index) => (
              <Carousel.Thumbnail
                key={photo.id}
                alt={photo.alt}
                className="size-9"
                index={index}
                src={photoUrl(photo.id, 120, 120)}
              />
            ))}
          </Carousel.Thumbnails>
          <Carousel.Next />
        </div>
      </Carousel>
    </div>
  ),
};

export const MultipleSlides: Story = {
  args: {opts: {align: "start"}},
  render: (args) => (
    <div className="w-full max-w-sm">
      <Carousel {...args}>
        <Carousel.Content>
          {letters.map((label) => (
            <Carousel.Item key={label} className="basis-1/3">
              <LetterCard label={label} size="text-2xl" />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>
    </div>
  ),
};

export const InfiniteLoop: Story = {
  args: {opts: {loop: true}},
  render: (args) => (
    <div className="w-full max-w-xs">
      <Carousel {...args}>
        <Carousel.Content>
          {letters.slice(0, 5).map((label) => (
            <Carousel.Item key={label}>
              <LetterCard label={label} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>
    </div>
  ),
};

export const Autoplay: Story = {
  render: () => <AutoplayCarousel />,
};

export const APIAccess: Story = {
  name: "API Access",
  render: () => <ApiAccessCarousel />,
};
