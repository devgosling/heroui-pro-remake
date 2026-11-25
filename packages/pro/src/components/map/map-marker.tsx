"use client";

import type {MapMarkerContextValue} from "./map-marker-context";
import type {MapPopupOptions} from "./map-popup";
import type {MapMarkerLabelVariants} from "./map.styles";
import type {MarkerOptions, PopupOptions} from "maplibre-gl";
import type {CSSProperties, ComponentPropsWithRef, ReactNode, Ref} from "react";

import {Marker, Popup} from "maplibre-gl";
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {createPortal} from "react-dom";

import {useMapContext} from "./map-context";
import {MapMarkerContext, useMarkerContext} from "./map-marker-context";
import {MAP_POPUP_OFFSET, MapPopupSurface} from "./map-popup";
import {createPopupContainer} from "./map-utils";
import {mapMarkerLabelVariants} from "./map.styles";

/** Shallow scan (through fragments) for compound parts rendered as children. */
function hasChildOfType(children: ReactNode, type: unknown): boolean {
  let found = false;

  Children.forEach(children, (child) => {
    if (found || !isValidElement(child)) return;
    if (child.type === type) found = true;
    else if (child.type === Fragment) {
      found = hasChildOfType((child.props as {children?: ReactNode}).children, type);
    }
  });

  return found;
}

function createMarkerElement(): HTMLDivElement {
  const element = document.createElement("div");

  element.className = "map__marker";
  element.setAttribute("data-slot", "map-marker");

  return element;
}

/* -------------------------------------------------------------------------------------------------
 * Map Marker
 * -----------------------------------------------------------------------------------------------*/
interface MapMarkerProps {
  /** Marker latitude. */
  latitude: number;
  /** Marker longitude. */
  longitude: number;
  /** Accessible name of the marker. */
  "aria-label"?: string;
  /** Allows dragging the marker. */
  draggable?: boolean;
  /** Fired when the marker is clicked. */
  onClick?: (event: MouseEvent) => void;
  /** Fired after a draggable marker moves. */
  onDragEnd?: (lngLat: {lat: number; lng: number}) => void;
  /** MapLibre anchor of the marker element. */
  anchor?: MarkerOptions["anchor"];
  /** Pixel offset of the marker element. */
  offset?: MarkerOptions["offset"];
  /** Extra classes on the `.map__marker` host element. */
  className?: string;
  children?: ReactNode;
}

const MapMarker = ({
  anchor = "center",
  "aria-label": ariaLabel,
  children,
  className,
  draggable = false,
  latitude,
  longitude,
  offset,
  onClick,
  onDragEnd,
}: MapMarkerProps) => {
  const {map, slots} = useMapContext("Map.Marker");
  const [element] = useState(createMarkerElement);
  const markerRef = useRef<Marker | null>(null);
  const [dragLngLat, setDragLngLat] = useState<[number, number] | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPopupOpen, setPopupOpen] = useState(false);

  const hasPopup = hasChildOfType(children, MapMarkerPopup);
  const hasContent = hasChildOfType(children, MapMarkerContent);
  const lngLat: [number, number] = dragLngLat ?? [longitude, latitude];

  const getInitial = useEffectEvent(() => ({
    draggable,
    lngLat: [longitude, latitude] as [number, number],
    offset,
  }));
  const handleClick = useEffectEvent((event: MouseEvent) => {
    onClick?.(event);
    if (hasPopup) setPopupOpen(!isPopupOpen);
  });
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!hasPopup || event.target !== element) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      setPopupOpen(!isPopupOpen);
    } else if (event.key === "Escape" && isPopupOpen) {
      event.stopPropagation();
      setPopupOpen(false);
    }
  });
  const handleDragEnd = useEffectEvent(() => {
    const position = markerRef.current?.getLngLat();

    if (!position) return;
    setDragLngLat(null);
    onDragEnd?.({lat: position.lat, lng: position.lng});
  });
  const handleMapClick = useEffectEvent((target: EventTarget | null) => {
    if (isPopupOpen && !(target instanceof Node && element.contains(target))) {
      setPopupOpen(false);
    }
  });

  /* MapLibre marker lifecycle. */
  useEffect(() => {
    if (!map) return;

    const initial = getInitial();
    const marker = new Marker({
      anchor,
      draggable: initial.draggable,
      element,
      offset: initial.offset,
    })
      .setLngLat(initial.lngLat)
      .addTo(map);
    const onDrag = () => {
      const {lat, lng} = marker.getLngLat();

      setDragLngLat([lng, lat]);
    };
    const onEnd = () => handleDragEnd();

    marker.on("drag", onDrag);
    marker.on("dragend", onEnd);
    markerRef.current = marker;

    return () => {
      marker.off("drag", onDrag);
      marker.off("dragend", onEnd);
      marker.remove();
      markerRef.current = null;
    };
  }, [map, element, anchor]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  useEffect(() => {
    markerRef.current?.setDraggable(draggable);
  }, [draggable]);

  useEffect(() => {
    if (offset !== undefined) markerRef.current?.setOffset(offset);
  }, [offset]);

  /* DOM listeners on the host element. */
  useEffect(() => {
    const onElementClick = (event: MouseEvent) => handleClick(event);
    const onElementKeyDown = (event: KeyboardEvent) => handleKeyDown(event);
    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);

    element.addEventListener("click", onElementClick);
    element.addEventListener("keydown", onElementKeyDown);
    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mouseleave", onLeave);

    return () => {
      element.removeEventListener("click", onElementClick);
      element.removeEventListener("keydown", onElementKeyDown);
      element.removeEventListener("mouseenter", onEnter);
      element.removeEventListener("mouseleave", onLeave);
    };
  }, [element]);

  /* Clicking the map outside of the marker closes its popup. */
  useEffect(() => {
    if (!map || !hasPopup) return;

    const onMapClick = (event: {originalEvent: MouseEvent}) =>
      handleMapClick(event.originalEvent.target);

    map.on("click", onMapClick);

    return () => {
      map.off("click", onMapClick);
    };
  }, [map, hasPopup]);

  /* Accessibility + classes on the host element. */
  useEffect(() => {
    syncMarkerAttributes(element, {ariaLabel, hasPopup, isPopupOpen});
  }, [element, ariaLabel, hasPopup, isPopupOpen]);

  useEffect(() => {
    const tokens = className?.split(/\s+/).filter(Boolean) ?? [];

    element.classList.add(...tokens);

    return () => element.classList.remove(...tokens);
  }, [element, className]);

  const contextValue: MapMarkerContextValue = {
    element,
    isHovered,
    isPopupOpen,
    lngLat,
    setPopupOpen,
  };

  return (
    <MapMarkerContext value={contextValue}>
      {hasContent
        ? null
        : createPortal(
            <div className={slots.markerContent()} data-slot="map-marker-content">
              <MapMarkerDot />
            </div>,
            element,
          )}
      {children}
    </MapMarkerContext>
  );
};

MapMarker.displayName = "HeroUI.Map.Marker";

function syncMarkerAttributes(
  element: HTMLDivElement,
  {ariaLabel, hasPopup, isPopupOpen}: {ariaLabel?: string; hasPopup: boolean; isPopupOpen: boolean},
) {
  const set = (name: string, value: string | undefined) => {
    if (value === undefined) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };

  set("aria-label", ariaLabel);
  set("role", hasPopup ? "button" : undefined);
  set("tabindex", hasPopup ? "0" : undefined);
  set("aria-expanded", hasPopup ? String(isPopupOpen) : undefined);
}

/* -------------------------------------------------------------------------------------------------
 * Marker Content
 * -----------------------------------------------------------------------------------------------*/
interface MapMarkerContentProps extends ComponentPropsWithRef<"div"> {}

const MapMarkerContent = ({children, className, ...rest}: MapMarkerContentProps) => {
  const {slots} = useMapContext("Map.MarkerContent");
  const {element} = useMarkerContext("Map.MarkerContent");

  return createPortal(
    <div className={slots.markerContent({className})} data-slot="map-marker-content" {...rest}>
      {children}
    </div>,
    element,
  );
};

MapMarkerContent.displayName = "HeroUI.Map.MarkerContent";

/* -------------------------------------------------------------------------------------------------
 * Marker Dot (default marker visual)
 * -----------------------------------------------------------------------------------------------*/
interface MapMarkerDotProps extends ComponentPropsWithRef<"span"> {
  /** Overrides `--map-marker-color`. */
  color?: string;
  /** Overrides `--map-marker-ring-color`. */
  ringColor?: string;
}

const MapMarkerDot = ({className, color, ringColor, style, ...rest}: MapMarkerDotProps) => {
  const {slots} = useMapContext("Map.MarkerDot");
  const resolvedStyle =
    color || ringColor
      ? ({
          ...(color ? {"--map-marker-color": color} : null),
          ...(ringColor ? {"--map-marker-ring-color": ringColor} : null),
          ...style,
        } as CSSProperties)
      : style;

  return (
    <span
      className={slots.defaultMarker({className})}
      data-slot="map-default-marker"
      style={resolvedStyle}
      {...rest}
    />
  );
};

MapMarkerDot.displayName = "HeroUI.Map.MarkerDot";

/* -------------------------------------------------------------------------------------------------
 * Marker Label
 * -----------------------------------------------------------------------------------------------*/
interface MapMarkerLabelProps extends ComponentPropsWithRef<"div">, MapMarkerLabelVariants {}

const MapMarkerLabel = ({className, position = "top", ...rest}: MapMarkerLabelProps) => (
  <div
    className={mapMarkerLabelVariants({className, position})}
    data-position={position}
    data-slot="map-marker-label"
    {...rest}
  />
);

MapMarkerLabel.displayName = "HeroUI.Map.MarkerLabel";

/* -------------------------------------------------------------------------------------------------
 * Marker Tooltip (hover)
 * -----------------------------------------------------------------------------------------------*/
interface MapMarkerTooltipProps extends ComponentPropsWithRef<"div"> {
  /** Distance (px) between the marker and the tooltip. */
  offset?: PopupOptions["offset"];
}

const MapMarkerTooltip = ({
  className,
  offset = MAP_POPUP_OFFSET,
  ...rest
}: MapMarkerTooltipProps) => {
  const {map, slots} = useMapContext("Map.MarkerTooltip");
  const {isHovered, isPopupOpen, lngLat} = useMarkerContext("Map.MarkerTooltip");
  const [container] = useState(createPopupContainer);
  const popupRef = useRef<Popup | null>(null);
  const isOpen = isHovered && !isPopupOpen;
  const getLngLat = useEffectEvent(() => lngLat);
  const getOffset = useEffectEvent(() => offset);

  useEffect(() => {
    if (!map || !isOpen) return;

    const popup = new Popup({
      closeButton: false,
      closeOnClick: true,
      maxWidth: "none",
      offset: getOffset(),
    })
      .setLngLat(getLngLat())
      .setDOMContent(container)
      .addTo(map);

    popupRef.current = popup;

    return () => {
      popup.remove();
      popupRef.current = null;
    };
  }, [map, isOpen, container]);

  useEffect(() => {
    popupRef.current?.setLngLat(lngLat);
  }, [lngLat]);

  return createPortal(
    <div className={slots.tooltip({className})} data-slot="map-marker-tooltip" {...rest} />,
    container,
  );
};

MapMarkerTooltip.displayName = "HeroUI.Map.MarkerTooltip";

/* -------------------------------------------------------------------------------------------------
 * Marker Popup (click / Enter / Space)
 * -----------------------------------------------------------------------------------------------*/
interface MapMarkerPopupProps extends MapPopupOptions {
  /** Shows the HeroUI close button. */
  closeButton?: boolean;
  /** Accessible name of the close button. */
  closeButtonLabel?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}

const MapMarkerPopup = ({
  children,
  className,
  closeButton = false,
  closeButtonLabel = "Close popup",
  focusAfterOpen = false,
  offset = MAP_POPUP_OFFSET,
  ref,
  style,
  ...options
}: MapMarkerPopupProps) => {
  const {map, slots} = useMapContext("Map.MarkerPopup");
  const {element, isPopupOpen, lngLat, setPopupOpen} = useMarkerContext("Map.MarkerPopup");
  const [container] = useState(createPopupContainer);
  const popupRef = useRef<Popup | null>(null);

  const getLngLat = useEffectEvent(() => lngLat);
  const getOptions = useEffectEvent((): PopupOptions => ({
    ...options,
    closeButton: false,
    closeOnClick: false,
    focusAfterOpen,
    maxWidth: "none",
    offset,
  }));
  const close = useEffectEvent((restoreFocus: boolean) => {
    setPopupOpen(false);
    if (restoreFocus) element.focus();
  });

  useEffect(() => {
    if (!map || !isPopupOpen) return;

    const popup = new Popup(getOptions())
      .setLngLat(getLngLat())
      .setDOMContent(container)
      .addTo(map);
    const onClose = () => close(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
      }
    };

    popup.on("close", onClose);
    container.addEventListener("keydown", onKeyDown);
    popupRef.current = popup;

    return () => {
      popup.off("close", onClose);
      container.removeEventListener("keydown", onKeyDown);
      popup.remove();
      popupRef.current = null;
    };
  }, [map, isPopupOpen, container]);

  useEffect(() => {
    popupRef.current?.setLngLat(lngLat);
  }, [lngLat]);

  return createPortal(
    <MapPopupSurface
      ref={ref}
      className={className}
      closeButton={closeButton}
      closeButtonLabel={closeButtonLabel}
      slots={slots}
      style={style}
      onClose={() => setPopupOpen(false)}
    >
      {children}
    </MapPopupSurface>,
    container,
  );
};

MapMarkerPopup.displayName = "HeroUI.Map.MarkerPopup";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  MapMarker,
  MapMarkerContent,
  MapMarkerDot,
  MapMarkerLabel,
  MapMarkerTooltip,
  MapMarkerPopup,
};

export type {
  MapMarkerProps,
  MapMarkerContentProps,
  MapMarkerDotProps,
  MapMarkerLabelProps,
  MapMarkerTooltipProps,
  MapMarkerPopupProps,
};
