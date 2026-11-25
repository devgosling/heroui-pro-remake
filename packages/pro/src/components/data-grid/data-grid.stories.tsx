import type {DataGridColumn, DataGridProps, DataGridSortDescriptor} from "./index";
import type {Key, Selection} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";

import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  Input,
  Label,
  Link,
  ListBox,
  Pagination,
  ProgressCircle,
  SearchField,
  Separator,
  Spinner,
  Switch,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {ActionBar} from "../action-bar";
import {AreaChart} from "../area-chart";
import {EmptyState as EmptyStateView} from "../empty-state";
import {InlineSelect} from "../inline-select";
import {NumberStepper} from "../number-stepper";
import {Segment} from "../segment";

import {DataGrid} from "./index";

/** Visual props exposed as Storybook controls (the data props are fixed per story). */
type DataGridStoryArgs = Pick<
  DataGridProps<object>,
  | "allowsColumnResize"
  | "selectionMode"
  | "showSelectionCheckboxes"
  | "stickyHeader"
  | "variant"
  | "verticalAlign"
>;

const meta: Meta<DataGridStoryArgs> = {
  argTypes: {
    allowsColumnResize: {control: "boolean"},
    selectionMode: {control: {type: "select"}, options: ["none", "single", "multiple"]},
    showSelectionCheckboxes: {control: "boolean"},
    stickyHeader: {control: "boolean"},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
    verticalAlign: {control: {type: "select"}, options: ["top", "middle", "bottom"]},
  },
  component: DataGrid as unknown as React.ComponentType<DataGridStoryArgs>,
  parameters: {layout: "padded"},
  title: "Pro/DataDisplay/DataGrid",
};

export default meta;

type Story = StoryObj<DataGridStoryArgs>;

/* -------------------------------------------------------------------------------------------------
 * Shared helpers (story content only)
 * -----------------------------------------------------------------------------------------------*/
const createRandom = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
};

const pick = <V,>(random: () => number, list: readonly V[]): V =>
  list[Math.floor(random() * list.length)]!;

const currency = (value: number, digits = 2) =>
  value.toLocaleString("en-US", {
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
    style: "currency",
  });

const shortDate = (date: Date) =>
  date.toLocaleDateString("en-US", {day: "numeric", month: "short", year: "numeric"});

const StatusDot = () => (
  <svg aria-hidden="true" fill="none" height={16} viewBox="0 0 16 16" width={6}>
    <circle cx="8" cy="8" fill="currentColor" r="6" />
  </svg>
);

const RowActions = ({label = "Row actions"}: {label?: string}) => (
  <Dropdown>
    <Button isIconOnly aria-label={label} size="sm" variant="tertiary">
      <Icon icon="gravity-ui:ellipsis-vertical" />
    </Button>
    <Dropdown.Popover placement="bottom end">
      <Dropdown.Menu>
        <Dropdown.Item id="view" textValue="View details">
          <Label>View details</Label>
        </Dropdown.Item>
        <Dropdown.Item id="copy" textValue="Copy ID">
          <Label>Copy ID</Label>
        </Dropdown.Item>
        <Dropdown.Item id="remove" textValue="Remove" variant="danger">
          <Label>Remove</Label>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const ColumnsMenu = ({
  columns,
  onChange,
  visible,
}: {
  columns: {id: string; label: string}[];
  onChange: (keys: Set<string>) => void;
  visible: Set<string>;
}) => (
  <Dropdown>
    <Button size="sm" variant="secondary">
      <Icon icon="gravity-ui:layout-columns-3" />
      Columns
    </Button>
    <Dropdown.Popover placement="bottom end">
      <Dropdown.Menu
        aria-label="Visible columns"
        selectedKeys={visible}
        selectionMode="multiple"
        onSelectionChange={(keys) =>
          onChange(new Set(keys === "all" ? columns.map((c) => c.id) : [...keys].map(String)))
        }
      >
        {columns.map((column) => (
          <Dropdown.Item key={column.id} id={column.id} textValue={column.label}>
            <Label>{column.label}</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const FilterMenu = ({
  icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) => (
  <Dropdown>
    <Button size="sm" variant="secondary">
      <Icon icon={icon} />
      {label}
    </Button>
    <Dropdown.Popover placement="bottom start">
      <Dropdown.Menu
        aria-label={label}
        selectedKeys={new Set([value])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const [next] = keys === "all" ? [] : [...keys];

          onChange(next ? String(next) : "all");
        }}
      >
        {["all", ...options].map((option) => (
          <Dropdown.Item key={option} id={option} textValue={option}>
            <Label className="capitalize">{option === "all" ? "All" : option}</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const usePagination = <V,>(items: V[], pageSize: number) => {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;

  return {
    end: Math.min(start + pageSize, items.length),
    page: current,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    setPage,
    start,
  };
};

const PageLinks = ({
  page,
  pageCount,
  setPage,
}: {
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
}) => {
  const pages: (number | "ellipsis")[] =
    pageCount <= 5
      ? Array.from({length: pageCount}, (_, i) => i + 1)
      : page <= 2
        ? [1, 2, "ellipsis", pageCount]
        : page >= pageCount - 1
          ? [1, "ellipsis", pageCount - 1, pageCount]
          : [1, "ellipsis", page, "ellipsis", pageCount];

  return (
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.Previous isDisabled={page === 1} onPress={() => setPage(page - 1)}>
          <Pagination.PreviousIcon />
        </Pagination.Previous>
      </Pagination.Item>
      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <Pagination.Item key={`ellipsis-${index}`}>
            <Pagination.Ellipsis />
          </Pagination.Item>
        ) : (
          <Pagination.Item key={entry}>
            <Pagination.Link isActive={entry === page} onPress={() => setPage(entry)}>
              {entry}
            </Pagination.Link>
          </Pagination.Item>
        ),
      )}
      <Pagination.Item>
        <Pagination.Next isDisabled={page === pageCount} onPress={() => setPage(page + 1)}>
          <Pagination.NextIcon />
        </Pagination.Next>
      </Pagination.Item>
    </Pagination.Content>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Payments data (Default + Sticky header)
 * -----------------------------------------------------------------------------------------------*/
interface Payment {
  id: string;
  customer: string;
  email: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  amount: number;
  fee: number;
  method: string;
  region: string;
  description: string;
  date: Date;
}

const paymentStatusColor = {
  failed: "danger",
  pending: "warning",
  refunded: "default",
  succeeded: "success",
} as const;

const payments: Payment[] = (() => {
  const random = createRandom(11);
  const people = [
    "Noah Fischer",
    "Amelia Brooks",
    "Kenji Watanabe",
    "Lucia Moreno",
    "Oskar Lindqvist",
    "Priya Raman",
    "Theo Laurent",
    "Hana Kobayashi",
    "Felix Okoro",
    "Mira Novak",
    "Jonas Weber",
    "Sofia Rossi",
  ];
  const methods = [
    "Visa •••• 1881",
    "Mastercard •••• 5100",
    "Amex •••• 3005",
    "SEPA debit",
    "Apple Pay",
  ];
  const regions = ["Europe", "North America", "Asia Pacific", "Latin America"];
  const descriptions = [
    "Team plan renewal",
    "Usage overage, March",
    "Annual license, 25 seats",
    "Workshop booking",
    "Add-on: priority support",
    "Hardware deposit",
  ];
  const statuses: Payment["status"][] = ["succeeded", "succeeded", "pending", "failed", "refunded"];

  return people.map((customer, index) => {
    const amount = Math.round((120 + random() * 4200) * 100) / 100;

    return {
      amount,
      customer,
      date: new Date(2026, 0, 3 + Math.floor(random() * 300)),
      description: pick(random, descriptions),
      email: `${customer.split(" ")[0]!.toLowerCase()}@northwind.dev`,
      fee: Math.round(amount * 0.029 * 100) / 100,
      id: `txn_${(48213 + index * 7919).toString(36).toUpperCase()}`,
      method: pick(random, methods),
      region: pick(random, regions),
      status: pick(random, statuses),
    };
  });
})();

const paymentColumns: DataGridColumn<Payment>[] = [
  {
    accessorKey: "customer",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.customer}</span>
        <span className="text-xs text-muted">{item.email}</span>
      </div>
    ),
    header: "Customer",
    id: "customer",
    isRowHeader: true,
    minWidth: 200,
    width: 240,
  },
  {
    accessorKey: "id",
    allowsResizing: true,
    cellClassName: "font-mono text-xs text-muted",
    header: "Transaction ID",
    id: "id",
    minWidth: 130,
    width: 130,
  },
  {
    accessorKey: "status",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <Chip color={paymentStatusColor[item.status]} size="sm" variant="soft">
        <StatusDot />
        <Chip.Label className="capitalize">{item.status}</Chip.Label>
      </Chip>
    ),
    header: "Status",
    id: "status",
    minWidth: 120,
    width: 120,
  },
  {
    accessorKey: "amount",
    align: "end",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => <span className="font-medium tabular-nums">{currency(item.amount)}</span>,
    header: "Amount",
    id: "amount",
    minWidth: 110,
    width: 110,
  },
  {
    accessorKey: "fee",
    align: "end",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => <span className="text-muted tabular-nums">{currency(item.fee)}</span>,
    header: "Fee",
    id: "fee",
    minWidth: 90,
    width: 90,
  },
  {
    align: "end",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <span className="font-medium tabular-nums">{currency(item.amount - item.fee)}</span>
    ),
    header: "Net",
    id: "net",
    minWidth: 110,
    sortFn: (a, b) => a.amount - a.fee - (b.amount - b.fee),
    width: 110,
  },
  {
    accessorKey: "method",
    allowsResizing: true,
    header: "Payment Method",
    id: "method",
    minWidth: 170,
    width: 170,
  },
  {
    accessorKey: "region",
    allowsResizing: true,
    allowsSorting: true,
    header: "Region",
    id: "region",
    minWidth: 130,
    width: 130,
  },
  {
    accessorKey: "description",
    allowsResizing: true,
    cellClassName: "text-muted",
    header: "Description",
    id: "description",
    minWidth: 240,
    width: 240,
  },
  {
    accessorKey: "date",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => <span className="text-muted tabular-nums">{shortDate(item.date)}</span>,
    header: "Date",
    id: "date",
    minWidth: 120,
    width: 120,
  },
  {
    align: "end",
    cell: () => <RowActions />,
    header: "",
    id: "actions",
    pinned: "end",
    width: 75,
  },
];

/* -------------------------------------------------------------------------------------------------
 * Default (Payments): sorting, resizing, multi-selection, pinned row actions
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    allowsColumnResize: true,
    selectionMode: "multiple",
    showSelectionCheckboxes: true,
    variant: "primary",
    verticalAlign: "middle",
  },
  render: (args) => (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      <DataGrid
        {...args}
        aria-label="Payments"
        columns={paymentColumns}
        contentClassName="min-w-[1400px]"
        data={payments.slice(0, 7)}
        defaultSortDescriptor={{column: "customer", direction: "ascending"}}
        getRowId={(item) => item.id}
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Users (Usage): flat data, secondary variant
 * -----------------------------------------------------------------------------------------------*/
interface Person {
  id: number;
  name: string;
  title: string;
  email: string;
  role: string;
}

const people: Person[] = [
  {
    email: "ines.duarte@acme.dev",
    id: 1,
    name: "Ines Duarte",
    role: "Owner",
    title: "Engineering Manager",
  },
  {
    email: "rafael.kim@acme.dev",
    id: 2,
    name: "Rafael Kim",
    role: "Admin",
    title: "Product Designer",
  },
  {email: "greta.holm@acme.dev", id: 3, name: "Greta Holm", role: "Member", title: "Data Analyst"},
  {
    email: "omar.haddad@acme.dev",
    id: 4,
    name: "Omar Haddad",
    role: "Member",
    title: "Backend Engineer",
  },
  {email: "chloe.martin@acme.dev", id: 5, name: "Chloe Martin", role: "Viewer", title: "Recruiter"},
  {
    email: "dmitri.volkov@acme.dev",
    id: 6,
    name: "Dmitri Volkov",
    role: "Admin",
    title: "Site Reliability",
  },
];

const peopleColumns: DataGridColumn<Person>[] = [
  {
    accessorKey: "name",
    cellClassName: "font-medium",
    header: "Name",
    id: "name",
    isRowHeader: true,
  },
  {accessorKey: "title", header: "Title", id: "title"},
  {accessorKey: "email", header: "Email", id: "email"},
  {accessorKey: "role", header: "Role", id: "role"},
  {
    align: "end",
    cell: (item) => (
      <Link className="text-sm" onPress={() => undefined}>
        Edit<span className="sr-only">, {item.name}</span>
      </Link>
    ),
    header: "",
    id: "edit",
  },
];

export const Users: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Members</h2>
          <p className="text-sm text-muted">
            Everyone with access to this workspace and their role.
          </p>
        </div>
        <Button size="sm" variant="secondary">
          Invite member
        </Button>
      </div>
      <DataGrid
        {...args}
        aria-label="Members"
        columns={peopleColumns}
        data={people}
        getRowId={(item) => item.id}
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Team members: controlled sort, selection, pinned columns, resizing, visibility, search,
 * filters and client-side pagination
 * -----------------------------------------------------------------------------------------------*/
interface Member {
  id: string;
  workerId: string;
  externalWorkerId: string;
  name: string;
  email: string;
  country: {code: string; name: string};
  role: string;
  workerType: "Employee" | "Contractor";
  status: "Active" | "Inactive" | "Onboarding";
  startDate: Date;
  teams: string[];
}

const members: Member[] = (() => {
  const random = createRandom(7);
  const first = [
    "Ada",
    "Bram",
    "Cleo",
    "Dario",
    "Elif",
    "Finn",
    "Gaia",
    "Hugo",
    "Iris",
    "Jules",
    "Kai",
    "Lena",
    "Milo",
    "Nora",
    "Otto",
    "Pia",
    "Rui",
    "Saga",
    "Tove",
    "Uma",
  ];
  const last = [
    "Andersen",
    "Barros",
    "Costa",
    "Dubois",
    "Eriksen",
    "Ferrari",
    "Grant",
    "Huber",
    "Ivanova",
    "Jensen",
    "Keller",
    "Lopez",
    "Meyer",
    "Nakamura",
    "Olsen",
  ];
  const countries = [
    {code: "de", name: "Germany"},
    {code: "pt", name: "Portugal"},
    {code: "jp", name: "Japan"},
    {code: "ca", name: "Canada"},
    {code: "se", name: "Sweden"},
    {code: "br", name: "Brazil"},
  ];
  const roles = [
    "Software Engineer",
    "Designer",
    "Product Manager",
    "Data Scientist",
    "Support Lead",
    "QA Engineer",
  ];
  const teams = ["Platform", "Growth", "Mobile", "Payments", "Infra", "Research"];
  const statuses: Member["status"][] = ["Active", "Active", "Active", "Inactive", "Onboarding"];

  return Array.from({length: 100}, (_, index) => {
    const name = `${pick(random, first)} ${pick(random, last)}`;
    const teamCount = 1 + Math.floor(random() * 2);

    return {
      country: pick(random, countries),
      email: `${name.toLowerCase().replace(" ", ".")}@studio.dev`,
      externalWorkerId: `EXT-${Math.floor(random() * 36 ** 6)
        .toString(36)
        .toUpperCase()
        .padStart(6, "0")}`,
      id: String(index + 1),
      name,
      role: pick(random, roles),
      startDate: new Date(2021, Math.floor(random() * 60), 1 + Math.floor(random() * 27)),
      status: pick(random, statuses),
      teams: Array.from(new Set(Array.from({length: teamCount}, () => pick(random, teams)))),
      workerId: `WRK-${(4100000 + Math.floor(random() * 899999)).toString()}`,
      workerType: random() > 0.7 ? "Contractor" : "Employee",
    };
  });
})();

const memberStatusColor = {Active: "success", Inactive: "danger", Onboarding: "warning"} as const;

const CopyValue = ({value}: {value: string}) => (
  <span className="inline-flex items-center gap-1">
    <Button
      isIconOnly
      aria-label="Copy"
      className="size-5 min-h-5 min-w-5 text-muted hover:text-foreground"
      size="sm"
      variant="ghost"
      onPress={() => void navigator.clipboard?.writeText(value)}
    >
      <Icon className="size-3" icon="gravity-ui:copy" />
    </Button>
    <span className="text-xs text-muted">{value}</span>
  </span>
);

const memberColumnDefs: DataGridColumn<Member>[] = [
  {
    accessorKey: "workerId",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => <CopyValue value={item.workerId} />,
    header: "Worker ID",
    id: "workerId",
    isRowHeader: true,
    minWidth: 100,
    width: 100,
  },
  {
    accessorKey: "externalWorkerId",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => <CopyValue value={item.externalWorkerId} />,
    header: "External Worker ID",
    id: "externalWorkerId",
    minWidth: 160,
    width: 160,
  },
  {
    accessorKey: "name",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <Avatar.Fallback>
            {item.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.name}</span>
          <span className="text-xs text-muted">{item.email}</span>
        </div>
      </div>
    ),
    header: "Member",
    id: "name",
    minWidth: 220,
    pinned: "start",
    width: 220,
  },
  {
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <span className="inline-flex items-center gap-2">
        <img
          alt={item.country.name}
          className="shrink-0 rounded-sm object-cover"
          height={14}
          src={`https://flagcdn.com/h20/${item.country.code}.png`}
          width={20}
        />
        <span className="text-sm">{item.country.name}</span>
      </span>
    ),
    header: "Country",
    id: "country",
    minWidth: 140,
    sortFn: (a, b) => a.country.name.localeCompare(b.country.name),
    width: 140,
  },
  {
    accessorKey: "role",
    allowsResizing: true,
    allowsSorting: true,
    header: "Role",
    id: "role",
    minWidth: 140,
    width: 140,
  },
  {
    accessorKey: "workerType",
    allowsResizing: true,
    allowsSorting: true,
    header: "Worker Type",
    id: "workerType",
    minWidth: 110,
    width: 110,
  },
  {
    accessorKey: "status",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <Chip color={memberStatusColor[item.status]} size="sm" variant="soft">
        <StatusDot />
        <Chip.Label>{item.status}</Chip.Label>
      </Chip>
    ),
    header: "Status",
    id: "status",
    minWidth: 100,
    width: 100,
  },
  {
    accessorKey: "startDate",
    allowsResizing: true,
    allowsSorting: true,
    cell: (item) => (
      <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
        <Icon className="size-3.5 text-muted" icon="gravity-ui:calendar" />
        {item.startDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
    ),
    header: "Start Date",
    id: "startDate",
    minWidth: 150,
    width: 150,
  },
  {
    allowsResizing: true,
    cell: (item) => (
      <span className="inline-flex items-center gap-1">
        {item.teams.map((team) => (
          <Chip key={team} size="sm" variant="secondary">
            {team}
          </Chip>
        ))}
      </span>
    ),
    header: "Teams",
    id: "teams",
    minWidth: 260,
    width: 260,
  },
  {
    align: "end",
    allowsResizing: true,
    cell: () => <RowActions />,
    header: "",
    id: "actions",
    minWidth: 50,
    pinned: "end",
    width: 50,
  },
];

const sortMembers = (list: Member[], descriptor: DataGridSortDescriptor) => {
  const column = memberColumnDefs.find((col) => col.id === descriptor.column);
  const direction = descriptor.direction === "descending" ? -1 : 1;

  return [...list].sort((a, b) => {
    if (column?.sortFn) return direction * column.sortFn(a, b);
    const key = (column?.accessorKey ?? "name") as keyof Member;
    const left = a[key];
    const right = b[key];

    if (left instanceof Date && right instanceof Date) {
      return direction * (left.getTime() - right.getTime());
    }

    return direction * String(left).localeCompare(String(right));
  });
};

const RowsPerPage = ({onChange, value}: {onChange: (value: number) => void; value: number}) => (
  <InlineSelect
    aria-label="Rows per page"
    value={String(value)}
    onChange={(next) => {
      if (next != null) onChange(Number(next));
    }}
  >
    <InlineSelect.Trigger>
      <span className="text-muted">Rows per page</span>
      <InlineSelect.Value />
      <InlineSelect.Indicator />
    </InlineSelect.Trigger>
    <InlineSelect.Popover className="w-[120px]">
      <ListBox>
        {[10, 25, 50, 100].map((size) => (
          <ListBox.Item key={size} id={String(size)} textValue={String(size)}>
            {size}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </InlineSelect.Popover>
  </InlineSelect>
);

const TeamMembersExample = () => {
  const [query, setQuery] = React.useState("");
  const [workerType, setWorkerType] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set());
  const [sortDescriptor, setSortDescriptor] = React.useState<DataGridSortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const toggleable = memberColumnDefs
    .filter((col) => col.id !== "actions" && col.id !== "name")
    .map((col) => ({id: col.id, label: String(col.header)}));
  const [visible, setVisible] = React.useState(() => new Set(toggleable.map((col) => col.id)));

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = members.filter(
      (member) =>
        (workerType === "all" || member.workerType === workerType) &&
        (status === "all" || member.status === status) &&
        (!needle ||
          member.name.toLowerCase().includes(needle) ||
          member.email.toLowerCase().includes(needle)),
    );

    return sortMembers(list, sortDescriptor);
  }, [query, sortDescriptor, status, workerType]);

  const pagination = usePagination(filtered, pageSize);
  const columns = memberColumnDefs.filter(
    (col) => col.id === "actions" || col.id === "name" || visible.has(col.id),
  );
  const selectedCount = selectedKeys === "all" ? filtered.length : selectedKeys.size;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">People</h2>
          <Chip size="sm" variant="soft">
            {members.length}
          </Chip>
        </div>
        <Button>
          New hire
          <Icon icon="gravity-ui:plus" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchField aria-label="Search people" value={query} onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-[200px]" placeholder="Search..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <FilterMenu
          icon="gravity-ui:funnel"
          label="Worker Type"
          options={["Employee", "Contractor"]}
          value={workerType}
          onChange={setWorkerType}
        />
        <FilterMenu
          icon="gravity-ui:funnel"
          label="Status"
          options={["Active", "Inactive", "Onboarding"]}
          value={status}
          onChange={setStatus}
        />
        <FilterMenu
          icon="gravity-ui:sliders"
          label="Sort"
          options={["name", "startDate", "status"]}
          value={String(sortDescriptor.column)}
          onChange={(column) =>
            setSortDescriptor({column: column === "all" ? "name" : column, direction: "ascending"})
          }
        />
        <ColumnsMenu columns={toggleable} visible={visible} onChange={setVisible} />
      </div>
      <DataGrid
        allowsColumnResize
        showSelectionCheckboxes
        aria-label="People"
        columns={columns}
        contentClassName="min-w-[1600px]"
        data={pagination.pageItems}
        footerClassName="justify-between whitespace-nowrap text-xs"
        getRowId={(item) => item.id}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        footer={
          <>
            <Pagination size="sm">
              <PageLinks
                page={pagination.page}
                pageCount={pagination.pageCount}
                setPage={pagination.setPage}
              />
            </Pagination>
            <div className="flex items-center gap-3">
              <RowsPerPage value={pageSize} onChange={setPageSize} />
              <Separator className="!h-4" orientation="vertical" />
              <span className="text-muted">
                {selectedCount} of {filtered.length} selected
              </span>
              <div className="flex gap-2">
                <Button
                  isDisabled={pagination.page === 1}
                  size="sm"
                  variant="secondary"
                  onPress={() => pagination.setPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  isDisabled={pagination.page === pagination.pageCount}
                  size="sm"
                  variant="secondary"
                  onPress={() => pagination.setPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        }
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      />
    </div>
  );
};

export const TeamMembers: Story = {
  render: () => <TeamMembersExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Pinned columns (dense CRM table with start-pinned name column)
 * -----------------------------------------------------------------------------------------------*/
interface Company {
  id: number;
  name: string;
  color: string;
  categories: string[];
  handle: string;
  lastInteraction: string;
  strength: "Very strong" | "Strong" | "Weak" | "None";
  followers: number;
}

const categoryStyles: Record<string, string> = {
  AI: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  B2B: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  Fintech: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Hardware: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  Health: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  SaaS: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const companies: Company[] = [
  ["Lumen Labs", "bg-violet-500", ["AI", "B2B"], "lumenlabs", "2 days ago", "Very strong", 48210],
  ["Northbeam", "bg-sky-500", ["SaaS", "B2B"], "northbeam", "1 week ago", "Strong", 12045],
  ["Quillstack", "bg-amber-500", ["SaaS"], "quillstack", "No contact", "None", 3920],
  ["Harbor Health", "bg-pink-500", ["Health", "AI"], "harborhealth", "3 weeks ago", "Weak", 88104],
  ["Coinlet", "bg-emerald-500", ["Fintech"], "coinlet", "Yesterday", "Very strong", 152330],
  [
    "Forge Robotics",
    "bg-orange-500",
    ["Hardware", "AI"],
    "forgerobotics",
    "1 month ago",
    "Weak",
    20877,
  ],
  ["Tidewater", "bg-cyan-500", ["B2B", "Fintech"], "tidewater", "No contact", "None", 7311],
  ["Pebble Pay", "bg-lime-500", ["Fintech", "SaaS"], "pebblepay", "4 days ago", "Strong", 61209],
  ["Orbitron", "bg-indigo-500", ["Hardware"], "orbitron", "2 months ago", "Weak", 15002],
  ["Sundial", "bg-yellow-500", ["SaaS", "Health"], "sundialhq", "Today", "Very strong", 9480],
  ["Vantage AI", "bg-fuchsia-500", ["AI"], "vantageai", "5 days ago", "Strong", 230118],
  ["Mosaic Grid", "bg-rose-500", ["B2B"], "mosaicgrid", "No contact", "None", 1204],
  ["Keystone Bio", "bg-teal-500", ["Health"], "keystonebio", "3 days ago", "Strong", 33870],
].map(([name, color, categories, handle, lastInteraction, strength, followers], index) => ({
  categories: categories as string[],
  color: color as string,
  followers: followers as number,
  handle: handle as string,
  id: index + 1,
  lastInteraction: lastInteraction as string,
  name: name as string,
  strength: strength as Company["strength"],
}));

const strengthColor = {
  None: "text-muted",
  Strong: "text-success",
  "Very strong": "text-success",
  Weak: "text-warning",
} as const;

const companyColumns: DataGridColumn<Company>[] = [
  {
    accessorKey: "name",
    allowsSorting: true,
    cell: (item) => (
      <span className="inline-flex items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${item.color}`} />
        <span className="text-xs font-medium">{item.name}</span>
      </span>
    ),
    header: "Company",
    id: "name",
    isRowHeader: true,
    minWidth: 160,
    pinned: "start",
  },
  {
    cell: (item) => (
      <span className="inline-flex flex-wrap items-center gap-1">
        {item.categories.map((category) => (
          <span
            key={category}
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] leading-none font-medium ${categoryStyles[category]}`}
          >
            {category}
          </span>
        ))}
      </span>
    ),
    header: "Categories",
    id: "categories",
  },
  {
    cell: (item) => (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Icon className="size-3 shrink-0 opacity-50" icon="gravity-ui:link" />
        {item.handle}
      </span>
    ),
    header: "LinkedIn",
    id: "linkedIn",
  },
  {
    accessorKey: "lastInteraction",
    allowsSorting: true,
    cell: (item) => <span className="text-xs text-muted">{item.lastInteraction}</span>,
    header: "Last interaction",
    id: "lastInteraction",
  },
  {
    accessorKey: "strength",
    allowsSorting: true,
    cell: (item) => (
      <span className={`inline-flex items-center gap-1.5 text-xs ${strengthColor[item.strength]}`}>
        <Icon className="size-2" icon="gravity-ui:circle-fill" />
        {item.strength === "None" ? "No communication" : item.strength}
      </span>
    ),
    header: "Connection strength",
    id: "strength",
  },
  {
    accessorKey: "followers",
    align: "end",
    allowsSorting: true,
    cell: (item) => (
      <span className="text-xs tabular-nums">{item.followers.toLocaleString("en-US")}</span>
    ),
    header: "Twitter followers",
    id: "followers",
  },
  {
    cell: (item) => <span className="text-xs text-accent">@{item.handle}</span>,
    header: "Twitter",
    id: "twitter",
  },
];

export const PinnedColumns: Story = {
  render: () => (
    <div
      className="flex w-full flex-col gap-3"
      style={{"--radius": "0.375rem", "--spacing": "0.2rem"} as React.CSSProperties}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Accounts</h2>
          <Button size="sm" variant="ghost">
            <span className="size-2 shrink-0 rounded-full bg-success" />
            All accounts
            <Icon className="size-3 text-muted" icon="gravity-ui:chevron-down" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Icon className="size-3.5" icon="gravity-ui:bars-descending-align-left" />
            Sort
          </Button>
          <Button size="sm" variant="ghost">
            <Icon className="size-3.5" icon="gravity-ui:funnel" />
            Filter
          </Button>
          <Separator className="!h-4 self-center" orientation="vertical" />
          <SearchField aria-label="Search accounts">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input className="w-[140px] text-xs" placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>
      <DataGrid
        showSelectionCheckboxes
        aria-label="Accounts"
        className="[&_.table__cell]:py-1.5 [&_.table__cell]:text-xs [&_.table__column]:py-1.5 [&_.table__column]:text-[11px]"
        columns={companyColumns}
        contentClassName="min-w-[1100px]"
        data={companies}
        footer={<span className="text-xs text-muted">{companies.length} count</span>}
        getRowId={(item) => item.id}
        selectionMode="multiple"
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Expandable rows (tree data)
 * -----------------------------------------------------------------------------------------------*/
interface FileNode {
  id: string;
  name: string;
  kind: "Folder" | "Image" | "Text" | "Video" | "Code";
  size: string;
  modified: string;
  children?: FileNode[];
}

const files: FileNode[] = [
  {
    children: [
      {
        children: [
          {id: "3", kind: "Code", modified: "Jul 18, 2026", name: "button.tsx", size: "4 KB"},
          {id: "4", kind: "Code", modified: "Jul 21, 2026", name: "table.tsx", size: "11 KB"},
        ],
        id: "2",
        kind: "Folder",
        modified: "Jul 21, 2026",
        name: "components",
        size: "2 items",
      },
      {id: "8", kind: "Text", modified: "Jun 2, 2026", name: "CHANGELOG.md", size: "7 KB"},
    ],
    id: "1",
    kind: "Folder",
    modified: "Aug 4, 2026",
    name: "src",
    size: "2 items",
  },
  {
    children: [
      {id: "6", kind: "Image", modified: "May 9, 2026", name: "cover.png", size: "1.4 MB"},
      {id: "7", kind: "Video", modified: "May 11, 2026", name: "teaser.mp4", size: "38 MB"},
    ],
    id: "5",
    kind: "Folder",
    modified: "May 11, 2026",
    name: "media",
    size: "2 items",
  },
  {id: "9", kind: "Text", modified: "Mar 30, 2026", name: "README.md", size: "3 KB"},
];

const kindColor = {
  Code: "accent",
  Folder: "warning",
  Image: "success",
  Text: "default",
  Video: "danger",
} as const;

const kindIcon = {
  Code: "gravity-ui:file-code",
  Folder: "gravity-ui:folder-fill",
  Image: "gravity-ui:picture",
  Text: "gravity-ui:file-text",
  Video: "gravity-ui:filmstrip",
} as const;

const fileColumns: DataGridColumn<FileNode>[] = [
  {
    accessorKey: "name",
    cell: (item) => (
      <span className="flex min-w-0 items-center gap-2">
        <Icon
          className={`size-4 shrink-0 ${item.kind === "Folder" ? "text-warning" : "text-muted"}`}
          icon={kindIcon[item.kind]}
        />
        <span className="truncate text-sm font-medium">{item.name}</span>
      </span>
    ),
    header: "Name",
    id: "name",
    isRowHeader: true,
  },
  {
    accessorKey: "kind",
    cell: (item) => (
      <Chip color={kindColor[item.kind]} size="sm" variant="soft">
        {item.kind}
      </Chip>
    ),
    header: "Type",
    id: "kind",
  },
  {
    accessorKey: "size",
    align: "end",
    cellClassName: "text-muted text-sm tabular-nums",
    header: "Size",
    id: "size",
  },
  {
    accessorKey: "modified",
    cellClassName: "text-muted text-sm tabular-nums",
    header: "Date Modified",
    id: "modified",
  },
];

const ExpandableRowsExample = () => {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<Key>>(new Set(["1"]));

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <DataGrid
        aria-label="Repository files"
        columns={fileColumns}
        contentClassName="min-w-[660px]"
        data={files}
        expandedKeys={expandedKeys}
        getChildren={(item) => item.children}
        getRowId={(item) => item.id}
        treeColumn="name"
        onExpandedChange={setExpandedKeys}
      />
    </div>
  );
};

export const ExpandableRows: Story = {
  render: () => <ExpandableRowsExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Editable cells
 * -----------------------------------------------------------------------------------------------*/
interface Flag {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  effort: number;
  enabled: boolean;
}

const initialFlags: Flag[] = [
  {effort: 5, enabled: true, id: "f1", priority: "high", title: "New checkout flow"},
  {effort: 3, enabled: false, id: "f2", priority: "medium", title: "Saved filters"},
  {effort: 8, enabled: true, id: "f3", priority: "high", title: "Offline mode"},
  {effort: 2, enabled: true, id: "f4", priority: "low", title: "Emoji reactions"},
  {effort: 13, enabled: false, id: "f5", priority: "medium", title: "Audit log export"},
  {effort: 5, enabled: true, id: "f6", priority: "low", title: "Keyboard shortcuts"},
  {effort: 3, enabled: true, id: "f7", priority: "medium", title: "Usage insights"},
  {effort: 8, enabled: false, id: "f8", priority: "high", title: "SAML single sign-on"},
];

const priorityColor = {high: "danger", low: "default", medium: "warning"} as const;

const EditableTitle = ({onChange, value}: {onChange: (value: string) => void; value: string}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  if (isEditing) {
    return (
      <Input
        autoFocus
        aria-label="Feature title"
        className="h-8 w-full text-sm"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          setIsEditing(false);
          if (draft.trim()) onChange(draft.trim());
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") (event.target as HTMLInputElement).blur();
          if (event.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <div className="group/edit flex items-center gap-1.5">
      <span className="text-sm font-medium">{value}</span>
      <Button
        isIconOnly
        aria-label="Edit title"
        className="opacity-0 group-hover/edit:opacity-100 focus-visible:opacity-100"
        size="sm"
        variant="ghost"
        onPress={() => {
          setDraft(value);
          setIsEditing(true);
        }}
      >
        <Icon icon="gravity-ui:pencil" />
      </Button>
    </div>
  );
};

const PrioritySelect = ({
  onChange,
  value,
}: {
  onChange: (value: Flag["priority"]) => void;
  value: Flag["priority"];
}) => (
  <InlineSelect
    aria-label="Priority"
    value={value}
    onChange={(next) => {
      if (next != null) onChange(next as Flag["priority"]);
    }}
  >
    <InlineSelect.Trigger>
      <InlineSelect.Value />
      <InlineSelect.Indicator />
    </InlineSelect.Trigger>
    <InlineSelect.Popover className="w-[140px]">
      <ListBox>
        {(["high", "medium", "low"] as const).map((option) => (
          <ListBox.Item key={option} id={option} textValue={option}>
            <Chip color={priorityColor[option]} size="sm" variant="soft">
              <Chip.Label className="capitalize">{option}</Chip.Label>
            </Chip>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </InlineSelect.Popover>
  </InlineSelect>
);

const EditableCellsExample = () => {
  const [flags, setFlags] = React.useState(initialFlags);
  const update = (id: string, patch: Partial<Flag>) =>
    setFlags((current) => current.map((flag) => (flag.id === id ? {...flag, ...patch} : flag)));

  const columns: DataGridColumn<Flag>[] = [
    {
      cell: (item) => (
        <EditableTitle value={item.title} onChange={(title) => update(item.id, {title})} />
      ),
      header: "Feature",
      id: "title",
      isRowHeader: true,
    },
    {
      cell: (item) => (
        <PrioritySelect
          value={item.priority}
          onChange={(priority) => update(item.id, {priority})}
        />
      ),
      header: "Priority",
      id: "priority",
    },
    {
      align: "center",
      cell: (item) => (
        <NumberStepper
          aria-label="Story points"
          minValue={0}
          size="sm"
          value={item.effort}
          onChange={(effort) => update(item.id, {effort})}
        >
          <NumberStepper.Group>
            <NumberStepper.DecrementButton />
            <NumberStepper.Value />
            <NumberStepper.IncrementButton />
          </NumberStepper.Group>
        </NumberStepper>
      ),
      header: "Story Points",
      id: "effort",
    },
    {
      align: "center",
      cell: (item) => (
        <Switch
          aria-label="Enabled"
          className="inline-flex"
          isSelected={item.enabled}
          onChange={(enabled) => update(item.id, {enabled})}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      ),
      header: "Enabled",
      id: "enabled",
    },
  ];

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Roadmap</h2>
        <p className="text-sm text-muted">
          Rename items, set a priority, estimate the effort and switch features on or off.
        </p>
      </div>
      <DataGrid aria-label="Roadmap" columns={columns} data={flags} getRowId={(item) => item.id} />
      <div className="flex items-center gap-4 text-sm text-muted">
        <span>
          {flags.filter((flag) => flag.enabled).length} of {flags.length} enabled
        </span>
        <span>Total effort: {flags.reduce((sum, flag) => sum + flag.effort, 0)} pts</span>
      </div>
    </div>
  );
};

export const EditableCells: Story = {
  render: () => <EditableCellsExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Drag and drop (row reorder)
 * -----------------------------------------------------------------------------------------------*/
interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  assignee: string;
  status: "To Do" | "In Progress" | "Review" | "Done";
}

const taskStatusColor = {
  Done: "success",
  "In Progress": "warning",
  Review: "accent",
  "To Do": "default",
} as const;

const initialTasks: Task[] = [
  {
    assignee: "Marta",
    id: "t1",
    priority: "high",
    status: "In Progress",
    title: "Migrate billing webhooks",
  },
  {assignee: "Leon", id: "t2", priority: "high", status: "To Do", title: "Fix flaky login test"},
  {assignee: "Yara", id: "t3", priority: "medium", status: "Review", title: "Dark mode for charts"},
  {assignee: "Sven", id: "t4", priority: "low", status: "To Do", title: "Update onboarding copy"},
  {assignee: "Marta", id: "t5", priority: "medium", status: "Done", title: "Cache avatar images"},
  {
    assignee: "Ibrahim",
    id: "t6",
    priority: "low",
    status: "To Do",
    title: "Remove legacy settings page",
  },
  {
    assignee: "Yara",
    id: "t7",
    priority: "high",
    status: "In Progress",
    title: "Rate limit public API",
  },
  {
    assignee: "Leon",
    id: "t8",
    priority: "medium",
    status: "Review",
    title: "CSV import progress bar",
  },
];

const taskColumns: DataGridColumn<Task>[] = [
  {accessorKey: "title", header: "Task", id: "title", isRowHeader: true},
  {
    accessorKey: "priority",
    cell: (item) => (
      <Chip color={priorityColor[item.priority]} size="sm" variant="soft">
        <Chip.Label className="capitalize">{item.priority}</Chip.Label>
      </Chip>
    ),
    header: "Priority",
    id: "priority",
  },
  {accessorKey: "assignee", header: "Assignee", id: "assignee"},
  {
    accessorKey: "status",
    cell: (item) => (
      <Chip color={taskStatusColor[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "Status",
    id: "status",
  },
];

const DragAndDropExample = () => {
  const [tasks, setTasks] = React.useState(initialTasks);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm text-muted">
        Drag a row to change its position, or focus a handle and press Enter, the arrow keys and
        Enter again.
      </p>
      <DataGrid
        aria-label="Sprint tasks"
        columns={taskColumns}
        data={tasks}
        getRowId={(item) => item.id}
        onReorder={(event) => setTasks(event.reorderedData)}
      />
    </div>
  );
};

export const DragAndDrop: Story = {
  render: () => <DragAndDropExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Servers (sparklines, progress circles, filters, column visibility)
 * -----------------------------------------------------------------------------------------------*/
interface Server {
  id: string;
  clusterId: string;
  instances: number;
  status: "Active" | "Degraded" | "Offline";
  region: string;
  capacity: number;
  cost: number;
  requests: {t: number; value: number}[];
}

const servers: Server[] = (() => {
  const random = createRandom(23);
  const regions = ["EU-Central 1", "US-East 2", "AP-South 1", "US-West 1", "EU-North 1"];
  const statuses: Server["status"][] = ["Active", "Active", "Active", "Degraded", "Offline"];

  return Array.from({length: 8}, (_, index) => {
    let value = 40 + random() * 40;

    return {
      capacity: Math.round(random() * 9500) / 100,
      clusterId: `#${(5200000 + Math.floor(random() * 799999)).toString()}`,
      cost: Math.round((200 + random() * 1800) * 100) / 100,
      id: String(index),
      instances: 4 + Math.floor(random() * 40),
      region: pick(random, regions),
      requests: Array.from({length: 16}, (__, t) => {
        value = Math.max(5, value + (random() - 0.5) * 30);

        return {t, value: Math.round(value)};
      }),
      status: pick(random, statuses),
    };
  });
})();

const serverStatusColor = {Active: "success", Degraded: "warning", Offline: "danger"} as const;

const sparklineMask =
  "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)";

const serverColumnDefs: DataGridColumn<Server>[] = [
  {
    accessorKey: "clusterId",
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-1.5">
        <span className="font-medium tabular-nums">{item.clusterId}</span>
        <Button isIconOnly aria-label="Copy cluster ID" size="sm" variant="ghost">
          <Icon className="text-muted" icon="gravity-ui:copy" />
        </Button>
      </div>
    ),
    header: "Cluster ID",
    id: "clusterId",
    isRowHeader: true,
  },
  {
    accessorKey: "instances",
    align: "center",
    allowsSorting: true,
    header: "Instances",
    id: "instances",
  },
  {
    accessorKey: "status",
    allowsSorting: true,
    cell: (item) => (
      <Chip color={serverStatusColor[item.status]} size="sm" variant="soft">
        <StatusDot />
        <Chip.Label>{item.status}</Chip.Label>
      </Chip>
    ),
    header: "Status",
    id: "status",
  },
  {accessorKey: "region", allowsSorting: true, header: "Region", id: "region"},
  {
    accessorKey: "capacity",
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-2">
        <ProgressCircle
          aria-label={`${item.capacity}% capacity`}
          color={item.capacity > 85 ? "danger" : item.capacity > 65 ? "warning" : "accent"}
          size="sm"
          value={item.capacity}
        >
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
        <span className="tabular-nums">{item.capacity}%</span>
      </div>
    ),
    header: "Capacity",
    id: "capacity",
  },
  {
    accessorKey: "cost",
    align: "end",
    allowsSorting: true,
    cell: (item) => <span className="font-medium tabular-nums">{currency(item.cost)}</span>,
    header: "Cost",
    id: "cost",
  },
  {
    cell: (item) => (
      <div
        className="w-[90px] overflow-hidden"
        style={{WebkitMaskImage: sparklineMask, maskImage: sparklineMask}}
      >
        <AreaChart data={item.requests} height={36} margin={{bottom: 2, left: 0, right: 0, top: 2}}>
          <AreaChart.Area
            dataKey="value"
            dot={false}
            fill={`var(--${serverStatusColor[item.status]})`}
            fillOpacity={0.15}
            isAnimationActive={false}
            stroke={`var(--${serverStatusColor[item.status]})`}
            strokeWidth={1.5}
            type="monotone"
          />
        </AreaChart>
      </div>
    ),
    header: "Requests",
    id: "requests",
  },
];

const ServersExample = () => {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sortDescriptor, setSortDescriptor] = React.useState<DataGridSortDescriptor>({
    column: "clusterId",
    direction: "ascending",
  });
  const toggleable = serverColumnDefs
    .filter((col) => col.id !== "clusterId")
    .map((col) => ({id: col.id, label: String(col.header)}));
  const [visible, setVisible] = React.useState(() => new Set(toggleable.map((col) => col.id)));

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const column = serverColumnDefs.find((col) => col.id === sortDescriptor.column);
    const key = column?.accessorKey ?? "clusterId";
    const direction = sortDescriptor.direction === "descending" ? -1 : 1;

    return servers
      .filter(
        (server) =>
          (status === "all" || server.status === status) &&
          (!needle ||
            server.clusterId.includes(needle) ||
            server.region.toLowerCase().includes(needle)),
      )
      .sort((a, b) => {
        const left = a[key];
        const right = b[key];

        return typeof left === "number" && typeof right === "number"
          ? direction * (left - right)
          : direction * String(left).localeCompare(String(right));
      });
  }, [query, sortDescriptor, status]);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Clusters</h2>
          <Chip size="sm" variant="soft">
            {rows.length}
          </Chip>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <FilterMenu
            icon="gravity-ui:funnel"
            label="Filter"
            options={["Active", "Degraded", "Offline"]}
            value={status}
            onChange={setStatus}
          />
          <FilterMenu
            icon="gravity-ui:sliders"
            label="Sort"
            options={["clusterId", "capacity", "cost"]}
            value={String(sortDescriptor.column)}
            onChange={(column) =>
              setSortDescriptor({
                column: column === "all" ? "clusterId" : column,
                direction: "ascending",
              })
            }
          />
          <ColumnsMenu columns={toggleable} visible={visible} onChange={setVisible} />
          <SearchField aria-label="Search clusters" value={query} onChange={setQuery}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input className="w-[160px]" placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>
      <DataGrid
        showSelectionCheckboxes
        aria-label="Clusters"
        columns={serverColumnDefs.filter((col) => col.id === "clusterId" || visible.has(col.id))}
        data={rows}
        getRowId={(item) => item.id}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />
    </div>
  );
};

export const Servers: Story = {
  render: () => <ServersExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Bulk actions (selection + floating action bar)
 * -----------------------------------------------------------------------------------------------*/
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "Active" | "Pending" | "Suspended";
  joinDate: Date;
}

const employees: Employee[] = [
  ["Arjun Mehta", "Engineering", "Active", new Date(2023, 2, 14)],
  ["Bea Schultz", "Marketing", "Pending", new Date(2025, 6, 2)],
  ["Carlos Ortega", "Finance", "Active", new Date(2022, 10, 21)],
  ["Dana Whitfield", "Support", "Suspended", new Date(2024, 0, 9)],
  ["Emre Yilmaz", "Engineering", "Active", new Date(2021, 4, 30)],
  ["Freya Nilsen", "Design", "Pending", new Date(2025, 8, 17)],
  ["Gabriel Silva", "Sales", "Active", new Date(2023, 11, 5)],
].map(([name, department, status, joinDate], index) => ({
  department: department as string,
  email: `${String(name).toLowerCase().replace(" ", ".")}@orbit.dev`,
  id: String(index + 1),
  joinDate: joinDate as Date,
  name: name as string,
  status: status as Employee["status"],
}));

const employeeStatusColor = {Active: "success", Pending: "warning", Suspended: "danger"} as const;

const employeeColumns: DataGridColumn<Employee>[] = [
  {
    accessorKey: "name",
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <Avatar.Fallback>
            {item.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.name}</span>
          <span className="text-xs text-muted">{item.email}</span>
        </div>
      </div>
    ),
    header: "Employee",
    id: "name",
    isRowHeader: true,
  },
  {accessorKey: "department", allowsSorting: true, header: "Department", id: "department"},
  {
    accessorKey: "status",
    allowsSorting: true,
    cell: (item) => (
      <Chip color={employeeStatusColor[item.status]} size="sm" variant="soft">
        <StatusDot />
        <Chip.Label>{item.status}</Chip.Label>
      </Chip>
    ),
    header: "Status",
    id: "status",
  },
  {
    accessorKey: "joinDate",
    allowsSorting: true,
    cell: (item) => (
      <span className="text-sm text-muted tabular-nums">{shortDate(item.joinDate)}</span>
    ),
    header: "Joined",
    id: "joinDate",
  },
];

const BulkActionsExample = () => {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set());
  const count = selectedKeys === "all" ? employees.length : selectedKeys.size;

  return (
    <div className="w-full max-w-4xl">
      <DataGrid
        showSelectionCheckboxes
        aria-label="Employees"
        columns={employeeColumns}
        data={employees}
        defaultSortDescriptor={{column: "name", direction: "ascending"}}
        getRowId={(item) => item.id}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        onSelectionChange={setSelectedKeys}
      />
      <ActionBar aria-label="Bulk actions" isOpen={count > 0}>
        <ActionBar.Prefix>
          <Chip className="size-5 shrink-0 tabular-nums" size="sm">
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
          <Button aria-label="Archive" size="sm" variant="ghost">
            <Icon icon="gravity-ui:archive" />
            <span className="action-bar__label">Archive</span>
          </Button>
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

export const BulkActions: Story = {
  render: () => <BulkActionsExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Footer (pagination below the table)
 * -----------------------------------------------------------------------------------------------*/
interface Invoice {
  id: string;
  customer: string;
  date: string;
  status: "paid" | "pending" | "overdue";
  amount: number;
}

const invoices: Invoice[] = [
  ["Globex", "2026-02-03", "paid", 2480],
  ["Initech", "2026-02-07", "pending", 990],
  ["Umbrella", "2026-02-11", "overdue", 4120],
  ["Hooli", "2026-02-14", "paid", 760],
  ["Stark Industries", "2026-02-19", "paid", 12900],
  ["Wayne Enterprises", "2026-02-22", "pending", 3300],
  ["Vandelay", "2026-03-01", "paid", 540],
  ["Soylent", "2026-03-04", "overdue", 1875],
  ["Tyrell", "2026-03-09", "paid", 6200],
  ["Wonka", "2026-03-12", "pending", 1430],
  ["Cyberdyne", "2026-03-18", "paid", 8890],
  ["Massive Dynamic", "2026-03-23", "paid", 2015],
].map(([customer, date, status, amount], index) => ({
  amount: amount as number,
  customer: customer as string,
  date: date as string,
  id: `INV-${String(index + 101).padStart(4, "0")}`,
  status: status as Invoice["status"],
}));

const invoiceStatusColor = {overdue: "danger", paid: "success", pending: "warning"} as const;

const invoiceColumns: DataGridColumn<Invoice>[] = [
  {accessorKey: "id", cellClassName: "font-medium", header: "Invoice", id: "id", isRowHeader: true},
  {accessorKey: "customer", allowsSorting: true, header: "Customer", id: "customer"},
  {accessorKey: "date", header: "Date", id: "date"},
  {
    accessorKey: "status",
    cell: (item) => (
      <Chip color={invoiceStatusColor[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "Status",
    id: "status",
  },
  {
    accessorKey: "amount",
    align: "end",
    cell: (item) => <span className="tabular-nums">${item.amount.toLocaleString("en-US")}</span>,
    header: "Amount",
    id: "amount",
  },
];

const WithFooterExample = () => {
  const pagination = usePagination(invoices, 4);

  return (
    <div className="w-full max-w-4xl">
      <DataGrid
        aria-label="Invoices"
        columns={invoiceColumns}
        data={pagination.pageItems}
        getRowId={(item) => item.id}
        footer={
          <Pagination size="sm">
            <Pagination.Summary>
              {pagination.start + 1} to {pagination.end} of {invoices.length} invoices
            </Pagination.Summary>
            <PageLinks
              page={pagination.page}
              pageCount={pagination.pageCount}
              setPage={pagination.setPage}
            />
          </Pagination>
        }
      />
    </div>
  );
};

export const WithFooter: Story = {
  render: () => <WithFooterExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Empty state
 * -----------------------------------------------------------------------------------------------*/
const emptyColumns: DataGridColumn<{
  id: string;
  name: string;
  owner: string;
  charts: number;
  updated: string;
}>[] = [
  {accessorKey: "name", header: "Name", id: "name", isRowHeader: true},
  {accessorKey: "owner", header: "Owner", id: "owner"},
  {accessorKey: "charts", align: "center", header: "Charts", id: "charts"},
  {accessorKey: "updated", header: "Last updated", id: "updated"},
];

export const EmptyState: Story = {
  render: () => (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      <h2 className="text-xl font-bold">Reports</h2>
      <DataGrid
        aria-label="Reports"
        columns={emptyColumns}
        data={[]}
        getRowId={(item) => item.id}
        renderEmptyState={() => (
          <div className="py-6">
            <EmptyStateView size="sm">
              <EmptyStateView.Header>
                <EmptyStateView.Media className="border" variant="icon">
                  <Icon icon="gravity-ui:chart-column" />
                </EmptyStateView.Media>
                <EmptyStateView.Title>No reports yet</EmptyStateView.Title>
                <EmptyStateView.Description>
                  Reports you create or that are shared with you will show up here. You can also
                  import them from a spreadsheet.
                </EmptyStateView.Description>
              </EmptyStateView.Header>
              <EmptyStateView.Content className="flex-row gap-2">
                <Button variant="outline">
                  <Icon icon="gravity-ui:plus" />
                  New report
                </Button>
              </EmptyStateView.Content>
            </EmptyStateView>
          </div>
        )}
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Async loading (infinite scroll)
 * -----------------------------------------------------------------------------------------------*/
const allBills: Invoice[] = (() => {
  const random = createRandom(5);
  const clients = [
    "Aperture",
    "Blue Sun",
    "Duff",
    "Gringotts",
    "Monarch",
    "Nakatomi",
    "Oscorp",
    "Pied Piper",
    "Rekall",
    "Sirius",
  ];
  const statuses: Invoice["status"][] = ["paid", "paid", "pending", "overdue"];

  return Array.from({length: 50}, (_, index) => ({
    amount: Math.round(300 + random() * 9700),
    customer: pick(random, clients),
    date: shortDate(new Date(2026, 0, 1 + index * 4)),
    id: `BL-${2000 + index}`,
    status: pick(random, statuses),
  }));
})();

const billColumns: DataGridColumn<Invoice>[] = [
  {
    accessorKey: "id",
    cellClassName: "font-medium font-mono text-xs",
    header: "Invoice",
    id: "id",
    isRowHeader: true,
  },
  {accessorKey: "customer", header: "Client", id: "customer"},
  {
    accessorKey: "amount",
    align: "end",
    cell: (item) => (
      <span className="font-medium tabular-nums">${item.amount.toLocaleString("en-US")}</span>
    ),
    header: "Amount",
    id: "amount",
  },
  {
    accessorKey: "status",
    cell: (item) => (
      <Chip color={invoiceStatusColor[item.status]} size="sm" variant="soft">
        <StatusDot />
        <Chip.Label className="capitalize">{item.status}</Chip.Label>
      </Chip>
    ),
    header: "Status",
    id: "status",
  },
  {
    accessorKey: "date",
    cell: (item) => <span className="text-muted tabular-nums">{item.date}</span>,
    header: "Issued",
    id: "date",
  },
];

const AsyncLoadingExample = () => {
  const [items, setItems] = React.useState(() => allBills.slice(0, 8));
  const [isLoading, setIsLoading] = React.useState(false);
  const hasMore = items.length < allBills.length;

  const handleLoadMore = React.useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    window.setTimeout(() => {
      setItems((current) => allBills.slice(0, current.length + 8));
      setIsLoading(false);
    }, 1000);
  }, [isLoading]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">Bills</h2>
        <Chip size="sm" variant="soft">
          {items.length} / {allBills.length}
        </Chip>
      </div>
      <DataGrid
        aria-label="Bills"
        columns={billColumns}
        data={items}
        getRowId={(item) => item.id}
        isLoadingMore={isLoading}
        loadMoreContent={<Spinner size="md" />}
        scrollContainerClassName="max-h-[400px] overflow-y-auto"
        onLoadMore={hasMore ? handleLoadMore : undefined}
      />
    </div>
  );
};

export const AsyncLoading: Story = {
  render: () => <AsyncLoadingExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Virtualization (1,000 rows)
 * -----------------------------------------------------------------------------------------------*/
interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  supplier: string;
}

const products: Product[] = (() => {
  const random = createRandom(42);
  const adjectives = [
    "Compact",
    "Classic",
    "Ultra",
    "Smart",
    "Eco",
    "Pro",
    "Mini",
    "Rugged",
    "Silent",
    "Wireless",
  ];
  const nouns = [
    "Desk Lamp",
    "Kettle",
    "Backpack",
    "Headphones",
    "Notebook",
    "Monitor Arm",
    "Water Bottle",
    "Keyboard",
    "Chair Mat",
    "Speaker",
  ];
  const categories = ["Home", "Office", "Audio", "Outdoor", "Kitchen"];
  const suppliers = ["Nordic Supply", "Kaito Trading", "Atlas Goods", "Brightline", "Copperleaf"];

  return Array.from({length: 1000}, (_, index) => {
    const roll = random();

    return {
      category: pick(random, categories),
      id: index + 1,
      name: `${pick(random, adjectives)} ${pick(random, nouns)}`,
      price: Math.round((9 + random() * 390) * 100) / 100,
      rating: Math.round((2.5 + random() * 2.5) * 10) / 10,
      sku: `SKU-${(10000 + index).toString()}`,
      stock:
        roll < 0.12
          ? 0
          : roll < 0.3
            ? 1 + Math.floor(random() * 9)
            : 10 + Math.floor(random() * 400),
      supplier: pick(random, suppliers),
    };
  });
})();

const stockState = (stock: number) =>
  stock === 0 ? "out" : stock < 10 ? "low" : ("in" as "in" | "low" | "out");

const productColumns: DataGridColumn<Product>[] = [
  {
    accessorKey: "name",
    cell: (item) => (
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-default text-muted">
          <Icon className="size-4" icon="gravity-ui:box" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{item.name}</span>
          <span className="text-xs text-muted">{item.sku}</span>
        </div>
      </div>
    ),
    defaultWidth: 280,
    header: "Product",
    id: "name",
    isRowHeader: true,
  },
  {accessorKey: "category", defaultWidth: 110, header: "Category", id: "category"},
  {
    accessorKey: "price",
    align: "end",
    cell: (item) => <span className="tabular-nums">{currency(item.price)}</span>,
    defaultWidth: 100,
    header: "Price",
    id: "price",
  },
  {
    accessorKey: "stock",
    align: "end",
    cell: (item) => <span className="tabular-nums">{item.stock}</span>,
    defaultWidth: 80,
    header: "Stock",
    id: "stock",
  },
  {
    cell: (item) => {
      const state = stockState(item.stock);

      return (
        <Chip
          color={state === "out" ? "danger" : state === "low" ? "warning" : "success"}
          size="sm"
          variant="soft"
        >
          <StatusDot />
          <Chip.Label>
            {state === "out" ? "Out of stock" : state === "low" ? "Low stock" : "In stock"}
          </Chip.Label>
        </Chip>
      );
    },
    defaultWidth: 130,
    header: "Availability",
    id: "availability",
  },
  {
    accessorKey: "rating",
    cell: (item) => (
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Icon className="size-3.5 text-warning" icon="gravity-ui:star-fill" />
        {item.rating.toFixed(1)}
      </span>
    ),
    defaultWidth: 80,
    header: "Rating",
    id: "rating",
  },
  {accessorKey: "supplier", cellClassName: "text-muted", header: "Supplier", id: "supplier"},
];

const VirtualizedExample = () => {
  const [filter, setFilter] = React.useState<Key>("all");
  const [query, setQuery] = React.useState("");

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return products.filter(
      (product) =>
        (filter === "all" || stockState(product.stock) === filter) &&
        (!needle ||
          product.name.toLowerCase().includes(needle) ||
          product.sku.toLowerCase().includes(needle)),
    );
  }, [filter, query]);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Segment aria-label="Availability" selectedKey={filter} onSelectionChange={setFilter}>
          <Segment.Item id="all">All</Segment.Item>
          <Segment.Item id="in">In Stock</Segment.Item>
          <Segment.Item id="out">Out of Stock</Segment.Item>
          <Segment.Item id="low">Low Stock</Segment.Item>
        </Segment>
        <SearchField aria-label="Search catalog" value={query} onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-[180px]" placeholder="Search..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>
      <DataGrid
        showSelectionCheckboxes
        virtualized
        aria-label="Catalog"
        columns={productColumns}
        contentClassName="h-[600px] min-w-[900px] overflow-auto"
        data={rows}
        footerClassName="justify-between text-sm"
        getRowId={(item) => item.id}
        headingHeight={37}
        rowHeight={58}
        selectionMode="multiple"
        footer={
          <>
            <span className="text-muted">{rows.length.toLocaleString("en-US")} products</span>
            <div className="flex gap-6">
              <span className="text-muted">
                Stock value:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {currency(
                    rows.reduce((sum, row) => sum + row.price * row.stock, 0),
                    0,
                  )}
                </span>
              </span>
              <span className="text-muted">
                Units:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {rows.reduce((sum, row) => sum + row.stock, 0).toLocaleString("en-US")}
                </span>
              </span>
            </div>
          </>
        }
      />
    </div>
  );
};

export const Virtualized: Story = {
  render: () => <VirtualizedExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Sticky header
 * -----------------------------------------------------------------------------------------------*/
export const StickyHeader: Story = {
  args: {
    allowsColumnResize: true,
    selectionMode: "multiple",
    showSelectionCheckboxes: true,
    stickyHeader: true,
  },
  render: (args) => (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      <DataGrid
        {...args}
        aria-label="Payments"
        columns={paymentColumns}
        contentClassName="min-w-[1400px]"
        data={payments}
        defaultSortDescriptor={{column: "customer", direction: "ascending"}}
        getRowId={(item) => item.id}
        scrollContainerClassName="max-h-[320px]"
      />
    </div>
  ),
};
