"use client";

import type {Spark} from "./model-selector.utils";
import type {CSSProperties, ComponentPropsWithRef, ReactNode, SVGProps} from "react";

import {Label, Slider} from "@heroui/react";
import {use, useId, useLayoutEffect, useRef} from "react";
import {useIsHidden} from "react-aria/private/collections/Hidden";

import {useResolvedClassName} from "../../utils";

import {ModelSelectorContext} from "./model-selector-context";
import {INNER_SPARKS, OUTER_SPARKS, getEffortValueText} from "./model-selector.utils";

/* -------------------------------------------------------------------------------------------------
 * Icons
 * -----------------------------------------------------------------------------------------------*/
const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" {...props}>
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="5.1" fill="currentColor" r="0.95" />
    <path d="M8 7.4v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Ultra particles
 * -----------------------------------------------------------------------------------------------*/
type EffortSparksProps = {
  layer: "inner" | "outer";
  sparkClassName: string;
  className: string;
};

const EffortSparks = ({className, layer, sparkClassName}: EffortSparksProps) => {
  const sparks: readonly Spark[] = layer === "inner" ? INNER_SPARKS : OUTER_SPARKS;

  return (
    <span
      aria-hidden="true"
      className={className}
      data-layer={layer}
      data-slot="model-selector-effort-sparks"
    >
      {sparks.map((spark, index) => (
        <span
          // The particle field is static, so its position is a stable key.
          key={`${layer}-${index}`}
          className={sparkClassName}
          data-slot="model-selector-effort-spark"
          data-star={spark.star ? "true" : undefined}
          style={
            {
              "--_delay": spark.delay,
              "--_life": spark.life,
              "--_side": spark.side,
              "--_v": spark.v,
              "--_x": spark.x,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ModelSelector.Effort
 * -----------------------------------------------------------------------------------------------*/
interface ModelSelectorEffortProps extends Omit<
  ComponentPropsWithRef<typeof Slider>,
  | "children"
  | "defaultValue"
  | "formatOptions"
  | "maxValue"
  | "minValue"
  | "onChange"
  | "onChangeEnd"
  | "orientation"
  | "step"
  | "value"
> {
  /** Shows Ultra's particles and stars outside the track. */
  showOuterSparks?: boolean;
  /**
   * Replaces the "Faster" / "Smarter" row under the track, which describes the slider.
   * `null` removes it.
   */
  children?: ReactNode;
}

const ModelSelectorEffort = ({
  children,
  className,
  showOuterSparks = true,
  ...rest
}: ModelSelectorEffortProps) => {
  const context = use(ModelSelectorContext);
  // Skipped in React Aria's hidden collection pass (the popover content is rendered once offscreen).
  const isHidden = useIsHidden();
  const endsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const slots = context?.slots;
  const levels = context?.selectedModel?.efforts ?? [];
  const index = Math.max(
    0,
    levels.findIndex((level) => level.id === context?.effort),
  );
  const level = levels[index];
  const valueText = level ? getEffortValueText(level) : "";
  const resolvedClassName = useResolvedClassName(className, slots?.effort());

  // React Aria reads a number as the slider value; the level and its usage note are what a
  // screen reader should hear on every step, so the text is patched onto the range input.
  useLayoutEffect(() => {
    if (valueText) inputRef.current?.setAttribute("aria-valuetext", valueText);
  });

  if (isHidden || !context || !slots || !level || levels.length < 2) return null;

  const {labels, setEffort} = context;
  const hasUltra = levels.some((item) => item.tone === "ultra");
  const describedLevels = levels.filter((item) => item.description);
  const isHintEmpty = !level.description;
  const showEnds = children !== null;

  return (
    <Slider
      {...rest}
      className={resolvedClassName}
      data-effort={level.id}
      data-slot="model-selector-effort"
      data-tone={level.tone}
      maxValue={levels.length - 1}
      minValue={0}
      step={1}
      value={index}
      onChange={(value) => {
        const next = levels[Array.isArray(value) ? (value[0] ?? 0) : value];

        if (next && next.id !== level.id) setEffort(next.id);
      }}
    >
      <div className={slots.effortHeader()} data-slot="model-selector-effort-header">
        <Label className={slots.effortLabel()} data-slot="model-selector-effort-label">
          {labels.effort}
        </Label>
        <Slider.Output className={slots.effortValue()} data-slot="model-selector-effort-value">
          {level.label}
        </Slider.Output>
      </div>

      <div className={slots.effortBody()} data-slot="model-selector-effort-body">
        <Slider.Track className={slots.effortTrack()} data-slot="model-selector-effort-track">
          {hasUltra ? (
            <span
              aria-hidden="true"
              className={slots.effortGlow()}
              data-slot="model-selector-effort-glow"
            />
          ) : null}
          <div className={slots.effortRail()} data-slot="model-selector-effort-rail">
            <Slider.Fill className={slots.effortFill()} data-slot="model-selector-effort-fill">
              <span
                aria-hidden="true"
                className={slots.effortSheen()}
                data-slot="model-selector-effort-sheen"
              />
              {hasUltra ? (
                <EffortSparks
                  className={slots.effortSparks()}
                  layer="inner"
                  sparkClassName={slots.effortSpark()}
                />
              ) : null}
            </Slider.Fill>
            <Slider.Steps className={slots.effortTicks()} data-slot="model-selector-effort-ticks" />
            <Slider.Thumb
              aria-describedby={showEnds ? endsId : undefined}
              className={slots.effortThumb()}
              data-slot="model-selector-effort-thumb"
              inputRef={inputRef}
            />
          </div>
          {hasUltra && showOuterSparks ? (
            <EffortSparks
              className={slots.effortSparks()}
              layer="outer"
              sparkClassName={slots.effortSpark()}
            />
          ) : null}
        </Slider.Track>

        {showEnds ? (
          <div
            aria-hidden="true"
            className={slots.effortEnds()}
            data-slot="model-selector-effort-ends"
            id={endsId}
          >
            {children ?? (
              <>
                <span data-slot="model-selector-effort-end">{labels.faster}</span>
                <span data-slot="model-selector-effort-end">{labels.smarter}</span>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div
        aria-hidden={isHintEmpty ? "true" : undefined}
        className={slots.effortHint()}
        data-empty={isHintEmpty ? "true" : undefined}
        data-slot="model-selector-effort-hint"
      >
        <div className={slots.effortHintContent()} data-slot="model-selector-effort-hint-content">
          <p className={slots.effortHintBody()} data-slot="model-selector-effort-hint-body">
            <InfoIcon
              className={slots.effortHintIcon()}
              data-slot="model-selector-effort-hint-icon"
            />
            <span className={slots.effortHintStack()} data-slot="model-selector-effort-hint-stack">
              {describedLevels.map((item) => {
                const isActive = item.id === level.id;

                return (
                  <span
                    key={item.id}
                    aria-hidden={isActive ? undefined : "true"}
                    className={slots.effortHintText()}
                    data-active={isActive ? "true" : undefined}
                    data-slot="model-selector-effort-hint-text"
                  >
                    {item.description}
                  </span>
                );
              })}
            </span>
          </p>
        </div>
      </div>
    </Slider>
  );
};

ModelSelectorEffort.displayName = "HeroUI.ModelSelector.Effort";

export {ModelSelectorEffort};

export type {ModelSelectorEffortProps};
