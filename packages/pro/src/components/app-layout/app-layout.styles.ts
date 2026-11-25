import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * AppLayout parts. The root element is the internal `Sidebar.Provider` (`.sidebar__provider`
 * with `[data-app-layout]`), so there is no `app-layout` block class on it.
 */
export const appLayoutVariants = tv({
  slots: {
    aside: "app-layout__aside",
    asidePanel: "app-layout__aside-panel",
    asideTrigger: "app-layout__aside-trigger",
    body: "app-layout__body",
    footer: "app-layout__footer",
    header: "app-layout__header",
    main: "app-layout__main",
    mainPanel: "app-layout__main-panel",
    menuToggle: "app-layout__menu-toggle",
    mobileAside: "app-layout__mobile-aside",
    mobileAsideDialog: "app-layout__mobile-aside-dialog",
    mobileAsideSheet: "app-layout__mobile-aside-sheet",
    resizable: "app-layout__resizable",
    sidebarPanel: "app-layout__sidebar-panel",
    toolbar: "app-layout__toolbar",
  },
});

export type AppLayoutVariants = VariantProps<typeof appLayoutVariants>;
