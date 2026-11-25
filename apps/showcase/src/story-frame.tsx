import type {CsfMeta, CsfStory, StoryContext} from "./stories";
import type {ComponentType, ErrorInfo, ReactNode} from "react";

import {Icon} from "@iconify/react";
import {Component, useMemo, useState} from "react";

import {storyLabel} from "./stories";

/* -------------------------------------------------------------------------------------------------
 * Error boundary - one broken story must not take the whole page down
 * -----------------------------------------------------------------------------------------------*/
class StoryErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  override state = {error: null as Error | null};

  static getDerivedStateFromError(error: Error) {
    return {error};
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console -- surface story crashes in the dev console
    console.error(error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-danger">
          <Icon className="size-5" icon="gravity-ui:triangle-exclamation" />
          <span className="font-medium">Diese Variante konnte nicht gerendert werden.</span>
          <code className="max-w-full text-xs break-all text-muted">
            {this.state.error.message}
          </code>
        </div>
      );
    }

    return this.props.children;
  }
}

/* -------------------------------------------------------------------------------------------------
 * Renders one CSF story (render function or component + args, with decorators)
 * -----------------------------------------------------------------------------------------------*/
/** Display name: CSF3 `name`, CSF2 `storyName`, otherwise derived from the export name. */
const storyDisplayName = (story: CsfStory, exportName: string) =>
  (typeof story === "function" ? story.storyName : story.name) ?? storyLabel(exportName);

const StoryRenderer = ({
  exportName,
  meta,
  story,
}: {
  exportName: string;
  meta: CsfMeta;
  story: CsfStory;
}) => {
  const Rendered = useMemo(() => {
    const args = {...meta.args, ...story.args};
    const context: StoryContext = {
      argTypes: {},
      args,
      globals: {},
      id: exportName,
      name: storyDisplayName(story, exportName),
      parameters: {...meta.parameters, ...story.parameters},
    };
    // CSF2 stories are the render function themselves; CSF3 stories carry `render`.
    const render =
      (typeof story === "function" ? story : story.render) ??
      meta.render ??
      ((renderArgs: Record<string, unknown>) => {
        const Target = meta.component;

        return Target ? <Target {...renderArgs} /> : null;
      });

    let Current: ComponentType = function StoryBase() {
      return <>{render(args, context)}</>;
    };

    for (const decorator of [...(story.decorators ?? []), ...(meta.decorators ?? [])]) {
      const Inner: ComponentType = Current;

      Current = function StoryDecorated(): ReactNode {
        return <>{decorator(Inner, context)}</>;
      };
    }

    return Current;
  }, [exportName, meta, story]);

  return <Rendered />;
};

/* -------------------------------------------------------------------------------------------------
 * Frame
 * -----------------------------------------------------------------------------------------------*/
export const StoryFrame = ({
  exportName,
  meta,
  story,
}: {
  exportName: string;
  meta: CsfMeta;
  story: CsfStory;
}) => {
  const [renderKey, setRenderKey] = useState(0);
  const layout = (story.parameters?.["layout"] ??
    meta.parameters?.["layout"] ??
    "centered") as string;
  const label = storyDisplayName(story, exportName);
  const anchor = `story-${exportName}`;

  return (
    <section className="scroll-mt-24" id={anchor}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <a className="text-base font-semibold text-foreground hover:underline" href={`#${anchor}`}>
          {label}
        </a>
        <button
          aria-label={`${label} neu laden`}
          className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-default hover:text-foreground"
          title="Neu laden (Animationen und Zustand zurücksetzen)"
          type="button"
          onClick={() => setRenderKey((key) => key + 1)}
        >
          <Icon className="size-3.5" icon="gravity-ui:arrow-rotate-right" />
        </button>
      </div>
      <div className="rounded-[20px] border border-(--showcase-demo-border) bg-(--showcase-demo) p-2">
        {/* Each frame is its own containing block: stories written for a full-page Storybook
            canvas (absolute / fixed positioning) stay inside their frame. Portalled overlays
            (modals, popovers, toasts) render into <body> and are unaffected. */}
        <div
          className={[
            "relative isolate min-h-[220px] overflow-auto rounded-2xl bg-background [contain:layout_paint]",
            layout === "fullscreen"
              ? ""
              : layout === "padded"
                ? "p-6"
                : "flex items-center justify-center p-8",
          ].join(" ")}
        >
          <StoryErrorBoundary key={renderKey}>
            <StoryRenderer exportName={exportName} meta={meta} story={story} />
          </StoryErrorBoundary>
        </div>
      </div>
    </section>
  );
};
