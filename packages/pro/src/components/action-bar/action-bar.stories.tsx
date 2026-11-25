import type {DataGridColumn} from "../data-grid";
import type {ActionBarProps} from "./index";
import type {Selection} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";

import {Avatar, Button, Chip, Separator} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {DataGrid} from "../data-grid";
import {ListView} from "../list-view";

import {ActionBar} from "./index";

/** Visual props exposed as Storybook controls (`isOpen` is driven by each story's selection). */
type ActionBarStoryArgs = Pick<ActionBarProps, "aria-label" | "isAttached" | "orientation">;

const meta: Meta<ActionBarStoryArgs> = {
  argTypes: {
    "aria-label": {control: "text"},
    isAttached: {control: "boolean"},
    orientation: {control: {type: "select"}, options: ["horizontal", "vertical"]},
  },
  args: {
    isAttached: true,
    orientation: "horizontal",
  },
  component: ActionBar as unknown as React.ComponentType<ActionBarStoryArgs>,
  decorators: [
    // Same frame as the Pro demo pages: centered content with a 24px gutter.
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {layout: "fullscreen"},
  title: "Pro/DataDisplay/ActionBar",
};

export default meta;

type Story = StoryObj<ActionBarStoryArgs>;

/* -------------------------------------------------------------------------------------------------
 * Shared helpers (story content only)
 * -----------------------------------------------------------------------------------------------*/
const selectionSize = (keys: Selection, total: number) => (keys === "all" ? total : keys.size);

interface BulkActionsProps extends ActionBarStoryArgs {
  count: number;
  /** Renders a separator between the regular actions and the destructive one. */
  separateDestructive?: boolean;
  onClear: () => void;
}

/** The action bar used by both stories: count chip, labelled actions and a clear button. */
const BulkActions = ({count, onClear, separateDestructive = false, ...args}: BulkActionsProps) => (
  <ActionBar {...args} isOpen={count > 0}>
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
      {separateDestructive ? <Separator /> : null}
      <Button aria-label="Remove" className="bg-danger/10 text-danger" size="sm" variant="ghost">
        <Icon icon="gravity-ui:trash-bin" />
        <span className="action-bar__label">Remove</span>
      </Button>
    </ActionBar.Content>
    <Separator />
    <ActionBar.Suffix>
      <Button isIconOnly aria-label="Deselect all" size="sm" variant="ghost" onPress={onClear}>
        <Icon icon="gravity-ui:xmark" />
      </Button>
    </ActionBar.Suffix>
  </ActionBar>
);

/* -------------------------------------------------------------------------------------------------
 * Default - bulk selection in a ListView
 * -----------------------------------------------------------------------------------------------*/
const documents = [
  {id: "roadmap", name: "Product roadmap 2026.key"},
  {id: "invoice", name: "Invoice INV-0482.pdf"},
  {id: "wireframes", name: "Checkout wireframes.fig"},
  {id: "headshots", name: "Speaker headshots.zip"},
  {id: "retro", name: "Sprint retro notes.md"},
  {id: "schema", name: "Database schema.sql"},
];

const DocumentsExample = (args: ActionBarStoryArgs) => {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set());
  const count = selectionSize(selectedKeys, documents.length);

  return (
    <div className="w-full max-w-lg p-4">
      <ListView
        aria-label="Documents"
        items={documents}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        onSelectionChange={setSelectedKeys}
      >
        {(item) => (
          <ListView.Item id={item.id} textValue={item.name}>
            <ListView.ItemContent>
              <ListView.Title>{item.name}</ListView.Title>
            </ListView.ItemContent>
          </ListView.Item>
        )}
      </ListView>
      <BulkActions
        {...args}
        separateDestructive
        count={count}
        onClear={() => setSelectedKeys(new Set())}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <DocumentsExample {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * With Data Grid - bulk actions for selected table rows
 * -----------------------------------------------------------------------------------------------*/
type MemberStatus = "active" | "invited" | "suspended";

interface Member {
  id: string;
  name: string;
  email: string;
  team: string;
  status: MemberStatus;
  joinedAt: string;
  avatar: number;
}

const members: Member[] = [
  {
    avatar: 31,
    email: "noor.haddad@northwind.io",
    id: "m1",
    joinedAt: "2024-03-12",
    name: "Noor Haddad",
    status: "active",
    team: "Design",
  },
  {
    avatar: 32,
    email: "tomas.lindqvist@northwind.io",
    id: "m2",
    joinedAt: "2023-11-02",
    name: "Tomas Lindqvist",
    status: "invited",
    team: "Finance",
  },
  {
    avatar: 33,
    email: "priya.raman@northwind.io",
    id: "m3",
    joinedAt: "2024-07-21",
    name: "Priya Raman",
    status: "active",
    team: "Platform",
  },
  {
    avatar: 34,
    email: "jonas.weber@northwind.io",
    id: "m4",
    joinedAt: "2022-09-30",
    name: "Jonas Weber",
    status: "active",
    team: "Operations",
  },
  {
    avatar: 35,
    email: "aiko.tanaka@northwind.io",
    id: "m5",
    joinedAt: "2025-01-08",
    name: "Aiko Tanaka",
    status: "invited",
    team: "Marketing",
  },
  {
    avatar: 36,
    email: "mateo.silva@northwind.io",
    id: "m6",
    joinedAt: "2023-05-17",
    name: "Mateo Silva",
    status: "active",
    team: "Platform",
  },
  {
    avatar: 37,
    email: "freya.olsen@northwind.io",
    id: "m7",
    joinedAt: "2024-10-03",
    name: "Freya Olsen",
    status: "active",
    team: "Legal",
  },
  {
    avatar: 38,
    email: "kwame.asante@northwind.io",
    id: "m8",
    joinedAt: "2022-12-14",
    name: "Kwame Asante",
    status: "suspended",
    team: "Support",
  },
];

const statusChip: Record<MemberStatus, {color: "success" | "warning" | "danger"; label: string}> = {
  active: {color: "success", label: "Active"},
  invited: {color: "warning", label: "Invited"},
  suspended: {color: "danger", label: "Suspended"},
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

const memberColumns: DataGridColumn<Member>[] = [
  {
    accessorKey: "name",
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <Avatar.Image
            alt={item.name}
            src={`https://img.heroui.chat/image/avatar?w=200&h=200&u=${item.avatar}`}
          />
          <Avatar.Fallback>{initials(item.name)}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.name}</span>
          <span className="text-xs text-muted">{item.email}</span>
        </div>
      </div>
    ),
    header: "Member",
    id: "name",
    isRowHeader: true,
  },
  {accessorKey: "team", allowsSorting: true, header: "Team", id: "team"},
  {
    accessorKey: "status",
    allowsSorting: true,
    cell: (item) => (
      <Chip color={statusChip[item.status].color} size="sm" variant="soft">
        <Icon height={16} icon="gravity-ui:circle-fill" width={6} />
        <Chip.Label>{statusChip[item.status].label}</Chip.Label>
      </Chip>
    ),
    header: "Status",
    id: "status",
  },
  {
    accessorKey: "joinedAt",
    allowsSorting: true,
    cell: (item) => (
      <span className="text-sm text-muted tabular-nums">
        {dateFormatter.format(new Date(item.joinedAt))}
      </span>
    ),
    header: "Joined",
    id: "joinedAt",
  },
];

const MembersExample = (args: ActionBarStoryArgs) => {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set());
  const count = selectionSize(selectedKeys, members.length);

  return (
    <div className="w-full max-w-4xl">
      <DataGrid
        showSelectionCheckboxes
        aria-label="Team members"
        columns={memberColumns}
        data={members}
        defaultSortDescriptor={{column: "name", direction: "ascending"}}
        getRowId={(item) => item.id}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        onSelectionChange={setSelectedKeys}
      />
      <BulkActions {...args} count={count} onClear={() => setSelectedKeys(new Set())} />
    </div>
  );
};

export const WithDataGrid: Story = {
  args: {"aria-label": "Bulk actions"},
  render: (args) => <MembersExample {...args} />,
};
