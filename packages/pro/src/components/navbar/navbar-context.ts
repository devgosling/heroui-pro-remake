"use client";

import {createContext, use} from "react";

import {navbarVariants} from "./navbar.styles";

/* -------------------------------------------------------------------------------------------------
 * Layout context (provided by AppLayout)
 * -----------------------------------------------------------------------------------------------*/
type NavbarLayoutContext = {
  /** Set by AppLayout: the layout owns positioning, so the navbar drops its own chrome. */
  isInAppLayout?: boolean;
  /** Navigation function inherited from the enclosing layout. */
  navigate?: (href: string) => void;
};

/**
 * Lets a surrounding layout (AppLayout) tell the navbar that it is embedded and hand down a
 * `navigate` function. Resolution order for navigation: `Navbar.navigate` -> this context ->
 * a React Aria `RouterProvider` -> native browser navigation.
 */
const NavbarLayoutContext = createContext<NavbarLayoutContext>({});

/* -------------------------------------------------------------------------------------------------
 * Navbar context
 * -----------------------------------------------------------------------------------------------*/
type NavbarContext = {
  slots: ReturnType<typeof navbarVariants>;
  /** Current navbar height (as passed via the `height` prop). */
  height: string;
  /** Whether the navbar is currently hidden via `hideOnScroll`. */
  isHidden: boolean;
  /** Whether the mobile menu is currently open. */
  isMenuOpen: boolean;
  /** Programmatically open / close the mobile menu. */
  setMenuOpen: (open: boolean) => void;
  /** The navigation function passed to Navbar (or inherited from AppLayout), if any. */
  navigate?: (href: string) => void;
};

const defaultSlots = navbarVariants();

const NavbarContext = createContext<NavbarContext>({
  height: "4rem",
  isHidden: false,
  isMenuOpen: false,
  setMenuOpen: () => {},
  slots: defaultSlots,
});

type UseNavbarReturn = Omit<NavbarContext, "slots">;

/** Reads and mutates navbar state from inside `Navbar`'s children. */
function useNavbar(): UseNavbarReturn {
  const {height, isHidden, isMenuOpen, navigate, setMenuOpen} = use(NavbarContext);

  return {height, isHidden, isMenuOpen, navigate, setMenuOpen};
}

export {NavbarContext, NavbarLayoutContext, useNavbar};

export type {UseNavbarReturn};
