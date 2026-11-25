import type {ImperativePanelHandle, ResizableHandleType, ResizableHandleVariant} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {Resizable} from "./index";

type ResizableStoryArgs = {
  orientation: "horizontal" | "vertical";
  type: ResizableHandleType;
  variant: ResizableHandleVariant;
  withIndicator: boolean;
  disabled: boolean;
};

const meta = {
  argTypes: {
    disabled: {control: "boolean", description: "Resizable.Handle `disabled`"},
    orientation: {control: {type: "select"}, options: ["horizontal", "vertical"]},
    type: {
      control: {type: "select"},
      description: "Resizable.Handle `type`",
      options: ["line", "drag", "pill", "handle"],
    },
    variant: {
      control: {type: "select"},
      description: "Resizable.Handle `variant`",
      options: ["primary", "secondary", "tertiary"],
    },
    withIndicator: {control: "boolean", description: "Resizable.Handle `withIndicator`"},
  },
  args: {
    disabled: false,
    orientation: "horizontal",
    type: "line",
    variant: "primary",
    withIndicator: false,
  },
  component: Resizable,
  parameters: {layout: "padded"},
  title: "Pro/Layout/Resizable",
} satisfies Meta<ResizableStoryArgs>;

export default meta;

type Story = StoryObj<ResizableStoryArgs>;

/* -------------------------------------------------------------------------------------------------
 * Story helpers (demo chrome only)
 * -----------------------------------------------------------------------------------------------*/
const Frame = ({
  children,
  className = "bg-background",
  height = "h-[400px]",
}: {
  children: ReactNode;
  className?: string;
  height?: string;
}) => (
  <div className={`${className} border-border ${height} w-full overflow-hidden rounded-xl border`}>
    {children}
  </div>
);

const PanelLabel = ({
  children,
  className = "",
  padding = "p-4",
  textClassName = "text-foreground",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
  textClassName?: string;
}) => (
  <div className={`flex h-full items-center justify-center ${padding} ${className}`}>
    <span className={`${textClassName} text-sm font-medium`}>{children}</span>
  </div>
);

const Caption = ({children}: {children: ReactNode}) => (
  <span className="text-xs font-medium tracking-wide text-muted uppercase">{children}</span>
);

/* -------------------------------------------------------------------------------------------------
 * Default - pixel-based sidebar that keeps its width when the group resizes
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: ({disabled, orientation, type, variant, withIndicator}) => (
    <Frame>
      <Resizable orientation={orientation}>
        <Resizable.Panel
          defaultSize="180px"
          groupResizeBehavior="preserve-pixel-size"
          maxSize="260px"
          minSize="140px"
        >
          <PanelLabel padding="p-6">Navigation</PanelLabel>
        </Resizable.Panel>
        <Resizable.Handle
          disabled={disabled}
          type={type}
          variant={variant}
          withIndicator={withIndicator}
        />
        <Resizable.Panel>
          <PanelLabel padding="p-6">Workspace</PanelLabel>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Vertical
 * -----------------------------------------------------------------------------------------------*/
export const Vertical: Story = {
  render: () => (
    <Frame>
      <Resizable orientation="vertical">
        <Resizable.Panel defaultSize={60} minSize={20}>
          <PanelLabel padding="p-6">Preview</PanelLabel>
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel defaultSize={40} minSize={20}>
          <PanelLabel padding="p-6">Console</PanelLabel>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Handle types
 * -----------------------------------------------------------------------------------------------*/
const handleTypes: ResizableHandleType[] = ["line", "drag", "pill", "handle"];

export const HandleTypes: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      {handleTypes.map((handleType) => (
        <div key={handleType} className="flex flex-col gap-2">
          <Caption>{handleType}</Caption>
          <Frame height="h-[200px]">
            <Resizable>
              <Resizable.Panel defaultSize={50} minSize={20}>
                <PanelLabel className="bg-surface" textClassName="text-surface-foreground">
                  Source
                </PanelLabel>
              </Resizable.Panel>
              <Resizable.Handle type={handleType} />
              <Resizable.Panel defaultSize={50} minSize={20}>
                <PanelLabel>Output</PanelLabel>
              </Resizable.Panel>
            </Resizable>
          </Frame>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Variants - each handle sits on the surface its separator token is meant for
 * -----------------------------------------------------------------------------------------------*/
const variantSurfaces: Array<{
  caption: string;
  surface: string;
  text: string;
  variant: ResizableHandleVariant;
}> = [
  {
    caption: "primary on background",
    surface: "bg-background",
    text: "text-foreground",
    variant: "primary",
  },
  {
    caption: "secondary on surface",
    surface: "bg-surface",
    text: "text-surface-foreground",
    variant: "secondary",
  },
  {
    caption: "tertiary on surface secondary",
    surface: "bg-surface-secondary",
    text: "text-surface-secondary-foreground",
    variant: "tertiary",
  },
];

export const Variants: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      {variantSurfaces.map(({caption, surface, text, variant}) => (
        <div key={variant} className="flex flex-col gap-2">
          <Caption>{caption}</Caption>
          <Frame className={surface} height="h-[180px]">
            <Resizable>
              <Resizable.Panel>
                <PanelLabel className={text} textClassName="">
                  Inbox
                </PanelLabel>
              </Resizable.Panel>
              <Resizable.Handle variant={variant} />
              <Resizable.Panel>
                <PanelLabel className={text} textClassName="">
                  Message
                </PanelLabel>
              </Resizable.Panel>
            </Resizable>
          </Frame>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With indicator
 * -----------------------------------------------------------------------------------------------*/
export const WithIndicator: Story = {
  render: () => (
    <Frame>
      <Resizable>
        <Resizable.Panel defaultSize={40} minSize={15}>
          <PanelLabel className="bg-surface" textClassName="text-surface-foreground">
            Outline
          </PanelLabel>
        </Resizable.Panel>
        <Resizable.Handle withIndicator />
        <Resizable.Panel defaultSize={60}>
          <PanelLabel>Document</PanelLabel>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Nested groups
 * -----------------------------------------------------------------------------------------------*/
export const NestedGroups: Story = {
  render: () => (
    <Frame height="h-[500px]">
      <Resizable>
        <Resizable.Panel defaultSize={25} minSize={15}>
          <PanelLabel className="bg-surface" padding="p-6" textClassName="text-surface-foreground">
            Explorer
          </PanelLabel>
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel defaultSize={75}>
          <Resizable orientation="vertical">
            <Resizable.Panel defaultSize={65} minSize={20}>
              <PanelLabel padding="p-6">Canvas</PanelLabel>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel defaultSize={35} minSize={15}>
              <PanelLabel
                className="bg-surface-secondary"
                padding="p-6"
                textClassName="text-surface-secondary-foreground"
              >
                Logs
              </PanelLabel>
            </Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Collapsible panels - imperative collapse / expand through `handleRef`
 * -----------------------------------------------------------------------------------------------*/
const CollapsibleExample = () => {
  const navigationRef = React.useRef<ImperativePanelHandle | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggle = () => {
    const panel = navigationRef.current;

    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onPress={toggle}>
          {isCollapsed ? "Show" : "Hide"} navigation
        </Button>
      </div>
      <Frame>
        <Resizable>
          <Resizable.Panel
            collapsible
            collapsedSize={0}
            defaultSize={25}
            handleRef={navigationRef}
            id="navigation"
            minSize={15}
            onCollapse={() => setIsCollapsed(true)}
            onExpand={() => setIsCollapsed(false)}
          >
            <PanelLabel className="bg-surface" textClassName="text-surface-foreground">
              Navigation
            </PanelLabel>
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel defaultSize={75} id="content">
            <PanelLabel>Content</PanelLabel>
          </Resizable.Panel>
        </Resizable>
      </Frame>
    </div>
  );
};

export const CollapsiblePanels: Story = {
  render: () => <CollapsibleExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Extra stories for documented features without a live Pro demo
 * -----------------------------------------------------------------------------------------------*/

/** Size units: pixel constraints on one panel, a percentage minimum on the other. */
export const SizeUnits: Story = {
  render: () => (
    <Frame>
      <Resizable>
        <Resizable.Panel
          defaultSize="260px"
          groupResizeBehavior="preserve-pixel-size"
          maxSize="22rem"
          minSize="200px"
        >
          <PanelLabel className="bg-surface" textClassName="text-surface-foreground">
            Filters (200px to 22rem)
          </PanelLabel>
        </Resizable.Panel>
        <Resizable.Handle type="drag" />
        <Resizable.Panel minSize={30}>
          <PanelLabel>Results (min 30%)</PanelLabel>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/** Persisted sizes: drag the handle, then reload the story; the layout is restored. */
export const PersistedSizes: Story = {
  render: () => {
    const [sizes, setSizes] = React.useState<number[]>([]);

    return (
      <div className="flex w-full flex-col gap-3">
        <span className="text-xs text-muted">
          Saved under <code>react-resizable-panels:storybook:resizable</code>:{" "}
          {sizes.map((size) => `${Math.round(size)}%`).join(" / ")}
        </span>
        <Frame>
          <Resizable autoSaveId="storybook:resizable" onLayout={setSizes}>
            <Resizable.Panel defaultSize={30} id="list" minSize={20}>
              <PanelLabel className="bg-surface" textClassName="text-surface-foreground">
                List
              </PanelLabel>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel defaultSize={70} id="detail">
              <PanelLabel>Detail</PanelLabel>
            </Resizable.Panel>
          </Resizable>
        </Frame>
      </div>
    );
  },
};

/**
 * A composed `Resizable.Indicator` with custom content replacing the default grip; `onDragging`
 * highlights it while the handle is dragged.
 */
const CustomIndicatorExample = () => {
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <Frame>
      <Resizable>
        <Resizable.Panel defaultSize={50} minSize={20}>
          <PanelLabel className="bg-surface" textClassName="text-surface-foreground">
            {isDragging ? "Resizing..." : "Before"}
          </PanelLabel>
        </Resizable.Panel>
        <Resizable.Handle onDragging={setIsDragging}>
          <Resizable.Indicator
            className={`size-6 rounded-full border border-border shadow-surface transition-colors ${
              isDragging ? "bg-accent text-accent-foreground" : "bg-background text-muted"
            }`}
          >
            <Icon className="size-3.5" icon="gravity-ui:arrows-left-right" />
          </Resizable.Indicator>
        </Resizable.Handle>
        <Resizable.Panel defaultSize={50} minSize={20}>
          <PanelLabel>After</PanelLabel>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  );
};

export const CustomIndicator: Story = {
  render: () => <CustomIndicatorExample />,
};
