import type {Selection} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Header, Kbd, Label, Separator} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {ContextMenu} from "./index";

const meta = {
  argTypes: {
    defaultOpen: {control: "boolean"},
    isDisabled: {control: "boolean"},
  },
  component: ContextMenu,
  parameters: {layout: "centered"},
  title: "Pro/Navigation/ContextMenu",
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const TriggerArea = ({children}: {children: ReactNode}) => (
  <div className="flex h-48 w-80 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted select-none">
    {children}
  </div>
);

const Shortcut = ({keys}: {keys: string}) => (
  <Kbd className="ms-auto" slot="keyboard" variant="light">
    <Kbd.Abbr keyValue="command" />
    <Kbd.Content>{keys}</Kbd.Content>
  </Kbd>
);

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <ContextMenu {...args}>
      <ContextMenu.Trigger>
        <TriggerArea>Right-click this area</TriggerArea>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu>
          <ContextMenu.Item id="undo" textValue="Undo">
            <Label>Undo</Label>
            <Shortcut keys="Z" />
          </ContextMenu.Item>
          <ContextMenu.Item isDisabled id="redo" textValue="Redo">
            <Label>Redo</Label>
            <Shortcut keys="Y" />
          </ContextMenu.Item>
          <ContextMenu.Item id="refresh" textValue="Refresh">
            <Label>Refresh</Label>
            <Shortcut keys="R" />
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item id="save-as" textValue="Save As">
            <Label>Save As…</Label>
          </ContextMenu.Item>
          <ContextMenu.Item id="print" textValue="Print">
            <Label>Print</Label>
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  ),
};

export const WithSections: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger>
        <TriggerArea>Right-click a file</TriggerArea>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu>
          <ContextMenu.Section>
            <Header>File</Header>
            <ContextMenu.Item id="open" textValue="Open">
              <Icon className="size-4 text-muted" icon="gravity-ui:arrow-up-right-from-square" />
              <Label>Open</Label>
              <Shortcut keys="O" />
            </ContextMenu.Item>
            <ContextMenu.Item id="duplicate" textValue="Duplicate">
              <Icon className="size-4 text-muted" icon="gravity-ui:copy" />
              <Label>Duplicate</Label>
              <Shortcut keys="D" />
            </ContextMenu.Item>
            <ContextMenu.Item id="download" textValue="Download">
              <Icon className="size-4 text-muted" icon="gravity-ui:arrow-down-to-line" />
              <Label>Download</Label>
              <Shortcut keys="S" />
            </ContextMenu.Item>
          </ContextMenu.Section>
          <Separator />
          <ContextMenu.Section>
            <Header>Organize</Header>
            <ContextMenu.Item id="move" textValue="Move to">
              <Icon className="size-4 text-muted" icon="gravity-ui:folder-arrow-right" />
              <Label>Move to</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="share" textValue="Share">
              <Icon className="size-4 text-muted" icon="gravity-ui:person-plus" />
              <Label>Share</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="trash" textValue="Move to Trash" variant="danger">
              <Icon className="size-4 text-danger" icon="gravity-ui:trash-bin" />
              <Label>Move to Trash</Label>
            </ContextMenu.Item>
          </ContextMenu.Section>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  ),
};

export const WithSelection: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<Selection>(new Set(["name"]));

    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <TriggerArea>Right-click to sort the list</TriggerArea>
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu
            selectedKeys={selected}
            selectionMode="single"
            onSelectionChange={setSelected}
          >
            <ContextMenu.Section>
              <Header>Sort by</Header>
              <ContextMenu.Item id="name" textValue="Name">
                <ContextMenu.ItemIndicator />
                <Label>Name</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="modified" textValue="Modified">
                <ContextMenu.ItemIndicator />
                <Label>Modified</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="size" textValue="Size">
                <ContextMenu.ItemIndicator />
                <Label>Size</Label>
              </ContextMenu.Item>
            </ContextMenu.Section>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    );
  },
};

export const WithSubmenus: Story = {
  render: () => {
    const [panels, setPanels] = React.useState<Selection>(new Set(["grid"]));
    const [zoom, setZoom] = React.useState<Selection>(new Set(["100"]));

    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <TriggerArea>Right-click the canvas</TriggerArea>
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu>
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
              <Shortcut keys="C" />
            </ContextMenu.Item>
            <ContextMenu.Item isDisabled id="paste" textValue="Paste">
              <Label>Paste</Label>
              <Shortcut keys="V" />
            </ContextMenu.Item>
            <ContextMenu.Item id="select-all" textValue="Select All">
              <Label>Select All</Label>
              <Shortcut keys="A" />
            </ContextMenu.Item>
            <ContextMenu.SubmenuTrigger>
              <ContextMenu.Item id="export" textValue="Export">
                <Label>Export</Label>
                <ContextMenu.SubmenuIndicator />
              </ContextMenu.Item>
              <ContextMenu.Popover>
                <ContextMenu.Menu>
                  <ContextMenu.Item id="png" textValue="Export as PNG">
                    <Label>As PNG…</Label>
                    <Shortcut keys="E" />
                  </ContextMenu.Item>
                  <ContextMenu.Item id="svg" textValue="Export as SVG">
                    <Label>As SVG…</Label>
                  </ContextMenu.Item>
                  <ContextMenu.Item id="pdf" textValue="Export as PDF">
                    <Label>As PDF…</Label>
                  </ContextMenu.Item>
                  <ContextMenu.Separator />
                  <ContextMenu.Item id="export-settings" textValue="Export Settings">
                    <Label>Export Settings</Label>
                  </ContextMenu.Item>
                </ContextMenu.Menu>
              </ContextMenu.Popover>
            </ContextMenu.SubmenuTrigger>
            <Separator />
            <ContextMenu.Section
              aria-label="Panels"
              selectedKeys={panels}
              selectionMode="multiple"
              onSelectionChange={setPanels}
            >
              <ContextMenu.Item id="grid" textValue="Show Grid">
                <ContextMenu.ItemIndicator />
                <Label>Show Grid</Label>
                <Shortcut keys="G" />
              </ContextMenu.Item>
              <ContextMenu.Item id="rulers" textValue="Show Rulers">
                <ContextMenu.ItemIndicator />
                <Label>Show Rulers</Label>
              </ContextMenu.Item>
            </ContextMenu.Section>
            <Separator />
            <ContextMenu.Section
              selectedKeys={zoom}
              selectionMode="single"
              onSelectionChange={setZoom}
            >
              <Header>Zoom</Header>
              <ContextMenu.Item id="50" textValue="50%">
                <ContextMenu.ItemIndicator type="dot" />
                <Label>50%</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="100" textValue="100%">
                <ContextMenu.ItemIndicator type="dot" />
                <Label>100%</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="150" textValue="150%">
                <ContextMenu.ItemIndicator type="dot" />
                <Label>150%</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="200" textValue="200%">
                <ContextMenu.ItemIndicator type="dot" />
                <Label>200%</Label>
              </ContextMenu.Item>
            </ContextMenu.Section>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    );
  },
};

export const LongPress: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger>
        <TriggerArea>Press and hold (touch screens)</TriggerArea>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu>
          <ContextMenu.Item id="view" textValue="View">
            <Label>View</Label>
          </ContextMenu.Item>
          <ContextMenu.Item id="favorite" textValue="Favorite">
            <Label>Favorite</Label>
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item id="rotate" textValue="Rotate">
            <Label>Rotate</Label>
          </ContextMenu.Item>
          <ContextMenu.Item id="crop" textValue="Crop">
            <Label>Crop</Label>
          </ContextMenu.Item>
          <ContextMenu.Item id="hide" textValue="Hide">
            <Label>Hide</Label>
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ContextMenu isDisabled>
      <ContextMenu.Trigger>
        <TriggerArea>Right-click shows the browser menu</TriggerArea>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu>
          <ContextMenu.Item id="rename" textValue="Rename">
            <Label>Rename</Label>
          </ContextMenu.Item>
          <ContextMenu.Item id="archive" textValue="Archive">
            <Label>Archive</Label>
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted">{isOpen ? "The menu is open" : "The menu is closed"}</p>
        <ContextMenu open={isOpen} onOpenChange={setIsOpen}>
          <ContextMenu.Trigger>
            <TriggerArea>Right-click (controlled state)</TriggerArea>
          </ContextMenu.Trigger>
          <ContextMenu.Popover>
            <ContextMenu.Menu>
              <ContextMenu.Item id="pin" textValue="Pin">
                <Label>Pin</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="mute" textValue="Mute">
                <Label>Mute</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="leave" textValue="Leave">
                <Label>Leave</Label>
              </ContextMenu.Item>
            </ContextMenu.Menu>
          </ContextMenu.Popover>
        </ContextMenu>
      </div>
    );
  },
};
