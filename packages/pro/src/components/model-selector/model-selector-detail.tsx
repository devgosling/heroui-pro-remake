"use client";

import type {ModelSelectorContextValue} from "./model-selector-context";
import type {ModelSelectorModel} from "./model-selector.utils";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {use, useLayoutEffect, useRef} from "react";
import {useLocale} from "react-aria-components/I18nProvider";

import {useMergedRef} from "../../utils";

import {ModelSelectorContext, ModelSelectorPopoverContext} from "./model-selector-context";
import {RATING_MAX, formatContextWindow} from "./model-selector.utils";

/* -------------------------------------------------------------------------------------------------
 * Built-in card body
 * -----------------------------------------------------------------------------------------------*/
function renderDefaultDetail(
  model: ModelSelectorModel,
  {labels, slots}: Pick<ModelSelectorContextValue, "labels" | "slots">,
  locale: string,
): ReactNode {
  const hasRatings = model.intelligence != null || model.speed != null;
  const hasContext = model.contextWindow != null;

  if (!model.description && !hasRatings && !hasContext) return null;

  const renderRating = (label: string, value: number) => (
    <div className={slots.detailRating()} data-slot="model-selector-detail-rating">
      <span data-slot="model-selector-detail-rating-label">{label}</span>
      <span className={slots.detailDots()} data-slot="model-selector-detail-dots">
        {Array.from({length: RATING_MAX}, (_, index) => (
          <span
            key={index}
            className={slots.detailDot()}
            data-filled={index < Math.round(value) ? "true" : undefined}
            data-slot="model-selector-detail-dot"
          />
        ))}
      </span>
    </div>
  );

  return (
    <>
      <div className={slots.detailHeader()} data-slot="model-selector-detail-header">
        <div className={slots.detailTitle()} data-slot="model-selector-detail-title">
          {model.icon ? (
            <span className={slots.detailIcon()} data-slot="model-selector-detail-icon">
              {model.icon}
            </span>
          ) : null}
          <span className={slots.detailName()} data-slot="model-selector-detail-name">
            {model.name}
          </span>
        </div>
        {model.description ? (
          <p className={slots.detailDescription()} data-slot="model-selector-detail-description">
            {model.description}
          </p>
        ) : null}
      </div>
      {hasRatings || hasContext ? (
        <div className={slots.detailRatings()} data-slot="model-selector-detail-ratings">
          {model.intelligence != null
            ? renderRating(labels.intelligence, model.intelligence)
            : null}
          {model.speed != null ? renderRating(labels.speed, model.speed) : null}
          {model.contextWindow != null ? (
            <p className={slots.detailContext()} data-slot="model-selector-detail-context">
              <strong>{formatContextWindow(model.contextWindow, locale, "short")}</strong>{" "}
              {labels.contextWindow}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Placement
 * -----------------------------------------------------------------------------------------------*/
/**
 * Picks the side with room for the card and publishes the hovered row's offset plus the
 * viewport bounds (all relative to the popover top) as CSS variables; CSS clamps the card.
 */
function placeDetail(card: HTMLElement, modelId: string) {
  const popover = card.parentElement;
  const view = card.ownerDocument.defaultView;

  if (!popover || !view) return;

  const row = popover.querySelector<HTMLElement>(`[data-key="${CSS.escape(modelId)}"]`);

  if (!row) return;

  const isRtl = view.getComputedStyle(card).direction === "rtl";

  // Measure in the default (inline-end) position.
  card.removeAttribute("data-side");

  const width = card.offsetWidth;
  const gap = isRtl ? -card.offsetLeft - width : card.offsetLeft - popover.clientWidth;
  const maxHeight = parseFloat(view.getComputedStyle(card).maxHeight);
  const margin = Number.isFinite(maxHeight) ? Math.max(0, (view.innerHeight - maxHeight) / 2) : 0;
  const popoverRect = popover.getBoundingClientRect();
  const need = gap + width + margin;
  const roomAfter = isRtl ? popoverRect.left : view.innerWidth - popoverRect.right;
  const roomBefore = isRtl ? view.innerWidth - popoverRect.right : popoverRect.left;
  const side = roomAfter >= need ? "end" : roomBefore >= need ? "start" : "none";

  card.setAttribute("data-side", side);

  const rowRect = row.getBoundingClientRect();

  card.style.setProperty("--model-selector-detail-y", `${rowRect.top - popoverRect.top}px`);
  card.style.setProperty("--model-selector-detail-min-y", `${-popoverRect.top}px`);
  card.style.setProperty(
    "--model-selector-detail-max-y",
    `${view.innerHeight - popoverRect.top - card.offsetHeight}px`,
  );
}

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Detail
 * -----------------------------------------------------------------------------------------------*/
type ModelSelectorDetailRenderProps = {
  model: ModelSelectorModel;
  /** The built-in name, description, ratings and context window, or `null` when it has none. */
  defaultChildren: ReactNode;
};

interface ModelSelectorDetailProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Card content for a model; return `null` to keep the card hidden for it. */
  children?: (values: ModelSelectorDetailRenderProps) => ReactNode;
}

const ModelSelectorDetail = ({
  children,
  className,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...rest
}: ModelSelectorDetailProps) => {
  const context = use(ModelSelectorContext);
  const popover = use(ModelSelectorPopoverContext);
  const {locale} = useLocale();
  const localRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, localRef);

  const state = popover?.detailState;
  const model = state?.modelId ? context?.modelMap.get(state.modelId) : undefined;
  const defaultChildren = model && context ? renderDefaultDetail(model, context, locale) : null;
  const content = model ? (children ? children({defaultChildren, model}) : defaultChildren) : null;
  const hasContent = content != null && content !== false;
  const isVisible = Boolean(state?.isVisible) && hasContent;
  const isGliding = isVisible && Boolean(state?.isGliding);
  const modelId = model?.id;

  useLayoutEffect(() => {
    if (isVisible && modelId && localRef.current) placeDetail(localRef.current, modelId);
  }, [isVisible, modelId]);

  if (!context) return null;

  return (
    <div
      aria-hidden="true"
      {...rest}
      ref={mergedRef}
      className={context.slots.detail({className})}
      data-glide={isGliding ? "true" : undefined}
      data-slot="model-selector-detail"
      data-visible={isVisible ? "true" : undefined}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        popover?.detail.cardEnter();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        popover?.detail.cardLeave();
      }}
    >
      {hasContent && model ? (
        // Re-created for each model so the glide crossfade replays.
        <div
          key={model.id}
          inert
          className={context.slots.detailBody()}
          data-slot="model-selector-detail-body"
        >
          {content}
        </div>
      ) : null}
    </div>
  );
};

ModelSelectorDetail.displayName = "HeroUI.ModelSelector.Detail";

export {ModelSelectorDetail};

export type {ModelSelectorDetailProps, ModelSelectorDetailRenderProps};
