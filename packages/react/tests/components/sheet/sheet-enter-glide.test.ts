import {
  SHEET_ENTER_GLIDING_ATTRIBUTE,
  installSheetEnterGlide,
} from "@/components/sheet/sheet-enter-glide";
import {SHEET_ENTER_MS} from "@/components/sheet/sheet.utils";

// The glide only replaces React Aria's smooth entrance scroll. Real scroll physics, snapping and the
// backdrop timeline are covered by the browser suite; here scroll geometry is a plain number.
const VIEWPORT = 800;
const SHEET_HEIGHT = 300;
const REST = VIEWPORT; // bottom sheets rest one viewport into the scroll container

const createSheet = () => {
  const scroller = document.createElement("div");
  const content = document.createElement("div");
  let scrollTop = 0;

  scroller.setAttribute("data-sheet-scroll", "");
  content.setAttribute("data-sheet-content", "");
  scroller.append(content);
  document.body.append(scroller);
  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
  // At rest the sheet's top sits SHEET_HEIGHT above the bottom edge; scrolling less moves it down.
  content.getBoundingClientRect = () => {
    const top = VIEWPORT - SHEET_HEIGHT + (REST - scrollTop);

    return DOMRect.fromRect({height: SHEET_HEIGHT, width: 400, x: 0, y: top});
  };

  return {content, scroller};
};

describe("Sheet", () => {
  describe("enter glide", () => {
    let frames: FrameRequestCallback[];
    let now: number;
    let nativeScrollTo: ReturnType<typeof vi.fn>;
    let reducedMotion: boolean;

    const flushFrames = (until: number) => {
      while (frames.length > 0 && now < until) {
        now += 16;
        frames.shift()!(now);
      }
    };

    beforeEach(() => {
      frames = [];
      now = 1000;
      reducedMotion = false;
      nativeScrollTo = vi.fn();
      vi.spyOn(performance, "now").mockImplementation(() => now);
      vi.stubGlobal(
        "requestAnimationFrame",
        vi.fn((callback: FrameRequestCallback) => frames.push(callback)),
      );
      vi.stubGlobal("cancelAnimationFrame", vi.fn());
      vi.stubGlobal("innerHeight", VIEWPORT);
      vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({matches: reducedMotion})),
      );
      Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: nativeScrollTo,
      });
    });
    afterEach(() => {
      document.body.innerHTML = "";
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it("supports a glide that starts at the visible edge and ends with one scrollend", () => {
      const {scroller} = createSheet();
      const onScrollEnd = vi.fn();

      installSheetEnterGlide(scroller, () => true);
      scroller.addEventListener("scrollend", onScrollEnd);
      scroller.scrollTo({behavior: "smooth", top: REST});

      // Skips the hidden part of the way: the sheet's top starts at the bottom edge.
      expect(scroller.scrollTop).toBe(REST - SHEET_HEIGHT);
      expect(scroller).toHaveAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
      expect(nativeScrollTo).not.toHaveBeenCalled();

      // Scrolling the container mid-glide must not end React Aria's enter early.
      flushFrames(1000 + SHEET_ENTER_MS / 2);
      scroller.dispatchEvent(new Event("scrollend"));
      expect(onScrollEnd).not.toHaveBeenCalled();
      expect(scroller.scrollTop).toBeGreaterThan(REST - SHEET_HEIGHT);
      expect(scroller.scrollTop).toBeLessThan(REST);

      flushFrames(1000 + SHEET_ENTER_MS + 32);
      expect(scroller.scrollTop).toBe(REST);
      expect(scroller).not.toHaveAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
      expect(onScrollEnd).toHaveBeenCalledTimes(1);
    });

    it("supports interruption by a pointer, handing the rest to the native smooth scroll", () => {
      const {scroller} = createSheet();

      installSheetEnterGlide(scroller, () => true);
      scroller.scrollTo({behavior: "smooth", top: REST});
      flushFrames(1000 + 48);
      scroller.dispatchEvent(new Event("pointerdown"));

      expect(scroller).not.toHaveAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
      expect(nativeScrollTo).toHaveBeenCalledExactlyOnceWith({behavior: "smooth", top: REST});
    });

    it.each([
      {case: "instant scroll", isOpen: true, options: {top: REST}, reduced: false, visible: false},
      {
        case: "reduced motion",
        isOpen: true,
        options: {behavior: "smooth", top: REST},
        reduced: true,
        visible: false,
      },
      {
        case: "a visible sheet (exit or detent change)",
        isOpen: true,
        options: {behavior: "smooth", top: 0},
        reduced: false,
        visible: true,
      },
      {
        case: "a closed sheet",
        isOpen: false,
        options: {behavior: "smooth", top: REST},
        reduced: false,
        visible: false,
      },
    ] as const)("supports keeping the native scroll for $case", (scenario) => {
      const {scroller} = createSheet();

      reducedMotion = scenario.reduced;
      if (scenario.visible) scroller.scrollTop = REST;
      installSheetEnterGlide(scroller, () => scenario.isOpen);
      scroller.scrollTo(scenario.options);

      expect(nativeScrollTo).toHaveBeenCalledExactlyOnceWith(scenario.options);
      expect(scroller).not.toHaveAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
      expect(frames).toHaveLength(0);
    });

    it("supports cleanup that restores the element's own scrollTo", () => {
      const {scroller} = createSheet();
      const cleanup = installSheetEnterGlide(scroller, () => true);

      scroller.scrollTo({behavior: "smooth", top: REST});
      cleanup();

      expect(scroller).not.toHaveAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
      expect(Object.hasOwn(scroller, "scrollTo")).toBe(false);
      scroller.scrollTo({behavior: "smooth", top: REST});
      expect(nativeScrollTo).toHaveBeenCalledTimes(1);
    });
  });
});
