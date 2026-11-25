import type {ModelSelectorModel} from "../model-selector";
import type {PromptInputStatus} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {
  Avatar,
  Button,
  Dropdown,
  Label,
  ListBox,
  Menu,
  ProgressCircle,
  Select,
  Separator,
  Switch,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useCallback, useEffect, useRef, useState} from "react";

import {ChatAttachment, ChatAttachmentGroup, ChatAttachmentInput} from "../chat-attachment";
import {ModelSelector} from "../model-selector";
import {PromptSuggestion} from "../prompt-suggestion";
import {TextShimmer} from "../text-shimmer";

import {PromptInput, TokenFieldValue, usePromptInputTokens} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    layout: {control: {type: "select"}, options: ["stacked", "compact", "inline"]},
    lockInputOnRun: {control: "boolean"},
    maxHeight: {control: {type: "number"}},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
    status: {control: {type: "select"}, options: ["ready", "submitted", "streaming", "error"]},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: PromptInput,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/PromptInput",
} satisfies Meta<typeof PromptInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mirrors the demo canvas: 40px padding, content centred (or docked to the bottom). */
const Canvas = ({
  children,
  placement = "center",
}: {
  children: React.ReactNode;
  placement?: "center" | "bottom";
}) => (
  <div
    className={`flex min-h-dvh w-full justify-center p-10 ${placement === "bottom" ? "items-end" : "items-center"}`}
  >
    {children}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Shared demo data (fictional models with hand-made marks)
 * -----------------------------------------------------------------------------------------------*/
const HarborMark = () => (
  <svg fill="#e8704a" viewBox="0 0 16 16">
    <path d="M8 1.25 14.75 8 8 14.75 1.25 8 8 1.25Zm0 3.5L4.75 8 8 11.25 11.25 8 8 4.75Z" />
  </svg>
);

const QuillMark = () => (
  <svg fill="#4f7df3" viewBox="0 0 16 16">
    <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
  </svg>
);

const levels = [
  {id: "low", label: "Low"},
  {id: "medium", label: "Medium"},
  {id: "high", label: "High"},
];

const models: ModelSelectorModel[] = [
  {
    contextWindow: 400_000,
    defaultEffort: "high",
    description: "Careful multi-step reasoning for long tasks.",
    efforts: levels,
    icon: <HarborMark />,
    id: "harbor-deep-4",
    intelligence: 5,
    name: "Harbor Deep 4",
    provider: "Harbor",
    shortName: "Deep 4",
    speed: 2,
  },
  {
    contextWindow: 200_000,
    defaultEffort: "medium",
    description: "Balanced quality and speed for everyday work.",
    efforts: levels,
    icon: <HarborMark />,
    id: "harbor-swift-4",
    intelligence: 4,
    name: "Harbor Swift 4",
    provider: "Harbor",
    shortName: "Swift 4",
    speed: 4,
  },
  {
    contextWindow: 128_000,
    description: "Fast drafts and quick answers.",
    icon: <QuillMark />,
    id: "quill-lite",
    intelligence: 3,
    name: "Quill Lite",
    provider: "Quill",
    speed: 5,
  },
];

/* -------------------------------------------------------------------------------------------------
 * Default: attach button with tooltip, model selector and send in the toolbar
 * -----------------------------------------------------------------------------------------------*/
type DraftFile = {id: string; mimeType: string; name: string; size: number; src?: string};

let draftFileId = 0;

/** Keeps picked files with local preview URLs and revokes them when they leave. */
function useDraftFiles() {
  const [files, setFiles] = useState<DraftFile[]>([]);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(
    () => () => filesRef.current.forEach((file) => file.src && URL.revokeObjectURL(file.src)),
    [],
  );

  const addFiles = useCallback((selected: File[]) => {
    setFiles((current) => [
      ...current,
      ...selected.map((file) => ({
        id: `draft-file-${++draftFileId}`,
        mimeType: file.type,
        name: file.name,
        size: file.size,
        src: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      })),
    ]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((current) => {
      const target = current.find((file) => file.id === id);

      if (target?.src) URL.revokeObjectURL(target.src);

      return current.filter((file) => file.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles((current) => {
      current.forEach((file) => file.src && URL.revokeObjectURL(file.src));

      return [];
    });
  }, []);

  return {addFiles, clearFiles, files, removeFile};
}

const DraftAttachments = ({
  files,
  onRemove,
  showInfo = false,
}: {
  files: DraftFile[];
  onRemove: (id: string) => void;
  showInfo?: boolean;
}) => (
  <PromptInput.Attachments>
    {files.length > 0 ? (
      <ChatAttachmentGroup>
        {files.map((file) => (
          <ChatAttachment
            key={file.id}
            mimeType={file.mimeType}
            name={file.name}
            size={file.size}
            src={file.src}
          >
            <ChatAttachment.Preview />
            {showInfo ? <ChatAttachment.Info /> : null}
            <ChatAttachment.Remove onPress={() => onRemove(file.id)} />
          </ChatAttachment>
        ))}
      </ChatAttachmentGroup>
    ) : null}
  </PromptInput.Attachments>
);

const AttachAction = ({label = "Attach file"}: {label?: string}) => (
  <ChatAttachmentInput.Trigger
    render={({"aria-label": _ariaLabel, ...triggerProps}) => (
      <PromptInput.Action {...triggerProps} aria-label={label} tooltip={label}>
        <Icon className="size-4" icon="gravity-ui:paperclip" />
      </PromptInput.Action>
    )}
  />
);

type ComposerProps = React.ComponentProps<typeof PromptInput> & {
  footer?: React.ReactNode;
  placeholder?: string;
  withModelSelector?: boolean;
};

/** A complete composer: file picking / dropping, attachments, toolbar, send and footer. */
const Composer = ({footer, placeholder, withModelSelector = false, ...props}: ComposerProps) => {
  const [value, setValue] = useState("");
  const {addFiles, clearFiles, files, removeFile} = useDraftFiles();

  const send = () => {
    setValue("");
    clearFiles();
  };

  return (
    <PromptInput value={value} onSubmit={send} onValueChange={setValue} {...props}>
      <ChatAttachmentInput onFilesSelected={addFiles}>
        <ChatAttachmentInput.Dropzone
          render={(dropzoneProps) => (
            <PromptInput.Shell {...dropzoneProps}>
              <PromptInput.Content>
                <DraftAttachments files={files} onRemove={removeFile} />
                <PromptInput.TextArea placeholder={placeholder} />
              </PromptInput.Content>
              <PromptInput.Toolbar>
                <PromptInput.ToolbarStart>
                  <AttachAction />
                </PromptInput.ToolbarStart>
                <PromptInput.ToolbarEnd>
                  {withModelSelector ? (
                    <ModelSelector defaultValue="harbor-deep-4" models={models} />
                  ) : null}
                  <PromptInput.Send>
                    <Icon className="size-4" icon="gravity-ui:arrow-up" />
                  </PromptInput.Send>
                </PromptInput.ToolbarEnd>
              </PromptInput.Toolbar>
            </PromptInput.Shell>
          )}
        />
      </ChatAttachmentInput>
      {footer ? <PromptInput.Footer>{footer}</PromptInput.Footer> : null}
    </PromptInput>
  );
};

export const Default: Story = {
  args: {layout: "stacked", size: "md", variant: "primary"},
  render: (args) => (
    <Canvas placement="bottom">
      <div className="w-full max-w-[640px]">
        <Composer
          withModelSelector
          footer="Answers can be wrong. Double-check anything that matters."
          {...args}
        />
      </div>
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Review Composer: workflow buttons above a compact composer and a status row below it
 * -----------------------------------------------------------------------------------------------*/
const draftModels = [
  {id: "draft-3", mode: "Quick", name: "Draft 3"},
  {id: "draft-3-deep", mode: "Deep", name: "Draft 3"},
  {id: "relay-2", mode: "Quick", name: "Relay 2"},
];

const DraftModelSelect = ({className}: {className: string}) => (
  <Select aria-label="Model" className={className} defaultSelectedKey="draft-3">
    <Select.Trigger className="h-8 max-w-[180px] min-w-0 items-center gap-1 rounded-full border-0 bg-transparent px-2 text-sm font-normal text-foreground shadow-none transition-colors hover:bg-default-hover data-[hovered=true]:bg-default-hover">
      <Select.Value className="min-w-0 flex-1 overflow-hidden">
        {({selectedItem}) => {
          const model = (selectedItem as (typeof draftModels)[number] | null) ?? draftModels[0]!;

          return (
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate font-normal">{model.name}</span>
              <span className="shrink-0 font-normal text-muted">{model.mode}</span>
            </span>
          );
        }}
      </Select.Value>
      <Select.Indicator className="static my-0 size-4 shrink-0 text-muted" />
    </Select.Trigger>
    <Select.Popover className="min-w-[240px]">
      <div className="flex h-10 items-center justify-between gap-4 px-4 text-sm">
        <span>Boost mode</span>
        <Switch defaultSelected aria-label="Boost mode" size="sm">
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
      <Separator />
      <ListBox className="p-2" items={draftModels}>
        {(model) => (
          <ListBox.Item id={model.id} textValue={`${model.name} ${model.mode}`}>
            <span className="text-sm">
              <span className="font-medium">{model.name}</span>
              <span className="ml-1 font-normal text-muted">{model.mode}</span>
            </span>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        )}
      </ListBox>
    </Select.Popover>
  </Select>
);

const outlineButtonStyle = {
  "--button-bg": "var(--background)",
  "--button-bg-hover": "var(--default-hover)",
  "--button-bg-pressed": "var(--default-hover)",
} as React.CSSProperties;

export const ReviewComposer: Story = {
  args: {layout: "compact"},
  render: (args) => (
    <Canvas>
      <div className="flex w-full max-w-[800px] min-w-0 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" style={outlineButtonStyle} variant="outline">
            <span>Inspect</span>
            <span className="font-semibold text-success-soft-foreground">+212</span>
            <span className="font-semibold text-danger-soft-foreground">-58</span>
          </Button>
          <Button
            className="hidden sm:inline-flex"
            size="sm"
            style={outlineButtonStyle}
            variant="outline"
          >
            <span className="truncate">Open Pull Request</span>
          </Button>
          <Dropdown>
            <Button
              isIconOnly
              aria-label="More actions"
              size="sm"
              style={outlineButtonStyle}
              variant="outline"
            >
              <Icon className="size-4" icon="gravity-ui:ellipsis" />
            </Button>
            <Dropdown.Popover className="w-48">
              <Dropdown.Menu aria-label="More actions">
                <Dropdown.Item id="discard" textValue="Discard changes">
                  <Label>Discard changes</Label>
                </Dropdown.Item>
                <Dropdown.Item id="copy" textValue="Copy diff">
                  <Label>Copy diff</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
        <ReviewPrompt {...args} />
        <div className="flex items-center justify-between gap-3 px-2 text-xs text-muted sm:px-4 sm:text-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <Icon className="size-4" icon="gravity-ui:branches-right" />
              feature/export
            </span>
            <span className="flex items-center gap-1.5">
              <Icon className="size-4" icon="gravity-ui:display" />
              Workspace
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ProgressCircle aria-label="Task progress" color="default" size="sm" value={64}>
              <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
              </ProgressCircle.Track>
            </ProgressCircle>
            <span className="tabular-nums">64%</span>
          </div>
        </div>
      </div>
    </Canvas>
  ),
};

const ReviewPrompt = (props: React.ComponentProps<typeof PromptInput>) => {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;

  return (
    <PromptInput
      className="group max-w-full min-w-0 overflow-hidden"
      layout="compact"
      value={value}
      onSubmit={() => setValue("")}
      onValueChange={setValue}
      {...props}
    >
      <PromptInput.Shell>
        <PromptInput.Content>
          <PromptInput.TextArea className="min-w-0" placeholder="Ask for another pass" />
        </PromptInput.Content>
        <PromptInput.Toolbar className="group-data-[expanded=true]:justify-start group-data-[expanded=true]:gap-1.5 sm:group-data-[expanded=true]:justify-between">
          <PromptInput.ToolbarStart>
            <PromptInput.Action
              aria-label="Add context"
              className="bg-default text-muted hover:bg-default-hover"
              tooltip="Add context"
            >
              <Icon className="size-4" icon="gravity-ui:plus" />
            </PromptInput.Action>
            <DraftModelSelect className="hidden w-auto min-w-0 min-[420px]:group-data-[expanded=true]:!block" />
          </PromptInput.ToolbarStart>
          <PromptInput.ToolbarEnd className="flex min-w-0 gap-1.5 group-data-[expanded=true]:!flex">
            <DraftModelSelect className="hidden w-auto min-w-0 group-data-[expanded=true]:!hidden sm:block" />
            <PromptInput.Action
              aria-label="Voice input"
              tooltip="Voice input"
              className={
                hasText
                  ? "bg-transparent text-muted hover:bg-default-hover"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }
            >
              <Icon className="size-4" icon="gravity-ui:microphone" />
            </PromptInput.Action>
            {hasText ? (
              <PromptInput.Send className="bg-foreground text-background hover:bg-foreground/90">
                <Icon className="size-4" icon="gravity-ui:arrow-up" />
              </PromptInput.Send>
            ) : null}
          </PromptInput.ToolbarEnd>
        </PromptInput.Toolbar>
      </PromptInput.Shell>
    </PromptInput>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Secondary: default-coloured surface
 * -----------------------------------------------------------------------------------------------*/
export const Secondary: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <Canvas placement="bottom">
      <div className="w-full max-w-[640px]">
        <Composer withModelSelector footer="Composer on the default surface colour." {...args} />
      </div>
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Inline: attach, input and send in one row while the textarea grows
 * -----------------------------------------------------------------------------------------------*/
export const Inline: Story = {
  args: {layout: "inline"},
  render: (args) => (
    <Canvas>
      <div className="w-full max-w-[640px]">
        <Composer
          footer="Answers can be wrong. Double-check anything that matters."
          placeholder="Reply to the thread"
          {...args}
        />
      </div>
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Compact: single-row pill that switches to the stacked composer once text wraps
 * -----------------------------------------------------------------------------------------------*/
export const Compact: Story = {
  args: {layout: "compact"},
  render: (args) => (
    <Canvas>
      <div className="w-full max-w-[640px]">
        <Composer
          footer="Answers can be wrong. Double-check anything that matters."
          placeholder="Reply to the thread"
          {...args}
        />
      </div>
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Attachments: the shell is the drop zone (dotted accent border while dragging files)
 * -----------------------------------------------------------------------------------------------*/
const AttachmentsComposer = (props: React.ComponentProps<typeof PromptInput>) => {
  const [value, setValue] = useState("");
  const {addFiles, clearFiles, files, removeFile} = useDraftFiles();

  return (
    <PromptInput
      className="max-w-xl"
      value={value}
      onValueChange={setValue}
      onSubmit={() => {
        setValue("");
        clearFiles();
      }}
      {...props}
    >
      <ChatAttachmentInput onFilesSelected={addFiles}>
        <ChatAttachmentInput.Dropzone
          render={(dropzoneProps) => (
            <PromptInput.Shell {...dropzoneProps}>
              <PromptInput.Content>
                <DraftAttachments showInfo files={files} onRemove={removeFile} />
                <PromptInput.TextArea placeholder="Drop files or ask about them..." />
              </PromptInput.Content>
              <PromptInput.Toolbar>
                <PromptInput.ToolbarStart>
                  <AttachAction />
                </PromptInput.ToolbarStart>
                <PromptInput.ToolbarEnd>
                  <PromptInput.Send aria-label="Send">
                    <Icon className="size-4" icon="gravity-ui:arrow-up" />
                  </PromptInput.Send>
                </PromptInput.ToolbarEnd>
              </PromptInput.Toolbar>
            </PromptInput.Shell>
          )}
        />
      </ChatAttachmentInput>
    </PromptInput>
  );
};

export const WithAttachments: Story = {
  render: (args) => (
    <Canvas>
      <AttachmentsComposer {...args} />
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Suggestions: starter prompts under a hero composer
 * -----------------------------------------------------------------------------------------------*/
const starters = [
  {icon: "gravity-ui:layout-header", label: "Sketch a pricing page"},
  {icon: "gravity-ui:file-text", label: "Draft release notes"},
  {icon: "gravity-ui:music-note", label: "Write a podcast intro"},
  {icon: "gravity-ui:database", label: "Design a schema"},
];

const SuggestionsComposer = (props: React.ComponentProps<typeof PromptInput>) => {
  const [value, setValue] = useState("");

  return (
    <div className="mx-auto flex min-h-[520px] w-full max-w-[920px] flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-normal tracking-tight text-foreground">
          Start something new with <TextShimmer className="text-muted">your copilot</TextShimmer>
        </h2>
        <p className="text-sm text-muted">
          Type an idea, attach a file, or pick a starter below to set the direction
        </p>
      </div>
      <PromptInput
        className="w-full max-w-[780px]"
        value={value}
        onSubmit={() => setValue("")}
        onValueChange={setValue}
        {...props}
      >
        <PromptInput.Shell className="shadow-overlay">
          <PromptInput.Content>
            <PromptInput.TextArea
              className="min-h-19"
              placeholder="Describe a product, a flow or a screen..."
            />
          </PromptInput.Content>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarStart>
              <PromptInput.Action aria-label="Dictate" tooltip="Dictate">
                <Icon className="size-4" icon="gravity-ui:microphone" />
              </PromptInput.Action>
              <PromptInput.Action aria-label="Add context" tooltip="Add context">
                <Icon className="size-4" icon="gravity-ui:plus" />
              </PromptInput.Action>
            </PromptInput.ToolbarStart>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send>
                <Icon className="size-4" icon="gravity-ui:arrow-up" />
              </PromptInput.Send>
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
      </PromptInput>
      <PromptSuggestion className="w-full max-w-[560px]" variant="pill">
        <PromptSuggestion.Items className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {starters.map((starter) => (
            <PromptSuggestion.Item
              key={starter.label}
              className="items-center justify-start"
              onPress={() => setValue(starter.label)}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0" icon={starter.icon} />
                <span className="truncate">{starter.label}</span>
              </span>
            </PromptSuggestion.Item>
          ))}
        </PromptSuggestion.Items>
      </PromptSuggestion>
    </div>
  );
};

export const WithSuggestions: Story = {
  render: (args) => (
    <Canvas>
      <SuggestionsComposer {...args} />
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Token Input: @ mentions and / commands as inline tokens
 * -----------------------------------------------------------------------------------------------*/
const teammates = [
  {color: "#60a5fa", id: "noah", name: "Noah Patel"},
  {color: "#34d399", id: "lena", name: "Lena Brooks"},
  {color: "#a78bfa", id: "omar", name: "Omar Haddad"},
  {color: "#fb923c", id: "ines", name: "Ines Moreau"},
  {color: "#f87171", id: "kai", name: "Kai Tanaka"},
];

const commands = [
  {description: "Condense the conversation", id: "recap"},
  {description: "Turn notes into tasks", id: "tasks"},
  {description: "Explain the selection", id: "clarify"},
  {description: "Rewrite in a friendlier tone", id: "soften"},
  {description: "Draft unit tests", id: "specs"},
];

const initialTokens = new TokenFieldValue([
  {text: "Ask ", type: "text"},
  {text: "@noah", type: "token"},
  {text: " to check the migration plan, then ", type: "text"},
  {text: "/recap", type: "token"},
  {text: " the discussion", type: "text"},
]);

const TokenComposer = (props: React.ComponentProps<typeof PromptInput>) => {
  const tokens = usePromptInputTokens({defaultValue: initialTokens, triggers: ["@", "/"]});
  const query = tokens.query.toLowerCase();
  const people = teammates.filter((person) => person.id.startsWith(query));
  const actions = commands.filter((command) => command.id.startsWith(query));
  const hasSuggestions = (tokens.trigger === "@" ? people : actions).length > 0;

  return (
    <div className="flex min-h-[340px] w-full max-w-[640px] flex-col justify-end">
      <PromptInput onSubmit={() => tokens.setValue(new TokenFieldValue([]))} {...props}>
        <PromptInput.Shell>
          <PromptInput.Tokens>
            <PromptInput.Content>
              <PromptInput.TokenInput
                placeholder="Ask anything, @ to mention, / for commands"
                tokens={tokens}
              />
            </PromptInput.Content>
            <PromptInput.TokenSuggestions
              isOpen={!!tokens.isOpen && hasSuggestions}
              placement="top start"
              tokens={tokens}
            >
              {tokens.trigger === "@" ? (
                <Menu aria-label="Teammates" items={people}>
                  {(person) => (
                    <Menu.Item
                      id={person.id}
                      textValue={person.name}
                      onAction={() => tokens.insertToken(`@${person.id}`)}
                    >
                      <Avatar size="sm">
                        <Avatar.Fallback style={{backgroundColor: person.color, color: "#fff"}}>
                          {person.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{person.name}</span>
                        <span className="truncate text-xs text-muted">@{person.id}</span>
                      </span>
                    </Menu.Item>
                  )}
                </Menu>
              ) : (
                <Menu aria-label="Commands" items={actions}>
                  {(command) => (
                    <Menu.Item
                      id={command.id}
                      textValue={command.id}
                      onAction={() => tokens.insertToken(`/${command.id}`)}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">/{command.id}</span>
                        <span className="truncate text-xs text-muted">{command.description}</span>
                      </span>
                    </Menu.Item>
                  )}
                </Menu>
              )}
            </PromptInput.TokenSuggestions>
          </PromptInput.Tokens>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarStart>
              <PromptInput.Action aria-label="Attach file" tooltip="Attach file">
                <Icon className="size-4" icon="gravity-ui:paperclip" />
              </PromptInput.Action>
            </PromptInput.ToolbarStart>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send>
                <Icon className="size-4" icon="gravity-ui:arrow-up" />
              </PromptInput.Send>
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
        <PromptInput.Footer>
          Answers can be wrong. Double-check anything that matters.
        </PromptInput.Footer>
      </PromptInput>
    </div>
  );
};

export const TokenInput: Story = {
  render: (args) => (
    <Canvas>
      <TokenComposer {...args} />
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Queue: queued follow-ups above the composer, reorderable by drag or arrow keys
 * -----------------------------------------------------------------------------------------------*/
type QueuedPrompt = {id: string; text: string};

const initialQueue: QueuedPrompt[] = [
  {id: "q1", text: "Compare the two onboarding flows and list the steps where users drop off."},
  {id: "q2", text: "Add keyboard shortcuts to the editor toolbar."},
  {id: "q3", text: "Move the billing settings into their own tab."},
  {id: "q4", text: "2 attachments"},
];

let queueId = 10;

const QueueComposer = (props: React.ComponentProps<typeof PromptInput>) => {
  const [queue, setQueue] = useState(initialQueue);
  const [value, setValue] = useState("");

  const remove = (id: string) => setQueue((current) => current.filter((item) => item.id !== id));
  const duplicate = (item: QueuedPrompt) =>
    setQueue((current) => {
      const index = current.indexOf(item);
      const copy = {id: `q${++queueId}`, text: item.text};

      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });

  return (
    <div className="w-full max-w-[640px]">
      <PromptInput
        value={value}
        onValueChange={setValue}
        onSubmit={() => {
          setQueue((current) => [...current, {id: `q${++queueId}`, text: value.trim()}]);
          setValue("");
        }}
        {...props}
      >
        {queue.length > 0 ? (
          <PromptInput.Queue>
            <PromptInput.Queue.List values={queue} onReorder={setQueue}>
              {queue.map((item) => (
                <PromptInput.Queue.Item key={item.id} value={item}>
                  <PromptInput.Queue.Item.Handle />
                  <PromptInput.Queue.Item.Body>
                    <PromptInput.Queue.Item.Icon />
                    <PromptInput.Queue.Item.Content>{item.text}</PromptInput.Queue.Item.Content>
                  </PromptInput.Queue.Item.Body>
                  <PromptInput.Queue.Item.Actions>
                    <PromptInput.Queue.Item.Remove onPress={() => remove(item.id)} />
                    <Dropdown>
                      <PromptInput.Queue.Item.More />
                      <Dropdown.Popover className="w-44" placement="bottom end">
                        <Dropdown.Menu
                          aria-label="Queued prompt actions"
                          onAction={(key) => {
                            if (key === "edit") {
                              setValue(item.text);
                              remove(item.id);
                            } else if (key === "duplicate") duplicate(item);
                            else if (key === "remove") remove(item.id);
                          }}
                        >
                          <Dropdown.Item id="edit" textValue="Edit prompt">
                            <Icon className="size-4 shrink-0 text-muted" icon="gravity-ui:pencil" />
                            <Label>Edit prompt</Label>
                          </Dropdown.Item>
                          <Dropdown.Item id="duplicate" textValue="Duplicate">
                            <Icon className="size-4 shrink-0 text-muted" icon="gravity-ui:copy" />
                            <Label>Duplicate</Label>
                          </Dropdown.Item>
                          <Dropdown.Item id="remove" textValue="Remove from queue" variant="danger">
                            <Icon
                              className="size-4 shrink-0 text-danger"
                              icon="gravity-ui:trash-bin"
                            />
                            <Label>Remove from queue</Label>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </PromptInput.Queue.Item.Actions>
                </PromptInput.Queue.Item>
              ))}
            </PromptInput.Queue.List>
          </PromptInput.Queue>
        ) : null}
        <PromptInput.Shell>
          <PromptInput.Content>
            <PromptInput.TextArea placeholder="Queue another change" />
          </PromptInput.Content>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarStart>
              <PromptInput.Action aria-label="Add attachment" tooltip="Add attachment">
                <Icon className="size-4" icon="gravity-ui:paperclip" />
              </PromptInput.Action>
            </PromptInput.ToolbarStart>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send />
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
      </PromptInput>
    </div>
  );
};

export const Queue: Story = {
  render: (args) => (
    <Canvas>
      <QueueComposer {...args} />
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Run State: ready -> submitted -> streaming -> ready, with stop
 * -----------------------------------------------------------------------------------------------*/
const RunStateComposer = (props: React.ComponentProps<typeof PromptInput>) => {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<PromptInputStatus>("ready");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const submit = () => {
    setValue("");
    setStatus("submitted");
    timers.current.push(
      window.setTimeout(() => setStatus("streaming"), 400),
      window.setTimeout(() => setStatus("ready"), 1800),
    );
  };

  const stop = () => {
    clearTimers();
    setStatus("ready");
  };

  return (
    <div className="w-full max-w-[640px]">
      <PromptInput
        status={status}
        value={value}
        onStop={stop}
        onSubmit={submit}
        onValueChange={setValue}
        {...props}
      >
        <PromptInput.Shell>
          <PromptInput.Content>
            <PromptInput.TextArea placeholder="Send a message to watch the run states" />
          </PromptInput.Content>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send />
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
        <PromptInput.Footer>
          The send button turns into stop while a reply is running.
        </PromptInput.Footer>
      </PromptInput>
    </div>
  );
};

export const RunState: Story = {
  render: (args) => (
    <Canvas>
      <RunStateComposer {...args} />
    </Canvas>
  ),
};
