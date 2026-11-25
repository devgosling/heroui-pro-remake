import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {ChatMessage} from "../chat-message";

import {ChatTool, ChatToolGroup} from "./index";

const meta = {
  argTypes: {
    argsText: {control: "text"},
    defaultExpanded: {control: "boolean"},
    errorText: {control: "text"},
    isDisabled: {control: "boolean"},
    state: {
      control: {type: "select"},
      options: [
        "input-streaming",
        "input-available",
        "output-available",
        "output-error",
        "requires-action",
      ],
    },
    toolName: {control: "text"},
    triggerPrefix: {control: "text"},
  },
  component: ChatTool,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChatTool",
} satisfies Meta<typeof ChatTool>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * Like the Pro demos, the tool card sits in a Chat Message assistant turn (avatar + body column)
 * on a centred page (24px padding, 40px from 640px up) that it fills edge to edge.
 * -----------------------------------------------------------------------------------------------*/
const DemoPage = ({children}: {children: ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10">{children}</div>
);

const AssistantTurn = ({children, text}: {children: ReactNode; text?: ReactNode}) => (
  <ChatMessage.Assistant>
    <ChatMessage.Avatar alt="Assistant" fallback="AI" />
    <ChatMessage.Body>
      {text ? <ChatMessage.Content>{text}</ChatMessage.Content> : null}
      {children}
    </ChatMessage.Body>
  </ChatMessage.Assistant>
);

/* -------------------------------------------------------------------------------------------------
 * Default - preset card for a finished call: compact JSON input, indented JSON output
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    input: {city: "Lisbon"},
    output: {forecast: "24°C, clear skies"},
    state: "output-available",
    toolName: "getForecast",
  },
  render: (args) => (
    <DemoPage>
      <AssistantTurn text="Ran a tool call with JSON input and output.">
        <ChatTool {...args} />
      </AssistantTurn>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Grouped - consecutive calls collapsed into one group card
 * -----------------------------------------------------------------------------------------------*/
export const Grouped: Story = {
  render: () => (
    <DemoPage>
      <AssistantTurn>
        <ChatToolGroup>
          <ChatToolGroup.Trigger>2 tool calls</ChatToolGroup.Trigger>
          <ChatToolGroup.Content>
            <ChatTool state="output-available" toolName="listInvoices" />
            <ChatTool state="output-available" toolName="sendReminder" />
          </ChatToolGroup.Content>
        </ChatToolGroup>
      </AssistantTurn>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Streaming - input still being generated (partial JSON, shimmering label)
 * -----------------------------------------------------------------------------------------------*/
export const Streaming: Story = {
  args: {
    argsText: '{"table":"orders","where":"status = ',
    state: "input-streaming",
    toolName: "queryDatabase",
  },
  render: (args) => (
    <DemoPage>
      <AssistantTurn>
        <ChatTool {...args} />
      </AssistantTurn>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Running - input complete, the tool is executing (`input-available`, `.chat-tool--running`).
 * Not one of the Pro demos; it covers the remaining documented state.
 * -----------------------------------------------------------------------------------------------*/
export const Running: Story = {
  args: {
    input: {table: "orders", where: "status = 'open'"},
    state: "input-available",
    toolName: "queryDatabase",
  },
  render: (args) => (
    <DemoPage>
      <AssistantTurn>
        <ChatTool {...args} />
      </AssistantTurn>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Error state - failed call with the error details
 * -----------------------------------------------------------------------------------------------*/
export const ErrorState: Story = {
  args: {
    errorText: "Upstream service returned 503",
    input: {endpoint: "https://api.example.org/status"},
    state: "output-error",
    toolName: "callEndpoint",
  },
  render: (args) => (
    <DemoPage>
      <AssistantTurn>
        <ChatTool {...args} />
      </AssistantTurn>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Approval - the call waits for the user to approve or reject it
 * -----------------------------------------------------------------------------------------------*/
export const Approval: Story = {
  args: {
    input: {branch: "release-2.1", repository: "northwind/web"},
    onApprove: () => {},
    onReject: () => {},
    state: "requires-action",
    toolName: "deleteBranch",
  },
  render: (args) => (
    <DemoPage>
      <AssistantTurn>
        <ChatTool {...args} />
      </AssistantTurn>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Composable - custom trigger and labelled content sections
 * -----------------------------------------------------------------------------------------------*/
const forecastInput = {city: "Lisbon"};
const forecastOutput = {forecast: "24°C, clear skies"};

export const Composable: Story = {
  args: {
    state: "output-available",
    toolName: "getForecast",
  },
  render: (args) => (
    <DemoPage>
      <AssistantTurn>
        <ChatTool {...args}>
          <ChatTool.Trigger>
            <ChatTool.StatusIcon />
            Used tool: <strong>getForecast</strong>
          </ChatTool.Trigger>
          <ChatTool.Content>
            <ChatTool.Args input={forecastInput} label="Arguments" />
            <ChatTool.Result label="Output" value={forecastOutput} />
          </ChatTool.Content>
        </ChatTool>
      </AssistantTurn>
    </DemoPage>
  ),
};
