import type {ComponentType, ReactNode} from "react";

/* -------------------------------------------------------------------------------------------------
 * Minimal CSF (Storybook) types - just what the showcase renders
 * -----------------------------------------------------------------------------------------------*/
type Args = Record<string, unknown>;

export interface StoryContext {
  args: Args;
  argTypes: Record<string, unknown>;
  globals: Record<string, unknown>;
  parameters: Record<string, unknown>;
  name: string;
  id: string;
}

type Decorator = (Story: ComponentType, context: StoryContext) => ReactNode;

interface CsfStoryAnnotations {
  args?: Args;
  parameters?: Record<string, unknown>;
  decorators?: Decorator[];
}

/** CSF3 story object. */
export interface CsfStoryObject extends CsfStoryAnnotations {
  name?: string;
  render?: (args: Args, context: StoryContext) => ReactNode;
}

/** CSF2 story: the export is the render function itself (annotations hang off the function). */
export type CsfStoryFunction = ((args: Args, context: StoryContext) => ReactNode) &
  CsfStoryAnnotations & {storyName?: string};

export type CsfStory = CsfStoryObject | CsfStoryFunction;

export interface CsfMeta extends CsfStoryObject {
  title?: string;
  component?: ComponentType<Args>;
  excludeStories?: string[] | RegExp;
}

export type CsfModule = {default?: CsfMeta} & Record<string, unknown>;

/* -------------------------------------------------------------------------------------------------
 * Story discovery
 * Raw sources are read eagerly (cheap) to know which components exist, how many variants they
 * have and in which order the stories are declared; modules are loaded lazily per page.
 * -----------------------------------------------------------------------------------------------*/
const sources = import.meta.glob<string>("../../../packages/pro/src/components/*/*.stories.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

const loaders = import.meta.glob<CsfModule>("../../../packages/pro/src/components/*/*.stories.tsx");

const slugFromPath = (path: string) => path.split("/").at(-2) ?? path;

const exportOrder = (source: string) => {
  const names: string[] = [];
  // CSF stories are named exports: `export const Story = ...` or `export function Story() {}`.
  const pattern = /^export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/gm;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) names.push(match[1]!);

  return names;
};

export interface StoryFileInfo {
  slug: string;
  path: string;
  storyNames: string[];
  load: () => Promise<CsfModule>;
}

export const STORY_FILES: Record<string, StoryFileInfo> = Object.fromEntries(
  Object.entries(sources).map(([path, source]) => {
    const slug = slugFromPath(path);

    return [slug, {load: loaders[path]!, path, slug, storyNames: exportOrder(source)}];
  }),
);

/* -------------------------------------------------------------------------------------------------
 * Standard (open-source) HeroUI components - grouped by their Storybook title
 * "Components/<Category>/<Name>"
 * -----------------------------------------------------------------------------------------------*/
const ossSources = import.meta.glob<string>(
  "../../../packages/react/src/components/*/*.stories.tsx",
  {eager: true, import: "default", query: "?raw"},
);

const ossLoaders = import.meta.glob<CsfModule>(
  "../../../packages/react/src/components/*/*.stories.tsx",
);

export interface OssStoryFile extends StoryFileInfo {
  id: string;
  name: string;
  category: string;
}

const kebab = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

export const OSS_FILES: OssStoryFile[] = Object.entries(ossSources)
  .map(([path, source]) => {
    const title = /title:\s*["'](Components\/[^"']+)["']/.exec(source)?.[1] ?? "";
    const segments = title.split("/").slice(1);
    const name = segments.at(-1) ?? slugFromPath(path);
    const category = segments.length > 1 ? segments[0]! : "Other";
    const fileBase = path.split("/").at(-1)!.replace(".stories.tsx", "");

    return {
      category,
      id: kebab(fileBase),
      load: ossLoaders[path]!,
      name: name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
      path,
      slug: slugFromPath(path),
      storyNames: exportOrder(source),
    };
  })
  .filter((file) => file.storyNames.length > 0)
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

export const OSS_CATEGORIES = [...new Set(OSS_FILES.map((file) => file.category))];

/** "WithChartBottom" -> "With Chart Bottom" (Storybook's default story naming). */
export const storyLabel = (exportName: string) =>
  exportName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
