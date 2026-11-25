"use client";

import type {MapCoordinates, MapFeature, MapFeatureCollection, MapPaintValue} from "./map-utils";
import type {
  AddLayerObject,
  GeoJSONSource,
  MapLayerMouseEvent,
  Map as MapLibreMap,
} from "maplibre-gl";

import {useEffect, useEffectEvent, useId, useRef} from "react";

import {useMapContext} from "./map-context";
import {getArcCoordinates, readCssNumber, readCssVar, toLineFeature, toMapColor} from "./map-utils";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const FALLBACK_ROUTE_COLOR = "#4285f4";
const FALLBACK_ROUTE_WIDTH = 3;
const FALLBACK_ROUTE_OPACITY = 0.8;

type LayerPaint = Record<string, unknown>;

/** Default route styling comes from the `--map-route-*` custom properties on `.map`. */
function getRouteDefaults(map: MapLibreMap) {
  const container = map.getContainer();

  return {
    color: toMapColor(readCssVar(container, "--map-route-color"), FALLBACK_ROUTE_COLOR),
    opacity: readCssNumber(container, "--map-route-opacity", FALLBACK_ROUTE_OPACITY),
    width: readCssNumber(container, "--map-route-width", FALLBACK_ROUTE_WIDTH),
  };
}

function addLayer(map: MapLibreMap, layer: Record<string, unknown>, beforeId?: string) {
  map.addLayer(
    layer as unknown as AddLayerObject,
    beforeId && map.getLayer(beforeId) ? beforeId : undefined,
  );
}

/** Removes layers / sources if the map (and its current style) still holds them. */
function removeFromStyle(map: MapLibreMap, layerIds: string[], sourceIds: string[]) {
  try {
    if (!map.style) return;
    for (const layerId of layerIds) if (map.getLayer(layerId)) map.removeLayer(layerId);
    for (const sourceId of sourceIds) if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch {
    // The map was removed before the layer components unmounted.
  }
}

function setPaint(map: MapLibreMap, layerId: string, paint: LayerPaint) {
  if (!map.getLayer(layerId)) return;
  for (const [key, value] of Object.entries(paint))
    map.setPaintProperty(layerId, key as never, value as never);
}

function getGeoJSONSource(map: MapLibreMap | null, sourceId: string) {
  return (map?.getSource(sourceId) as GeoJSONSource | undefined) ?? undefined;
}

function setCanvasCursor(map: MapLibreMap, cursor: string) {
  map.getCanvas().style.cursor = cursor;
}

/* -------------------------------------------------------------------------------------------------
 * Map Route
 * -----------------------------------------------------------------------------------------------*/
interface MapRouteProps {
  /** Route coordinates as `[longitude, latitude]`. */
  coordinates: MapCoordinates[];
  /** Route stroke color (defaults to `--map-route-color`). */
  color?: string;
  /** Route stroke width (defaults to `--map-route-width`). */
  width?: number;
  /** Route stroke opacity (defaults to `--map-route-opacity`). */
  opacity?: number;
  /** Optional dashed route pattern. */
  dashArray?: [number, number];
  /** Base id of the generated source (`<id>-source`) and layer (`<id>-layer`). */
  id?: string;
  /** Insert the layer before this existing layer id. */
  beforeId?: string;
}

function getRoutePaint(map: MapLibreMap, props: Omit<MapRouteProps, "coordinates" | "id">) {
  const defaults = getRouteDefaults(map);
  const paint: LayerPaint = {
    "line-color": props.color ? toMapColor(props.color, defaults.color) : defaults.color,
    "line-opacity": props.opacity ?? defaults.opacity,
    "line-width": props.width ?? defaults.width,
  };

  if (props.dashArray) paint["line-dasharray"] = props.dashArray;

  return paint;
}

const MapRoute = ({beforeId, color, coordinates, dashArray, id, opacity, width}: MapRouteProps) => {
  const {isLoaded, map} = useMapContext("Map.Route");
  const autoId = useId();
  const baseId = id ?? `route-${autoId}`;
  const sourceId = `${baseId}-source`;
  const layerId = `${baseId}-layer`;

  const getLayer = useEffectEvent((instance: MapLibreMap) => ({
    beforeId,
    data: toLineFeature(coordinates),
    paint: getRoutePaint(instance, {color, dashArray, opacity, width}),
  }));

  useEffect(() => {
    if (!map || !isLoaded) return;

    const layer = getLayer(map);

    map.addSource(sourceId, {data: layer.data, type: "geojson"});
    addLayer(
      map,
      {
        id: layerId,
        layout: {"line-cap": "round", "line-join": "round"},
        paint: layer.paint,
        source: sourceId,
        type: "line",
      },
      layer.beforeId,
    );

    return () => removeFromStyle(map, [layerId], [sourceId]);
  }, [map, isLoaded, sourceId, layerId]);

  useEffect(() => {
    void getGeoJSONSource(map, sourceId)?.setData(toLineFeature(coordinates));
  }, [map, sourceId, coordinates]);

  const dashA = dashArray?.[0];
  const dashB = dashArray?.[1];

  useEffect(() => {
    if (!map?.getLayer(layerId)) return;

    const dash: [number, number] | undefined =
      dashA !== undefined && dashB !== undefined ? [dashA, dashB] : undefined;

    setPaint(map, layerId, getRoutePaint(map, {color, dashArray: dash, opacity, width}));
    if (!dash) map.setPaintProperty(layerId, "line-dasharray", undefined);
  }, [map, layerId, color, opacity, width, dashA, dashB]);

  return null;
};

MapRoute.displayName = "HeroUI.Map.Route";

/* -------------------------------------------------------------------------------------------------
 * Map Arc
 * -----------------------------------------------------------------------------------------------*/
interface MapArcDatum {
  /** Unique id (used as the GeoJSON feature id for hover state). */
  id: string | number;
  /** Start point as `[longitude, latitude]`. */
  from: MapCoordinates;
  /** End point as `[longitude, latitude]`. */
  to: MapCoordinates;
  /** Per-arc stroke color. */
  color?: string;
  /** Per-arc stroke width. */
  width?: number;
  [key: string]: unknown;
}

interface MapArcProps<T extends MapArcDatum = MapArcDatum> {
  /** Arcs to draw. Every datum needs `id`, `from` and `to`; other fields become feature properties. */
  data: T[];
  /** Default stroke color (defaults to `--map-route-color`). */
  color?: string;
  /** Default stroke width. */
  width?: number;
  /** Stroke opacity. */
  opacity?: number;
  /** Stroke width while hovered. */
  hoverWidth?: number;
  /** Stroke opacity while hovered. */
  hoverOpacity?: number;
  /** Bend of the curve, relative to the distance between both points. */
  curvature?: number;
  /** Number of line segments per arc. */
  segments?: number;
  /** Width of the invisible hit area used for hover / click. */
  hitWidth?: number;
  /** Fired when an arc is clicked. */
  onClick?: (datum: T, event: MapLayerMouseEvent) => void;
  /** Fired when the hovered arc changes (`null` when the pointer leaves). */
  onHoverChange?: (datum: T | null) => void;
  /** Base id of the generated source / layers. */
  id?: string;
  /** Insert the layers before this existing layer id. */
  beforeId?: string;
}

function getArcCollection<T extends MapArcDatum>(
  data: T[],
  {
    color,
    curvature,
    segments,
    width,
  }: {color: string; curvature: number; segments: number; width: number},
) {
  return {
    features: data.map(({color: arcColor, from, to, width: arcWidth, ...properties}) => ({
      geometry: {coordinates: getArcCoordinates(from, to, curvature, segments), type: "LineString"},
      properties: {...properties, color: arcColor ?? color, width: arcWidth ?? width},
      type: "Feature",
    })),
    type: "FeatureCollection",
  } as const;
}

const MapArc = <T extends MapArcDatum = MapArcDatum>({
  beforeId,
  color,
  curvature = 0.34,
  data,
  hitWidth = 18,
  hoverOpacity = 1,
  hoverWidth = 5,
  id,
  onClick,
  onHoverChange,
  opacity = 0.74,
  segments = 64,
  width = 2.5,
}: MapArcProps<T>) => {
  const {isLoaded, map} = useMapContext("Map.Arc");
  const autoId = useId();
  const baseId = id ?? `arc-${autoId}`;
  const sourceId = `${baseId}-source`;
  const layerId = `${baseId}-layer`;
  const hitLayerId = `${baseId}-hit-layer`;

  const getCollection = useEffectEvent((instance: MapLibreMap) =>
    getArcCollection(data, {
      color: color ? toMapColor(color, FALLBACK_ROUTE_COLOR) : getRouteDefaults(instance).color,
      curvature,
      segments,
      width,
    }),
  );
  const getLinePaint = useEffectEvent(() => ({
    "line-color": ["get", "color"],
    "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], hoverOpacity, opacity],
    "line-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      hoverWidth,
      ["get", "width"],
    ],
  }));
  const getConfig = useEffectEvent(() => ({beforeId, hitWidth}));
  const findDatum = useEffectEvent((featureId: string | number | undefined) =>
    data.find((datum) => String(datum.id) === String(featureId)),
  );
  const emitHover = useEffectEvent((datum: T | null) => onHoverChange?.(datum));
  const emitClick = useEffectEvent((datum: T, event: MapLayerMouseEvent) =>
    onClick?.(datum, event),
  );

  useEffect(() => {
    if (!map || !isLoaded) return;

    const config = getConfig();
    let hoveredId: string | number | undefined;

    map.addSource(sourceId, {
      data: getCollection(map) as never,
      promoteId: "id",
      type: "geojson",
    });
    addLayer(
      map,
      {
        id: layerId,
        layout: {"line-cap": "round", "line-join": "round"},
        paint: getLinePaint(),
        source: sourceId,
        type: "line",
      },
      config.beforeId,
    );
    addLayer(
      map,
      {
        id: hitLayerId,
        layout: {"line-cap": "round", "line-join": "round"},
        paint: {"line-color": "rgba(0, 0, 0, 0)", "line-opacity": 1, "line-width": config.hitWidth},
        source: sourceId,
        type: "line",
      },
      config.beforeId,
    );

    const setHovered = (nextId: string | number | undefined) => {
      if (nextId === hoveredId) return;
      if (hoveredId !== undefined && map.getSource(sourceId)) {
        map.setFeatureState({id: hoveredId, source: sourceId}, {hover: false});
      }
      hoveredId = nextId;
      if (nextId !== undefined) map.setFeatureState({id: nextId, source: sourceId}, {hover: true});
      setCanvasCursor(map, nextId === undefined ? "" : "pointer");
      emitHover(nextId === undefined ? null : (findDatum(nextId) ?? null));
    };
    const onMove = (event: MapLayerMouseEvent) => setHovered(event.features?.[0]?.id);
    const onLeave = () => setHovered(undefined);
    const onLayerClick = (event: MapLayerMouseEvent) => {
      const datum = findDatum(event.features?.[0]?.id);

      if (datum) emitClick(datum, event);
    };

    map.on("mousemove", hitLayerId, onMove);
    map.on("mouseleave", hitLayerId, onLeave);
    map.on("click", hitLayerId, onLayerClick);

    return () => {
      map.off("mousemove", hitLayerId, onMove);
      map.off("mouseleave", hitLayerId, onLeave);
      map.off("click", hitLayerId, onLayerClick);
      if (hoveredId !== undefined) setCanvasCursor(map, "");
      removeFromStyle(map, [hitLayerId, layerId], [sourceId]);
    };
  }, [map, isLoaded, sourceId, layerId, hitLayerId]);

  useEffect(() => {
    if (!map) return;
    void getGeoJSONSource(map, sourceId)?.setData(getCollection(map) as never);
  }, [map, sourceId, data, color, curvature, segments, width]);

  useEffect(() => {
    if (map) setPaint(map, layerId, getLinePaint());
  }, [map, layerId, opacity, hoverOpacity, hoverWidth]);

  return null;
};

MapArc.displayName = "HeroUI.Map.Arc";

/* -------------------------------------------------------------------------------------------------
 * Map Cluster Layer
 * -----------------------------------------------------------------------------------------------*/
interface MapClusterLayerProps<P = Record<string, unknown>> {
  /** GeoJSON point collection or a URL to one. */
  data: MapFeatureCollection<P> | string;
  /** Max zoom to cluster points on. */
  clusterMaxZoom?: number;
  /** Cluster radius in pixels. */
  clusterRadius?: number;
  /** Point counts at which the cluster color / size steps up. */
  clusterThresholds?: [number, number];
  /** Cluster colors for the three steps. */
  clusterColors?: [string, string, string];
  /** Cluster circle radii (px) for the three steps. */
  clusterSizes?: [number, number, number];
  /** Cluster circle opacity. */
  clusterOpacity?: number;
  /** Color of unclustered points (a color or a MapLibre expression). */
  pointColor?: MapPaintValue<string>;
  /** Radius of unclustered points (px). */
  pointRadius?: number;
  /** Stroke color of clusters and points. */
  strokeColor?: string;
  /** Color of the cluster count label. */
  countColor?: string;
  /** Font size of the cluster count label. */
  countSize?: number;
  /** Fired when an unclustered point is clicked. */
  onPointClick?: (
    feature: MapFeature<P>,
    coordinates: MapCoordinates,
    event: MapLayerMouseEvent,
  ) => void;
  /** Fired when a cluster is clicked (the map also zooms into it). */
  onClusterClick?: (clusterId: number, coordinates: MapCoordinates) => void;
  /** Base id of the generated source / layers. */
  id?: string;
  /** Insert the layers before this existing layer id. */
  beforeId?: string;
}

const MapClusterLayer = <P = Record<string, unknown>,>({
  beforeId,
  clusterColors = ["#4285f4", "#f97316", "#ef4444"],
  clusterMaxZoom = 14,
  clusterOpacity = 0.85,
  clusterRadius = 50,
  clusterSizes = [20, 30, 40],
  clusterThresholds = [100, 750],
  countColor = "#fff",
  countSize = 12,
  data,
  id,
  onClusterClick,
  onPointClick,
  pointColor = "#4285f4",
  pointRadius = 6,
  strokeColor = "#fff",
}: MapClusterLayerProps<P>) => {
  const {isLoaded, map} = useMapContext("Map.ClusterLayer");
  const autoId = useId();
  const baseId = id ?? `cluster-${autoId}`;
  const sourceId = `${baseId}-source`;
  const clustersId = `${baseId}-clusters`;
  const countId = `${baseId}-cluster-count`;
  const pointId = `${baseId}-unclustered-point`;
  const appliedDataRef = useRef<MapClusterLayerProps<P>["data"] | null>(null);

  const getConfig = useEffectEvent(() => ({
    beforeId,
    clusterMaxZoom,
    clusterPaint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        clusterColors[0],
        clusterThresholds[0],
        clusterColors[1],
        clusterThresholds[1],
        clusterColors[2],
      ],
      "circle-opacity": clusterOpacity,
      "circle-radius": [
        "step",
        ["get", "point_count"],
        clusterSizes[0],
        clusterThresholds[0],
        clusterSizes[1],
        clusterThresholds[1],
        clusterSizes[2],
      ],
      "circle-stroke-color": strokeColor,
      "circle-stroke-width": 1,
    },
    clusterRadius,
    countPaint: {"text-color": countColor},
    countSize,
    data,
    pointPaint: {
      "circle-color": pointColor,
      "circle-radius": pointRadius,
      "circle-stroke-color": strokeColor,
      "circle-stroke-width": 2,
    },
  }));
  const emitPointClick = useEffectEvent((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];

    if (!feature || feature.geometry.type !== "Point") return;

    const coordinates = feature.geometry.coordinates.slice(0, 2) as MapCoordinates;

    onPointClick?.(
      {
        geometry: {coordinates, type: "Point"},
        id: feature.id,
        properties: feature.properties as P,
        type: "Feature",
      },
      coordinates,
      event,
    );
  });
  const emitClusterClick = useEffectEvent((clusterId: number, coordinates: MapCoordinates) =>
    onClusterClick?.(clusterId, coordinates),
  );

  useEffect(() => {
    if (!map || !isLoaded) return;

    const config = getConfig();

    appliedDataRef.current = config.data;
    map.addSource(sourceId, {
      cluster: true,
      clusterMaxZoom: config.clusterMaxZoom,
      clusterRadius: config.clusterRadius,
      data: config.data as never,
      type: "geojson",
    });
    addLayer(
      map,
      {
        filter: ["has", "point_count"],
        id: clustersId,
        paint: config.clusterPaint,
        source: sourceId,
        type: "circle",
      },
      config.beforeId,
    );
    addLayer(
      map,
      {
        filter: ["has", "point_count"],
        id: countId,
        layout: {"text-field": "{point_count_abbreviated}", "text-size": config.countSize},
        paint: config.countPaint,
        source: sourceId,
        type: "symbol",
      },
      config.beforeId,
    );
    addLayer(
      map,
      {
        filter: ["!", ["has", "point_count"]],
        id: pointId,
        paint: config.pointPaint,
        source: sourceId,
        type: "circle",
      },
      config.beforeId,
    );

    const onClusterLayerClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.["cluster_id"] as number | undefined;

      if (!feature || clusterId === undefined || feature.geometry.type !== "Point") return;

      const coordinates = feature.geometry.coordinates.slice(0, 2) as MapCoordinates;

      emitClusterClick(clusterId, coordinates);
      void getGeoJSONSource(map, sourceId)
        ?.getClusterExpansionZoom(clusterId)
        .then((zoom) => map.easeTo({center: coordinates, zoom}))
        .catch(() => {});
    };
    const onPointLayerClick = (event: MapLayerMouseEvent) => emitPointClick(event);
    const onEnter = () => setCanvasCursor(map, "pointer");
    const onLeave = () => setCanvasCursor(map, "");

    map.on("click", clustersId, onClusterLayerClick);
    map.on("click", pointId, onPointLayerClick);
    for (const layer of [clustersId, pointId]) {
      map.on("mouseenter", layer, onEnter);
      map.on("mouseleave", layer, onLeave);
    }

    return () => {
      map.off("click", clustersId, onClusterLayerClick);
      map.off("click", pointId, onPointLayerClick);
      for (const layer of [clustersId, pointId]) {
        map.off("mouseenter", layer, onEnter);
        map.off("mouseleave", layer, onLeave);
      }
      removeFromStyle(map, [pointId, countId, clustersId], [sourceId]);
    };
  }, [map, isLoaded, sourceId, clustersId, countId, pointId]);

  useEffect(() => {
    if (appliedDataRef.current === data) return;

    const source = getGeoJSONSource(map, sourceId);

    if (!source) return;
    appliedDataRef.current = data;
    void source.setData(data as never);
  }, [map, sourceId, data]);

  return null;
};

MapClusterLayer.displayName = "HeroUI.Map.ClusterLayer";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MapRoute, MapArc, MapClusterLayer};

export type {MapRouteProps, MapArcProps, MapArcDatum, MapClusterLayerProps};
