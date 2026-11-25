"use client";

import type {MapContextValue} from "./map-context";
import type {PopupOptions} from "maplibre-gl";
import type {CSSProperties, ReactNode, Ref} from "react";

import {CloseButton} from "@heroui/react";
import {Popup} from "maplibre-gl";
import {useEffect, useEffectEvent, useRef, useState} from "react";
import {createPortal} from "react-dom";

import {useMapContext} from "./map-context";
import {createPopupContainer} from "./map-utils";

/** Popup / tooltip offset (px) from the anchor point. */
export const MAP_POPUP_OFFSET = 16;

/** MapLibre options a HeroUI popup forwards (the close button and width are HeroUI-owned). */
export type MapPopupOptions = Omit<PopupOptions, "closeButton" | "maxWidth" | "className">;

/* -------------------------------------------------------------------------------------------------
 * Popup surface (shared by Map.Popup and Map.MarkerPopup)
 * -----------------------------------------------------------------------------------------------*/
interface MapPopupSurfaceProps {
  children?: ReactNode;
  className?: string;
  closeButton?: boolean;
  closeButtonLabel?: string;
  onClose?: () => void;
  ref?: Ref<HTMLDivElement>;
  slots: MapContextValue["slots"];
  style?: CSSProperties;
}

export const MapPopupSurface = ({
  children,
  className,
  closeButton,
  closeButtonLabel,
  onClose,
  ref,
  slots,
  style,
}: MapPopupSurfaceProps) => (
  <div
    ref={ref}
    className={slots.popupContent({className})}
    data-close-button={closeButton ? "true" : undefined}
    data-slot="map-popup"
    style={style}
  >
    {closeButton ? (
      <CloseButton
        aria-label={closeButtonLabel}
        className={slots.popupCloseButton()}
        data-slot="map-popup-close-button"
        onPress={onClose}
      />
    ) : null}
    {children}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Map Popup (standalone)
 * -----------------------------------------------------------------------------------------------*/
interface MapPopupProps extends MapPopupOptions {
  /** Popup latitude. */
  latitude: number;
  /** Popup longitude. */
  longitude: number;
  /** Shows the HeroUI close button. */
  closeButton?: boolean;
  /** Accessible name of the close button. */
  closeButtonLabel?: string;
  /** Fired when the popup closes. */
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}

const MapPopup = ({
  children,
  className,
  closeButton = false,
  closeButtonLabel = "Close popup",
  closeOnClick = false,
  focusAfterOpen = false,
  latitude,
  longitude,
  offset = MAP_POPUP_OFFSET,
  onClose,
  ref,
  style,
  ...options
}: MapPopupProps) => {
  const {map, slots} = useMapContext("Map.Popup");
  const [container] = useState(createPopupContainer);
  const popupRef = useRef<Popup | null>(null);
  const positionKey = `${longitude},${latitude}`;
  // Closing (close button, `closeOnClick`, ...) hides the popup until its position changes.
  const [closedKey, setClosedKey] = useState<string | null>(null);
  const isOpen = closedKey !== positionKey;

  const getLngLat = useEffectEvent((): [number, number] => [longitude, latitude]);
  const getOptions = useEffectEvent((): PopupOptions => ({
    ...options,
    closeButton: false,
    closeOnClick,
    focusAfterOpen,
    maxWidth: "none",
    offset,
  }));
  const handleClose = useEffectEvent(() => {
    setClosedKey(positionKey);
    onClose?.();
  });

  useEffect(() => {
    if (!map || !isOpen) return;

    const popup = new Popup(getOptions())
      .setLngLat(getLngLat())
      .setDOMContent(container)
      .addTo(map);
    const onPopupClose = () => handleClose();

    popup.on("close", onPopupClose);
    popupRef.current = popup;

    return () => {
      popup.off("close", onPopupClose);
      popup.remove();
      popupRef.current = null;
    };
  }, [map, isOpen, container]);

  useEffect(() => {
    popupRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  useEffect(() => {
    popupRef.current?.setOffset(offset);
  }, [offset]);

  return createPortal(
    <MapPopupSurface
      ref={ref}
      className={className}
      closeButton={closeButton}
      closeButtonLabel={closeButtonLabel}
      slots={slots}
      style={style}
      onClose={() => popupRef.current?.remove()}
    >
      {children}
    </MapPopupSurface>,
    container,
  );
};

MapPopup.displayName = "HeroUI.Map.Popup";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MapPopup};

export type {MapPopupProps};
