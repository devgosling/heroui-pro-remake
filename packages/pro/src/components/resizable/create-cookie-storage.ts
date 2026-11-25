/* -------------------------------------------------------------------------------------------------
 * createCookieStorage
 * A cookie-backed `LayoutStorage` (structurally `Pick<Storage, "getItem" | "setItem">`) for SSR apps.
 * Reads prefer the cookie and fall back to `localStorage`; writes go to both, so a server can read the
 * layout from the request cookie (`react-resizable-panels:<autoSaveId>`) and other tabs stay in sync.
 *
 * Kept free of any `react-resizable-panels` runtime import so it can be re-exported from the package
 * root without pulling the peer in.
 * -----------------------------------------------------------------------------------------------*/

export interface CookieLayoutStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface CreateCookieStorageOptions {
  /** Cookie lifetime in seconds. @default 31536000 (one year) */
  maxAge?: number;
  /** Cookie path. @default "/" */
  path?: string;
  /** Cookie SameSite policy. @default "lax" */
  sameSite?: "lax" | "strict" | "none";
  /** Adds the `Secure` attribute. Defaults to `true` on https pages. */
  secure?: boolean;
}

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;

  for (const part of document.cookie.split(";")) {
    const entry = part.trim();

    if (!entry.startsWith(prefix)) continue;

    try {
      return decodeURIComponent(entry.slice(prefix.length));
    } catch {
      return null;
    }
  }

  return null;
}

function getLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createCookieStorage(options: CreateCookieStorageOptions = {}): CookieLayoutStorage {
  const {maxAge = ONE_YEAR_IN_SECONDS, path = "/", sameSite = "lax", secure} = options;

  return {
    getItem(key) {
      const fromCookie = readCookie(key);

      if (fromCookie !== null) return fromCookie;

      try {
        return getLocalStorage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      if (typeof document !== "undefined") {
        const isSecure =
          secure ?? (typeof location !== "undefined" && location.protocol === "https:");
        const attributes = [
          `path=${path}`,
          `max-age=${maxAge}`,
          `samesite=${sameSite}`,
          isSecure ? "secure" : "",
        ]
          .filter(Boolean)
          .join("; ");

        document.cookie = `${key}=${encodeURIComponent(value)}; ${attributes}`;
      }

      try {
        getLocalStorage()?.setItem(key, value);
      } catch {
        // Storage can be full or blocked (private mode); the cookie still holds the layout.
      }
    },
  };
}
