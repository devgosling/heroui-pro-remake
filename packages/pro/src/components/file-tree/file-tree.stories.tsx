import type {FileTreeItemRenderProps} from "./index";
import type {Selection} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, Dropdown, Header, Label, SearchField, Separator} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";
import {Collection} from "react-aria-components/Collection";
import {useTreeData} from "react-aria-components/useTreeData";

import {FileTree, useFileTree, useFileTreeDrag} from "./index";

const meta = {
  argTypes: {
    reduceMotion: {control: "boolean"},
    selectionMode: {control: {type: "select"}, options: ["none", "single", "multiple"]},
    showGuideLines: {control: {type: "select"}, options: [true, false, "hover"]},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: FileTree,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/FileTree",
} satisfies Meta<typeof FileTree>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
type FileNode = {
  id: string;
  name: string;
  children?: FileNode[];
};

/** Folder icon that opens with the item. */
const folderIcon = ({isExpanded}: FileTreeItemRenderProps) => (
  <Icon icon={isExpanded ? "gravity-ui:folder-open" : "gravity-ui:folder"} />
);

function fileIconName(name: string) {
  if (name.startsWith(".env")) return "gravity-ui:gear";
  if (name.endsWith(".css")) return "gravity-ui:code";
  if (name.endsWith(".json")) return "gravity-ui:curly-brackets";
  if (name.endsWith(".md") || name.endsWith(".jsonc") || name.endsWith(".toml")) {
    return "gravity-ui:file-text";
  }

  return "gravity-ui:file-code";
}

/** Folder icons for folders, a type icon for files. */
const typedIcon = (name: string) => {
  const renderTypedIcon = (props: FileTreeItemRenderProps) =>
    props.hasChildItems ? folderIcon(props) : <Icon icon={fileIconName(name)} />;

  return renderTypedIcon;
};

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
const DefaultTree = (props: Partial<FileTree["RootProps"]>) => (
  <FileTree
    aria-label="Workspace files"
    className="max-h-[420px] w-80"
    defaultExpandedKeys={["services", "web", "worker", "libs", "libs-ui", "github"]}
    {...props}
  >
    <FileTree.Item id="services" title="services">
      <FileTree.Item id="web" title="web">
        <FileTree.Item id="web-package" title="package.json" />
        <FileTree.Item id="web-vite" title="vite.config.ts" />
        <FileTree.Item id="web-src" title="src">
          <FileTree.Item id="web-main" title="main.tsx" />
          <FileTree.Item id="web-routes" title="routes.tsx" />
        </FileTree.Item>
      </FileTree.Item>
      <FileTree.Item id="worker" title="worker">
        <FileTree.Item id="worker-package" title="package.json" />
        <FileTree.Item id="worker-src" title="src">
          <FileTree.Item id="worker-queue" title="queue.ts" />
        </FileTree.Item>
      </FileTree.Item>
    </FileTree.Item>
    <FileTree.Item id="libs" title="libs">
      <FileTree.Item id="libs-ui" title="ui">
        <FileTree.Item id="ui-package" title="package.json" />
        <FileTree.Item id="ui-src" title="src">
          <FileTree.Item id="ui-index" title="index.ts" />
        </FileTree.Item>
      </FileTree.Item>
    </FileTree.Item>
    <FileTree.Item id="github" title=".github">
      <FileTree.Item id="github-workflows" title="workflows">
        <FileTree.Item id="workflow-ci" title="ci.yml" />
      </FileTree.Item>
    </FileTree.Item>
    <FileTree.Item id="changelog" title="CHANGELOG.md" />
    <FileTree.Item id="contributing" title="CONTRIBUTING.md" />
    <FileTree.Item id="root-package" title="package.json" />
    <FileTree.Item id="turbo" title="turbo.json" />
  </FileTree>
);

export const Default: Story = {
  render: (args) => <DefaultTree {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * PR File Review
 * -----------------------------------------------------------------------------------------------*/
const changedFiles: FileNode[] = [
  {
    children: [
      {
        children: [
          {
            children: [
              {id: "srv-db", name: "db"},
              {id: "srv-jobs", name: "jobs"},
              {
                children: [
                  {
                    children: [{id: "rate-limit-test", name: "rateLimit.test.ts"}],
                    id: "srv-tests-guards",
                    name: "guards",
                  },
                  {
                    children: [{id: "invoices-test", name: "invoices.test.ts"}],
                    id: "srv-tests-handlers",
                    name: "handlers",
                  },
                  {
                    children: [{id: "billing-test", name: "billingService.test.ts"}],
                    id: "srv-tests-services",
                    name: "services",
                  },
                  {
                    children: [{id: "currency-test", name: "currency.test.ts"}],
                    id: "srv-tests-utils",
                    name: "utils",
                  },
                ],
                id: "srv-tests",
                name: "__tests__",
              },
              {id: "srv-session", name: "session.ts"},
              {id: "srv-server", name: "server.ts"},
              {id: "srv-schema", name: "schema.ts"},
            ],
            id: "srv-src",
            name: "src",
          },
          {id: "srv-fly", name: "fly.toml"},
        ],
        id: "server",
        name: "server",
      },
      {
        children: [
          {
            children: [
              {id: "web-settings", name: "settings"},
              {id: "web-checkout", name: "checkout/[plan]"},
            ],
            id: "web-pages",
            name: "pages",
          },
          {
            children: [
              {
                children: [{id: "web-nav", name: "account-nav.tsx"}],
                id: "web-ui-account",
                name: "account",
              },
              {
                children: [{id: "web-invoice-drawer", name: "invoice-drawer.tsx"}],
                id: "web-ui-invoices",
                name: "invoices",
              },
              {
                children: [{id: "web-member-row", name: "member-row.tsx"}],
                id: "web-ui-members",
                name: "members",
              },
            ],
            id: "web-ui",
            name: "ui",
          },
          {
            children: [{id: "web-billing-client", name: "billing-client.ts"}],
            id: "web-hooks",
            name: "hooks",
          },
        ],
        id: "web-src",
        name: "web/src",
      },
    ],
    id: "packages",
    name: "packages",
  },
];

/** Changed folders without listed files are rendered as (closed) folders. */
const folderIds = new Set(["srv-db", "srv-jobs", "web-settings", "web-checkout"]);

function extensionOf(name: string) {
  const index = name.lastIndexOf(".");

  return index > 0 ? name.slice(index) : "";
}

const renderReviewItem = (node: FileNode): ReactNode => {
  const isFolder = !!node.children || folderIds.has(node.id);

  return (
    <FileTree.Item
      key={node.id}
      icon={isFolder ? folderIcon : <Icon icon={fileIconName(node.name)} />}
      id={node.id}
      title={node.name}
    >
      {node.children?.map(renderReviewItem)}
    </FileTree.Item>
  );
};

const PRFileReviewDemo = () => {
  const [query, setQuery] = React.useState("");
  const {expandableKeys, filterTree, leaves} = useFileTree({items: changedFiles});
  const extensions = React.useMemo(
    () =>
      [
        ...new Set(
          leaves.filter((leaf) => !folderIds.has(leaf.id)).map((leaf) => extensionOf(leaf.name)),
        ),
      ].sort(),
    [leaves],
  );
  // One multi-select menu: the extension filters plus two independent view toggles.
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(() => new Set(extensions));

  const visibleItems = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    const isKeySelected = (key: string) => selectedKeys === "all" || selectedKeys.has(key);

    return filterTree((node) => {
      // Changed folders without listed files only show while nothing is searched.
      if (folderIds.has(node.id)) return !search;

      return (
        (!search || node.name.toLowerCase().includes(search)) &&
        isKeySelected(extensionOf(node.name)) &&
        (!isKeySelected("hide-tests") || !node.name.includes(".test.")) &&
        (!isKeySelected("hide-config") || !node.name.endsWith(".toml"))
      );
    });
  }, [filterTree, query, selectedKeys]);

  return (
    <div className="flex w-[310px] flex-col gap-3">
      <div className="flex w-full items-center gap-3 px-2">
        <SearchField aria-label="Search changed files" className="w-full" onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-full" placeholder="Search files..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Dropdown>
          <Button isIconOnly aria-label="Filter files" className="shrink-0" variant="secondary">
            <Icon icon="gravity-ui:bars-descending-align-center" />
          </Button>
          <Dropdown.Popover className="min-w-[210px]">
            <Dropdown.Menu
              aria-label="File filters"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              onSelectionChange={setSelectedKeys}
            >
              <Dropdown.Section>
                <Header>File types</Header>
                {extensions.map((extension) => (
                  <Dropdown.Item key={extension} id={extension} textValue={extension}>
                    <Dropdown.ItemIndicator />
                    <Label>{extension}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Section>
              <Separator />
              <Dropdown.Section>
                <Dropdown.Item id="hide-tests" textValue="Hide test files">
                  <Label>Hide test files</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="hide-config" textValue="Hide config files">
                  <Label>Hide config files</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
      <FileTree
        aria-label="Changed files"
        defaultExpandedKeys={expandableKeys}
        showGuideLines="hover"
      >
        {visibleItems.map(renderReviewItem)}
      </FileTree>
    </div>
  );
};

export const PRFileReview: Story = {
  render: () => <PRFileReviewDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * With Icons
 * -----------------------------------------------------------------------------------------------*/
const IconTree = (props: Partial<FileTree["RootProps"]>) => (
  <FileTree
    aria-label="Library with icons"
    defaultExpandedKeys={["lib", "widgets", "hooks"]}
    {...props}
  >
    <FileTree.Item icon={typedIcon("lib")} id="lib" title="lib">
      <FileTree.Item icon={typedIcon("widgets")} id="widgets" title="widgets">
        <FileTree.Item icon={typedIcon("chart.tsx")} id="chart-tsx" title="chart.tsx" />
        <FileTree.Item icon={typedIcon("table.tsx")} id="table-tsx" title="table.tsx" />
        <FileTree.Item icon={typedIcon("chart.css")} id="chart-css" title="chart.css" />
      </FileTree.Item>
      <FileTree.Item icon={typedIcon("hooks")} id="hooks" title="hooks">
        <FileTree.Item icon={typedIcon("use-theme.ts")} id="use-theme" title="use-theme.ts" />
        <FileTree.Item icon={typedIcon("use-media.ts")} id="use-media" title="use-media.ts" />
      </FileTree.Item>
      <FileTree.Item icon={typedIcon("main.ts")} id="main-ts" title="main.ts" />
    </FileTree.Item>
    <FileTree.Item icon={typedIcon("package.json")} id="package-json" title="package.json" />
    <FileTree.Item icon={typedIcon("jsconfig.json")} id="jsconfig-json" title="jsconfig.json" />
    <FileTree.Item icon={typedIcon("CHANGELOG.md")} id="changelog-md" title="CHANGELOG.md" />
    <FileTree.Item icon={typedIcon(".env.local")} id="env-local" title=".env.local" />
  </FileTree>
);

export const WithIcons: Story = {
  render: (args) => <IconTree className="w-[300px]" {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Sizes / Guide Lines (three trees side by side)
 * -----------------------------------------------------------------------------------------------*/
/** Full-width page with 40px padding, like the demo page these grids are shown on. */
const TreeGrid = ({children}: {children: ReactNode}) => (
  <div className="flex justify-center p-10">
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">{children}</div>
  </div>
);

const TreeColumn = ({children, label}: {children: ReactNode; label: string}) => (
  <div className="flex min-w-0 flex-col gap-2">
    <span className="text-xs text-muted">{label}</span>
    {children}
  </div>
);

export const Sizes: Story = {
  parameters: {layout: "fullscreen"},
  render: () => (
    <TreeGrid>
      {(["sm", "md", "lg"] as const).map((size) => (
        <TreeColumn key={size} label={size}>
          <IconTree className="w-full" size={size} />
        </TreeColumn>
      ))}
    </TreeGrid>
  ),
};

export const GuideLines: Story = {
  parameters: {layout: "fullscreen"},
  render: () => (
    <TreeGrid>
      {(
        [
          ["always", true],
          ["hover", "hover"],
          ["none", false],
        ] as const
      ).map(([label, showGuideLines]) => (
        <TreeColumn key={label} label={label}>
          <IconTree className="w-full" showGuideLines={showGuideLines} />
        </TreeColumn>
      ))}
    </TreeGrid>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Multiple Selection
 * -----------------------------------------------------------------------------------------------*/
const MultipleSelectionDemo = () => {
  const [selected, setSelected] = React.useState<Selection>(new Set());
  const summary =
    selected === "all" ? "all" : selected.size ? [...selected].map(String).join(", ") : "none";

  return (
    <div className="flex flex-col items-center gap-4">
      <FileTree
        aria-label="Pick files to commit"
        className="w-[280px]"
        defaultExpandedKeys={["app", "screens"]}
        selectedKeys={selected}
        selectionMode="multiple"
        onSelectionChange={setSelected}
      >
        <FileTree.Item id="app" title="app">
          <FileTree.Item id="screens" title="screens">
            <FileTree.Item id="home" title="home.tsx" />
            <FileTree.Item id="profile" title="profile.tsx" />
            <FileTree.Item id="settings" title="settings.tsx" />
          </FileTree.Item>
          <FileTree.Item id="store" title="store">
            <FileTree.Item id="store-index" title="index.ts" />
          </FileTree.Item>
        </FileTree.Item>
        <FileTree.Item id="license" title="LICENSE.md" />
      </FileTree>
      <p className="text-sm text-muted">Selected: {summary}</p>
    </div>
  );
};

export const MultipleSelection: Story = {
  render: () => <MultipleSelectionDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Drag And Drop
 * -----------------------------------------------------------------------------------------------*/
const draggableFiles: FileNode[] = [
  {
    children: [
      {
        children: [
          {id: "avatar-vue", name: "avatar.vue"},
          {id: "badge-vue", name: "badge.vue"},
          {id: "dialog-vue", name: "dialog.vue"},
        ],
        id: "views",
        name: "views",
      },
      {
        children: [
          {id: "format-ts", name: "format.ts"},
          {id: "fetcher-ts", name: "fetcher.ts"},
        ],
        id: "helpers",
        name: "helpers",
      },
      {id: "app-ts", name: "app.ts"},
    ],
    id: "client",
    name: "client",
  },
  {id: "pnpm-workspace", name: "pnpm-workspace.yaml"},
  {id: "vitest-config", name: "vitest.config.ts"},
  {id: "license-md", name: "LICENSE.md"},
];

const DragAndDropDemo = () => {
  const tree = useTreeData<FileNode>({
    getChildren: (node) => node.children ?? [],
    getKey: (node) => node.id,
    initialItems: draggableFiles,
  });
  const {dragAndDropHooks} = useFileTreeDrag({tree});

  return (
    <FileTree
      aria-label="Reorder project files"
      className="w-[300px]"
      defaultExpandedKeys={["client", "views", "helpers"]}
      dragAndDropHooks={dragAndDropHooks}
      items={tree.items}
      selectionMode="multiple"
    >
      {function renderItem(item): ReactNode {
        return (
          <FileTree.Item
            id={item.key}
            title={item.value.name}
            icon={(props) =>
              props.hasChildItems ? folderIcon(props) : <Icon icon="gravity-ui:file-code" />
            }
          >
            {item.children?.length ? (
              <Collection items={item.children}>{renderItem}</Collection>
            ) : null}
          </FileTree.Item>
        );
      }}
    </FileTree>
  );
};

export const DragAndDrop: Story = {
  render: () => <DragAndDropDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Dynamic Collection
 * -----------------------------------------------------------------------------------------------*/
const dynamicFiles: FileNode[] = [
  {
    children: [
      {
        children: [
          {id: "site-index", name: "index.astro"},
          {id: "site-about", name: "about.astro"},
          {id: "site-styles", name: "styles.css"},
        ],
        id: "site",
        name: "site",
      },
      {
        children: [{id: "docs-intro", name: "intro.mdx"}],
        id: "docs",
        name: "docs",
      },
    ],
    id: "websites",
    name: "websites",
  },
  {
    children: [
      {
        children: [
          {id: "icons-index", name: "index.ts"},
          {id: "icons-package", name: "package.json"},
        ],
        id: "icons",
        name: "icons",
      },
    ],
    id: "modules",
    name: "modules",
  },
  {id: "root-license", name: "LICENSE.md"},
  {id: "root-security", name: "SECURITY.md"},
  {id: "root-package-json", name: "package.json"},
];

const renderDynamicItem = (item: FileNode): ReactNode => (
  <FileTree.Item id={item.id} title={item.name}>
    {item.children ? <Collection items={item.children}>{renderDynamicItem}</Collection> : null}
  </FileTree.Item>
);

export const DynamicCollection: Story = {
  render: ({reduceMotion, showGuideLines, size}) => (
    <FileTree
      aria-label="Generated file tree"
      className="max-h-[380px] w-[300px]"
      defaultExpandedKeys={["websites", "site", "modules", "icons"]}
      items={dynamicFiles}
      reduceMotion={reduceMotion}
      showGuideLines={showGuideLines}
      size={size}
    >
      {renderDynamicItem}
    </FileTree>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom Indicator
 * -----------------------------------------------------------------------------------------------*/
export const CustomIndicator: Story = {
  render: (args) => (
    <FileTree
      aria-label="Tree with caret indicators"
      className="w-[300px]"
      defaultExpandedKeys={["lib", "widgets"]}
      {...args}
    >
      <FileTree.Item icon={typedIcon("lib")} id="lib" title="lib">
        <FileTree.Indicator>
          <Icon icon="gravity-ui:caret-right" />
        </FileTree.Indicator>
        <FileTree.Item icon={typedIcon("widgets")} id="widgets" title="widgets">
          <FileTree.Indicator>
            <Icon icon="gravity-ui:caret-right" />
          </FileTree.Indicator>
          <FileTree.Item icon={typedIcon("chart.tsx")} id="chart" title="chart.tsx" />
          <FileTree.Item icon={typedIcon("table.tsx")} id="table" title="table.tsx" />
        </FileTree.Item>
        <FileTree.Item icon={typedIcon("main.ts")} id="main" title="main.ts" />
      </FileTree.Item>
      <FileTree.Item icon={typedIcon("deno.json")} id="deno" title="deno.json" />
      <FileTree.Item icon={typedIcon("NOTES.md")} id="notes" title="NOTES.md" />
    </FileTree>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Reduced Motion
 * -----------------------------------------------------------------------------------------------*/
export const ReducedMotion: Story = {
  render: (args) => <DefaultTree reduceMotion {...args} />,
};
