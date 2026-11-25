"use client";

import type {MapContextValue} from "./map-context";
import type {
  MapCoordinates,
  MapStyleOption,
  MapStyleSpecification,
  MapTheme,
  MapViewport,
} from "./map-utils";
import type {MapOptions} from "maplibre-gl";
import type {CSSProperties, ReactNode, Ref} from "react";

import {Spinner} from "@heroui/react";
import {Map as MapLibreMap, setWorkerUrl} from "maplibre-gl";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {MapContext} from "./map-context";
import {getDocumentTheme, subscribeDocumentTheme} from "./map-utils";
import {mapVariants} from "./map.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type MapLibreOptions = Omit<MapOptions, "container" | "style" | "center" | "zoom">;

interface MapRootProps extends MapLibreOptions {
  /** Initial center as `[longitude, latitude]`. */
  center?: MapCoordinates;
  /** Initial zoom level. */
  zoom?: number;
  /** Single MapLibre-compatible style URL/object. Overrides `styles`. */
  mapStyle?: MapStyleOption;
  /** Theme-aware style URLs or objects. */
  styles?: {light?: MapStyleOption; dark?: MapStyleOption};
  /** Force the map style theme (defaults to the detected document theme). */
  theme?: MapTheme;
  /** Controlled viewport state. */
  viewport?: Partial<MapViewport>;
  /** Fired as the map moves. */
  onViewportChange?: (viewport: MapViewport) => void;
  /** Shows the loading veil over the map. */
  isLoading?: boolean;
  /** Explicit MapLibre worker URL for bundlers that cannot resolve it. */
  workerUrl?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  [attribute: `aria-${string}`]: string | number | boolean | undefined;
  [attribute: `data-${string}`]: string | number | boolean | undefined;
}

type InitialMapConfig = {
  options: Omit<MapOptions, "container">;
  workerUrl?: string;
};

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/

/** A blank style so the map still initialises when no style was provided. */
const EMPTY_STYLE: MapStyleSpecification = {layers: [], sources: {}, version: 8};

function resolveMapStyle(
  mapStyle: MapStyleOption | undefined,
  styles: MapRootProps["styles"],
  theme: MapTheme,
): MapStyleOption {
  if (mapStyle) return mapStyle;
  if (theme === "dark") return styles?.dark ?? styles?.light ?? EMPTY_STYLE;

  return styles?.light ?? styles?.dark ?? EMPTY_STYLE;
}

function getViewport(map: MapLibreMap): MapViewport {
  const {lat, lng} = map.getCenter();

  return {
    bearing: map.getBearing(),
    center: [lng, lat],
    pitch: map.getPitch(),
    zoom: map.getZoom(),
  };
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

const getServerTheme = (): MapTheme => "light";

function getStyleKey(style: MapStyleOption): string {
  return typeof style === "string" ? style : JSON.stringify(style);
}

/* -------------------------------------------------------------------------------------------------
 * Map Root
 * -----------------------------------------------------------------------------------------------*/
const MapRoot = ({
  center,
  children,
  className,
  id,
  isLoading = false,
  mapStyle,
  onViewportChange,
  ref,
  style,
  styles,
  theme: themeProp,
  viewport,
  workerUrl,
  zoom,
  ...rest
}: MapRootProps) => {
  const slots = useMemo(() => mapVariants(), []);

  // Split DOM attributes (aria-*, data-*) from MapLibre `MapOptions` (read once, on creation).
  const domProps: Record<string, unknown> = {};
  const mapOptions: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith("aria-") || key.startsWith("data-")) domProps[key] = value;
    else mapOptions[key] = value;
  }

  const documentTheme = useSyncExternalStore(
    subscribeDocumentTheme,
    getDocumentTheme,
    getServerTheme,
  );
  const theme = themeProp ?? documentTheme;
  const resolvedStyle = resolveMapStyle(mapStyle, styles, theme);
  // Style objects are compared by value so inline objects do not trigger a reload every render.
  const styleKey = useMemo(() => getStyleKey(resolvedStyle), [resolvedStyle]);

  const [map, setMap] = useState<MapLibreMap | null>(null);
  /* True once the very first style finished loading (the veil is only shown before that). */
  const [hasLoaded, setHasLoaded] = useState(false);
  /*
   * `requested` is the style the props ask for, `ready` the one that finished loading. A style swap
   * (theme change) resets `ready` during render, so `isLoaded` turns false in the same commit and
   * layer effects never touch a style that is still loading.
   */
  const [styleState, setStyleState] = useState<{requested: string; ready: string | null}>(() => ({
    ready: null,
    requested: styleKey,
  }));

  if (styleState.requested !== styleKey) {
    setStyleState({ready: null, requested: styleKey});
  }

  const appliedStyleKeyRef = useRef<string | null>(null);
  const markStyleReady = useCallback(
    (key: string | null) => {
      if (key === null) return;
      setStyleState((state) =>
        state.requested === key && state.ready !== key ? {ready: key, requested: key} : state,
      );
    },
    [setStyleState],
  );

  /* Latest values for the imperative MapLibre callbacks. */
  const initialConfig: InitialMapConfig = {
    options: withoutUndefined({
      attributionControl: {compact: true},
      renderWorldCopies: false,
      ...mapOptions,
      bearing: viewport?.bearing ?? (mapOptions["bearing"] as number | undefined),
      center: viewport?.center ?? center,
      pitch: viewport?.pitch ?? (mapOptions["pitch"] as number | undefined),
      style: resolvedStyle,
      zoom: viewport?.zoom ?? zoom,
    }),
    workerUrl,
  };
  const initialConfigRef = useRef(initialConfig);
  const onViewportChangeRef = useRef(onViewportChange);

  useLayoutEffect(() => {
    initialConfigRef.current = initialConfig;
    onViewportChangeRef.current = onViewportChange;
  });

  /* The forwarded ref points at the container; kept separate so a changing ref never recreates the map. */
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => nodeRef.current as HTMLDivElement, []);

  /* Create the MapLibre instance when the container mounts (React 19 ref cleanup). */
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      nodeRef.current = node;

      const config = initialConfigRef.current;

      if (config.workerUrl) setWorkerUrl(config.workerUrl);

      const instance = new MapLibreMap({...config.options, container: node});

      appliedStyleKeyRef.current = config.options.style ? getStyleKey(config.options.style) : null;

      instance.on("load", () => {
        setHasLoaded(true);
        markStyleReady(appliedStyleKeyRef.current);
      });
      instance.on("move", () => onViewportChangeRef.current?.(getViewport(instance)));

      setMap(instance);

      return () => {
        instance.remove();
        nodeRef.current = null;
        appliedStyleKeyRef.current = null;
        setMap(null);
        setHasLoaded(false);
        setStyleState((state) => ({ready: null, requested: state.requested}));
      };
    },
    [markStyleReady, setHasLoaded, setMap, setStyleState],
  );

  const getStyle = useEffectEvent(() => resolvedStyle);

  /*
   * Swap the style when the theme / style props change. The map counts as loaded again on the
   * first `idle` of the new style (custom sources / layers are re-added then); the veil stays hidden.
   */
  useEffect(() => {
    if (!map || appliedStyleKeyRef.current === styleKey) return;

    const key = styleKey;
    const onIdle = () => {
      if (!map.isStyleLoaded()) return;
      map.off("idle", onIdle);
      if (appliedStyleKeyRef.current === key) markStyleReady(key);
    };

    appliedStyleKeyRef.current = key;
    map.setStyle(getStyle(), {diff: false});
    map.on("idle", onIdle);

    return () => {
      map.off("idle", onIdle);
    };
  }, [map, styleKey, markStyleReady]);

  /* Controlled viewport. */
  const vCenterLng = viewport?.center?.[0];
  const vCenterLat = viewport?.center?.[1];
  const vZoom = viewport?.zoom;
  const vBearing = viewport?.bearing;
  const vPitch = viewport?.pitch;

  useEffect(() => {
    if (!map) return;

    const current = getViewport(map);
    const next = withoutUndefined({
      bearing: vBearing,
      center:
        vCenterLng !== undefined && vCenterLat !== undefined
          ? ([vCenterLng, vCenterLat] as MapCoordinates)
          : undefined,
      pitch: vPitch,
      zoom: vZoom,
    });
    const changed =
      (next.center !== undefined &&
        (Math.abs(next.center[0] - current.center[0]) > 1e-9 ||
          Math.abs(next.center[1] - current.center[1]) > 1e-9)) ||
      (next.zoom !== undefined && Math.abs(next.zoom - current.zoom) > 1e-9) ||
      (next.bearing !== undefined && Math.abs(next.bearing - current.bearing) > 1e-9) ||
      (next.pitch !== undefined && Math.abs(next.pitch - current.pitch) > 1e-9);

    if (changed) map.jumpTo(next);
  }, [map, vCenterLng, vCenterLat, vZoom, vBearing, vPitch]);

  const isLoaded = hasLoaded && styleState.ready !== null && styleState.ready === styleKey;
  const showLoader = !hasLoaded || isLoading;

  const contextValue = useMemo<MapContextValue>(
    () => ({isLoaded, map, slots, theme}),
    [isLoaded, map, slots, theme],
  );

  return (
    <div
      {...domProps}
      ref={containerRef}
      data-loaded={isLoaded ? "true" : undefined}
      data-loading={showLoader ? "true" : undefined}
      data-slot="map"
      id={id}
      style={style}
      className={slots.base({
        className: [map ? "maplibregl-map" : "", className ?? ""].join(" ").trim(),
      })}
    >
      {showLoader ? (
        <div className={slots.loader()} data-slot="map-loader">
          <Spinner
            aria-label="Loading"
            className={slots.loaderSpinner()}
            color="current"
            data-slot="map-loader-spinner"
            size="sm"
          />
        </div>
      ) : null}
      {map ? <MapContext value={contextValue}>{children}</MapContext> : null}
    </div>
  );
};

MapRoot.displayName = "HeroUI.Map";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MapRoot};

export type {MapRootProps};
