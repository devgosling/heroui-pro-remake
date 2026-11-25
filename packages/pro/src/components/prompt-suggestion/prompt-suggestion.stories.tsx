import type {Meta, StoryObj} from "@storybook/react";

import {Chip} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {PromptSuggestion} from "./index";

const meta = {
  argTypes: {
    variant: {control: {type: "select"}, options: ["pill", "card"]},
  },
  component: PromptSuggestion,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/PromptSuggestion",
} satisfies Meta<typeof PromptSuggestion>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Mirrors the demo page: a centred canvas (24px padding, 40px from `sm`) with a width-capped column. */
const DemoPage = ({children, maxWidth}: {children: React.ReactNode; maxWidth: string}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10">
    <div className={`mx-auto w-full ${maxWidth}`}>{children}</div>
  </div>
);

const pillPrompts = [
  "Write a polite follow-up to a client who has not replied",
  "Turn these bullet points into a short blog intro",
  "Suggest three dinner recipes with what is left in my fridge",
  "Compare two laptops for video editing on a budget",
  "Create a two-week study plan for a statistics exam",
  "Rewrite this paragraph so it sounds more confident",
];

export const Default: Story = {
  args: {variant: "pill"},
  render: (args) => (
    <DemoPage maxWidth="max-w-[714px]">
      <PromptSuggestion {...args}>
        <PromptSuggestion.Header>
          <PromptSuggestion.Title>How can I help you today?</PromptSuggestion.Title>
          <PromptSuggestion.Description>
            Type your own request or pick one of the ideas below to get going.
          </PromptSuggestion.Description>
        </PromptSuggestion.Header>
        <PromptSuggestion.Items>
          {pillPrompts.map((prompt) => (
            <PromptSuggestion.Item key={prompt}>{prompt}</PromptSuggestion.Item>
          ))}
        </PromptSuggestion.Items>
      </PromptSuggestion>
    </DemoPage>
  ),
};

const cardPrompts = [
  {description: "Draft a structured agenda with time boxes.", title: "Plan a workshop"},
  {description: "Summarise the key points of a long article.", title: "Digest a long read"},
  {description: "Collect pros, cons and a clear recommendation.", title: "Weigh a decision"},
];

export const Cards: Story = {
  args: {variant: "card"},
  render: (args) => (
    <DemoPage maxWidth="max-w-[960px]">
      <PromptSuggestion {...args}>
        <PromptSuggestion.Header>
          <PromptSuggestion.Title>Ideas to get you started</PromptSuggestion.Title>
          <PromptSuggestion.Description>
            Choose a starter to see the kinds of tasks this assistant handles well.
          </PromptSuggestion.Description>
        </PromptSuggestion.Header>
        <PromptSuggestion.Group
          description="Meetings, research and everyday decisions."
          label="Getting things done"
        >
          <PromptSuggestion.Items>
            {cardPrompts.map((prompt) => (
              <PromptSuggestion.Item key={prompt.title}>
                <PromptSuggestion.ItemHeader>
                  <PromptSuggestion.ItemTitle>{prompt.title}</PromptSuggestion.ItemTitle>
                  <PromptSuggestion.ItemDescription>
                    {prompt.description}
                  </PromptSuggestion.ItemDescription>
                </PromptSuggestion.ItemHeader>
              </PromptSuggestion.Item>
            ))}
          </PromptSuggestion.Items>
        </PromptSuggestion.Group>
      </PromptSuggestion>
    </DemoPage>
  ),
};

const groups = [
  {
    description: "Copy, outlines and edits for any channel.",
    items: [
      {
        description: "Outline a launch post with a hook and a call to action.",
        meta: "2 min",
        tags: ["Marketing", "Blog"],
        title: "Announcement draft",
      },
      {
        description: "Tighten wording and fix tone without changing meaning.",
        meta: "1 min",
        tags: ["Editing"],
        title: "Polish my text",
      },
      {
        description: "Five subject lines ranked by expected open rate.",
        meta: "30 sec",
        tags: ["Email", "Ideas"],
        title: "Subject lines",
      },
    ],
    label: "Writing",
  },
  {
    description: "Spreadsheets, numbers and quick explanations.",
    items: [
      {
        description: "Explain what drives the change between two quarters.",
        meta: "3 min",
        tags: ["Finance"],
        title: "Explain a trend",
      },
      {
        description: "Write a formula that matches rows across two sheets.",
        meta: "1 min",
        tags: ["Spreadsheets", "Formulas"],
        title: "Lookup formula",
      },
      {
        description: "List the questions a reviewer would ask about this data.",
        meta: "2 min",
        tags: ["Review"],
        title: "Stress-test a report",
      },
    ],
    label: "Analysis",
  },
];

export const CardsWithTags: Story = {
  args: {variant: "card"},
  render: (args) => (
    <DemoPage maxWidth="max-w-[960px]">
      <PromptSuggestion {...args}>
        <PromptSuggestion.Header>
          <PromptSuggestion.Title>Browse starter prompts</PromptSuggestion.Title>
          <PromptSuggestion.Description>
            Grouped by task, with an estimate of how long each answer takes.
          </PromptSuggestion.Description>
        </PromptSuggestion.Header>
        {groups.map((group) => (
          <PromptSuggestion.Group
            key={group.label}
            description={group.description}
            label={group.label}
          >
            <PromptSuggestion.Items>
              {group.items.map((item) => (
                <PromptSuggestion.Item key={item.title}>
                  <PromptSuggestion.ItemHeader>
                    <PromptSuggestion.ItemTitle>{item.title}</PromptSuggestion.ItemTitle>
                    <PromptSuggestion.ItemDescription>
                      {item.description}
                    </PromptSuggestion.ItemDescription>
                  </PromptSuggestion.ItemHeader>
                  <PromptSuggestion.ItemFooter>
                    <PromptSuggestion.ItemTags>
                      {item.tags.map((tag) => (
                        <Chip key={tag} size="sm">
                          {tag}
                        </Chip>
                      ))}
                    </PromptSuggestion.ItemTags>
                    <PromptSuggestion.ItemMeta>{item.meta}</PromptSuggestion.ItemMeta>
                  </PromptSuggestion.ItemFooter>
                </PromptSuggestion.Item>
              ))}
            </PromptSuggestion.Items>
          </PromptSuggestion.Group>
        ))}
      </PromptSuggestion>
    </DemoPage>
  ),
};

export const LinksAndStates: Story = {
  args: {variant: "pill"},
  render: (args) => (
    <DemoPage maxWidth="max-w-[714px]">
      <PromptSuggestion {...args}>
        <PromptSuggestion.Header>
          <PromptSuggestion.Title>Jump back in</PromptSuggestion.Title>
        </PromptSuggestion.Header>
        <PromptSuggestion.Items>
          <PromptSuggestion.Item href="#recent-chat">
            Open my last conversation
          </PromptSuggestion.Item>
          <PromptSuggestion.Item href="#templates">Browse prompt templates</PromptSuggestion.Item>
          <PromptSuggestion.Item showEndIcon={false}>
            <Icon className="me-2 size-4 shrink-0 text-muted" icon="gravity-ui:magic-wand" />
            Surprise me with a creative writing task
          </PromptSuggestion.Item>
          <PromptSuggestion.Item isDisabled>
            Analyse an uploaded file (no file yet)
          </PromptSuggestion.Item>
        </PromptSuggestion.Items>
      </PromptSuggestion>
    </DemoPage>
  ),
};
