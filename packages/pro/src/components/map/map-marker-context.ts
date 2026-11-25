"use client";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Marker Context
 * -----------------------------------------------------------------------------------------------*/
export type MapMarkerContextValue = {
  /** The MapLibre marker host element (React content is portalled into it). */
  element: HTMLDivElement;
  /** Current marker position (follows dragging). */
  lngLat: [number, number];
  isHovered: boolean;
  isPopupOpen: boolean;
  setPopupOpen: (open: boolean) => void;
};

export const MapMarkerContext = createContext<MapMarkerContextValue | null>(null);

export function useMarkerContext(component: string): MapMarkerContextValue {
  const context = use(MapMarkerContext);

  if (!context) throw new Error(`<${component}> must be rendered inside <Map.Marker>.`);

  return context;
}
