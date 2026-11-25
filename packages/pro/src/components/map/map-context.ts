"use client";

import type {MapTheme} from "./map-utils";
import type {mapVariants} from "./map.styles";
import type {Map as MapLibreMap} from "maplibre-gl";

import {createContext, use} from "react";

export type MapContextValue = {
  /** The MapLibre instance (null until the map has been created on the client). */
  map: MapLibreMap | null;
  /**
   * True once the current style finished loading: after the first `load` event, and again after the
   * first `idle` of a swapped style (false while a light / dark style swap is in flight).
   */
  isLoaded: boolean;
  /** Resolved theme the style was picked for. */
  theme: MapTheme;
  slots: ReturnType<typeof mapVariants>;
};

export const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext(component: string): MapContextValue {
  const context = use(MapContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Map>.`);
  }

  return context;
}

/**
 * Access the MapLibre instance from any component rendered inside `<Map>`.
 *
 * Effects that add sources / layers should depend on `isLoaded`: it turns false while the style is
 * swapped (e.g. on a light/dark theme change, which drops every custom layer) and true again once
 * custom layers can be (re-)added.
 */
export function useMap() {
  const context = useMapContext("useMap consumer");

  return {
    isLoaded: context.isLoaded,
    map: context.map,
    theme: context.theme,
  };
}
