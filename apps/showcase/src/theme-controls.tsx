import {Segment} from "@heroui/pro";
import {Icon} from "@iconify/react";
import {useEffect, useState} from "react";

/* -------------------------------------------------------------------------------------------------
 * Theme state (applied as CSS variables, exactly how a HeroUI app would theme itself)
 * -----------------------------------------------------------------------------------------------*/
const ACCENTS = [
  {label: "Blau (Standard)", value: ""},
  {label: "Violett", value: "oklch(0.58 0.22 293)"},
  {label: "Grün", value: "oklch(0.63 0.17 150)"},
  {label: "Orange", value: "oklch(0.7 0.18 50)"},
  {label: "Pink", value: "oklch(0.64 0.23 350)"},
  {label: "Schwarz", value: "oklch(0.21 0.006 286)"},
];

const RADII = [
  {label: "0", value: "0rem"},
  {label: "S", value: "0.25rem"},
  {label: "M", value: "0.5rem"},
  {label: "L", value: "0.75rem"},
  {label: "XL", value: "1rem"},
];

const FONTS = [
  {label: "Inter", value: "Inter, ui-sans-serif, system-ui, sans-serif"},
  {label: "Geist", value: "Geist, ui-sans-serif, system-ui, sans-serif"},
  {label: "Manrope", value: "Manrope, ui-sans-serif, system-ui, sans-serif"},
  {label: "System", value: "ui-sans-serif, system-ui, sans-serif"},
];

interface ThemeState {
  mode: "light" | "dark";
  accent: string;
  radius: string;
  font: string;
}

const DEFAULT_THEME: ThemeState = {
  accent: "",
  font: FONTS[0]!.value,
  mode: "light",
  radius: "0.5rem",
};

const STORAGE_KEY = "heroui-pro-showcase-theme";

const readStoredTheme = (): ThemeState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    return raw ? {...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemeState>)} : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const applyTheme = (theme: ThemeState) => {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme.mode);
  root.setAttribute("data-theme", theme.mode);
  root.style.setProperty("--radius", theme.radius);
  root.style.setProperty("--font-sans", theme.font);
  if (theme.accent) root.style.setProperty("--accent", theme.accent);
  else root.style.removeProperty("--accent");
};

/* -------------------------------------------------------------------------------------------------
 * Controls
 * -----------------------------------------------------------------------------------------------*/
export const ThemeControls = () => {
  const [theme, setTheme] = useState<ThemeState>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Storage unavailable (private mode) - the theme still applies for this visit.
    }
  }, [theme]);

  const update = (patch: Partial<ThemeState>) => setTheme((current) => ({...current, ...patch}));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segment
        aria-label="Farbschema"
        selectedKey={theme.mode}
        size="sm"
        onSelectionChange={(key) => update({mode: key as ThemeState["mode"]})}
      >
        <Segment.Item aria-label="Hell" id="light">
          <Icon icon="gravity-ui:sun" />
        </Segment.Item>
        <Segment.Item aria-label="Dunkel" id="dark">
          <Icon icon="gravity-ui:moon" />
        </Segment.Item>
      </Segment>

      <div aria-label="Akzentfarbe" className="flex items-center gap-1.5" role="radiogroup">
        {ACCENTS.map((accent) => (
          <button
            key={accent.label}
            aria-checked={theme.accent === accent.value}
            aria-label={accent.label}
            className="size-5 rounded-full ring-offset-2 ring-offset-background transition-shadow aria-checked:ring-2 aria-checked:ring-foreground"
            role="radio"
            style={{background: accent.value || "oklch(0.6204 0.195 253.83)"}}
            title={accent.label}
            type="button"
            onClick={() => update({accent: accent.value})}
          />
        ))}
      </div>

      <Segment
        aria-label="Radius"
        selectedKey={theme.radius}
        size="sm"
        onSelectionChange={(key) => update({radius: String(key)})}
      >
        {RADII.map((radius) => (
          <Segment.Item key={radius.value} id={radius.value}>
            {radius.label}
          </Segment.Item>
        ))}
      </Segment>

      <Segment
        aria-label="Schrift"
        selectedKey={theme.font}
        size="sm"
        onSelectionChange={(key) => update({font: String(key)})}
      >
        {FONTS.map((font) => (
          <Segment.Item key={font.label} id={font.value}>
            {font.label}
          </Segment.Item>
        ))}
      </Segment>

      <button
        className="text-xs text-muted hover:text-foreground"
        type="button"
        onClick={() => setTheme(DEFAULT_THEME)}
      >
        Zurücksetzen
      </button>
    </div>
  );
};
