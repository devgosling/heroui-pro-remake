import type {UseKanbanReturn} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {FormEvent, ReactNode} from "react";

import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  Header,
  Input,
  Label,
  Modal,
  ProgressBar,
  Separator,
  TextArea,
  TextField,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";
import {Text} from "react-aria-components/Text";

import {Kanban, useKanban, useKanbanCardPlaceholder, useKanbanColumn} from "./index";

const meta = {
  argTypes: {
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: Kanban,
  parameters: {layout: "fullscreen"},
  title: "Pro/DataDisplay/Kanban",
} satisfies Meta<typeof Kanban>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared assets
 * -----------------------------------------------------------------------------------------------*/
const ASSETS = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com";

const people = {
  ava: {name: "Ava", src: `${ASSETS}/avatars/purple.jpg`},
  ben: {name: "Ben", src: `${ASSETS}/avatars/blue.jpg`},
  cleo: {name: "Cleo", src: `${ASSETS}/avatars/green.jpg`},
  dev: {name: "Dev", src: `${ASSETS}/avatars/orange.jpg`},
  eli: {name: "Eli", src: `${ASSETS}/avatars/black.jpg`},
  noor: {name: "Noor", src: `${ASSETS}/avatars/red.jpg`},
} as const;

type Person = (typeof people)[keyof typeof people];

/** Same flex row as the Pro demo pages: content centred, a fixed 24px gutter. */
const DemoPage = ({children}: {children: ReactNode}) => (
  <div className="flex min-h-screen items-center justify-center p-6">{children}</div>
);

const AvatarStack = ({members}: {members: Person[]}) => (
  <div className="flex -space-x-2">
    {members.map((member) => (
      <Avatar key={member.name} className="size-5 ring-2 ring-background" size="sm">
        <Avatar.Image alt={member.name} src={member.src} />
        <Avatar.Fallback>{member.name.charAt(0)}</Avatar.Fallback>
      </Avatar>
    ))}
  </div>
);

const CardProgress = ({value}: {value: number}) => (
  <div className="flex items-center gap-2">
    <ProgressBar aria-label="Progress" className="flex-1" color="accent" size="sm" value={value}>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
    <span className="text-xs text-muted tabular-nums">{value}%</span>
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Task board data (Default + Sizes)
 * -----------------------------------------------------------------------------------------------*/
type ChipColor = "accent" | "danger" | "default" | "success" | "warning";

type BoardTask = {
  id: string;
  status: string;
  title: string;
  description: string;
  image?: string;
  labels: Array<{label: string; color: ChipColor}>;
  progress?: number;
  members: Person[];
  comments?: number;
  attachments?: number;
};

type BoardColumn = {id: string; title: string; icon: string; tone: string; dot: string};

const boardColumns: BoardColumn[] = [
  {
    dot: "bg-success",
    icon: "gravity-ui:circle-dashed",
    id: "planned",
    title: "Planned",
    tone: "text-success",
  },
  {
    dot: "bg-warning",
    icon: "gravity-ui:circle-play",
    id: "active",
    title: "Active",
    tone: "text-warning",
  },
  {
    dot: "bg-danger",
    icon: "gravity-ui:circle-check",
    id: "shipped",
    title: "Shipped",
    tone: "text-danger",
  },
];

const boardTasks: BoardTask[] = [
  {
    attachments: 2,
    comments: 6,
    description: "Wire the payment provider into the order flow",
    id: "t1",
    image: `${ASSETS}/docs/oranges.jpeg`,
    labels: [
      {color: "success", label: "Low priority"},
      {color: "warning", label: "Backend"},
    ],
    members: [people.cleo, people.ava],
    progress: 0,
    status: "planned",
    title: "Build checkout service",
  },
  {
    comments: 4,
    description: "Draft the five welcome emails sent to new workspaces",
    id: "t2",
    labels: [{color: "danger", label: "High priority"}],
    members: [people.ben],
    status: "planned",
    title: "Onboarding email sequence",
  },
  {
    comments: 2,
    description: "Give every primary action a shortcut in the command palette",
    id: "t3",
    labels: [{color: "accent", label: "Feature"}],
    members: [people.noor],
    progress: 35,
    status: "planned",
    title: "Keyboard shortcuts",
  },
  {
    description: "Due dates move by one day for people west of UTC",
    id: "t4",
    labels: [{color: "danger", label: "Bug"}],
    members: [people.dev],
    status: "planned",
    title: "Fix timezone drift",
  },
  {
    attachments: 4,
    comments: 9,
    description: "Consolidate spacing and colour tokens across both apps",
    id: "t5",
    image: `${ASSETS}/docs/avocado.jpeg`,
    labels: [
      {color: "accent", label: "Design"},
      {color: "warning", label: "Medium"},
    ],
    members: [people.ava, people.eli],
    progress: 60,
    status: "active",
    title: "Design tokens audit",
  },
  {
    comments: 3,
    description: "Reindex jobs fail now and then on very large workspaces",
    id: "t6",
    labels: [{color: "danger", label: "Bug"}],
    members: [people.ben, people.noor],
    progress: 25,
    status: "active",
    title: "Search indexing errors",
  },
  {
    comments: 5,
    description: "Split vendor chunks and drop locales nobody loads",
    id: "t7",
    image: `${ASSETS}/docs/robot1.jpeg`,
    labels: [{color: "success", label: "Done"}],
    members: [people.eli],
    progress: 100,
    status: "shipped",
    title: "Bundle size reduction",
  },
  {
    comments: 1,
    description: "Let admins download the member list as a CSV file",
    id: "t8",
    labels: [{color: "accent", label: "Feature"}],
    members: [people.cleo],
    progress: 100,
    status: "shipped",
    title: "CSV export",
  },
];

const BoardTaskCard = ({task}: {task: BoardTask}) => (
  <Kanban.Card id={task.id} textValue={task.title}>
    {task.image ? (
      <img
        alt=""
        className="h-32 w-full rounded-lg object-cover"
        draggable={false}
        src={task.image}
      />
    ) : null}
    <div className="flex flex-col gap-2">
      <span className="leading-snug font-semibold text-foreground">{task.title}</span>
      <Text className="line-clamp-2 text-sm text-muted" slot="description">
        {task.description}
      </Text>
      {task.labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <Chip key={label.label} color={label.color} size="sm" variant="soft">
              {label.label}
            </Chip>
          ))}
        </div>
      ) : null}
      {task.progress === undefined ? null : <CardProgress value={task.progress} />}
      {task.members.length > 0 || task.comments || task.attachments ? (
        <div className="mt-0.5 flex items-center justify-between">
          <AvatarStack members={task.members} />
          <div className="flex items-center gap-2.5 text-xs text-muted">
            {task.comments ? (
              <span className="flex items-center gap-1">
                <Icon className="size-3.5" icon="gravity-ui:comment" />
                {task.comments}
              </span>
            ) : null}
            {task.attachments ? (
              <span className="flex items-center gap-1">
                <Icon className="size-3.5" icon="gravity-ui:paperclip" />
                {task.attachments}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  </Kanban.Card>
);

/* -------------------------------------------------------------------------------------------------
 * Column actions (Default + Sizes)
 * -----------------------------------------------------------------------------------------------*/
const ColumnMenu = ({
  column,
  columns,
  kanban,
}: {
  column: BoardColumn;
  columns: BoardColumn[];
  kanban: UseKanbanReturn<BoardTask>;
}) => {
  const handleAction = (key: React.Key) => {
    const columnItems = kanban.list.items.filter((item) => item.status === column.id);

    if (key === "clear") {
      columnItems.forEach((item) => kanban.removeItem(item.id));

      return;
    }

    columnItems.forEach((item) => kanban.moveItem(item.id, String(key)));
  };

  return (
    <Dropdown>
      <Button isIconOnly aria-label="More options" size="sm" variant="ghost">
        <Icon icon="gravity-ui:ellipsis" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Section>
            <Header>Column</Header>
            <Dropdown.Item id="clear" textValue="Clear all tasks">
              <Icon className="text-danger" icon="gravity-ui:trash-bin" />
              <Label className="text-danger">Clear all tasks</Label>
            </Dropdown.Item>
          </Dropdown.Section>
          <Separator />
          <Dropdown.Section>
            <Header>Move all to</Header>
            {columns
              .filter((other) => other.id !== column.id)
              .map((other) => (
                <Dropdown.Item key={other.id} id={other.id} textValue={other.title}>
                  <Icon className="rtl:-scale-x-100" icon="gravity-ui:arrow-right" />
                  <Label>{other.title}</Label>
                </Dropdown.Item>
              ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};

const AddTaskModal = ({
  column,
  onAdd,
  onOpenChange,
}: {
  column: BoardColumn | null;
  onAdd: (title: string, description: string) => void;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  const formId = React.useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();

    if (!title) return;
    onAdd(title, String(data.get("description") ?? "").trim());
    onOpenChange(false);
  };

  return (
    <Modal.Backdrop isOpen={column !== null} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[380px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Add task to {column?.title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4 overflow-visible">
            <form className="flex flex-col gap-4" id={formId} onSubmit={handleSubmit}>
              <TextField autoFocus name="title">
                <Label>Title</Label>
                <Input placeholder="What needs doing?" variant="secondary" />
              </TextField>
              <TextField name="description">
                <Label>Description</Label>
                <TextArea placeholder="A sentence or two" rows={3} variant="secondary" />
              </TextField>
            </form>
          </Modal.Body>
          <Modal.Footer className="gap-2">
            <Button slot="close" variant="ghost">
              Cancel
            </Button>
            <Button form={formId} type="submit">
              Add task
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Task board (Default + Sizes)
 * -----------------------------------------------------------------------------------------------*/
const TaskBoardColumn = ({
  column,
  columns,
  iconIndicator,
  kanban,
  onAddTask,
  renderDropIndicator,
}: {
  column: BoardColumn;
  columns: BoardColumn[];
  iconIndicator?: boolean;
  kanban: UseKanbanReturn<BoardTask>;
  onAddTask: (column: BoardColumn) => void;
  renderDropIndicator: ReturnType<typeof useKanbanCardPlaceholder>["renderDropIndicator"];
}) => {
  const {dragAndDropHooks, items} = useKanbanColumn(kanban, column.id, {renderDropIndicator});

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        {iconIndicator ? (
          <Kanban.ColumnIndicator className={column.tone}>
            <Icon icon={column.icon} />
          </Kanban.ColumnIndicator>
        ) : (
          <Kanban.ColumnIndicator className={column.dot} />
        )}
        <Kanban.ColumnTitle>{column.title}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
        <Kanban.ColumnActions>
          <Button
            isIconOnly
            aria-label="Add task"
            size="sm"
            variant="ghost"
            onPress={() => onAddTask(column)}
          >
            <Icon icon="gravity-ui:plus" />
          </Button>
          <ColumnMenu column={column} columns={columns} kanban={kanban} />
        </Kanban.ColumnActions>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.ScrollShadow className="max-h-[600px]">
          <Kanban.CardList
            aria-label={column.title}
            dragAndDropHooks={dragAndDropHooks}
            items={items}
          >
            {(task) => <BoardTaskCard task={task} />}
          </Kanban.CardList>
        </Kanban.ScrollShadow>
        <div className="p-2">
          <Button fullWidth variant="outline" onPress={() => onAddTask(column)}>
            <Icon icon="gravity-ui:plus" />
            Add a task
          </Button>
        </div>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
};

const TaskBoard = ({
  columns = boardColumns,
  iconIndicator = true,
  size,
  tasks = boardTasks,
}: {
  columns?: BoardColumn[];
  iconIndicator?: boolean;
  size?: "sm" | "md" | "lg";
  tasks?: BoardTask[];
}) => {
  const kanban = useKanban<BoardTask>({
    getColumn: (task) => task.status,
    initialItems: tasks,
    setColumn: (task, status) => ({...task, status}),
  });
  const {renderDropIndicator} = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const [addingTo, setAddingTo] = React.useState<BoardColumn | null>(null);
  const nextId = React.useRef(100);

  const handleAdd = (title: string, description: string) => {
    if (!addingTo) return;
    nextId.current += 1;
    kanban.addItem({
      description,
      id: `t${nextId.current}`,
      labels: [],
      members: [],
      status: addingTo.id,
      title,
    });
  };

  return (
    <>
      <Kanban size={size}>
        {columns.map((column) => (
          <TaskBoardColumn
            key={column.id}
            column={column}
            columns={columns}
            iconIndicator={iconIndicator}
            kanban={kanban}
            renderDropIndicator={renderDropIndicator}
            onAddTask={setAddingTo}
          />
        ))}
      </Kanban>
      <AddTaskModal
        column={addingTo}
        onAdd={handleAdd}
        onOpenChange={(isOpen) => !isOpen && setAddingTo(null)}
      />
    </>
  );
};

export const Default: Story = {
  render: (args) => (
    <DemoPage>
      <TaskBoard size={args.size} />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Notion board
 * -----------------------------------------------------------------------------------------------*/
type NotionTone = "accent" | "danger" | "success" | "warning";

type NotionTask = {
  id: string;
  status: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  estimate: "S" | "M" | "L" | "XL";
  owner: Person;
  project: string;
  due?: string;
  tags: string[];
};

const notionTones: Record<
  NotionTone,
  {
    body: string;
    button: string;
    count: string;
    dot: string;
    header: string;
    pill: string;
    text: string;
  }
> = {
  accent: {
    body: "bg-accent/8",
    button: "text-accent border-accent/30 hover:bg-accent/10",
    count: "text-accent",
    dot: "bg-accent",
    header: "bg-accent/8",
    pill: "bg-accent/15",
    text: "text-accent",
  },
  danger: {
    body: "bg-danger/8",
    button: "text-danger border-danger/30 hover:bg-danger/10",
    count: "text-danger",
    dot: "bg-danger",
    header: "bg-danger/8",
    pill: "bg-danger/15",
    text: "text-danger",
  },
  success: {
    body: "bg-success/8",
    button: "text-success border-success/30 hover:bg-success/10",
    count: "text-success",
    dot: "bg-success",
    header: "bg-success/8",
    pill: "bg-success/15",
    text: "text-success",
  },
  warning: {
    body: "bg-warning/8",
    button: "text-warning border-warning/30 hover:bg-warning/10",
    count: "text-warning",
    dot: "bg-warning",
    header: "bg-warning/8",
    pill: "bg-warning/15",
    text: "text-warning",
  },
};

const priorityTone = {
  High: {chip: "danger", square: "bg-danger"},
  Low: {chip: "success", square: "bg-success"},
  Medium: {chip: "warning", square: "bg-warning"},
} as const;

const notionColumns: Array<{id: string; title: string; tone: NotionTone}> = [
  {id: "not-started", title: "Not started", tone: "accent"},
  {id: "doing", title: "Doing", tone: "warning"},
  {id: "needs-docs", title: "Needs docs", tone: "danger"},
  {id: "done", title: "Done", tone: "success"},
];

const notionTasks: NotionTask[] = [
  {
    estimate: "M",
    id: "n1",
    owner: people.ava,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Mobile", "Block"],
    title: "Agenda blocks",
  },
  {
    due: "Feb 12, 2026",
    estimate: "M",
    id: "n2",
    owner: people.ben,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Launch", "New Component"],
    title: "Beta badge in the app store listing",
  },
  {
    estimate: "M",
    id: "n3",
    owner: people.ava,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Mobile", "New Component"],
    title: "StoryRail",
  },
  {
    estimate: "M",
    id: "n4",
    owner: people.cleo,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Mobile", "New Component"],
    title: "TiltCard",
  },
  {
    estimate: "M",
    id: "n5",
    owner: people.ava,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Mobile", "New Component"],
    title: "PinPad",
  },
  {
    estimate: "M",
    id: "n6",
    owner: people.dev,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Mobile", "New Component"],
    title: "Address autocomplete",
  },
  {
    estimate: "M",
    id: "n7",
    owner: people.ava,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "not-started",
    tags: ["Mobile", "Block"],
    title: "Action sheet blocks",
  },
  {
    due: "Mar 3, 2026",
    estimate: "L",
    id: "n8",
    owner: people.noor,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "doing",
    tags: ["Mobile", "New Component"],
    title: "ShapeShiftButton",
  },
  {
    estimate: "S",
    id: "n9",
    owner: people.ben,
    priority: "Low",
    project: "Field Kit (Beta)",
    status: "doing",
    tags: ["Mobile", "Block"],
    title: "Reset password",
  },
  {
    estimate: "S",
    id: "n10",
    owner: people.ben,
    priority: "Low",
    project: "Field Kit (Beta)",
    status: "doing",
    tags: ["Mobile", "Block"],
    title: "Magic link sign-in",
  },
  {
    estimate: "S",
    id: "n11",
    owner: people.cleo,
    priority: "Low",
    project: "Field Kit (Beta)",
    status: "doing",
    tags: ["Mobile", "Block"],
    title: "Account creation",
  },
  {
    due: "Mar 18, 2026",
    estimate: "L",
    id: "n12",
    owner: people.eli,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Mobile", "New Component"],
    title: "HoldToConfirm",
  },
  {
    due: "Mar 18, 2026",
    estimate: "L",
    id: "n13",
    owner: people.eli,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Mobile", "New Component"],
    title: "SwipeToUnlock",
  },
  {
    due: "Mar 18, 2026",
    estimate: "M",
    id: "n14",
    owner: people.dev,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Mobile", "New Component"],
    title: "QuantityField",
  },
  {
    due: "Mar 24, 2026",
    estimate: "L",
    id: "n15",
    owner: people.noor,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Mobile", "New Component"],
    title: "SegmentedChoice",
  },
  {
    due: "Mar 22, 2026",
    estimate: "XL",
    id: "n16",
    owner: people.eli,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Launch", "New Component"],
    title: "DateRangeSheet",
  },
  {
    due: "Mar 9, 2026",
    estimate: "L",
    id: "n17",
    owner: people.ava,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Mobile", "Block"],
    title: "Wizard bottom sheet",
  },
  {
    estimate: "M",
    id: "n18",
    owner: people.cleo,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "needs-docs",
    tags: ["Mobile", "New Component"],
    title: "ProgressSteps",
  },
  {
    due: "Feb 20, 2026",
    estimate: "S",
    id: "n19",
    owner: people.ben,
    priority: "High",
    project: "Field Kit (Beta)",
    status: "done",
    tags: ["Mobile"],
    title: "What's new sheet",
  },
  {
    estimate: "S",
    id: "n20",
    owner: people.dev,
    priority: "Medium",
    project: "Field Kit (Beta)",
    status: "done",
    tags: ["Mobile", "Improvement"],
    title: "Design ↔ code token sync",
  },
];

const NotionCard = ({task}: {task: NotionTask}) => (
  <Kanban.Card id={task.id} textValue={task.title}>
    <div className="flex items-start gap-2">
      <span className={`mt-1 size-2.5 shrink-0 rounded-sm ${priorityTone[task.priority].square}`} />
      <span className="leading-snug font-semibold text-foreground">{task.title}</span>
    </div>
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip color={priorityTone[task.priority].chip} size="sm" variant="soft">
        {task.priority}
      </Chip>
      <Chip size="sm" variant="secondary">
        {task.estimate}
      </Chip>
      <Avatar className="size-5 ring-2 ring-background" size="sm">
        <Avatar.Image alt={task.owner.name} src={task.owner.src} />
        <Avatar.Fallback>{task.owner.name.charAt(0)}</Avatar.Fallback>
      </Avatar>
    </div>
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-xs text-muted">
        <Icon className="size-3 text-warning" icon="gravity-ui:thunderbolt-fill" />
        {task.project}
      </span>
      {task.due ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
          <Icon className="size-3" icon="gravity-ui:calendar" />
          {task.due}
        </span>
      ) : null}
    </div>
    <div className="flex flex-wrap gap-1">
      {task.tags.map((tag) => (
        <Chip key={tag} size="sm" variant="secondary">
          {tag}
        </Chip>
      ))}
    </div>
  </Kanban.Card>
);

const NotionColumn = ({
  column,
  kanban,
  renderDropIndicator,
}: {
  column: (typeof notionColumns)[number];
  kanban: UseKanbanReturn<NotionTask>;
  renderDropIndicator: ReturnType<typeof useKanbanCardPlaceholder>["renderDropIndicator"];
}) => {
  const {dragAndDropHooks, items} = useKanbanColumn(kanban, column.id, {renderDropIndicator});
  const tone = notionTones[column.tone];

  return (
    <Kanban.Column className="gap-0">
      <div className="sticky top-0 z-10 bg-background pt-2">
        <Kanban.ColumnHeader
          className={`rounded-t-[calc(var(--radius-2xl)_+_var(--radius-sm))] px-3 py-2.5 ${tone.header}`}
        >
          <span
            className={`flex items-center gap-2 rounded-[calc(var(--radius)*infinity)] px-3 py-1 ${tone.pill}`}
          >
            <Kanban.ColumnIndicator className={tone.dot} />
            <Kanban.ColumnTitle>{column.title}</Kanban.ColumnTitle>
          </span>
          <Kanban.ColumnCount className={tone.count}>{items.length}</Kanban.ColumnCount>
          <Kanban.ColumnActions>
            <Button
              isIconOnly
              aria-label="Add task"
              className={tone.text}
              size="sm"
              variant="ghost"
            >
              <Icon icon="gravity-ui:plus" />
            </Button>
            <Button
              isIconOnly
              aria-label="More options"
              className={tone.text}
              size="sm"
              variant="ghost"
            >
              <Icon icon="gravity-ui:ellipsis" />
            </Button>
          </Kanban.ColumnActions>
        </Kanban.ColumnHeader>
      </div>
      <Kanban.ColumnBody className={`rounded-t-none ${tone.body}`}>
        <Kanban.CardList
          aria-label={column.title}
          className="pt-0 pb-2"
          dragAndDropHooks={dragAndDropHooks}
          items={items}
        >
          {(task) => <NotionCard task={task} />}
        </Kanban.CardList>
        <div className="p-2 pt-0">
          <Button fullWidth className={tone.button} variant="outline">
            <Icon icon="gravity-ui:plus" />
            New task
          </Button>
        </div>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
};

const NotionBoardDemo = () => {
  const kanban = useKanban<NotionTask>({
    getColumn: (task) => task.status,
    initialItems: notionTasks,
    setColumn: (task, status) => ({...task, status}),
  });
  const {renderDropIndicator} = useKanbanCardPlaceholder();

  return (
    <div className="w-full pr-3">
      <Kanban hideScrollBar className="items-start overflow-visible" visibility="none">
        {notionColumns.map((column) => (
          <NotionColumn
            key={column.id}
            column={column}
            kanban={kanban}
            renderDropIndicator={renderDropIndicator}
          />
        ))}
      </Kanban>
    </div>
  );
};

export const NotionBoard: Story = {
  render: () => (
    <DemoPage>
      <NotionBoardDemo />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Project board
 * -----------------------------------------------------------------------------------------------*/
type ProjectTask = {
  id: string;
  status: string;
  title: string;
  category: {label: string; color: string};
  progress?: number;
  members: Person[];
  due?: string;
};

const categories = {
  backend: {color: "#0ea5e9", label: "Backend"},
  content: {color: "#f59e0b", label: "Content"},
  design: {color: "#ec4899", label: "Design"},
  growth: {color: "#22c55e", label: "Growth"},
  research: {color: "#a855f7", label: "Research"},
} as const;

const projectColumns = [
  {dot: "bg-default", id: "backlog", title: "Backlog"},
  {dot: "bg-accent", id: "todo", title: "Up next"},
  {dot: "bg-warning", id: "progress", title: "Building"},
  {dot: "bg-danger", id: "review", title: "Reviewing"},
  {dot: "bg-success", id: "done", title: "Released"},
] as const;

const projectTasks: ProjectTask[] = [
  {
    category: categories.research,
    id: "p1",
    members: [people.noor],
    status: "backlog",
    title: "Interview five churned teams about setup pain",
  },
  {
    category: categories.backend,
    id: "p2",
    members: [people.ben],
    status: "backlog",
    title: "Rename legacy webhook events",
  },
  {
    category: categories.design,
    due: "Apr 2",
    id: "p3",
    members: [people.ava, people.cleo],
    status: "todo",
    title: "Illustrations for empty search results",
  },
  {
    category: categories.backend,
    due: "Apr 4",
    id: "p4",
    members: [people.dev, people.eli],
    status: "todo",
    title: "Preview deployments for every pull request",
  },
  {
    category: categories.design,
    due: "Apr 9",
    id: "p5",
    members: [people.cleo],
    progress: 70,
    status: "progress",
    title: "Rework the invite teammates step",
  },
  {
    category: categories.backend,
    id: "p6",
    members: [people.ben],
    progress: 40,
    status: "progress",
    title: "Per-token quota for the public API",
  },
  {
    category: categories.research,
    id: "p7",
    members: [people.noor],
    status: "progress",
    title: "Survey script for the pricing study",
  },
  {
    category: categories.growth,
    id: "p8",
    members: [people.ava, people.dev],
    status: "review",
    title: "Weekly digest email opt-in",
  },
  {
    category: categories.backend,
    id: "p9",
    members: [people.eli, people.ben, people.noor],
    status: "review",
    title: "Backfill job for archived projects",
  },
  {
    category: categories.content,
    id: "p10",
    members: [people.cleo],
    status: "review",
    title: "Changelog post for the spring release",
  },
  {
    category: categories.design,
    id: "p11",
    members: [people.ava],
    status: "done",
    title: "High-contrast theme option",
  },
  {
    category: categories.backend,
    id: "p12",
    members: [people.dev, people.eli],
    status: "done",
    title: "Stop duplicate notifications on retry",
  },
  {
    category: categories.growth,
    id: "p13",
    members: [people.noor],
    status: "done",
    title: "Referral link in account settings",
  },
];

const ProjectCard = ({task}: {task: ProjectTask}) => (
  <Kanban.Card id={task.id} textValue={task.title}>
    <span
      className={`leading-snug font-semibold text-foreground ${
        task.status === "done" ? "line-through" : ""
      }`}
    >
      {task.title}
    </span>
    <span className="flex items-center gap-1.5">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{backgroundColor: task.category.color}}
      />
      <span className="text-xs text-muted">{task.category.label}</span>
    </span>
    {task.progress === undefined ? null : <CardProgress value={task.progress} />}
    <div className="mt-0.5 flex items-center justify-between">
      <AvatarStack members={task.members} />
      {task.due ? <span className="text-xs text-muted">{task.due}</span> : null}
    </div>
  </Kanban.Card>
);

const ProjectColumn = ({
  column,
  kanban,
}: {
  column: (typeof projectColumns)[number];
  kanban: UseKanbanReturn<ProjectTask>;
}) => {
  // No placeholder: RAC's default line indicator marks the drop position.
  const {dragAndDropHooks, items} = useKanbanColumn(kanban, column.id);

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator className={column.dot} />
        <Kanban.ColumnTitle>{column.title}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
        <Kanban.ColumnActions>
          <Button isIconOnly aria-label="Add task" size="sm" variant="ghost">
            <Icon icon="gravity-ui:plus" />
          </Button>
          <Button isIconOnly aria-label="More options" size="sm" variant="ghost">
            <Icon icon="gravity-ui:ellipsis" />
          </Button>
        </Kanban.ColumnActions>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.ScrollShadow className="max-h-[480px]">
          <Kanban.CardList
            aria-label={column.title}
            dragAndDropHooks={dragAndDropHooks}
            items={items}
          >
            {(task) => <ProjectCard task={task} />}
          </Kanban.CardList>
        </Kanban.ScrollShadow>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
};

const ProjectBoardDemo = () => {
  const kanban = useKanban<ProjectTask>({
    getColumn: (task) => task.status,
    initialItems: projectTasks,
    setColumn: (task, status) => ({...task, status}),
  });

  return (
    <Kanban>
      {projectColumns.map((column) => (
        <ProjectColumn key={column.id} column={column} kanban={kanban} />
      ))}
    </Kanban>
  );
};

export const ProjectBoard: Story = {
  render: () => (
    <DemoPage>
      <ProjectBoardDemo />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Sizes
 * -----------------------------------------------------------------------------------------------*/
const sizeColumns = boardColumns.slice(0, 2);
const sizeTasks = boardTasks.filter((task) => task.id !== "t4" && task.status !== "shipped");

export const Sizes: Story = {
  render: () => (
    <DemoPage>
      <div className="flex flex-col gap-10">
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted">{size}</span>
            <TaskBoard columns={sizeColumns} iconIndicator={false} size={size} tasks={sizeTasks} />
          </div>
        ))}
      </div>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Keyboard drag and drop (not a Pro demo): drag handles, empty state
 * -----------------------------------------------------------------------------------------------*/
type Chore = {id: number; list: string; title: string};

const choreColumns = ["Inbox", "This week", "Later"];

const KeyboardColumn = ({
  column,
  kanban,
  renderDropIndicator,
}: {
  column: string;
  kanban: UseKanbanReturn<Chore>;
  renderDropIndicator: ReturnType<typeof useKanbanCardPlaceholder>["renderDropIndicator"];
}): ReactNode => {
  const {dragAndDropHooks, items} = useKanbanColumn(kanban, column, {renderDropIndicator});

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator />
        <Kanban.ColumnTitle>{column}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.CardList
          aria-label={column}
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => "Drop a card here"}
        >
          {(chore) => (
            <Kanban.Card textValue={chore.title}>
              <div className="flex items-center gap-2">
                <Kanban.DragHandle />
                <span className="font-medium text-foreground">{chore.title}</span>
              </div>
            </Kanban.Card>
          )}
        </Kanban.CardList>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
};

const KeyboardBoardDemo = () => {
  const kanban = useKanban<Chore>({
    getColumn: (chore) => chore.list,
    initialItems: [
      {id: 1, list: "Inbox", title: "Renew the domain"},
      {id: 2, list: "Inbox", title: "Book the team offsite"},
      {id: 3, list: "This week", title: "Review the Q3 roadmap"},
      {id: 4, list: "This week", title: "Update the status page copy"},
    ],
    setColumn: (chore, list) => ({...chore, list}),
  });
  const {renderDropIndicator} = useKanbanCardPlaceholder();

  return (
    <Kanban>
      {choreColumns.map((column) => (
        <KeyboardColumn
          key={column}
          column={column}
          kanban={kanban}
          renderDropIndicator={renderDropIndicator}
        />
      ))}
    </Kanban>
  );
};

export const KeyboardDragAndDrop: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <p className="text-sm text-muted">
        Tab to a card: its drag handle appears. Press Enter on the handle, move with Tab or the
        arrow keys, then press Enter to drop.
      </p>
      <KeyboardBoardDemo />
    </div>
  ),
};
