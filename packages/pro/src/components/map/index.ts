import type {ComponentProps} from "react";

import {MapRoot} from "./map";
import {
  MapCompassControl,
  MapControlButton,
  MapControlGroup,
  MapControlSeparator,
  MapControls,
  MapFullscreenControl,
  MapLocateControl,
  MapZoomControl,
} from "./map-controls";
import {MapArc, MapClusterLayer, MapRoute} from "./map-layers";
import {
  MapMarker,
  MapMarkerContent,
  MapMarkerDot,
  MapMarkerLabel,
  MapMarkerPopup,
  MapMarkerTooltip,
} from "./map-marker";
import {MapPopup} from "./map-popup";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/map`) because it depends on the optional `maplibre-gl` peer.
 * -----------------------------------------------------------------------------------------------*/
export const Map = Object.assign(MapRoot, {
  Arc: MapArc,
  ClusterLayer: MapClusterLayer,
  CompassControl: MapCompassControl,
  ControlButton: MapControlButton,
  ControlGroup: MapControlGroup,
  ControlSeparator: MapControlSeparator,
  Controls: MapControls,
  FullscreenControl: MapFullscreenControl,
  LocateControl: MapLocateControl,
  Marker: MapMarker,
  MarkerContent: MapMarkerContent,
  MarkerDot: MapMarkerDot,
  MarkerLabel: MapMarkerLabel,
  MarkerPopup: MapMarkerPopup,
  MarkerTooltip: MapMarkerTooltip,
  Popup: MapPopup,
  Root: MapRoot,
  Route: MapRoute,
  ZoomControl: MapZoomControl,
});

export type Map = {
  Props: ComponentProps<typeof MapRoot>;
  RootProps: ComponentProps<typeof MapRoot>;
  MarkerProps: ComponentProps<typeof MapMarker>;
  MarkerContentProps: ComponentProps<typeof MapMarkerContent>;
  MarkerDotProps: ComponentProps<typeof MapMarkerDot>;
  MarkerLabelProps: ComponentProps<typeof MapMarkerLabel>;
  MarkerTooltipProps: ComponentProps<typeof MapMarkerTooltip>;
  MarkerPopupProps: ComponentProps<typeof MapMarkerPopup>;
  PopupProps: ComponentProps<typeof MapPopup>;
  ControlsProps: ComponentProps<typeof MapControls>;
  ControlGroupProps: ComponentProps<typeof MapControlGroup>;
  ControlButtonProps: ComponentProps<typeof MapControlButton>;
  ControlSeparatorProps: ComponentProps<typeof MapControlSeparator>;
  ZoomControlProps: ComponentProps<typeof MapZoomControl>;
  CompassControlProps: ComponentProps<typeof MapCompassControl>;
  LocateControlProps: ComponentProps<typeof MapLocateControl>;
  FullscreenControlProps: ComponentProps<typeof MapFullscreenControl>;
  RouteProps: ComponentProps<typeof MapRoute>;
  ArcProps: ComponentProps<typeof MapArc>;
  ClusterLayerProps: ComponentProps<typeof MapClusterLayer>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {MapRoot} from "./map";
export {
  MapMarker,
  MapMarkerContent,
  MapMarkerDot,
  MapMarkerLabel,
  MapMarkerTooltip,
  MapMarkerPopup,
} from "./map-marker";
export {MapMarkerContext} from "./map-marker-context";
export {MapPopup} from "./map-popup";
export {
  MapControls,
  MapControlGroup,
  MapControlButton,
  MapControlSeparator,
  MapZoomControl,
  MapCompassControl,
  MapLocateControl,
  MapFullscreenControl,
} from "./map-controls";
export {MapRoute, MapArc, MapClusterLayer} from "./map-layers";
export {MapContext, useMap} from "./map-context";

export type {MapRootProps, MapRootProps as MapProps} from "./map";
export type {
  MapMarkerProps,
  MapMarkerContentProps,
  MapMarkerDotProps,
  MapMarkerLabelProps,
  MapMarkerTooltipProps,
  MapMarkerPopupProps,
} from "./map-marker";
export type {MapPopupProps} from "./map-popup";
export type {
  MapControlsProps,
  MapControlGroupProps,
  MapControlButtonProps,
  MapControlSeparatorProps,
  MapZoomControlProps,
  MapCompassControlProps,
  MapLocateControlProps,
  MapFullscreenControlProps,
} from "./map-controls";
export type {MapRouteProps, MapArcProps, MapArcDatum, MapClusterLayerProps} from "./map-layers";
export type {MapContextValue} from "./map-context";
export type {
  MapCoordinates,
  MapFeature,
  MapFeatureCollection,
  MapStyleOption,
  MapStyleSpecification,
  MapTheme,
  MapViewport,
} from "./map-utils";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  mapVariants,
  mapControlsVariants,
  mapMarkerLabelVariants,
  type MapVariants,
  type MapControlsVariants,
  type MapMarkerLabelVariants,
} from "./map.styles";
