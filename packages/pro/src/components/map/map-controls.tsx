"use client";

import type {MapControlsVariants} from "./map.styles";
import type {ButtonGroupProps, ButtonGroupSeparatorProps, ButtonProps} from "@heroui/react";
import type {FlyToOptions} from "maplibre-gl";
import type {ComponentPropsWithRef} from "react";

import {Button, ButtonGroup, IconMinus, IconPlus, Spinner} from "@heroui/react";
import {useEffect, useState} from "react";

import {composeTwRenderProps} from "../../utils";

import {useMapContext} from "./map-context";
import {MapCompassIcon, MapExitFullscreenIcon, MapFullscreenIcon, MapLocateIcon} from "./map-icons";
import {mapControlsVariants} from "./map.styles";

/** Camera animation used by the zoom and compass controls (ms). */
const CONTROL_ANIMATION_DURATION = 300;

/* -------------------------------------------------------------------------------------------------
 * Controls container
 * -----------------------------------------------------------------------------------------------*/
interface MapControlsProps extends ComponentPropsWithRef<"div">, MapControlsVariants {}

const MapControls = ({className, position = "bottom-right", ...rest}: MapControlsProps) => {
  useMapContext("Map.Controls");

  return (
    <div
      className={mapControlsVariants({className, position})}
      data-position={position}
      data-slot="map-controls"
      {...rest}
    />
  );
};

MapControls.displayName = "HeroUI.Map.Controls";

/* -------------------------------------------------------------------------------------------------
 * Control group (OSS ButtonGroup, vertical)
 * -----------------------------------------------------------------------------------------------*/
interface MapControlGroupProps extends Omit<ButtonGroupProps, "className" | "orientation"> {
  className?: string;
}

const MapControlGroup = ({className, ...rest}: MapControlGroupProps) => {
  const {slots} = useMapContext("Map.ControlGroup");

  return (
    <ButtonGroup
      className={slots.controlGroup({className})}
      data-slot="map-control-group"
      orientation="vertical"
      {...rest}
    />
  );
};

MapControlGroup.displayName = "HeroUI.Map.ControlGroup";

/* -------------------------------------------------------------------------------------------------
 * Control button (OSS Button, icon-only / sm / tertiary)
 * -----------------------------------------------------------------------------------------------*/
interface MapControlButtonProps extends ButtonProps {}

const MapControlButton = ({className, ...rest}: MapControlButtonProps) => {
  const {slots} = useMapContext("Map.ControlButton");

  return (
    <Button
      isIconOnly
      className={composeTwRenderProps(className, slots.controlButton())}
      data-slot="map-control-button"
      size="sm"
      variant="tertiary"
      {...rest}
    />
  );
};

MapControlButton.displayName = "HeroUI.Map.ControlButton";

/* -------------------------------------------------------------------------------------------------
 * Control separator (rendered as the first child of the later button)
 * -----------------------------------------------------------------------------------------------*/
interface MapControlSeparatorProps extends Omit<ButtonGroupSeparatorProps, "className"> {
  className?: string;
}

const MapControlSeparator = ({className, ...rest}: MapControlSeparatorProps) => {
  const {slots} = useMapContext("Map.ControlSeparator");

  return (
    <ButtonGroup.Separator
      className={slots.controlSeparator({className})}
      data-slot="map-control-separator"
      {...rest}
    />
  );
};

MapControlSeparator.displayName = "HeroUI.Map.ControlSeparator";

/* -------------------------------------------------------------------------------------------------
 * Zoom control
 * -----------------------------------------------------------------------------------------------*/
interface MapZoomControlProps extends Omit<MapControlGroupProps, "children"> {
  /** Accessible name of the zoom-in button. */
  zoomInLabel?: string;
  /** Accessible name of the zoom-out button. */
  zoomOutLabel?: string;
}

const MapZoomControl = ({
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  ...rest
}: MapZoomControlProps) => {
  const {map, slots} = useMapContext("Map.ZoomControl");

  return (
    <MapControlGroup {...rest}>
      <MapControlButton
        aria-label={zoomInLabel}
        onPress={() => map?.zoomIn({duration: CONTROL_ANIMATION_DURATION})}
      >
        <IconPlus className={slots.controlIcon()} data-slot="map-control-icon" />
      </MapControlButton>
      <MapControlButton
        aria-label={zoomOutLabel}
        onPress={() => map?.zoomOut({duration: CONTROL_ANIMATION_DURATION})}
      >
        <MapControlSeparator />
        <IconMinus className={slots.controlIcon()} data-slot="map-control-icon" />
      </MapControlButton>
    </MapControlGroup>
  );
};

MapZoomControl.displayName = "HeroUI.Map.ZoomControl";

/* -------------------------------------------------------------------------------------------------
 * Compass control (needle follows bearing + pitch, press resets north)
 * -----------------------------------------------------------------------------------------------*/
interface MapCompassControlProps extends Omit<MapControlGroupProps, "children"> {
  /** Accessible name of the button. */
  label?: string;
}

const MapCompassControl = ({label = "Reset bearing to north", ...rest}: MapCompassControlProps) => {
  const {map, slots} = useMapContext("Map.CompassControl");
  const [rotation, setRotation] = useState(() => ({
    bearing: map?.getBearing() ?? 0,
    pitch: map?.getPitch() ?? 0,
  }));

  useEffect(() => {
    if (!map) return;

    const update = () => setRotation({bearing: map.getBearing(), pitch: map.getPitch()});

    map.on("rotate", update);
    map.on("pitch", update);

    return () => {
      map.off("rotate", update);
      map.off("pitch", update);
    };
  }, [map]);

  return (
    <MapControlGroup {...rest}>
      <MapControlButton
        aria-label={label}
        onPress={() => map?.resetNorthPitch({duration: CONTROL_ANIMATION_DURATION})}
      >
        <MapCompassIcon
          className={slots.compassIcon()}
          data-slot="map-compass-icon"
          style={{transform: `rotateX(${rotation.pitch}deg) rotateZ(${-rotation.bearing}deg)`}}
        />
      </MapControlButton>
    </MapControlGroup>
  );
};

MapCompassControl.displayName = "HeroUI.Map.CompassControl";

/* -------------------------------------------------------------------------------------------------
 * Locate control (browser geolocation)
 * -----------------------------------------------------------------------------------------------*/
interface MapLocateControlProps extends Omit<MapControlGroupProps, "children"> {
  /** Accessible name of the button. */
  label?: string;
  /** Minimum zoom level the map flies to once located. */
  zoom?: number;
  /** Extra `flyTo` options for the camera animation. */
  flyToOptions?: Omit<FlyToOptions, "center" | "zoom">;
  /** Options forwarded to `navigator.geolocation.getCurrentPosition`. */
  positionOptions?: PositionOptions;
  /** Fired with the located coordinates. */
  onLocate?: (coords: GeolocationCoordinates) => void;
  /** Fired when geolocation fails or is denied. */
  onLocateError?: (error: GeolocationPositionError) => void;
}

const MapLocateControl = ({
  flyToOptions,
  label = "Find my location",
  onLocate,
  onLocateError,
  positionOptions,
  zoom = 14,
  ...rest
}: MapLocateControlProps) => {
  const {map, slots} = useMapContext("Map.LocateControl");
  const [isLocating, setIsLocating] = useState(false);

  const locate = () => {
    if (!map || isLocating || typeof navigator === "undefined" || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        map.flyTo({
          ...flyToOptions,
          center: [position.coords.longitude, position.coords.latitude],
          zoom: Math.max(map.getZoom(), zoom),
        });
        onLocate?.(position.coords);
      },
      (error) => {
        setIsLocating(false);
        onLocateError?.(error);
      },
      positionOptions,
    );
  };

  return (
    <MapControlGroup {...rest}>
      <MapControlButton aria-busy={isLocating || undefined} aria-label={label} onPress={locate}>
        {isLocating ? (
          <Spinner
            className={slots.controlSpinner()}
            color="current"
            data-slot="map-control-spinner"
            size="sm"
          />
        ) : (
          <MapLocateIcon className={slots.controlIcon()} data-slot="map-control-icon" />
        )}
      </MapControlButton>
    </MapControlGroup>
  );
};

MapLocateControl.displayName = "HeroUI.Map.LocateControl";

/* -------------------------------------------------------------------------------------------------
 * Fullscreen control
 * -----------------------------------------------------------------------------------------------*/
interface MapFullscreenControlProps extends Omit<MapControlGroupProps, "children"> {
  /** Accessible name of the button. */
  label?: string;
}

const MapFullscreenControl = ({
  label = "Toggle fullscreen",
  ...rest
}: MapFullscreenControlProps) => {
  const {map, slots} = useMapContext("Map.FullscreenControl");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!map) return;

    const onChange = () => setIsFullscreen(document.fullscreenElement === map.getContainer());

    document.addEventListener("fullscreenchange", onChange);

    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [map]);

  const toggle = () => {
    if (!map) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void map.getContainer().requestFullscreen?.();
    }
  };

  const Icon = isFullscreen ? MapExitFullscreenIcon : MapFullscreenIcon;

  return (
    <MapControlGroup {...rest}>
      <MapControlButton aria-label={label} onPress={toggle}>
        <Icon className={slots.controlIcon()} data-slot="map-control-icon" />
      </MapControlButton>
    </MapControlGroup>
  );
};

MapFullscreenControl.displayName = "HeroUI.Map.FullscreenControl";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  MapControls,
  MapControlGroup,
  MapControlButton,
  MapControlSeparator,
  MapZoomControl,
  MapCompassControl,
  MapLocateControl,
  MapFullscreenControl,
};

export type {
  MapControlsProps,
  MapControlGroupProps,
  MapControlButtonProps,
  MapControlSeparatorProps,
  MapZoomControlProps,
  MapCompassControlProps,
  MapLocateControlProps,
  MapFullscreenControlProps,
};
