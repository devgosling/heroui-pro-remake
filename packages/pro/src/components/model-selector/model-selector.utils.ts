import type {ReactNode} from "react";

/* -------------------------------------------------------------------------------------------------
 * Public data types
 * -----------------------------------------------------------------------------------------------*/
export interface ModelSelectorEffortLevel {
  /** Unique level id, such as `"high"`. */
  id: string;
  /** Visible level name, such as `"High"`. */
  label: string;
  /** Usage note shown under the slider while this level is selected. */
  description?: string;
  /** Visual tone for levels that use more of the usage limit. */
  tone?: "max" | "ultra";
}

export interface ModelSelectorModel {
  /** Unique id. */
  id: string;
  /** Full name, shown in the list and the detail card. */
  name: string;
  /** Name in the trigger, such as "Opus 5.5". Falls back to `name`. */
  shortName?: string;
  /** Groups the list. */
  provider?: string;
  /** 16px logo. */
  icon?: ReactNode;
  /** Short label after the name, such as "New". */
  badge?: string;
  /** One line for the detail card. */
  description?: string;
  /** Rating from 1 to 5. */
  intelligence?: number;
  /** Rating from 1 to 5. */
  speed?: number;
  /** Tokens, shown in compact notation such as "1M". */
  contextWindow?: number;
  /** Levels from lowest to highest; fewer than two hides the slider. */
  efforts?: ModelSelectorEffortLevel[];
  /** Level used when the current level is not in `efforts`. */
  defaultEffort?: string;
  /** Shows the model but blocks picking it. */
  isDisabled?: boolean;
}

export interface ModelSelectorLabels {
  /** Names the trigger before the model name. */
  trigger: string;
  /** Text above the list. */
  title: string;
  /** Search field placeholder and accessible name. */
  searchPlaceholder: string;
  /** Empty search result title. */
  emptyTitle: (query: string) => string;
  /** Empty search result hint. */
  emptyHint: string;
  /** Effort slider label. */
  effort: string;
  /** Start of the effort range. */
  faster: string;
  /** End of the effort range. */
  smarter: string;
  /** Intelligence rating label. */
  intelligence: string;
  /** Speed rating label. */
  speed: string;
  /** Spoken rating, such as "4 of 5". */
  rating: (value: number, max: number) => string;
  /** Text after the context window size. */
  contextWindow: string;
}

export const DEFAULT_LABELS: ModelSelectorLabels = {
  contextWindow: "context window",
  effort: "Effort",
  emptyHint: "Try a model or provider name.",
  emptyTitle: (query) => `No models match “${query}”`,
  faster: "Faster",
  intelligence: "Intelligence",
  rating: (value, max) => `${value} of ${max}`,
  searchPlaceholder: "Search models",
  smarter: "Smarter",
  speed: "Speed",
  title: "Models",
  trigger: "Model",
};

export const RATING_MAX = 5;

/* -------------------------------------------------------------------------------------------------
 * Models
 * -----------------------------------------------------------------------------------------------*/
export type ModelGroup = {provider?: string; models: ModelSelectorModel[]};

/** Groups models by provider, keeping the first-appearance order of providers and models. */
export function groupModelsByProvider(models: readonly ModelSelectorModel[]): ModelGroup[] {
  const groups: ModelGroup[] = [];
  const byProvider = new Map<string, ModelGroup>();

  for (const model of models) {
    if (!model.provider) {
      groups.push({models: [model]});
      continue;
    }

    let group = byProvider.get(model.provider);

    if (!group) {
      group = {models: [], provider: model.provider};
      byProvider.set(model.provider, group);
      groups.push(group);
    }

    group.models.push(model);
  }

  return groups;
}

/** Whether the level list contains the id. */
export function hasEffort(model: ModelSelectorModel | undefined, id: string | undefined) {
  return id !== undefined && Boolean(model?.efforts?.some((level) => level.id === id));
}

/** The level a model uses for a preferred level: the preferred one when it has it, else its default. */
export function resolveEffort(
  model: ModelSelectorModel | undefined,
  preferred: string | undefined,
): string | undefined {
  const levels = model?.efforts;

  if (!levels?.length) return undefined;
  if (hasEffort(model, preferred)) return preferred;
  if (hasEffort(model, model?.defaultEffort)) return model?.defaultEffort;

  return levels[0]?.id;
}

/** The slider's spoken value: a description naming the level is read as written. */
export function getEffortValueText(level: ModelSelectorEffortLevel) {
  const description = level.description?.trim();

  if (!description) return level.label;
  if (description.toLocaleLowerCase().includes(level.label.toLocaleLowerCase())) return description;

  return `${level.label}, ${description}`;
}

/* -------------------------------------------------------------------------------------------------
 * Formatting
 * -----------------------------------------------------------------------------------------------*/
const formatterCache = new Map<string, Intl.NumberFormat>();

/** Compact context window size: "1M" / "1.05M" (short) or "1.05 million" (long). */
export function formatContextWindow(value: number, locale: string, display: "short" | "long") {
  const cacheKey = `${locale}:${display}`;
  let formatter = formatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      compactDisplay: display,
      maximumFractionDigits: 2,
      notation: "compact",
    });
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(value);
}

const endsWithPunctuation = (text: string) => /[.!?…]$/.test(text);

/** The row's screen reader description: badge, description, ratings and context window. */
export function getItemDescription(
  model: ModelSelectorModel,
  labels: ModelSelectorLabels,
  locale: string,
) {
  const parts: string[] = [];

  if (model.badge) parts.push(model.badge);
  if (model.description) parts.push(model.description);
  if (model.intelligence != null) {
    parts.push(`${labels.intelligence} ${labels.rating(model.intelligence, RATING_MAX)}`);
  }
  if (model.speed != null) parts.push(`${labels.speed} ${labels.rating(model.speed, RATING_MAX)}`);
  if (model.contextWindow != null) {
    parts.push(
      `${formatContextWindow(model.contextWindow, locale, "long")} ${labels.contextWindow}`,
    );
  }

  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (endsWithPunctuation(part) ? part : `${part}.`))
    .join(" ");
}

/* -------------------------------------------------------------------------------------------------
 * Ultra particles
 * -----------------------------------------------------------------------------------------------*/
export type Spark = {
  x: number;
  v: number;
  life: number;
  delay: number;
  side?: 1 | -1;
  star: boolean;
};

const fract = (value: number) => value - Math.floor(value);
const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Deterministic, evenly spread particles (additive recurrence with irrational steps), so the
 * server and client render the same field and no two particles bunch up.
 */
function createSparks(count: number, options: {outer: boolean; starEvery: number}): Spark[] {
  const goldenStep = 0.6180339887;
  const silverStep = 0.4142135624;
  const plasticStep = 0.7548776662;

  return Array.from({length: count}, (_, index) => {
    const x = fract(0.09 + index * goldenStep);
    const v = fract(0.37 + index * silverStep);
    const life = options.outer
      ? 5.8 + fract(0.21 + index * plasticStep) * 2.7
      : 7.2 + fract(0.53 + index * plasticStep) * 1.8;
    const phase = fract(0.5 + index * 0.3819660113);

    return {
      delay: round(-life * phase),
      life: round(life),
      side: options.outer ? (fract(index * goldenStep + 0.25) < 0.5 ? -1 : 1) : undefined,
      star: index % options.starEvery === options.starEvery - 1,
      v: round(v),
      x: round(0.03 + x * 0.94),
    };
  });
}

export const INNER_SPARKS = createSparks(10, {outer: false, starEvery: 4});
export const OUTER_SPARKS = createSparks(16, {outer: true, starEvery: 3});
