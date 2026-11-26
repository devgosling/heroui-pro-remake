//  ===================================
//  HeroUI Pro (remake) - root barrel
//  ===================================
//  Components that depend on heavy optional peers are NOT exported here; import them from their
//  subpath instead so apps that don't use them never load the peer:
//    import {AreaChart} from "@heroui/pro/area-chart";             // recharts (all *-chart components)
//    import {KPI} from "@heroui/pro/kpi";                          // recharts
//    import {NumberStepper} from "@heroui/pro/number-stepper";     // @number-flow/react
//    import {Resizable} from "@heroui/pro/resizable";              // react-resizable-panels
//    import {AppLayout} from "@heroui/pro/app-layout";             // react-resizable-panels
//    import {Carousel} from "@heroui/pro/carousel";                // embla-carousel-react
//    import {Map} from "@heroui/pro/map";                          // maplibre-gl
//    import {CodeBlock} from "@heroui/pro/code-block";             // shiki
//    import {ChatTool} from "@heroui/pro/chat-tool";               // shiki (via code-block)
//    import {Markdown} from "@heroui/pro/markdown";                // streamdown, react-markdown, marked, remark-gfm, shiki
//    import {RichTextEditor} from "@heroui/pro/rich-text-editor";  // @tiptap/*

// Charts (no recharts import)
export * from "./components/chart-tooltip";
export * from "./components/stacked-meter";

// Data Display
export * from "./components/action-bar";
export * from "./components/agenda";
export * from "./components/data-grid";
export * from "./components/empty-state";
export * from "./components/file-tree";
export * from "./components/floating-toc";
export * from "./components/holo-card";
export * from "./components/hover-card";
export * from "./components/item-card";
export * from "./components/item-card-group";
export * from "./components/kanban";
export * from "./components/kpi-group";
export * from "./components/list-view";
export * from "./components/swipeable-row";
export * from "./components/timeline";
export * from "./components/widget";

// AI
export * from "./components/approval-card";
export * from "./components/chain-of-thought";
export * from "./components/chat-attachment";
export * from "./components/chat-conversation";
export * from "./components/chat-list-view";
export * from "./components/chat-loader";
export * from "./components/chat-message";
export * from "./components/chat-message-actions";
export * from "./components/chat-source";
export * from "./components/loader";
export * from "./components/model-selector";
export * from "./components/prompt-input";
export * from "./components/prompt-suggestion";
export * from "./components/reasoning";
export * from "./components/text-shimmer";

// Buttons (ported from HeroUI Pro Native)
export * from "./components/fab";
export * from "./components/morph-button";
export * from "./components/slide-button";
export * from "./components/social-auth-button";

// Feedback
export * from "./components/emoji-reaction-button";
export * from "./components/number-value";
export * from "./components/pressable-feedback";
export * from "./components/rating";
export * from "./components/trend-chip";

// Forms
export * from "./components/cell-color-picker";
export * from "./components/cell-select";
export * from "./components/cell-slider";
export * from "./components/cell-switch";
export * from "./components/checkbox-button-group";
export * from "./components/drop-zone";
export * from "./components/inline-select";
export * from "./components/native-select";
export * from "./components/number-pad";
export * from "./components/radio-button-group";
export * from "./components/wheel-picker";
export * from "./components/wheel-picker-group";

// Navigation
export * from "./components/command";
export * from "./components/context-menu";
export * from "./components/morph-tabs";
export * from "./components/navbar";
export * from "./components/segment";
export * from "./components/sidebar";
export * from "./components/stepper";
export * from "./components/swipeable-tabs";

// Overlays
export * from "./components/emoji-picker";

// Utilities
export * from "./components/haptics-provider";
export * from "./components/overlay-scrollbars";
