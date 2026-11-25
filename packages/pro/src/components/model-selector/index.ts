import type {ComponentProps} from "react";

import {
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorPopover,
  ModelSelectorRoot,
  ModelSelectorSearch,
  ModelSelectorTrigger,
} from "./model-selector";
import {ModelSelectorDetail} from "./model-selector-detail";
import {ModelSelectorEffort} from "./model-selector-effort";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ModelSelector = Object.assign(ModelSelectorRoot, {
  Detail: ModelSelectorDetail,
  Effort: ModelSelectorEffort,
  Group: ModelSelectorGroup,
  Item: ModelSelectorItem,
  List: ModelSelectorList,
  Popover: ModelSelectorPopover,
  Root: ModelSelectorRoot,
  Search: ModelSelectorSearch,
  Trigger: ModelSelectorTrigger,
});

export type ModelSelector = {
  Props: ComponentProps<typeof ModelSelectorRoot>;
  RootProps: ComponentProps<typeof ModelSelectorRoot>;
  TriggerProps: ComponentProps<typeof ModelSelectorTrigger>;
  PopoverProps: ComponentProps<typeof ModelSelectorPopover>;
  SearchProps: ComponentProps<typeof ModelSelectorSearch>;
  ListProps: ComponentProps<typeof ModelSelectorList>;
  GroupProps: ComponentProps<typeof ModelSelectorGroup>;
  ItemProps: ComponentProps<typeof ModelSelectorItem>;
  EffortProps: ComponentProps<typeof ModelSelectorEffort>;
  DetailProps: ComponentProps<typeof ModelSelectorDetail>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ModelSelectorRoot,
  ModelSelectorTrigger,
  ModelSelectorPopover,
  ModelSelectorSearch,
  ModelSelectorList,
  ModelSelectorGroup,
  ModelSelectorItem,
} from "./model-selector";
export {ModelSelectorEffort} from "./model-selector-effort";
export {ModelSelectorDetail} from "./model-selector-detail";
export {ModelSelectorContext} from "./model-selector-context";

export type {
  ModelSelectorRootProps,
  ModelSelectorRootProps as ModelSelectorProps,
  ModelSelectorTriggerProps,
  ModelSelectorPopoverProps,
  ModelSelectorSearchProps,
  ModelSelectorListProps,
  ModelSelectorGroupProps,
  ModelSelectorItemProps,
} from "./model-selector";
export type {ModelSelectorEffortProps} from "./model-selector-effort";
export type {
  ModelSelectorDetailProps,
  ModelSelectorDetailRenderProps,
} from "./model-selector-detail";
export type {
  ModelSelectorEffortLevel,
  ModelSelectorLabels,
  ModelSelectorModel,
} from "./model-selector.utils";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {modelSelectorVariants, type ModelSelectorVariants} from "./model-selector.styles";
