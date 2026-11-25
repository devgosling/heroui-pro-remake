"use client";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export interface UseSidebarPagesReturn {
  /** The value of the currently active page. */
  activeValue: string;
  /** Switch to a page by its value. */
  setActiveValue: (value: string) => void;
  /** Index of the active page within `order`. */
  activeIndex: number;
  /** Ordered list of page values, derived from the `Sidebar.Page` children. */
  order: string[];
}

export const SidebarPagesContext = createContext<UseSidebarPagesReturn | null>(null);

/** Whether the nearest `Sidebar.Pages` switches pages without the slide animation. */
export const SidebarPagesReducedMotionContext = createContext(false);

/** Reads and controls the nearest `Sidebar.Pages`. Must be used within `Sidebar.Pages`. */
export function useSidebarPages(): UseSidebarPagesReturn {
  const context = use(SidebarPagesContext);

  if (!context) throw new Error("useSidebarPages must be used within <Sidebar.Pages>.");

  return context;
}
