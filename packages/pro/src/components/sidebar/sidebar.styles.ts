import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const sidebarVariants = tv({
  defaultVariants: {
    side: "left",
    variant: "sidebar",
  },
  slots: {
    base: "sidebar",
    content: "sidebar__content",
    footer: "sidebar__footer",
    group: "sidebar__group",
    groupLabel: "sidebar__group-label",
    header: "sidebar__header",
    main: "sidebar__main",
    menu: "sidebar__menu",
    menuAction: "sidebar__menu-action",
    menuActions: "sidebar__menu-actions",
    menuChip: "sidebar__menu-chip",
    menuHeader: "sidebar__menu-header",
    menuIcon: "sidebar__menu-icon",
    menuIndicator: "sidebar__menu-indicator",
    menuItem: "sidebar__menu-item",
    menuItemContent: "sidebar__menu-item-content",
    menuLabel: "sidebar__menu-label",
    menuLabelText: "sidebar__menu-label-text",
    menuSection: "sidebar__menu-section",
    menuTrigger: "sidebar__menu-trigger",
    mobile: "sidebar__mobile",
    mobileDialog: "sidebar__mobile-dialog",
    mobileOverlayContainer: "sidebar__mobile-overlay-container",
    mobileSheet: "sidebar__mobile-sheet",
    offcanvasWrapper: "sidebar__offcanvas-wrapper",
    page: "sidebar__page",
    pages: "sidebar__pages",
    provider: "sidebar__provider",
    rail: "sidebar__rail",
    separator: "sidebar__separator",
  },
  variants: {
    side: {
      left: {base: "sidebar--left"},
      right: {base: "sidebar--right"},
    },
    variant: {
      floating: {base: "sidebar--floating"},
      inset: {base: "sidebar--inset"},
      sidebar: {base: "sidebar--default"},
    },
  },
});

export type SidebarVariants = VariantProps<typeof sidebarVariants>;
