import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, ScrollShadow} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {
  EMOJI_CATEGORIES,
  EMOJI_RECENT_CATEGORY,
  EMOJI_SKIN_TONES,
  EmojiPicker,
  emojiPickerVariants,
  useEmojiPicker,
} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: EmojiPicker,
  parameters: {layout: "centered"},
  title: "Pro/Overlays/EmojiPicker",
} satisfies Meta<typeof EmojiPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
interface NavCategory {
  id: string;
  label: string;
  icon: ReactNode;
}

const categoryById = new Map(EMOJI_CATEGORIES.map((category) => [category.id, category]));

/** Navigation order of the footer (Activities before Travel & Places). */
const NAV_ORDER = [
  "smileys",
  "people",
  "nature",
  "food",
  "activities",
  "travel",
  "objects",
  "symbols",
  "flags",
];

const emojiNav: NavCategory[] = [
  EMOJI_RECENT_CATEGORY,
  ...NAV_ORDER.map((id) => categoryById.get(id)!),
].map(({icon, id, label}) => ({icon, id, label}));

const iconByCategory: Record<string, string> = {
  activities: "gravity-ui:gift",
  flags: "gravity-ui:flag",
  food: "gravity-ui:cup",
  nature: "gravity-ui:planet-earth",
  objects: "gravity-ui:bulb",
  people: "gravity-ui:hand-stop",
  smileys: "gravity-ui:face-smile",
  symbols: "gravity-ui:hashtag",
  travel: "gravity-ui:car",
};

const iconNav: NavCategory[] = NAV_ORDER.map((id) => ({
  icon: <Icon icon={iconByCategory[id]!} />,
  id,
  label: categoryById.get(id)!.label,
}));

/** Footer navigation: one ghost icon button per category, scrolling the grid on press. */
function CategoryNav({categories}: {categories: NavCategory[]}) {
  const {scrollToCategory} = useEmojiPicker();

  return (
    <ScrollShadow hideScrollBar orientation="horizontal">
      <div className="flex items-center gap-1 overflow-visible px-2 py-0.5 pr-3">
        {categories.map((category) => (
          <Button
            key={category.id}
            excludeFromTabOrder
            isIconOnly
            aria-label={category.label}
            className="flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-muted/20"
            variant="ghost"
            onPress={() => scrollToCategory(category.id)}
          >
            <span className="text-base">{category.icon}</span>
          </Button>
        ))}
      </div>
    </ScrollShadow>
  );
}

/** Search field with skin tones, the emoji grid and the category footer. */
function PickerContent({categories}: {categories: NavCategory[]}) {
  return (
    <EmojiPicker.Content>
      <EmojiPicker.SkinTonePicker>
        <EmojiPicker.SkinToneTrigger />
        <EmojiPicker.SkinToneContent>
          {EMOJI_SKIN_TONES.map((tone) => (
            <EmojiPicker.SkinToneOption key={tone.id} id={tone.id} />
          ))}
        </EmojiPicker.SkinToneContent>
      </EmojiPicker.SkinTonePicker>
      <EmojiPicker.Grid />
      <EmojiPicker.Footer>
        <CategoryNav categories={categories} />
      </EmojiPicker.Footer>
    </EmojiPicker.Content>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {"aria-label": "Reaction", defaultSelectedKey: "😊"},
  render: (args) => (
    <EmojiPicker {...args}>
      <EmojiPicker.Trigger className="text-xl">
        <EmojiPicker.Value />
      </EmojiPicker.Trigger>
      <EmojiPicker.Popover>
        <PickerContent categories={emojiNav} />
      </EmojiPicker.Popover>
    </EmojiPicker>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted">{size}</span>
          <EmojiPicker aria-label={`Status emoji ${size}`} defaultSelectedKey="🚀" size={size}>
            <EmojiPicker.Trigger className="text-xl">
              <EmojiPicker.Value />
            </EmojiPicker.Trigger>
            <EmojiPicker.Popover>
              <PickerContent categories={emojiNav} />
            </EmojiPicker.Popover>
          </EmojiPicker>
        </div>
      ))}
    </div>
  ),
};

export const Inline: Story = {
  render: () => (
    <EmojiPicker aria-label="Message emoji">
      <div className={emojiPickerVariants({size: "md"}).popover({className: "relative"})}>
        <PickerContent categories={emojiNav} />
      </div>
    </EmojiPicker>
  ),
};

export const CustomCategories: Story = {
  render: () => (
    <EmojiPicker aria-label="Topic emoji" defaultSelectedKey="😊">
      <EmojiPicker.Trigger className="text-xl">
        <EmojiPicker.Value />
      </EmojiPicker.Trigger>
      <EmojiPicker.Popover>
        <PickerContent categories={iconNav} />
      </EmojiPicker.Popover>
    </EmojiPicker>
  ),
};
