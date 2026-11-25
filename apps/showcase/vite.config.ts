import type {Plugin} from "vite";

import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

import {default as tailwindcss} from "@tailwindcss/vite";
import {default as react} from "@vitejs/plugin-react";
import {defineConfig} from "vite";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The stories live outside this app's root (packages/pro, packages/react). Vite only watches its
 * root, so story files created later would never reach the import.meta.glob lists. Watch the
 * package sources too, so new components show up without restarting the server.
 */
const watchPackageStories = (): Plugin => ({
  configureServer(server) {
    server.watcher.add([
      resolve(here, "../../packages/pro/src"),
      resolve(here, "../../packages/react/src/components"),
    ]);
  },
  name: "showcase:watch-package-stories",
});

export default defineConfig({
  plugins: [react(), tailwindcss(), watchPackageStories()],
  resolve: {
    // Stories live in packages/pro and resolve React from there; keep a single instance.
    dedupe: ["react", "react-dom", "react-aria-components", "@heroui/react", "@heroui/styles"],
  },
  server: {
    host: "127.0.0.1",
    port: 5180,
  },
});
