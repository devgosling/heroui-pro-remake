import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {ChatSource, ChatSources} from "./index";

const meta = {
  argTypes: {
    description: {control: "text"},
    enablePreview: {control: "boolean"},
    faviconUrl: {control: "text"},
    href: {control: "text"},
    sourceType: {control: "inline-radio", options: ["url", "document"]},
    title: {control: "text"},
  },
  component: ChatSource,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChatSource",
} satisfies Meta<typeof ChatSource>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
/** Centers a demo on the page, like the Pro demo frame (40px padding, full-height flex). */
const DemoPage = ({children}: {children: ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-10">{children}</div>
);

/** Public favicon service (the same 64px PNG for any site). */
const favicon = (url: string) =>
  `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`;

type DemoSource = {
  description: string;
  href: string;
  title: string;
};

const sources: DemoSource[] = [
  {
    description: "Next-generation frontend tooling with instant server start.",
    href: "https://vite.dev",
    title: "Vite",
  },
  {
    description: "Accessible, unstyled UI primitives and hooks from Adobe.",
    href: "https://react-spectrum.adobe.com",
    title: "React Aria",
  },
  {
    description: "The TypeScript handbook and language reference.",
    href: "https://www.typescriptlang.org",
    title: "TypeScript",
  },
  {
    description: "Where the world builds and ships software.",
    href: "https://github.com",
    title: "GitHub",
  },
  {
    description: "JavaScript runtime built on the V8 engine.",
    href: "https://nodejs.org",
    title: "Node.js",
  },
];

const renderSource = (source: DemoSource) => (
  <ChatSource
    key={source.href}
    description={source.description}
    faviconUrl={favicon(source.href)}
    href={source.href}
    title={source.title}
  />
);

/* -------------------------------------------------------------------------------------------------
 * Default - a link chip with a hover preview next to a document chip
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    description: "Fast, disk space efficient package manager for JavaScript.",
    faviconUrl: favicon("https://pnpm.io"),
    href: "https://pnpm.io",
    title: "pnpm",
  },
  render: (args) => (
    <DemoPage>
      <div className="flex flex-wrap items-center gap-2">
        <ChatSource {...args} />
        <ChatSource title="onboarding-checklist.docx" />
      </div>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Grouped - many sources folded behind stacked favicons and a count
 * -----------------------------------------------------------------------------------------------*/
export const Grouped: Story = {
  render: () => {
    const grouped = sources.slice(0, 3);

    return (
      <DemoPage>
        <ChatSources>
          <ChatSources.Trigger>
            <span className="inline-flex -space-x-1.5">
              {grouped.map((source) => (
                <img
                  key={source.href}
                  alt=""
                  className="size-5 rounded-full border border-background object-cover"
                  src={favicon(source.href)}
                />
              ))}
            </span>
            {grouped.length} sources
          </ChatSources.Trigger>
          <ChatSources.Content>
            <ChatSources.List>{grouped.map(renderSource)}</ChatSources.List>
          </ChatSources.Content>
        </ChatSources>
      </DemoPage>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Show More - the first sources and a "+N more" chip that toggles the rest
 * -----------------------------------------------------------------------------------------------*/
export const MaxVisible: Story = {
  name: "Show More",
  render: () => (
    <DemoPage>
      <ChatSources.List maxVisible={3}>{sources.map(renderSource)}</ChatSources.List>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Composable - a custom chip label and a custom preview for a source without title/description
 * -----------------------------------------------------------------------------------------------*/
export const Composable: Story = {
  render: () => (
    <DemoPage>
      <ChatSource enablePreview faviconUrl={favicon("https://vite.dev")} href="https://vite.dev">
        <ChatSource.Trigger>
          <ChatSource.Icon />
          <ChatSource.Title>Vite guide</ChatSource.Title>
        </ChatSource.Trigger>
        <ChatSource.Preview>
          <div className="flex max-w-72 flex-col gap-2">
            <div className="flex items-center gap-2">
              <ChatSource.Icon />
              <span className="text-sm font-medium text-foreground">vite.dev</span>
            </div>
            <p className="text-sm text-muted">
              Getting started with Vite, from scaffolding a project to building for production.
            </p>
          </div>
        </ChatSource.Preview>
      </ChatSource>
    </DemoPage>
  ),
};
