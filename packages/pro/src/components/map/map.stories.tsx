import type {MapArcDatum, MapCoordinates, MapFeatureCollection} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Avatar, Card} from "@heroui/react";
// Vite resolves the worker file to a served URL (its dependency pre-bundling breaks MapLibre's
// own `import.meta.url` based lookup, so the stories pass it through `workerUrl`).
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import React, {useEffect, useMemo, useState} from "react";

import {Map, useMap} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Basemap: OpenFreeMap public styles (no API key, free to use; data © OpenStreetMap contributors)
 * -----------------------------------------------------------------------------------------------*/
const styles = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/positron",
};

const meta = {
  argTypes: {
    isLoading: {control: "boolean"},
    pitch: {control: {max: 60, min: 0, step: 1, type: "range"}},
    theme: {control: {type: "select"}, options: [undefined, "light", "dark"]},
    zoom: {control: {max: 18, min: 1, step: 0.25, type: "range"}},
  },
  component: Map,
  parameters: {layout: "padded"},
  title: "Pro/DataDisplay/Map",
} satisfies Meta<typeof Map>;

export default meta;

type Story = StoryObj<typeof meta>;

const BLUE = "#4285f4";
const GREEN = "#22c55e";
const ORANGE = "#f97316";
const PURPLE = "#8b5cf6";
const RED = "#ef4444";

/* -------------------------------------------------------------------------------------------------
 * Shared story chrome
 * -----------------------------------------------------------------------------------------------*/
const Frame = ({children, height = 420}: {children: React.ReactNode; height?: number}) => (
  <div className="relative w-full overflow-hidden rounded-lg border" style={{height}}>
    {children}
  </div>
);

const OverlayCard = ({
  children,
  description,
  title,
  width,
}: {
  children: React.ReactNode;
  description: React.ReactNode;
  title: string;
  width: number;
}) => (
  <Card className="absolute top-3 left-3 z-10 gap-3 bg-overlay p-4 shadow-overlay" style={{width}}>
    <Card.Header>
      <Card.Title className="text-sm">{title}</Card.Title>
      <Card.Description>{description}</Card.Description>
    </Card.Header>
    {children}
  </Card>
);

const Stat = ({label, value}: {label: string; value: string}) => (
  <span>
    <strong className="block text-base text-foreground">{value}</strong>
    {label}
  </span>
);

const LegendRow = ({
  capitalize = false,
  color,
  label,
  line = false,
  value,
}: {
  capitalize?: boolean;
  color: string;
  label: string;
  line?: boolean;
  value: string;
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className={capitalize ? "flex items-center gap-2 capitalize" : "flex items-center gap-2"}>
      <span
        className={line ? "h-0.5 w-4 rounded-full" : "size-2 rounded-full"}
        style={{backgroundColor: color}}
      />
      {label}
    </span>
    <span className="text-muted">{value}</span>
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Default: route + labelled stops + popup + controls
 * -----------------------------------------------------------------------------------------------*/
const loopRoute: MapCoordinates[] = [
  [-87.6402, 41.8789],
  [-87.6398, 41.8822],
  [-87.6395, 41.8857],
  [-87.6355, 41.8857],
  [-87.63, 41.8857],
  [-87.6262, 41.8857],
  [-87.6245, 41.8854],
  [-87.6243, 41.8826],
  [-87.6242, 41.879],
  [-87.624, 41.874],
  [-87.6238, 41.87],
  [-87.6195, 41.8681],
  [-87.615, 41.8665],
];

const loopStops = [
  {arrival: "10:31 AM", kind: "Pickup", label: "Pickup", position: loopRoute[0]!, start: true},
  {arrival: "10:42 AM", kind: "Second drop", label: "Lake & Wabash", position: loopRoute[5]!},
  {
    arrival: "10:55 AM",
    kind: "Final drop",
    label: "Museum Campus",
    position: loopRoute[loopRoute.length - 1]!,
  },
];

/** Clicking a stop opens its popup; the close button hides it until another stop is picked. */
const DefaultDemo = (args: Story["args"]) => {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(loopStops[1]!.label);
  const selected = loopStops.find((stop) => stop.label === selectedLabel);

  return (
    <Frame>
      <Map {...args} styles={styles} workerUrl={maplibreWorkerUrl}>
        <Map.Route coordinates={loopRoute} />
        {loopStops.map((stop) => (
          <Map.Marker
            key={stop.label}
            latitude={stop.position[1]}
            longitude={stop.position[0]}
            onClick={() => setSelectedLabel(stop.label)}
          >
            <Map.MarkerContent>
              {stop.start ? <Map.MarkerDot color={GREEN} ringColor="#bbf7d0" /> : <Map.MarkerDot />}
              <Map.MarkerLabel>{stop.label}</Map.MarkerLabel>
            </Map.MarkerContent>
          </Map.Marker>
        ))}
        {selected ? (
          <Map.Popup
            closeButton
            latitude={selected.position[1]}
            longitude={selected.position[0]}
            offset={18}
            onClose={() => setSelectedLabel(null)}
          >
            <div className="space-y-1 pr-4 text-xs">
              <p className="font-medium">{selected.label}</p>
              <p className="text-muted">{selected.kind}</p>
              <p className="text-muted">Arrival {selected.arrival}</p>
            </div>
          </Map.Popup>
        ) : null}
        <Map.Controls>
          <Map.ZoomControl />
          <Map.CompassControl />
          <Map.FullscreenControl />
        </Map.Controls>
      </Map>
      <OverlayCard description="Loop district courier" title="Delivery run" width={230}>
        <Card.Content className="grid grid-cols-3 gap-3 text-xs">
          <Stat label="ETA" value="12m" />
          <Stat label="Stops" value="3" />
          <Stat label="Km" value="4.1" />
        </Card.Content>
      </OverlayCard>
    </Frame>
  );
};

export const Default: Story = {
  args: {
    center: [-87.6295, 41.8772],
    isLoading: false,
    pitch: 24,
    zoom: 13.4,
  },
  render: (args) => <DefaultDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Live visitors: avatar markers with hover tooltips + grouped count bubbles
 * -----------------------------------------------------------------------------------------------*/
const visitors = [
  {city: "Tokyo", position: [139.69, 35.69], seen: "Active now", u: 11},
  {city: "Seoul", position: [126.98, 37.57], seen: "Active now", u: 12},
  {city: "Beijing", position: [116.4, 39.9], seen: "2m ago", u: 13},
  {city: "Shanghai", position: [121.47, 31.23], seen: "Active now", u: 14},
  {city: "Hong Kong", position: [114.17, 22.32], seen: "Active now", u: 15},
  {city: "Manila", position: [120.98, 14.6], seen: "5m ago", u: 16},
  {city: "Bangkok", position: [100.5, 13.76], seen: "Active now", u: 17},
  {city: "Singapore", position: [103.82, 1.35], seen: "Active now", u: 18},
  {city: "Jakarta", position: [106.85, -6.21], seen: "1m ago", u: 19},
  {city: "Hanoi", position: [105.85, 21.03], seen: "Active now", u: 20},
  {city: "Delhi", position: [77.21, 28.61], seen: "Active now", u: 21},
  {city: "Mumbai", position: [72.88, 19.08], seen: "3m ago", u: 22},
  {city: "Dhaka", position: [90.41, 23.81], seen: "Active now", u: 23},
  {city: "Sydney", position: [151.21, -33.87], seen: "Active now", u: 24},
  {city: "Melbourne", position: [144.96, -37.81], seen: "4m ago", u: 25},
  {city: "Auckland", position: [174.76, -36.85], seen: "Active now", u: 26},
] as const;

const visitorGroups = [
  {count: 6, label: "Osaka area", position: [135.5, 34.69]},
  {count: 4, label: "Chennai area", position: [80.27, 13.08]},
  {count: 3, label: "Perth area", position: [115.86, -31.95]},
] as const;

const visitorTotal =
  visitors.length + visitorGroups.reduce((total, group) => total + group.count, 0);

export const LiveVisitors: Story = {
  render: () => (
    <Frame height={500}>
      <Map center={[118, 8]} styles={styles} workerUrl={maplibreWorkerUrl} zoom={2.4}>
        {visitors.map((visitor) => (
          <Map.Marker
            key={visitor.city}
            latitude={visitor.position[1]}
            longitude={visitor.position[0]}
          >
            <Map.MarkerContent>
              <Avatar className="ring-2 ring-white" size="sm">
                <Avatar.Image
                  alt={`Visitor from ${visitor.city}`}
                  src={`https://img.heroui.chat/image/avatar?w=96&h=96&u=${visitor.u}`}
                />
                <Avatar.Fallback>{visitor.city.slice(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
            </Map.MarkerContent>
            <Map.MarkerTooltip>
              <span className="font-medium">{visitor.city}</span>
              <span className="ml-1 text-background/70">{visitor.seen}</span>
            </Map.MarkerTooltip>
          </Map.Marker>
        ))}
        {visitorGroups.map((group) => (
          <Map.Marker
            key={group.label}
            aria-label={`${group.count} visitors near ${group.label}`}
            latitude={group.position[1]}
            longitude={group.position[0]}
          >
            <Map.MarkerContent>
              <span className="flex size-6 items-center justify-center rounded-full bg-[#8b5cf6] text-xs font-medium text-white ring-2 ring-white">
                {group.count}
              </span>
            </Map.MarkerContent>
            <Map.MarkerTooltip>
              <span className="font-medium">{group.label}</span>
              <span className="ml-1 text-background/70">{group.count} visitors</span>
            </Map.MarkerTooltip>
          </Map.Marker>
        ))}
      </Map>
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#22c55e]" />
        </span>
        {visitorTotal} visitors online
      </div>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Property listings: price pills + selectable list + popup
 * -----------------------------------------------------------------------------------------------*/
const homes = [
  {
    area: "Alfama",
    baths: 2,
    beds: 3,
    id: "alfama",
    name: "Alfama townhouse",
    position: [-9.1305, 38.7118],
    price: "€1.2m",
    size: "142 m²",
  },
  {
    area: "Baixa",
    baths: 1,
    beds: 1,
    id: "baixa",
    name: "Baixa loft",
    position: [-9.1385, 38.7105],
    price: "€640k",
    size: "68 m²",
  },
  {
    area: "Príncipe Real",
    baths: 2,
    beds: 2,
    id: "principe",
    name: "Príncipe Real flat",
    position: [-9.1497, 38.7172],
    price: "€910k",
    size: "96 m²",
  },
  {
    area: "Campo de Ourique",
    baths: 3,
    beds: 4,
    id: "ourique",
    name: "Campo de Ourique home",
    position: [-9.1672, 38.7178],
    price: "€1.9m",
    size: "210 m²",
  },
  {
    area: "Avenidas Novas",
    baths: 1,
    beds: 1,
    id: "avenidas",
    name: "Avenidas Novas studio",
    position: [-9.1468, 38.7388],
    price: "€420k",
    size: "41 m²",
  },
  {
    area: "Estrela",
    baths: 2,
    beds: 3,
    id: "estrela",
    name: "Estrela duplex",
    position: [-9.1602, 38.7112],
    price: "€1.05m",
    size: "128 m²",
  },
] as const;

const PropertyListingsDemo = () => {
  const [selectedId, setSelectedId] = useState<string | null>("baixa");
  const selected = homes.find((home) => home.id === selectedId);

  return (
    <Frame>
      <Map center={[-9.1455, 38.7215]} styles={styles} workerUrl={maplibreWorkerUrl} zoom={12.6}>
        {homes.map((home) => {
          const isSelected = home.id === selectedId;

          return (
            <Map.Marker
              key={home.id}
              latitude={home.position[1]}
              longitude={home.position[0]}
              onClick={() => setSelectedId(home.id)}
            >
              <Map.MarkerContent>
                <span
                  className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold shadow-md transition ${
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "bg-overlay text-foreground"
                  }`}
                >
                  {home.price}
                </span>
              </Map.MarkerContent>
            </Map.Marker>
          );
        })}
        {selected ? (
          <Map.Popup
            closeButton
            latitude={selected.position[1]}
            longitude={selected.position[0]}
            offset={22}
            onClose={() => setSelectedId(null)}
          >
            <div className="space-y-1 pr-4 text-xs">
              <p className="font-medium">{selected.name}</p>
              <p className="text-muted">{selected.area}</p>
              <p className="text-muted">
                {selected.beds} bd · {selected.baths} ba · {selected.size}
              </p>
              <p className="font-semibold text-foreground">{selected.price}</p>
            </div>
          </Map.Popup>
        ) : null}
        <Map.Controls>
          <Map.ZoomControl />
        </Map.Controls>
      </Map>
      <OverlayCard description={`${homes.length} homes in Lisbon`} title="For sale" width={250}>
        <Card.Content className="gap-1">
          {homes.map((home) => (
            <button
              key={home.id}
              type="button"
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left transition ${
                home.id === selectedId ? "bg-surface-tertiary" : "hover:bg-surface-tertiary"
              }`}
              onClick={() => setSelectedId(home.id)}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{home.name}</span>
                <span className="block text-xs text-muted">
                  {home.beds} bd · {home.baths} ba
                </span>
              </span>
              <span className="text-xs font-semibold">{home.price}</span>
            </button>
          ))}
        </Card.Content>
      </OverlayCard>
    </Frame>
  );
};

export const PropertyListings: Story = {
  render: () => <PropertyListingsDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Live tracking: animated courier along a route
 * -----------------------------------------------------------------------------------------------*/
const courierRoute: MapCoordinates[] = [
  [-0.1238, 51.5113],
  [-0.1221, 51.5127],
  [-0.1196, 51.5142],
  [-0.1171, 51.5158],
  [-0.1149, 51.5176],
  [-0.1121, 51.5191],
  [-0.1093, 51.5207],
  [-0.1071, 51.5224],
  [-0.1052, 51.5236],
  [-0.1036, 51.5247],
];

const TRIP_DURATION = 45_000;
const TRIP_MINUTES = 14;

/** Point at `progress` (0..1) along a polyline, plus the travelled part of it. */
function splitRoute(route: MapCoordinates[], progress: number) {
  const lengths = route
    .slice(1)
    .map((point, index) => Math.hypot(point[0] - route[index]![0], point[1] - route[index]![1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = total * progress;

  for (let index = 0; index < lengths.length; index++) {
    const length = lengths[index]!;

    if (remaining <= length) {
      const start = route[index]!;
      const end = route[index + 1]!;
      const t = length === 0 ? 0 : remaining / length;
      const point: MapCoordinates = [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ];

      return {point, travelled: [...route.slice(0, index + 1), point]};
    }
    remaining -= length;
  }

  const last = route[route.length - 1]!;

  return {point: last, travelled: route};
}

const LiveTrackingDemo = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setProgress((((now - start) % TRIP_DURATION) / TRIP_DURATION) * 0.98);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  const {point, travelled} = useMemo(() => splitRoute(courierRoute, progress), [progress]);
  const destination = courierRoute[courierRoute.length - 1]!;
  const minutesLeft = Math.max(1, Math.ceil((1 - progress) * TRIP_MINUTES));

  return (
    <Frame>
      <Map
        center={[-0.1137, 51.518]}
        pitch={30}
        styles={styles}
        workerUrl={maplibreWorkerUrl}
        zoom={14.2}
      >
        <Map.Route
          color="#94a3b8"
          coordinates={courierRoute}
          dashArray={[1.5, 1.5]}
          opacity={0.6}
        />
        <Map.Route color={BLUE} coordinates={travelled} opacity={0.9} width={4} />
        <Map.Marker latitude={point[1]} longitude={point[0]}>
          <Map.MarkerContent>
            <Map.MarkerDot color={BLUE} />
            <Map.MarkerLabel>Courier</Map.MarkerLabel>
          </Map.MarkerContent>
        </Map.Marker>
        <Map.Marker latitude={destination[1]} longitude={destination[0]}>
          <Map.MarkerContent>
            <Map.MarkerDot color={GREEN} />
            <Map.MarkerLabel>Your door</Map.MarkerLabel>
          </Map.MarkerContent>
        </Map.Marker>
        <Map.Controls>
          <Map.ZoomControl />
          <Map.CompassControl />
        </Map.Controls>
      </Map>
      <Card className="absolute top-3 left-3 z-10 w-[250px] gap-3 bg-overlay p-4 shadow-overlay">
        <Card.Header className="flex-row items-center gap-3">
          <Avatar size="sm">
            <Avatar.Fallback>MA</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <Card.Title className="text-sm">Maya is on the way</Card.Title>
            <Card.Description>Order #5120 · 3 items</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Estimated arrival</span>
            <span className="font-semibold">{minutesLeft} min</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className="h-full rounded-full bg-[#4285f4] transition-[width] duration-150 ease-linear"
              style={{width: `${Math.round(progress * 100)}%`}}
            />
          </div>
        </Card.Content>
      </Card>
    </Frame>
  );
};

export const LiveTracking: Story = {
  render: () => <LiveTrackingDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Store locator: coloured pickup points + locate control
 * -----------------------------------------------------------------------------------------------*/
const stores = [
  {
    color: BLUE,
    distance: "0.6 mi",
    id: "union",
    name: "Union Station desk",
    position: [-105.0003, 39.7527],
    ready: 24,
    street: "Wynkoop St",
  },
  {
    color: GREEN,
    distance: "1.1 mi",
    id: "lodo",
    name: "LoDo lockers",
    position: [-104.995, 39.749],
    ready: 12,
    street: "Blake St",
  },
  {
    color: ORANGE,
    distance: "2.3 mi",
    id: "capitol",
    name: "Capitol Hill hub",
    position: [-104.979, 39.733],
    ready: 37,
    street: "E Colfax Ave",
  },
  {
    color: PURPLE,
    distance: "2.8 mi",
    id: "highlands",
    name: "Highlands counter",
    position: [-105.011, 39.762],
    ready: 9,
    street: "W 32nd Ave",
  },
] as const;

const StoreLocatorDemo = () => {
  const [selectedId, setSelectedId] = useState<string | null>("union");
  const selected = stores.find((store) => store.id === selectedId);

  return (
    <Frame>
      <Map
        center={[-104.9935, 39.7478]}
        pitch={18}
        styles={styles}
        workerUrl={maplibreWorkerUrl}
        zoom={12.6}
      >
        {stores.map((store) => (
          <Map.Marker
            key={store.id}
            latitude={store.position[1]}
            longitude={store.position[0]}
            onClick={() => setSelectedId(store.id)}
          >
            <Map.MarkerContent>
              <Map.MarkerDot color={store.color} />
              <Map.MarkerLabel>{store.name}</Map.MarkerLabel>
            </Map.MarkerContent>
          </Map.Marker>
        ))}
        {selected ? (
          <Map.Popup
            closeButton
            latitude={selected.position[1]}
            longitude={selected.position[0]}
            offset={18}
            onClose={() => setSelectedId(null)}
          >
            <div className="space-y-1 pr-4 text-xs">
              <p className="font-medium">{selected.name}</p>
              <p className="text-muted">{selected.street}</p>
              <p className="text-muted">Open · {selected.ready} ready</p>
            </div>
          </Map.Popup>
        ) : null}
        <Map.Controls>
          <Map.ZoomControl />
          <Map.LocateControl />
        </Map.Controls>
      </Map>
      <OverlayCard
        description={`${stores.length} locations near Denver`}
        title="Pickup points"
        width={240}
      >
        <Card.Content className="gap-2">
          {stores.slice(0, 3).map((store) => (
            <button
              key={store.id}
              className="flex items-center justify-between rounded-md px-2 py-1 text-left transition hover:bg-surface-tertiary"
              type="button"
              onClick={() => setSelectedId(store.id)}
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{backgroundColor: store.color}} />
                <span className="text-xs font-medium">{store.name}</span>
              </span>
              <span className="text-xs text-muted">{store.distance}</span>
            </button>
          ))}
        </Card.Content>
      </OverlayCard>
    </Frame>
  );
};

export const StoreLocator: Story = {
  render: () => <StoreLocatorDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Fleet dispatch: route + vehicles + full control set
 * -----------------------------------------------------------------------------------------------*/
const dispatchRoute: MapCoordinates[] = [
  [-71.0812, 42.3471],
  [-71.0765, 42.3489],
  [-71.0718, 42.3508],
  [-71.0679, 42.3527],
  [-71.0641, 42.3549],
  [-71.0603, 42.3575],
  [-71.0577, 42.3601],
  [-71.0553, 42.3627],
  [-71.0531, 42.3652],
];

const vehicles = [
  {
    color: BLUE,
    driver: "Jonah",
    eta: "4 min",
    id: "van-07",
    name: "Van 07",
    position: dispatchRoute[3]!,
    status: "En route",
  },
  {
    color: GREEN,
    driver: "Priya",
    eta: "Loading",
    id: "bike-31",
    name: "Bike 31",
    position: [-71.0618, 42.3622] as MapCoordinates,
    status: "At hub",
  },
  {
    color: ORANGE,
    driver: "Leo",
    eta: "11 min",
    id: "van-12",
    name: "Van 12",
    position: [-71.0752, 42.3561] as MapCoordinates,
    status: "Delayed",
  },
];

const FleetDispatchDemo = () => {
  const [selectedId, setSelectedId] = useState<string | null>("van-07");
  const selected = vehicles.find((vehicle) => vehicle.id === selectedId);

  return (
    <Frame>
      <Map
        center={[-71.0664, 42.3562]}
        pitch={32}
        styles={styles}
        workerUrl={maplibreWorkerUrl}
        zoom={13.4}
      >
        <Map.Route color={BLUE} coordinates={dispatchRoute} opacity={0.78} width={4} />
        {vehicles.map((vehicle) => (
          <Map.Marker
            key={vehicle.id}
            latitude={vehicle.position[1]}
            longitude={vehicle.position[0]}
            onClick={() => setSelectedId(vehicle.id)}
          >
            <Map.MarkerContent>
              <Map.MarkerDot color={vehicle.color} />
              <Map.MarkerLabel>{vehicle.name}</Map.MarkerLabel>
            </Map.MarkerContent>
          </Map.Marker>
        ))}
        {selected ? (
          <Map.Popup
            closeButton
            latitude={selected.position[1]}
            longitude={selected.position[0]}
            offset={18}
            onClose={() => setSelectedId(null)}
          >
            <div className="space-y-1 pr-4 text-xs">
              <p className="font-medium">{selected.name}</p>
              <p className="text-muted">{selected.driver}</p>
              <p className="text-muted">
                {selected.status} · {selected.eta}
              </p>
            </div>
          </Map.Popup>
        ) : null}
        <Map.Controls>
          <Map.ZoomControl />
          <Map.CompassControl />
          <Map.FullscreenControl />
        </Map.Controls>
      </Map>
      <OverlayCard description="Back Bay zone" title="Fleet dispatch" width={230}>
        <Card.Content className="grid grid-cols-3 gap-3 text-xs">
          <Stat label="Active" value="24" />
          <Stat label="SLA" value="95%" />
          <Stat label="Holds" value="2" />
        </Card.Content>
      </OverlayCard>
    </Frame>
  );
};

export const FleetDispatch: Story = {
  render: () => <FleetDispatchDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Coverage zones: custom fill + line layers through `useMap`
 * -----------------------------------------------------------------------------------------------*/
const zones = [
  {
    capacity: "88%",
    center: [-112.074, 33.612] as MapCoordinates,
    color: BLUE,
    id: "north",
    name: "North same-day",
    ring: [
      [-112.16, 33.56],
      [-111.99, 33.56],
      [-111.98, 33.67],
      [-112.15, 33.68],
    ],
  },
  {
    capacity: "97%",
    center: [-112.067, 33.48] as MapCoordinates,
    color: GREEN,
    id: "core",
    name: "Core express",
    ring: [
      [-112.13, 33.43],
      [-112.0, 33.43],
      [-111.99, 33.535],
      [-112.14, 33.535],
    ],
  },
  {
    capacity: "69%",
    center: [-112.06, 33.36] as MapCoordinates,
    color: ORANGE,
    id: "south",
    name: "South scheduled",
    ring: [
      [-112.15, 33.31],
      [-111.97, 33.3],
      [-111.98, 33.405],
      [-112.14, 33.41],
    ],
  },
];

const ZONE_SOURCE = "story-coverage-zones-source";

/** Adds GeoJSON fill + outline layers; re-added after every style swap (light / dark). */
const CoverageZonesLayer = () => {
  const {isLoaded, map} = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.addSource(ZONE_SOURCE, {
      data: {
        features: zones.map((zone) => ({
          geometry: {coordinates: [[...zone.ring, zone.ring[0]!]], type: "Polygon"},
          properties: {fill: zone.color, id: zone.id, stroke: zone.color},
          type: "Feature",
        })),
        type: "FeatureCollection",
      },
      type: "geojson",
    });
    map.addLayer({
      id: "story-coverage-zones-fill",
      paint: {"fill-color": ["get", "fill"], "fill-opacity": 0.18},
      source: ZONE_SOURCE,
      type: "fill",
    });
    map.addLayer({
      id: "story-coverage-zones-line",
      paint: {"line-color": ["get", "stroke"], "line-opacity": 0.9, "line-width": 2},
      source: ZONE_SOURCE,
      type: "line",
    });

    return () => {
      if (!map.style) return;
      for (const id of ["story-coverage-zones-line", "story-coverage-zones-fill"]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource(ZONE_SOURCE)) map.removeSource(ZONE_SOURCE);
    };
  }, [map, isLoaded]);

  return null;
};

export const CoverageZones: Story = {
  render: () => (
    <Frame>
      <Map
        center={[-112.066, 33.49]}
        pitch={18}
        styles={styles}
        workerUrl={maplibreWorkerUrl}
        zoom={10.2}
      >
        <CoverageZonesLayer />
        {zones.map((zone) => (
          <Map.Marker key={zone.id} latitude={zone.center[1]} longitude={zone.center[0]}>
            <Map.MarkerContent>
              <Map.MarkerDot color={zone.color} />
              <Map.MarkerLabel>{zone.capacity}</Map.MarkerLabel>
            </Map.MarkerContent>
          </Map.Marker>
        ))}
        <Map.Controls>
          <Map.ZoomControl />
          <Map.CompassControl />
        </Map.Controls>
      </Map>
      <OverlayCard description="Phoenix delivery capacity" title="Coverage zones" width={240}>
        <Card.Content className="gap-2">
          {zones.map((zone) => (
            <LegendRow key={zone.id} color={zone.color} label={zone.name} value={zone.capacity} />
          ))}
        </Card.Content>
      </OverlayCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Heatmap: custom heatmap layer through `useMap`
 * -----------------------------------------------------------------------------------------------*/
const HEAT_STOPS = [
  "rgba(66, 133, 244, 0.4)",
  "rgba(34, 197, 94, 0.55)",
  "rgba(249, 115, 22, 0.7)",
  "rgba(239, 68, 68, 0.85)",
];

/** Deterministic pseudo-random points around a few hotspots. */
function createDemandPoints(): MapFeatureCollection<{weight: number}> {
  const hotspots = [
    {center: [2.3522, 48.8566], count: 60, spread: 0.035, weight: 1},
    {center: [2.3376, 48.8738], count: 45, spread: 0.02, weight: 0.9},
    {center: [2.3735, 48.8448], count: 40, spread: 0.025, weight: 0.7},
    {center: [2.2945, 48.8584], count: 30, spread: 0.018, weight: 0.6},
    {center: [2.395, 48.8795], count: 25, spread: 0.03, weight: 0.4},
  ];
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;

    return (seed - 1) / 2147483646;
  };
  const features: MapFeatureCollection<{weight: number}>["features"] = [];

  for (const spot of hotspots) {
    for (let i = 0; i < spot.count; i++) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * spot.spread;

      features.push({
        geometry: {
          coordinates: [
            spot.center[0]! + Math.cos(angle) * distance * 1.4,
            spot.center[1]! + Math.sin(angle) * distance,
          ],
          type: "Point",
        },
        properties: {weight: Math.round(spot.weight * (0.5 + random() / 2) * 100) / 100},
        type: "Feature",
      });
    }
  }

  return {features, type: "FeatureCollection"};
}

const demandPoints = createDemandPoints();
const HEAT_SOURCE = "story-demand-heatmap-source";
const HEAT_LAYER = "story-demand-heatmap-layer";

const DemandHeatmapLayer = () => {
  const {isLoaded, map} = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.addSource(HEAT_SOURCE, {data: demandPoints as never, type: "geojson"});
    map.addLayer({
      id: HEAT_LAYER,
      paint: {
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(66, 133, 244, 0)",
          0.25,
          HEAT_STOPS[0]!,
          0.5,
          HEAT_STOPS[1]!,
          0.75,
          HEAT_STOPS[2]!,
          1,
          HEAT_STOPS[3]!,
        ],
        "heatmap-intensity": 0.9,
        "heatmap-opacity": 0.8,
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 18, 14, 40],
        "heatmap-weight": ["get", "weight"],
      },
      source: HEAT_SOURCE,
      type: "heatmap",
    });

    return () => {
      if (!map.style) return;
      if (map.getLayer(HEAT_LAYER)) map.removeLayer(HEAT_LAYER);
      if (map.getSource(HEAT_SOURCE)) map.removeSource(HEAT_SOURCE);
    };
  }, [map, isLoaded]);

  return null;
};

export const Heatmap: Story = {
  render: () => (
    <Frame>
      <Map center={[2.345, 48.861]} styles={styles} workerUrl={maplibreWorkerUrl} zoom={11.6}>
        <DemandHeatmapLayer />
        <Map.Controls>
          <Map.ZoomControl />
        </Map.Controls>
      </Map>
      <OverlayCard description="Paris · last hour" title="Ride demand" width={240}>
        <Card.Content className="gap-2">
          <div
            className="h-2 w-full rounded-full"
            style={{background: `linear-gradient(to right, ${HEAT_STOPS.join(", ")})`}}
          />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Low</span>
            <span>High</span>
          </div>
        </Card.Content>
      </OverlayCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Flight paths: curved arcs between airports
 * -----------------------------------------------------------------------------------------------*/
const airports: Record<string, MapCoordinates> = {
  BOM: [72.8679, 19.0896],
  FRA: [8.5706, 50.0333],
  GRU: [-46.4731, -23.4356],
  ICN: [126.4505, 37.4602],
  JNB: [28.246, -26.1392],
  ORD: [-87.9048, 41.9786],
  SYD: [151.177, -33.9461],
  YYZ: [-79.6306, 43.6777],
};

interface FlightArc extends MapArcDatum {
  load: string;
  route: string;
}

const flights: FlightArc[] = [
  {
    color: BLUE,
    from: airports["ORD"]!,
    id: "ORD-FRA",
    load: "84%",
    route: "ORD → FRA",
    to: airports["FRA"]!,
  },
  {
    color: BLUE,
    from: airports["FRA"]!,
    id: "FRA-BOM",
    load: "79%",
    route: "FRA → BOM",
    to: airports["BOM"]!,
  },
  {
    color: GREEN,
    from: airports["YYZ"]!,
    id: "YYZ-GRU",
    load: "88%",
    route: "YYZ → GRU",
    to: airports["GRU"]!,
  },
  {
    color: GREEN,
    from: airports["GRU"]!,
    id: "GRU-JNB",
    load: "71%",
    route: "GRU → JNB",
    to: airports["JNB"]!,
  },
  {
    color: ORANGE,
    from: airports["BOM"]!,
    id: "BOM-SYD",
    load: "93%",
    route: "BOM → SYD",
    to: airports["SYD"]!,
    width: 3.5,
  },
  {
    color: PURPLE,
    from: airports["ICN"]!,
    id: "ICN-ORD",
    load: "76%",
    route: "ICN → ORD",
    to: airports["ORD"]!,
  },
];

export const FlightPaths: Story = {
  render: () => (
    <Frame>
      <Map center={[30, 25]} styles={styles} workerUrl={maplibreWorkerUrl} zoom={1.9}>
        <Map.Arc data={flights} />
        {Object.entries(airports).map(([code, position]) => (
          <Map.Marker key={code} latitude={position[1]} longitude={position[0]}>
            <Map.MarkerContent>
              <Map.MarkerDot color={BLUE} />
              <Map.MarkerLabel>{code}</Map.MarkerLabel>
            </Map.MarkerContent>
          </Map.Marker>
        ))}
        <Map.Controls>
          <Map.ZoomControl />
          <Map.CompassControl />
        </Map.Controls>
      </Map>
      <OverlayCard description="Intercontinental schedule" title="Flight network" width={260}>
        <Card.Content className="gap-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <Stat label="Routes" value={String(flights.length)} />
            <Stat label="Seats" value="1.3k" />
            <Stat label="Peak" value="93%" />
          </div>
          <div className="space-y-1">
            {flights.slice(0, 3).map((flight) => (
              <LegendRow
                key={flight.id}
                line
                color={flight.color!}
                label={flight.route}
                value={flight.load}
              />
            ))}
          </div>
        </Card.Content>
      </OverlayCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Incident monitor: clustered incidents + popup on point click
 * -----------------------------------------------------------------------------------------------*/
type Severity = "critical" | "warning" | "info";

interface Incident {
  id: string;
  owner: string;
  service: string;
  severity: Severity;
  status: string;
  title: string;
}

const incidentRows: Array<Incident & {position: MapCoordinates}> = [
  {
    id: "OPS-311",
    owner: "SRE",
    position: [139.767, 35.681],
    service: "Checkout",
    severity: "critical",
    status: "Investigating",
    title: "Payment timeouts",
  },
  {
    id: "OPS-312",
    owner: "Edge",
    position: [139.758, 35.676],
    service: "CDN",
    severity: "warning",
    status: "Mitigating",
    title: "Cache miss spike",
  },
  {
    id: "OPS-313",
    owner: "Data",
    position: [139.701, 35.659],
    service: "Events",
    severity: "info",
    status: "Monitoring",
    title: "Stream lag",
  },
  {
    id: "OPS-314",
    owner: "SRE",
    position: [139.772, 35.689],
    service: "Auth",
    severity: "critical",
    status: "Escalated",
    title: "Login failures",
  },
  {
    id: "OPS-315",
    owner: "Infra",
    position: [139.81, 35.73],
    service: "Compute",
    severity: "warning",
    status: "Assigned",
    title: "Node pressure",
  },
  {
    id: "OPS-316",
    owner: "Mobile",
    position: [139.709, 35.652],
    service: "Push",
    severity: "info",
    status: "Triaged",
    title: "Delayed pushes",
  },
  {
    id: "OPS-317",
    owner: "Edge",
    position: [139.62, 35.7],
    service: "DNS",
    severity: "warning",
    status: "Mitigating",
    title: "Resolver errors",
  },
  {
    id: "OPS-318",
    owner: "Data",
    position: [139.57, 35.76],
    service: "Warehouse",
    severity: "warning",
    status: "Assigned",
    title: "Batch overdue",
  },
  {
    id: "OPS-319",
    owner: "SRE",
    position: [139.776, 35.674],
    service: "Search",
    severity: "critical",
    status: "Investigating",
    title: "Shard offline",
  },
  {
    id: "OPS-320",
    owner: "Infra",
    position: [139.74, 35.61],
    service: "Storage",
    severity: "warning",
    status: "Mitigating",
    title: "Disk latency",
  },
  {
    id: "OPS-321",
    owner: "Mobile",
    position: [139.66, 35.58],
    service: "Sync",
    severity: "info",
    status: "Monitoring",
    title: "Retry storm",
  },
  {
    id: "OPS-322",
    owner: "Edge",
    position: [139.98, 35.76],
    service: "WAF",
    severity: "info",
    status: "Resolved",
    title: "Rule rollback",
  },
];

const severityColors: Record<Severity, string> = {critical: RED, info: BLUE, warning: ORANGE};

const incidentCollection: MapFeatureCollection<Incident> = {
  features: incidentRows.map(({position, ...incident}) => ({
    geometry: {coordinates: position, type: "Point"},
    properties: incident,
    type: "Feature",
  })),
  type: "FeatureCollection",
};

const severityCounts = (["critical", "warning", "info"] as Severity[]).map((severity) => ({
  count: incidentRows.filter((incident) => incident.severity === severity).length,
  severity,
}));

const IncidentMonitorDemo = () => {
  const [selected, setSelected] = useState<{
    incident: Incident;
    position: MapCoordinates;
  } | null>(null);

  return (
    <Frame>
      <Map
        center={[139.75, 35.68]}
        pitch={18}
        styles={styles}
        workerUrl={maplibreWorkerUrl}
        zoom={10.4}
      >
        <Map.ClusterLayer
          clusterRadius={42}
          clusterThresholds={[4, 8]}
          data={incidentCollection}
          pointColor={[
            "match",
            ["get", "severity"],
            "critical",
            RED,
            "warning",
            ORANGE,
            "info",
            BLUE,
            BLUE,
          ]}
          onPointClick={(feature, position) =>
            setSelected({incident: feature.properties, position})
          }
        />
        {selected ? (
          <Map.Popup
            closeButton
            latitude={selected.position[1]}
            longitude={selected.position[0]}
            onClose={() => setSelected(null)}
          >
            <div className="space-y-2 pr-4 text-xs">
              <div>
                <p className="font-medium">{selected.incident.title}</p>
                <p className="text-muted">{selected.incident.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <span>
                  <strong className="block text-foreground">Service</strong>
                  {selected.incident.service}
                </span>
                <span>
                  <strong className="block text-foreground">Owner</strong>
                  {selected.incident.owner}
                </span>
              </div>
              <p className="text-muted">
                {selected.incident.severity} · {selected.incident.status}
              </p>
            </div>
          </Map.Popup>
        ) : null}
        <Map.Controls>
          <Map.ZoomControl />
          <Map.FullscreenControl />
        </Map.Controls>
      </Map>
      <OverlayCard description="Tokyo operations" title="Incident monitor" width={250}>
        <Card.Content className="gap-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <Stat label="Open" value={String(incidentRows.length)} />
            <Stat label="Critical" value={String(severityCounts[0]!.count)} />
            <Stat label="Warning" value={String(severityCounts[1]!.count)} />
          </div>
          <div className="space-y-1">
            {severityCounts.map(({count, severity}) => (
              <LegendRow
                key={severity}
                capitalize
                color={severityColors[severity]}
                label={severity}
                value={String(count)}
              />
            ))}
          </div>
        </Card.Content>
      </OverlayCard>
    </Frame>
  );
};

export const IncidentMonitor: Story = {
  render: () => <IncidentMonitorDemo />,
};
