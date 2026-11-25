import type {ListViewProps} from "./index";
import type {Selection} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, Chip, Separator} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {ActionBar} from "../action-bar";

import {ListView} from "./index";

/** Visual / behavioural props exposed as Storybook controls. */
type ListViewStoryArgs = Pick<ListViewProps, "selectionBehavior" | "selectionMode" | "variant">;

const meta: Meta<ListViewStoryArgs> = {
  argTypes: {
    selectionBehavior: {
      control: "select",
      description: "Selection interaction model",
      options: ["toggle", "replace"],
      table: {defaultValue: {summary: "toggle"}},
    },
    selectionMode: {
      control: "select",
      description: "Item selection mode",
      options: ["none", "single", "multiple"],
      table: {defaultValue: {summary: "none"}},
    },
    variant: {
      control: "select",
      description: "Visual variant",
      options: ["primary", "secondary"],
      table: {defaultValue: {summary: "primary"}},
    },
  },
  args: {
    selectionBehavior: "toggle",
    selectionMode: "multiple",
    variant: "primary",
  },
  component: ListView as unknown as React.ComponentType<ListViewStoryArgs>,
  decorators: [
    // Same frame as the Pro demo pages: centered content with a 24px gutter.
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <Story />
      </div>
    ),
  ],
  title: "Pro/DataDisplay/ListView",
};

export default meta;

type Story = StoryObj<ListViewStoryArgs>;

/* -------------------------------------------------------------------------------------------------
 * Story data + helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
type Entry = {id: string; kind: "file" | "folder"; name: string; meta: string};

const entries: Entry[] = [
  {id: "1", kind: "folder", meta: "Modified 4 days ago", name: "Invoices"},
  {id: "2", kind: "folder", meta: "Modified 2 weeks ago", name: "Screenshots"},
  {id: "3", kind: "file", meta: "Modified 5 hours ago", name: "CHANGELOG.md"},
  {id: "4", kind: "file", meta: "Modified yesterday", name: "tsconfig.base.json"},
  {id: "5", kind: "folder", meta: "Modified a moment ago", name: "scripts"},
  {id: "6", kind: "file", meta: "Modified 3 weeks ago", name: ".env.example"},
];

const moreEntries: Entry[] = [
  ...entries,
  {id: "7", kind: "file", meta: "Modified 6 days ago", name: "vite.config.ts"},
  {id: "8", kind: "folder", meta: "Modified 2 days ago", name: "public"},
];

const EntryIcon = ({kind}: {kind: Entry["kind"]}) => (
  <Icon icon={kind === "folder" ? "gravity-ui:folder" : "gravity-ui:file"} />
);

/** Icon + title + description row, the layout shared by most demos. */
const EntryRow = ({entry}: {entry: Entry}) => (
  <ListView.Item id={entry.id} textValue={entry.name}>
    <ListView.ItemContent>
      <EntryIcon kind={entry.kind} />
      <div className="flex min-w-0 flex-col">
        <ListView.Title>{entry.name}</ListView.Title>
        <ListView.Description>{entry.meta}</ListView.Description>
      </div>
    </ListView.ItemContent>
  </ListView.Item>
);

const selectionCount = (keys: Selection, total: number) => (keys === "all" ? total : keys.size);

const selectionLabel = (keys: Selection, total: number) => {
  const count = selectionCount(keys, total);

  return count === 0 ? "None selected" : `${count} selected`;
};

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <ListView {...args} aria-label="Workspace files">
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </ListView>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Action Bar - bulk actions for the current selection
 * -----------------------------------------------------------------------------------------------*/
const WithActionBarExample = (args: ListViewStoryArgs) => {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set());
  const count = selectionCount(selectedKeys, moreEntries.length);

  return (
    <div className="w-full max-w-md">
      <ListView
        {...args}
        aria-label="Repository files"
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        onSelectionChange={setSelectedKeys}
      >
        {moreEntries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </ListView>
      <ActionBar aria-label="Bulk file actions" isOpen={count > 0}>
        <ActionBar.Prefix>
          <Chip className="shrink-0 tabular-nums" size="sm">
            {count}
          </Chip>
        </ActionBar.Prefix>
        <Separator />
        <ActionBar.Content>
          <Button aria-label="Rename" size="sm" variant="ghost">
            <Icon icon="gravity-ui:pencil" />
            <span className="action-bar__label">Rename</span>
          </Button>
          <Button aria-label="Download" size="sm" variant="ghost">
            <Icon icon="gravity-ui:arrow-down-to-line" />
            <span className="action-bar__label">Download</span>
          </Button>
          <Button aria-label="Move" size="sm" variant="ghost">
            <Icon icon="gravity-ui:folder-arrow-right" />
            <span className="action-bar__label">Move</span>
          </Button>
          <Separator />
          <Button
            aria-label="Remove"
            className="bg-danger/10 text-danger"
            size="sm"
            variant="ghost"
          >
            <Icon icon="gravity-ui:trash-bin" />
            <span className="action-bar__label">Remove</span>
          </Button>
        </ActionBar.Content>
        <Separator />
        <ActionBar.Suffix>
          <Button
            isIconOnly
            aria-label="Clear selection"
            size="sm"
            variant="ghost"
            onPress={() => setSelectedKeys(new Set())}
          >
            <Icon icon="gravity-ui:xmark" />
          </Button>
        </ActionBar.Suffix>
      </ActionBar>
    </div>
  );
};

export const WithActionBar: Story = {
  args: {selectionMode: "multiple"},
  render: (args) => <WithActionBarExample {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Secondary variant
 * -----------------------------------------------------------------------------------------------*/
export const Secondary: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <div className="w-full max-w-md">
      <ListView {...args} aria-label="Workspace files">
        {entries.slice(0, 5).map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </ListView>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Selection modes - none / single / multiple side by side
 * -----------------------------------------------------------------------------------------------*/
const ModeColumn = ({
  children,
  status,
  title,
}: {
  children: ReactNode;
  status?: string;
  title: string;
}) => (
  <div className="min-w-0 flex-1">
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {status ? <span className="text-xs text-muted">{status}</span> : null}
      </div>
      {children}
    </div>
  </div>
);

const SelectionModesExample = ({variant}: ListViewStoryArgs) => {
  const [single, setSingle] = React.useState<Selection>(new Set());
  const [multiple, setMultiple] = React.useState<Selection>(new Set());
  const items = entries.slice(0, 5);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8 sm:flex-row">
      <ModeColumn title="None">
        <ListView aria-label="None" selectionMode="none" variant={variant}>
          {items.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ListView>
      </ModeColumn>
      <ModeColumn status={selectionLabel(single, items.length)} title="Single">
        <ListView
          aria-label="Single"
          selectedKeys={single}
          selectionMode="single"
          variant={variant}
          onSelectionChange={setSingle}
        >
          {items.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ListView>
      </ModeColumn>
      <ModeColumn status={selectionLabel(multiple, items.length)} title="Multiple">
        <ListView
          aria-label="Multiple"
          selectedKeys={multiple}
          selectionMode="multiple"
          variant={variant}
          onSelectionChange={setMultiple}
        >
          {items.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ListView>
      </ModeColumn>
    </div>
  );
};

export const SelectionModes: Story = {
  render: (args) => <SelectionModesExample {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Disabled items
 * -----------------------------------------------------------------------------------------------*/
const plainEntries: Entry[] = [
  {id: "1", kind: "folder", meta: "", name: "Receipts"},
  {id: "2", kind: "file", meta: "", name: "Roadmap.pdf"},
  {id: "3", kind: "file", meta: "", name: "Legacy-export.csv"},
  {id: "4", kind: "folder", meta: "", name: "Wallpapers"},
  {id: "5", kind: "file", meta: "", name: "Snapshot-2024.7z"},
  {id: "6", kind: "file", meta: "", name: "LICENSE.txt"},
];

const lockedKeys = ["3", "5"];

export const DisabledItems: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <ListView {...args} aria-label="Workspace files" disabledKeys={lockedKeys}>
        {plainEntries.map((entry) => (
          <ListView.Item key={entry.id} id={entry.id} textValue={entry.name}>
            <ListView.ItemContent>
              <EntryIcon kind={entry.kind} />
              <div className="flex min-w-0 flex-col">
                <ListView.Title>{entry.name}</ListView.Title>
              </div>
            </ListView.ItemContent>
            {lockedKeys.includes(entry.id) ? (
              <ListView.ItemAction>
                <Icon className="size-3.5 text-muted" icon="gravity-ui:lock" />
              </ListView.ItemAction>
            ) : null}
          </ListView.Item>
        ))}
      </ListView>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Extra: empty state (renderEmptyState)
 * -----------------------------------------------------------------------------------------------*/
export const EmptyState: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <ListView
        {...args}
        aria-label="Search results"
        items={[] as Entry[]}
        renderEmptyState={() => (
          <div className="flex flex-col items-center gap-1 text-center">
            <Icon className="size-5 text-muted" icon="gravity-ui:magnifier" />
            <span className="text-sm font-medium">No matching files</span>
            <span className="text-xs text-muted">Try a different search term.</span>
          </div>
        )}
      >
        {(entry) => <EntryRow entry={entry} />}
      </ListView>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Extra: virtualized (dynamic collection, 5,000 rows)
 * -----------------------------------------------------------------------------------------------*/
const manyEntries: Entry[] = Array.from({length: 5000}, (_, index) => ({
  id: String(index + 1),
  kind: index % 4 === 0 ? "folder" : "file",
  meta: `Revision ${5000 - index}`,
  name: index % 4 === 0 ? `archive-${index + 1}` : `log-${String(index + 1).padStart(4, "0")}.txt`,
}));

export const Virtualized: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <ListView
        {...args}
        virtualized
        aria-label="Log files"
        className="h-[400px] overflow-auto"
        items={manyEntries}
        rowHeight={63}
      >
        {(entry) => <EntryRow entry={entry} />}
      </ListView>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Extra: infinite loading (ListView.LoadMore)
 * -----------------------------------------------------------------------------------------------*/
const PAGE_SIZE = 12;

const pageOf = (page: number): Entry[] =>
  Array.from({length: PAGE_SIZE}, (_, index) => {
    const n = page * PAGE_SIZE + index + 1;

    return {
      id: `page-${n}`,
      kind: "file",
      meta: `Uploaded batch ${page + 1}`,
      name: `photo-${n}.heic`,
    };
  });

const LoadMoreExample = (args: ListViewStoryArgs) => {
  const [rows, setRows] = React.useState<Entry[]>(() => pageOf(0));
  const [isLoading, setIsLoading] = React.useState(false);
  const hasMore = rows.length < PAGE_SIZE * 4;

  const loadMore = React.useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    window.setTimeout(() => {
      setRows((current) => [...current, ...pageOf(current.length / PAGE_SIZE)]);
      setIsLoading(false);
    }, 800);
  }, [hasMore, isLoading]);

  return (
    <div className="w-full max-w-md">
      <ListView {...args} aria-label="Camera uploads" className="h-[400px] overflow-auto">
        {rows.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
        {/* Unmount the sentinel once everything is loaded so the last row gets its end styles back
            (the `:last-child` rules cannot see past the sentinel element). */}
        {hasMore ? <ListView.LoadMore isLoading={isLoading} onLoadMore={loadMore} /> : null}
      </ListView>
    </div>
  );
};

export const LoadMore: Story = {
  render: (args) => <LoadMoreExample {...args} />,
};
