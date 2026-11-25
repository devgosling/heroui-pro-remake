"use client";

import type {MapOptions} from "maplibre-gl";

/* -------------------------------------------------------------------------------------------------
 * Shared types
 * -----------------------------------------------------------------------------------------------*/

/** A `[longitude, latitude]` pair. */
export type MapCoordinates = [number, number];

/** MapLibre style specification object (the non-URL form of `MapOptions["style"]`). */
export type MapStyleSpecification = Exclude<MapOptions["style"], string | undefined>;

/** A MapLibre-compatible style URL or style object. */
export type MapStyleOption = string | MapStyleSpecification;

export type MapTheme = "light" | "dark";

export interface MapViewport {
  /** `[longitude, latitude]` */
  center: MapCoordinates;
  zoom: number;
  bearing: number;
  pitch: number;
}

/* Minimal GeoJSON shapes (kept local so consumers do not need `@types/geojson`). */
export interface MapPointGeometry {
  type: "Point";
  coordinates: MapCoordinates | number[];
}

export interface MapFeature<P = Record<string, unknown>> {
  type: "Feature";
  id?: string | number;
  geometry: MapPointGeometry | {type: string; coordinates: unknown};
  properties: P;
}

export interface MapFeatureCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: Array<MapFeature<P>>;
}

/** A MapLibre expression or literal paint value (e.g. `["get", "color"]`). */
export type MapPaintValue<T> = T | readonly unknown[];

/* -------------------------------------------------------------------------------------------------
 * Theme detection
 * -------------------------------------------------------------------------------------------------
 * `data-theme` on <html> (`dark`, `light`, `*-dark`, `*-light`) wins, then a `dark` / `light`
 * class, then the system color scheme.
 * -----------------------------------------------------------------------------------------------*/
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function getDocumentTheme(): MapTheme {
  if (typeof document === "undefined") return "light";

  const html = document.documentElement;
  const dataTheme = html.getAttribute("data-theme")?.trim().toLowerCase();

  if (dataTheme) {
    if (dataTheme === "dark" || dataTheme.endsWith("-dark")) return "dark";
    if (dataTheme === "light" || dataTheme.endsWith("-light")) return "light";
  }

  if (html.classList.contains("dark")) return "dark";
  if (html.classList.contains("light")) return "light";

  return typeof window !== "undefined" && window.matchMedia?.(DARK_QUERY).matches
    ? "dark"
    : "light";
}

export function subscribeDocumentTheme(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {};

  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributeFilter: ["class", "data-theme"],
    attributes: true,
  });

  const media = window.matchMedia?.(DARK_QUERY);

  media?.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    media?.removeEventListener("change", onChange);
  };
}

/* -------------------------------------------------------------------------------------------------
 * CSS helpers
 * -----------------------------------------------------------------------------------------------*/
const NATIVE_COLOR = /^(#|rgba?\(|hsla?\(|transparent$|[a-z]+$)/i;

let colorCanvas: CanvasRenderingContext2D | null | undefined;

/**
 * MapLibre only parses CSS Color 3 syntax. Theme tokens may resolve to `oklch()` / `lab()`, so
 * anything else is rasterised through a 1x1 canvas and returned as `rgba()`.
 */
export function toMapColor(value: string | undefined, fallback: string): string {
  const color = value?.trim();

  if (!color) return fallback;
  if (NATIVE_COLOR.test(color)) return color;
  if (typeof document === "undefined") return fallback;

  if (colorCanvas === undefined) {
    const canvas = document.createElement("canvas");

    canvas.width = 1;
    canvas.height = 1;
    colorCanvas = canvas.getContext("2d", {willReadFrequently: true});
  }

  if (!colorCanvas) return fallback;

  colorCanvas.clearRect(0, 0, 1, 1);
  colorCanvas.fillStyle = "#000";
  colorCanvas.fillStyle = color;
  colorCanvas.fillRect(0, 0, 1, 1);

  const [r = 0, g = 0, b = 0, a = 255] = colorCanvas.getImageData(0, 0, 1, 1).data;

  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
}

/** Reads a custom property from the map container (CSS variables are the documented defaults). */
export function readCssVar(element: Element | null | undefined, name: string): string {
  if (!element || typeof window === "undefined") return "";

  return window.getComputedStyle(element).getPropertyValue(name).trim();
}

export function readCssNumber(
  element: Element | null | undefined,
  name: string,
  fallback: number,
): number {
  const value = Number.parseFloat(readCssVar(element, name));

  return Number.isFinite(value) ? value : fallback;
}

/* -------------------------------------------------------------------------------------------------
 * Popup helpers
 * -----------------------------------------------------------------------------------------------*/

/** Creates the detached element MapLibre mounts as popup content (React portals into it). */
export function createPopupContainer(): HTMLDivElement {
  return document.createElement("div");
}

/* -------------------------------------------------------------------------------------------------
 * Geometry
 * -----------------------------------------------------------------------------------------------*/

/**
 * Quadratic Bezier between two points in lng/lat space. The control point sits on the
 * perpendicular of the segment midpoint, `curvature * length` away (left of the travel direction).
 */
export function getArcCoordinates(
  from: MapCoordinates,
  to: MapCoordinates,
  curvature: number,
  segments: number,
): MapCoordinates[] {
  const [x0, y0] = from;
  const [x2, y2] = to;
  const dx = x2 - x0;
  const dy = y2 - y0;
  const length = Math.hypot(dx, dy);

  if (length === 0) return [from, to];

  const cx = (x0 + x2) / 2 - (dy / length) * length * curvature;
  const cy = (y0 + y2) / 2 + (dx / length) * length * curvature;
  const steps = Math.max(1, Math.round(segments));
  const points: MapCoordinates[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;

    points.push([a * x0 + b * cx + c * x2, a * y0 + b * cy + c * y2]);
  }

  // Keep the exact endpoints (no floating point drift).
  points[0] = from;
  points[points.length - 1] = to;

  return points;
}

export function toLineFeature(coordinates: MapCoordinates[]) {
  return {
    geometry: {coordinates, type: "LineString" as const},
    properties: {},
    type: "Feature" as const,
  };
}
