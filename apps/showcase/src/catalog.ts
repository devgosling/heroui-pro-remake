/**
 * Every HeroUI Pro (web) component with the number of demo variants the original documents.
 * The showcase compares this with the stories that exist in packages/pro.
 */
export interface CatalogEntry {
  slug: string;
  name: string;
  proVariants: number;
}

export interface CatalogCategory {
  name: string;
  items: CatalogEntry[];
}

const entry = (slug: string, name: string, proVariants: number): CatalogEntry => ({
  name,
  proVariants,
  slug,
});

export const CATALOG: CatalogCategory[] = [
  {
    items: [
      entry("area-chart", "Area Chart", 6),
      entry("bar-chart", "Bar Chart", 8),
      entry("chart-tooltip", "Chart Tooltip", 7),
      entry("composed-chart", "Composed Chart", 5),
      entry("line-chart", "Line Chart", 10),
      entry("pie-chart", "Pie Chart", 7),
      entry("radar-chart", "Radar Chart", 5),
      entry("radial-chart", "Radial Chart", 5),
    ],
    name: "Charts",
  },
  {
    items: [
      entry("agenda", "Agenda", 1),
      entry("action-bar", "Action Bar", 2),
      entry("carousel", "Carousel", 6),
      entry("data-grid", "Data Grid", 14),
      entry("empty-state", "Empty State", 8),
      entry("file-tree", "File Tree", 10),
      entry("floating-toc", "Floating TOC", 10),
      entry("holo-card", "Holo Card", 8),
      entry("hover-card", "Hover Card", 6),
      entry("kanban", "Kanban", 4),
      entry("item-card", "Item Card", 12),
      entry("item-card-group", "Item Card Group", 12),
      entry("kpi", "KPI", 9),
      entry("kpi-group", "KPI Group", 3),
      entry("list-view", "List View", 5),
      entry("map", "Map", 10),
      entry("timeline", "Timeline", 8),
      entry("widget", "Widget", 8),
    ],
    name: "Data Display",
  },
  {
    items: [
      entry("approval-card", "Approval Card", 3),
      entry("chain-of-thought", "Chain Of Thought", 2),
      entry("chat-attachment", "Chat Attachment", 3),
      entry("chat-conversation", "Chat Conversation", 3),
      entry("chat-list-view", "Chat List View", 2),
      entry("chat-loader", "Chat Loader", 1),
      entry("chat-message", "Chat Message", 4),
      entry("chat-message-actions", "Chat Message Actions", 3),
      entry("chat-source", "Chat Source", 4),
      entry("chat-tool", "Chat Tool", 6),
      entry("code-block", "Code Block", 1),
      entry("loader", "Loader", 4),
      entry("markdown", "Markdown", 3),
      entry("model-selector", "Model Selector", 4),
      entry("prompt-input", "Prompt Input", 9),
      entry("prompt-suggestion", "Prompt Suggestion", 2),
      entry("reasoning", "Reasoning", 4),
      entry("text-shimmer", "Text Shimmer", 1),
    ],
    name: "AI",
  },
  {
    items: [
      entry("emoji-reaction-button", "Emoji Reaction Button", 4),
      entry("number-value", "Number Value", 8),
      entry("pressable-feedback", "Pressable Feedback", 17),
      entry("rating", "Rating", 12),
      entry("trend-chip", "Trend Chip", 6),
    ],
    name: "Feedback",
  },
  {
    items: [entry("resizable", "Resizable", 7)],
    name: "Layout",
  },
  {
    items: [
      entry("cell-color-picker", "Cell Color Picker", 6),
      entry("cell-select", "Cell Select", 7),
      entry("cell-slider", "Cell Slider", 7),
      entry("cell-switch", "Cell Switch", 7),
      entry("checkbox-button-group", "Checkbox Button Group", 11),
      entry("drop-zone", "Drop Zone", 9),
      entry("inline-select", "Inline Select", 5),
      entry("native-select", "Native Select", 12),
      entry("number-stepper", "Number Stepper", 13),
      entry("radio-button-group", "Radio Button Group", 12),
      entry("rich-text-editor", "Rich Text Editor", 8),
    ],
    name: "Forms",
  },
  {
    items: [
      entry("app-layout", "AppLayout", 14),
      entry("command", "Command", 9),
      entry("context-menu", "Context Menu", 7),
      entry("navbar", "Navbar", 7),
      entry("segment", "Segment", 11),
      entry("sidebar", "Sidebar", 16),
      entry("stepper", "Stepper", 19),
    ],
    name: "Navigation",
  },
  {
    items: [entry("emoji-picker", "Emoji Picker", 4)],
    name: "Overlays",
  },
];

export const ALL_ENTRIES = CATALOG.flatMap((category) => category.items);

export const PRO_DOCS_URL = (slug: string) => `https://heroui.pro/docs/react/components/${slug}`;
