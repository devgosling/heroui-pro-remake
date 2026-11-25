import type {CommandVariants} from "./command.styles";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Avatar, Button, Chip, CloseButton, Input, Kbd, Spinner, Switch} from "@heroui/react";
import {Icon} from "@iconify/react";
import {useCallback, useEffect, useState} from "react";

import {Command} from "./index";

type DemoArgs = {
  /** Size of the palette dialog (`Command.Container`). */
  size?: CommandVariants["size"];
  /** Backdrop style (`Command.Backdrop`). */
  variant?: CommandVariants["variant"];
  /** Whether clicking the backdrop closes the palette. */
  isDismissable?: boolean;
};

const meta = {
  argTypes: {
    isDismissable: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
    variant: {control: {type: "select"}, options: ["opaque", "blur", "transparent"]},
  },
  parameters: {layout: "centered"},
  title: "Pro/Navigation/Command",
} satisfies Meta<DemoArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
const GIcon = ({icon}: {icon: string}) => <Icon icon={`gravity-ui:${icon}`} />;

/** Opens the palette with Cmd+K / Ctrl+K. */
const useCommandHotkey = (onOpen: () => void) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
};

const usePalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  useCommandHotkey(open);

  return {isOpen, open, setIsOpen};
};

const LaunchButton = ({label, onPress}: {label: string; onPress: () => void}) => (
  <Button variant="outline" onPress={onPress}>
    {label}{" "}
    <Kbd>
      <Kbd.Abbr keyValue="command" />
      <Kbd.Content>K</Kbd.Content>
    </Kbd>
  </Button>
);

const EscHint = () => (
  <Kbd className="text-xs">
    <Kbd.Content>Esc</Kbd.Content>
  </Kbd>
);

const NavigationFooter = ({className, extra}: {className?: string; extra?: ReactNode}) => (
  <Command.Footer className={`justify-between [&_kbd]:h-5 [&_kbd]:text-xs ${className ?? ""}`}>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Kbd className="text-xs">
            <Kbd.Abbr keyValue="up" />
          </Kbd>
          <Kbd className="text-xs">
            <Kbd.Abbr keyValue="down" />
          </Kbd>
        </div>
        <span>Move</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd>
          <Kbd.Abbr keyValue="enter" />
        </Kbd>
        <span>Run</span>
      </div>
    </div>
    {extra}
  </Command.Footer>
);

const workspaceGroups = [
  {
    heading: "Suggestions",
    items: [
      {icon: "file-text", label: "New document..."},
      {icon: "folder-open", label: "Open folder..."},
      {icon: "person-plus", label: "Invite teammate"},
    ],
  },
  {
    heading: "Settings",
    items: [
      {icon: "gear", label: "Account settings"},
      {icon: "moon", label: "Toggle appearance"},
      {icon: "square-article", label: "View shortcuts"},
    ],
  },
];

/**
 * Shared palette body of the Usage, Sizes and Backdrop Variants stories (the Pro Backdrop Variants
 * demo has no footer).
 */
const WorkspacePalette = ({
  hideFooter,
  isDismissable,
  isOpen,
  onOpenChange,
  size,
  variant,
}: DemoArgs & {
  hideFooter?: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) => (
  <Command>
    <Command.Backdrop
      isDismissable={isDismissable}
      isOpen={isOpen}
      variant={variant}
      onOpenChange={onOpenChange}
    >
      <Command.Container size={size}>
        <Command.Dialog>
          <Command.Header>
            <Chip size="sm">Dashboard</Chip>
          </Command.Header>
          <Command.InputGroup>
            <Command.InputGroup.Prefix>
              <GIcon icon="magnifier" />
            </Command.InputGroup.Prefix>
            <Command.InputGroup.Input placeholder="Search for a command or page..." />
            <Command.InputGroup.ClearButton />
            <Command.InputGroup.Suffix>
              <EscHint />
            </Command.InputGroup.Suffix>
          </Command.InputGroup>
          <Command.List>
            {workspaceGroups.map((group) => (
              <Command.Group key={group.heading} heading={group.heading}>
                {group.items.map((item) => (
                  <Command.Item key={item.label} textValue={item.label}>
                    <GIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          {!hideFooter && <NavigationFooter />}
        </Command.Dialog>
      </Command.Container>
    </Command.Backdrop>
  </Command>
);

/* -------------------------------------------------------------------------------------------------
 * Usage
 * -----------------------------------------------------------------------------------------------*/
const UsageDemo = (args: DemoArgs) => {
  const {isOpen, open, setIsOpen} = usePalette();

  return (
    <>
      <LaunchButton label="Open Command Menu" onPress={open} />
      <WorkspacePalette {...args} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export const Default: Story = {
  args: {isDismissable: true, size: "md", variant: "opaque"},
  render: (args) => <UsageDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Launcher
 * -----------------------------------------------------------------------------------------------*/
const launcherApps = [
  {icon: "pencil", label: "Sketchpad", tile: "bg-violet-500"},
  {icon: "layers", label: "Roadmap", tile: "bg-indigo-500"},
  {icon: "comment", label: "Messenger", tile: "bg-sky-500"},
  {icon: "video", label: "Screen Recorder", tile: "bg-red-500"},
  {icon: "book-open", label: "Journal", tile: "bg-amber-500"},
];

const launcherCommands = [
  {icon: "copy", label: "Search Clipboard", tile: "bg-gradient-to-b from-red-400 to-red-600"},
  {
    icon: "plug-connection",
    label: "Install Plugin",
    tile: "bg-gradient-to-b from-emerald-400 to-emerald-700",
  },
  {icon: "gear", label: "Manage Plugins", tile: "bg-gradient-to-b from-emerald-400 to-emerald-700"},
];

const LauncherKey = ({children}: {children: ReactNode}) => (
  <kbd className="flex h-5 items-center rounded bg-default px-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
    {children}
  </kbd>
);

const LauncherDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();

  const renderRow = (
    item: {icon: string; label: string; tile: string},
    kind: string,
    rounded: string,
  ) => (
    <Command.Item key={item.label} className="!h-10" textValue={item.label}>
      <div
        className={`flex size-5 shrink-0 items-center justify-center ${rounded} [&_svg]:size-3 [&_svg]:text-white ${item.tile}`}
      >
        <GIcon icon={item.icon} />
      </div>
      <span>{item.label}</span>
      <span className="ml-auto text-[13px] text-muted">{kind}</span>
    </Command.Item>
  );

  return (
    <>
      <LaunchButton label="App Launcher" onPress={open} />
      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Command.Container size="lg">
            <Command.Dialog>
              <Command.InputGroup>
                <Command.InputGroup.Input placeholder="Find apps, files and commands..." />
                <Command.InputGroup.ClearButton />
              </Command.InputGroup>
              <Command.List>
                <Command.Group heading="Recent">
                  {launcherApps.map((app) => renderRow(app, "App", "rounded"))}
                </Command.Group>
                <Command.Group heading="Commands">
                  {launcherCommands.map((command) => renderRow(command, "Command", "rounded-md"))}
                </Command.Group>
              </Command.List>
              <Command.Footer className="justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Open App</span>
                  <LauncherKey>↵</LauncherKey>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-px bg-border" />
                  <span className="text-xs">More</span>
                  <div className="flex gap-0.5">
                    <LauncherKey>⌘</LauncherKey>
                    <LauncherKey>K</LauncherKey>
                  </div>
                </div>
              </Command.Footer>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const Launcher: Story = {
  render: () => <LauncherDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Dev Toolbar
 * -----------------------------------------------------------------------------------------------*/
const toolbarGroups = [
  {
    heading: "Team",
    items: [
      {icon: "comment", key: "C", label: "Leave Comment"},
      {icon: "bell", key: "I", label: "Inbox"},
      {icon: "flag", key: "F", label: "Toggle Flags..."},
      {icon: "paperclip", key: "S", label: "Copy Share Link"},
      {icon: "code-fork", key: "B", label: "Change Branch..."},
    ],
  },
  {
    heading: "Debug",
    items: [
      {icon: "terminal", key: "O", label: "Open Console"},
      {icon: "stopwatch", key: "T", label: "Performance Trace..."},
    ],
  },
];

const DevToolbarDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();

  return (
    <>
      <LaunchButton label="Toolbar" onPress={open} />
      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Command.Container>
            <Command.Dialog>
              <Command.InputGroup>
                <Command.InputGroup.Prefix>
                  <GIcon icon="magnifier" />
                </Command.InputGroup.Prefix>
                <Command.InputGroup.Input placeholder="How can I help?" />
                <Command.InputGroup.ClearButton />
                <Command.InputGroup.Suffix>
                  <EscHint />
                </Command.InputGroup.Suffix>
              </Command.InputGroup>
              <Command.List>
                <Command.Group>
                  <Command.Item className="bg-default" textValue="Current Deployment">
                    <span className="size-2 shrink-0 rounded-full bg-success" />
                    <div className="flex flex-col">
                      <span className="font-medium">Current Deployment</span>
                      <span className="text-xs text-muted">preview/feat-billing-v2</span>
                    </div>
                  </Command.Item>
                </Command.Group>
                {toolbarGroups.map((group) => (
                  <Command.Group key={group.heading} heading={group.heading}>
                    {group.items.map((item) => (
                      <Command.Item key={item.label} textValue={item.label}>
                        <GIcon icon={item.icon} />
                        <span>{item.label}</span>
                        <Kbd className="ms-auto text-xs" slot="keyboard">
                          <Kbd.Content>{item.key}</Kbd.Content>
                        </Kbd>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const DevToolbar: Story = {
  render: () => <DevToolbarDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Sizes
 * -----------------------------------------------------------------------------------------------*/
const SizesDemo = () => {
  const [size, setSize] = useState<CommandVariants["size"]>("md");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {(["sm", "md", "lg"] as const).map((value) => (
          <Button
            key={value}
            variant="tertiary"
            onPress={() => {
              setSize(value);
              setIsOpen(true);
            }}
          >
            Size: {value}
          </Button>
        ))}
      </div>
      <WorkspacePalette isOpen={isOpen} size={size} onOpenChange={setIsOpen} />
    </div>
  );
};

export const Sizes: Story = {
  render: () => <SizesDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Backdrop Variants
 * -----------------------------------------------------------------------------------------------*/
const BackdropVariantsDemo = () => {
  const [variant, setVariant] = useState<CommandVariants["variant"]>("opaque");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {(["transparent", "opaque", "blur"] as const).map((value) => (
          <Button
            key={value}
            variant="tertiary"
            onPress={() => {
              setVariant(value);
              setIsOpen(true);
            }}
          >
            {value}
          </Button>
        ))}
      </div>
      <WorkspacePalette hideFooter isOpen={isOpen} variant={variant} onOpenChange={setIsOpen} />
    </div>
  );
};

export const BackdropVariants: Story = {
  render: () => <BackdropVariantsDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Clean (nested pages with breadcrumbs, Backspace / Escape go back)
 * -----------------------------------------------------------------------------------------------*/
type CleanPage = "home" | "workspaces" | "people";

const cleanSubPages: Record<Exclude<CleanPage, "home">, string[]> = {
  people: ["Ada Park", "Ben Ortiz", "Chloe Nakamura", "Dev Malhotra", "Elif Kaya"],
  workspaces: [
    "Workspace Alpha",
    "Workspace Beta",
    "Workspace Gamma",
    "Workspace Delta",
    "Workspace Epsilon",
    "Workspace Zeta",
  ],
};

const CleanKey = ({children}: {children: ReactNode}) => (
  <kbd className="flex size-5 items-center justify-center rounded bg-default text-[11px] text-zinc-500 uppercase dark:text-zinc-400">
    {children}
  </kbd>
);

const CleanDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();
  const [pages, setPages] = useState<CleanPage[]>(["home"]);
  const [search, setSearch] = useState("");
  const page = pages[pages.length - 1]!;

  const goTo = (next: CleanPage) => {
    setPages((current) => [...current, next]);
    setSearch("");
  };

  const goBack = () => setPages((current) => (current.length > 1 ? current.slice(0, -1) : current));

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (!next) {
      setPages(["home"]);
      setSearch("");
    }
  };

  return (
    <>
      <LaunchButton label="Clean" onPress={open} />
      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
          <Command.Container size="lg">
            <Command.Dialog inputValue={search} onInputChange={setSearch}>
              <Command.Header className="flex flex-wrap gap-1 px-3 pt-2 pb-0">
                {pages.map((crumb) => (
                  <span
                    key={crumb}
                    className="inline-flex h-5 items-center rounded bg-default px-2 text-xs font-medium text-zinc-500 capitalize dark:text-zinc-400"
                  >
                    {crumb}
                  </span>
                ))}
              </Command.Header>
              <Command.InputGroup>
                <Command.InputGroup.Input
                  placeholder="Where to next?"
                  onKeyDownCapture={(event) => {
                    const isBackspace = event.key === "Backspace" && search === "";
                    const isEscape = event.key === "Escape" && search === "";

                    if (pages.length > 1 && (isBackspace || isEscape)) {
                      event.preventDefault();
                      event.stopPropagation();
                      goBack();
                    }
                  }}
                />
                <Command.InputGroup.ClearButton />
              </Command.InputGroup>
              {page === "home" ? (
                <Command.List key="home">
                  <Command.Group heading="Workspaces">
                    <Command.Item
                      id="browse-workspaces"
                      textValue="Browse Workspaces"
                      onAction={() => goTo("workspaces")}
                    >
                      <GIcon icon="layout-cells-large" />
                      <span>Browse Workspaces...</span>
                      <div className="ml-auto flex gap-1">
                        <CleanKey>B</CleanKey>
                        <CleanKey>W</CleanKey>
                      </div>
                    </Command.Item>
                    <Command.Item textValue="New Workspace">
                      <GIcon icon="square-plus" />
                      <span>New Workspace...</span>
                    </Command.Item>
                  </Command.Group>
                  <Command.Group heading="People">
                    <Command.Item
                      id="find-people"
                      textValue="Find People"
                      onAction={() => goTo("people")}
                    >
                      <GIcon icon="persons" />
                      <span>Find People...</span>
                      <div className="ml-auto flex gap-1">
                        <CleanKey>⇧</CleanKey>
                        <CleanKey>F</CleanKey>
                      </div>
                    </Command.Item>
                    <Command.Item textValue="Invite Member">
                      <GIcon icon="person-plus" />
                      <span>Invite Member...</span>
                    </Command.Item>
                  </Command.Group>
                  <Command.Group heading="Support">
                    <Command.Item textValue="Read Guides">
                      <GIcon icon="book-open" />
                      <span>Read Guides...</span>
                      <div className="ml-auto flex gap-1">
                        <CleanKey>⇧</CleanKey>
                        <CleanKey>G</CleanKey>
                      </div>
                    </Command.Item>
                    <Command.Item textValue="Report a Bug">
                      <GIcon icon="triangle-exclamation" />
                      <span>Report a Bug...</span>
                    </Command.Item>
                    <Command.Item textValue="Talk to Us">
                      <GIcon icon="headphones" />
                      <span>Talk to Us</span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              ) : (
                <Command.List key={page}>
                  {cleanSubPages[page].map((name) => (
                    <Command.Item
                      key={name}
                      textValue={name}
                      onAction={() => handleOpenChange(false)}
                    >
                      <span>{name}</span>
                    </Command.Item>
                  ))}
                </Command.List>
              )}
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const Clean: Story = {
  render: () => <CleanDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Minimal
 * -----------------------------------------------------------------------------------------------*/
const minimalItems = [
  {icon: "person", keys: ["A"], label: "Set assignee..."},
  {icon: "person-fill", keys: ["T"], label: "Take it myself"},
  {icon: "circle-dashed", keys: ["S"], label: "Update status..."},
  {icon: "flag", keys: ["P"], label: "Set priority..."},
  {icon: "tag", keys: ["L"], label: "Add tags..."},
  {icon: "circle-xmark", keys: ["⇧", "L"], label: "Clear tags..."},
  {icon: "calendar", keys: ["⇧", "D"], label: "Pick deadline..."},
];

const MinimalDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();

  return (
    <>
      <LaunchButton label="Minimal" onPress={open} />
      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Command.Container size="lg">
            <Command.Dialog>
              <Command.Header className="px-4 pt-4 pb-0">
                <div className="flex h-6 items-center rounded bg-default px-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Task - OPS-128
                </div>
              </Command.Header>
              <Command.InputGroup>
                <Command.InputGroup.Input
                  className="!text-lg caret-[#6e5ed2]"
                  placeholder="Type a command or search..."
                />
                <Command.InputGroup.ClearButton />
              </Command.InputGroup>
              <Command.List>
                {minimalItems.map((item) => (
                  <Command.Item
                    key={item.label}
                    className="!gap-3 !rounded-none before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[#5f6ad2] before:opacity-0 data-[focused=true]:!bg-zinc-100 data-[focused=true]:before:opacity-100 dark:data-[focused=true]:!bg-zinc-800/50"
                    textValue={item.label}
                  >
                    <GIcon icon={item.icon} />
                    <span>{item.label}</span>
                    <div className="ml-auto flex gap-2">
                      {item.keys.map((key) => (
                        <kbd key={key} className="text-[13px] text-zinc-500 dark:text-zinc-400">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </Command.Item>
                ))}
              </Command.List>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const Minimal: Story = {
  render: () => <MinimalDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Split View (list + live preview of the chosen component)
 * -----------------------------------------------------------------------------------------------*/
const splitItems: {description: string; id: string; preview: ReactNode}[] = [
  {description: "Run an action", id: "Button", preview: <Button>Continue</Button>},
  {
    description: "Capture text",
    id: "Input",
    preview: <Input placeholder="Your name" variant="secondary" />,
  },
  {description: "Label a status", id: "Chip", preview: <Chip color="success">Active</Chip>},
  {
    description: "Flip a setting",
    id: "Switch",
    preview: (
      <Switch defaultSelected>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Wi-Fi
        </Switch.Content>
      </Switch>
    ),
  },
  {
    description: "Show a person",
    id: "Avatar",
    preview: (
      <Avatar>
        <Avatar.Fallback>MK</Avatar.Fallback>
      </Avatar>
    ),
  },
  {description: "Signal loading", id: "Spinner", preview: <Spinner />},
  {
    description: "Hint a shortcut",
    id: "Kbd",
    preview: (
      <Kbd>
        <Kbd.Abbr keyValue="shift" />
        <Kbd.Content>P</Kbd.Content>
      </Kbd>
    ),
  },
];

const SplitViewDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();
  const [selected, setSelected] = useState(splitItems[0]!.id);
  const preview = splitItems.find((item) => item.id === selected)?.preview;

  return (
    <>
      <LaunchButton label="Split View" onPress={open} />
      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Command.Container size="lg">
            <Command.Dialog>
              <Command.InputGroup>
                <Command.InputGroup.Prefix>
                  <GIcon icon="magnifier" />
                </Command.InputGroup.Prefix>
                <Command.InputGroup.Input placeholder="Look up a component or pattern..." />
                <Command.InputGroup.ClearButton />
              </Command.InputGroup>
              <div className="flex min-h-[308px]">
                <Command.List className="!w-2/5 !flex-none">
                  <Command.Group heading="Components">
                    {splitItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        className="group rounded-xl data-[focused=true]:bg-blue-600 data-[focused=true]:text-white"
                        id={item.id}
                        textValue={item.id}
                        onAction={() => setSelected(item.id)}
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 [&_svg]:text-white">
                          <GIcon icon="cube" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{item.id}</span>
                          <span className="text-xs text-muted group-data-[focused=true]:text-white/70">
                            {item.description}
                          </span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>
                <div className="w-px self-stretch bg-separator" />
                <div className="flex flex-1 items-center justify-center rounded-lg p-4">
                  {preview}
                </div>
              </div>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const SplitView: Story = {
  render: () => <SplitViewDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Multiple Search Terms (removable scope chips under the input)
 * -----------------------------------------------------------------------------------------------*/
// Long enough to wrap onto a second row, like the Pro demo.
const searchScopes = ["Docs", "Issues", "Members", "Attachments", "Threads"];

const promptExamples = [
  {icon: "sparkles", label: "Recap yesterday's standup"},
  {icon: "square-plus", label: "Open a new issue"},
  {icon: "pencil", label: "Write a release note"},
  {icon: "calendar", label: "Book a review call"},
];

const matches = [
  {icon: "clock", label: "Recently viewed pages"},
  {icon: "chart-line", label: "Product roadmap"},
  {icon: "persons", label: "Member directory"},
  {icon: "gear", label: "Workspace preferences"},
];

const MultipleSearchTermsDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();
  const [scopes, setScopes] = useState(searchScopes);

  return (
    <>
      <LaunchButton label="Scoped Search" onPress={open} />
      <Command>
        <Command.Backdrop
          isOpen={isOpen}
          onOpenChange={(next) => {
            setIsOpen(next);
            if (!next) setScopes(searchScopes);
          }}
        >
          <Command.Container size="lg">
            <Command.Dialog>
              <Command.InputGroup>
                <Command.InputGroup.Prefix>
                  <GIcon icon="magnifier" />
                </Command.InputGroup.Prefix>
                <Command.InputGroup.Input placeholder="Search or ask anything" />
                <Command.InputGroup.ClearButton />
                <Command.InputGroup.Suffix>
                  <Kbd className="text-xs">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>K</Kbd.Content>
                  </Kbd>
                </Command.InputGroup.Suffix>
              </Command.InputGroup>
              {scopes.length > 0 && (
                <Command.Header className="flex flex-col items-start gap-2 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    {scopes.map((scope) => (
                      <Chip key={scope} size="sm" variant="soft">
                        <Chip.Label>{scope}</Chip.Label>
                        <CloseButton
                          aria-label={`Remove ${scope}`}
                          className="-mr-px size-4 [&_svg]:size-3"
                          onPress={() => setScopes((current) => current.filter((s) => s !== scope))}
                        />
                      </Chip>
                    ))}
                  </div>
                </Command.Header>
              )}
              <Command.List>
                <Command.Group heading="Ask anything">
                  {promptExamples.map((item) => (
                    <Command.Item key={item.label} textValue={item.label}>
                      <GIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group
                  heading={
                    <span className="flex w-full items-center justify-between">
                      <span>Matches ({matches.length})</span>
                      <button className="text-xs font-medium text-accent" type="button">
                        View all
                      </button>
                    </span>
                  }
                >
                  {matches.map((item) => (
                    <Command.Item key={item.label} textValue={item.label}>
                      <GIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
              <NavigationFooter
                className="h-10"
                extra={
                  // Wraps onto two lines (like the Pro demo), so the `h-10` footer keeps its 40px.
                  <span className="text-xs text-muted">
                    Still not finding it? Try searching the{" "}
                    <button className="font-medium text-accent" type="button">
                      Help Center
                    </button>
                  </span>
                }
              />
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const MultipleSearchTerms: Story = {
  render: () => <MultipleSearchTermsDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Empty state (documented `renderEmptyState` of Command.List)
 * -----------------------------------------------------------------------------------------------*/
const EmptyStateDemo = () => {
  const {isOpen, open, setIsOpen} = usePalette();

  return (
    <>
      <LaunchButton label="With Empty State" onPress={open} />
      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Command.Container>
            <Command.Dialog defaultInputValue="zebra">
              <Command.InputGroup>
                <Command.InputGroup.Prefix>
                  <GIcon icon="magnifier" />
                </Command.InputGroup.Prefix>
                <Command.InputGroup.Input />
                <Command.InputGroup.ClearButton />
              </Command.InputGroup>
              <Command.List renderEmptyState={() => "No results found."}>
                <Command.Group heading="Navigation">
                  <Command.Item>Home</Command.Item>
                  <Command.Item>Projects</Command.Item>
                </Command.Group>
                <Command.Separator />
                <Command.Group heading="Account">
                  <Command.Item>Profile</Command.Item>
                  <Command.Item isDisabled>Billing (admins only)</Command.Item>
                </Command.Group>
              </Command.List>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
};

export const EmptyState: Story = {
  render: () => <EmptyStateDemo />,
};
