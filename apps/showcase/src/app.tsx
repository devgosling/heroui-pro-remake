import type {CatalogEntry} from "./catalog";
import type {CsfMeta, CsfModule, CsfStory, OssStoryFile, StoryFileInfo} from "./stories";
import type {ReactNode} from "react";

import {Segment} from "@heroui/pro";
import {Icon} from "@iconify/react";
import {useEffect, useMemo, useState} from "react";

import {ALL_ENTRIES, CATALOG, PRO_DOCS_URL} from "./catalog";
import {OSS_CATEGORIES, OSS_FILES, STORY_FILES} from "./stories";
import {StoryFrame} from "./story-frame";
import {ThemeControls} from "./theme-controls";

/* -------------------------------------------------------------------------------------------------
 * Routing: #/<pro-slug> | #/standard/<id> | #/ | #/standard
 * -----------------------------------------------------------------------------------------------*/
type Library = "pro" | "standard";

interface Route {
  library: Library;
  id: string;
}

const readRoute = (): Route => {
  const path = window.location.hash.replace(/^#\/?/, "").split("#")[0] ?? "";

  if (path === "standard" || path.startsWith("standard/")) {
    return {id: path.slice("standard/".length), library: "standard"};
  }

  return {id: path, library: "pro"};
};

const useRoute = () => {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => {
      const next = readRoute();

      setRoute((current) => {
        if (current.id !== next.id || current.library !== next.library) window.scrollTo({top: 0});

        return next;
      });
    };

    window.addEventListener("hashchange", onHashChange);

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
};

const hrefFor = (library: Library, id = "") =>
  library === "pro" ? `#/${id}` : id ? `#/standard/${id}` : "#/standard";

/* -------------------------------------------------------------------------------------------------
 * Status helpers (Pro)
 * -----------------------------------------------------------------------------------------------*/
type Status = "done" | "partial" | "pending";

const statusOf = (entry: CatalogEntry): {status: Status; count: number} => {
  const count = STORY_FILES[entry.slug]?.storyNames.length ?? 0;

  if (count === 0) return {count, status: "pending"};

  return {count, status: count >= entry.proVariants ? "done" : "partial"};
};

const STATUS_DOT: Record<Status, string> = {
  done: "bg-success",
  partial: "bg-warning",
  pending: "bg-default-foreground/20",
};

const STATUS_LABEL: Record<Status, string> = {
  done: "Fertig",
  partial: "Teilweise",
  pending: "In Arbeit",
};

/* -------------------------------------------------------------------------------------------------
 * Sidebar
 * -----------------------------------------------------------------------------------------------*/
const NavLink = ({
  active,
  children,
  href,
  meta,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  meta?: ReactNode;
}) => (
  <a
    aria-current={active ? "page" : undefined}
    className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
      active
        ? "bg-default font-medium text-foreground"
        : "text-foreground/80 hover:bg-default/60 hover:text-foreground"
    }`}
    href={href}
  >
    <span className="flex min-w-0 items-center gap-2">{children}</span>
    {meta ? <span className="shrink-0 text-xs text-muted tabular-nums">{meta}</span> : null}
  </a>
);

const Sidebar = ({route}: {route: Route}) => {
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState<Library>(route.library);
  const normalized = query.trim().toLowerCase();

  useEffect(() => setLibrary(route.library), [route.library]);

  return (
    <nav aria-label="Komponenten" className="flex flex-col gap-5">
      <Segment
        aria-label="Bibliothek"
        className="w-full"
        selectedKey={library}
        size="sm"
        onSelectionChange={(key) => setLibrary(key as Library)}
      >
        <Segment.Item id="pro">Pro ({ALL_ENTRIES.length})</Segment.Item>
        <Segment.Item id="standard">Standard ({OSS_FILES.length})</Segment.Item>
      </Segment>

      <label className="relative block">
        <span className="sr-only">Komponente suchen</span>
        <Icon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          icon="gravity-ui:magnifier"
        />
        <input
          className="h-9 w-full rounded-xl bg-default ps-9 pe-3 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus"
          placeholder="Suchen…"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <NavLink active={route.library === library && route.id === ""} href={hrefFor(library)}>
        Übersicht
      </NavLink>

      {library === "pro"
        ? CATALOG.map((category) => {
            const items = category.items.filter((item) =>
              item.name.toLowerCase().includes(normalized),
            );

            if (!items.length) return null;

            return (
              <div key={category.name} className="flex flex-col gap-0.5">
                <span className="px-2.5 pb-1 text-xs font-medium text-muted">{category.name}</span>
                {items.map((item) => {
                  const {count, status} = statusOf(item);

                  return (
                    <NavLink
                      key={item.slug}
                      active={route.library === "pro" && route.id === item.slug}
                      href={hrefFor("pro", item.slug)}
                      meta={`${count}/${item.proVariants}`}
                    >
                      <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })
        : OSS_CATEGORIES.map((category) => {
            const items = OSS_FILES.filter(
              (file) => file.category === category && file.name.toLowerCase().includes(normalized),
            );

            if (!items.length) return null;

            return (
              <div key={category} className="flex flex-col gap-0.5">
                <span className="px-2.5 pb-1 text-xs font-medium text-muted">{category}</span>
                {items.map((file) => (
                  <NavLink
                    key={file.id}
                    active={route.library === "standard" && route.id === file.id}
                    href={hrefFor("standard", file.id)}
                    meta={file.storyNames.length}
                  >
                    <span className="truncate">{file.name}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
    </nav>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Overview
 * -----------------------------------------------------------------------------------------------*/
/** Marks components ported from HeroUI Pro Native. */
const NativeBadge = () => (
  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-soft-foreground">
    Native
  </span>
);

const Card = ({children, href}: {children: ReactNode; href: string}) => (
  <a
    className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 shadow-surface transition-transform hover:-translate-y-0.5"
    href={href}
  >
    {children}
  </a>
);

const ProOverview = () => {
  const totals = useMemo(() => {
    const statuses = ALL_ENTRIES.map(statusOf);

    return {
      done: statuses.filter((s) => s.status === "done").length,
      partial: statuses.filter((s) => s.status === "partial").length,
      pending: statuses.filter((s) => s.status === "pending").length,
      stories: statuses.reduce((sum, s) => sum + s.count, 0),
      variants: ALL_ENTRIES.reduce((sum, e) => sum + e.proVariants, 0),
    };
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">HeroUI Pro Remake</h1>
        <p className="max-w-2xl text-muted">
          Alle {ALL_ENTRIES.length} Pro-Komponenten mit ihren Varianten. Grün = alle Varianten
          vorhanden, Gelb = teilweise, Grau = noch in Arbeit. Theme, Akzentfarbe, Radius und Schrift
          oben ändern alle Komponenten gleichzeitig. Die Standard-Komponenten von HeroUI findest du
          über den Umschalter in der Seitenleiste oder{" "}
          <a className="underline" href="#/standard">
            hier
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-success-soft px-3 py-1 text-success-soft-foreground">
            {totals.done} fertig
          </span>
          <span className="rounded-full bg-warning-soft px-3 py-1 text-warning-soft-foreground">
            {totals.partial} teilweise
          </span>
          <span className="rounded-full bg-default px-3 py-1 text-default-foreground">
            {totals.pending} in Arbeit
          </span>
          <span className="rounded-full bg-default px-3 py-1 text-default-foreground tabular-nums">
            {totals.stories} / {totals.variants} Varianten
          </span>
        </div>
      </header>

      {CATALOG.map((category) => (
        <section key={category.name} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {category.items.map((item) => {
              const {count, status} = statusOf(item);

              return (
                <Card key={item.slug} href={hrefFor("pro", item.slug)}>
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {item.name}
                      {item.origin === "native" ? <NativeBadge /> : null}
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {count} / {item.proVariants} Varianten
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
                    {STATUS_LABEL[status]}
                  </span>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

const StandardOverview = () => (
  <div className="flex flex-col gap-10">
    <header className="flex flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">HeroUI Standard</h1>
      <p className="max-w-2xl text-muted">
        Alle {OSS_FILES.length} Open-Source-Komponenten von HeroUI v3 mit allen Beispielen. Sie
        nutzen dasselbe Theme wie die Pro-Komponenten.
      </p>
    </header>
    {OSS_CATEGORIES.map((category) => (
      <section key={category} className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{category}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OSS_FILES.filter((file) => file.category === category).map((file) => (
            <Card key={file.id} href={hrefFor("standard", file.id)}>
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted tabular-nums">
                {file.storyNames.length} Beispiele
              </span>
            </Card>
          ))}
        </div>
      </section>
    ))}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Component page (shared by Pro and Standard)
 * -----------------------------------------------------------------------------------------------*/
const isExcluded = (name: string, exclude: CsfMeta["excludeStories"]) =>
  Array.isArray(exclude)
    ? exclude.includes(name)
    : exclude instanceof RegExp
      ? exclude.test(name)
      : false;

const ComponentPage = ({
  badge,
  file,
  links,
  title,
}: {
  title: string;
  file?: StoryFileInfo;
  badge?: ReactNode;
  links?: ReactNode;
}) => {
  const [module, setModule] = useState<CsfModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setModule(null);
    setError(null);
    file
      ?.load()
      .then((loaded) => !cancelled && setModule(loaded))
      .catch((reason: unknown) => !cancelled && setError(String(reason)));

    return () => {
      cancelled = true;
    };
  }, [file]);

  const meta = (module?.default ?? {}) as CsfMeta;
  const storyNames = (file?.storyNames ?? []).filter(
    (name) => module && name in module && !isExcluded(name, meta.excludeStories),
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>
        {links}
        {storyNames.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {storyNames.map((name) => (
              <a
                key={name}
                className="rounded-full bg-default px-2.5 py-1 text-xs text-default-foreground hover:bg-default-hover"
                href={`#story-${name}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(`story-${name}`)?.scrollIntoView({behavior: "smooth"});
                }}
              >
                {name.replace(/([a-z0-9])([A-Z])/g, "$1 $2")}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      {!file ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-10 text-center shadow-surface">
          <Icon className="size-6 text-muted" icon="gravity-ui:hammer" />
          <span className="font-medium">Diese Komponente wird gerade nachgebaut.</span>
          <span className="text-sm text-muted">
            Sobald ihre Stories existieren, erscheinen sie hier automatisch.
          </span>
        </div>
      ) : error ? (
        <pre className="overflow-auto rounded-2xl bg-danger-soft p-4 text-xs text-danger-soft-foreground">
          {error}
        </pre>
      ) : !module ? (
        <div className="text-sm text-muted">Lade Varianten…</div>
      ) : (
        <div className="flex flex-col gap-10">
          {storyNames.map((name) => (
            <StoryFrame
              key={`${file.path}-${name}`}
              exportName={name}
              meta={meta}
              story={(module[name] ?? {}) as CsfStory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProPage = ({entry}: {entry: CatalogEntry}) => {
  const {count, status} = statusOf(entry);

  return (
    <ComponentPage
      badge={
        <>
          <span className="flex items-center gap-1.5 rounded-full bg-default px-2.5 py-0.5 text-xs text-default-foreground">
            <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
            {STATUS_LABEL[status]} · {count}/{entry.proVariants} Varianten
          </span>
          {entry.origin === "native" ? <NativeBadge /> : null}
        </>
      }
      file={STORY_FILES[entry.slug]}
      links={
        <a
          className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
          href={PRO_DOCS_URL(entry)}
          rel="noreferrer"
          target="_blank"
        >
          {entry.origin === "native"
            ? "Original in HeroUI Pro Native vergleichen (für das Web nachgebaut)"
            : "Original auf heroui.pro vergleichen"}
          <Icon className="size-3.5" icon="gravity-ui:arrow-up-right-from-square" />
        </a>
      }
      title={entry.name}
    />
  );
};

const StandardPage = ({file}: {file: OssStoryFile}) => (
  <ComponentPage
    badge={
      <span className="rounded-full bg-default px-2.5 py-0.5 text-xs text-default-foreground">
        Standard · {file.category} · {file.storyNames.length} Beispiele
      </span>
    }
    file={file}
    title={file.name}
  />
);

/* -------------------------------------------------------------------------------------------------
 * App shell
 * -----------------------------------------------------------------------------------------------*/
export const App = () => {
  const route = useRoute();
  const routeKey = `${route.library}/${route.id}`;

  let content: ReactNode;

  if (route.library === "standard") {
    const file = OSS_FILES.find((item) => item.id === route.id);

    content = file ? <StandardPage key={routeKey} file={file} /> : <StandardOverview />;
  } else {
    const entry = ALL_ENTRIES.find((item) => item.slug === route.id);

    content = entry ? <ProPage key={routeKey} entry={entry} /> : <ProOverview />;
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-separator bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <a className="flex items-center gap-2 font-semibold" href="#/">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
              <Icon className="size-4" icon="gravity-ui:layers-3-diagonal" />
            </span>
            HeroUI Pro Remake
          </a>
          <ThemeControls />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-4 md:px-6">
        <aside className="sticky top-[61px] hidden h-[calc(100dvh-61px)] w-64 shrink-0 overflow-y-auto py-6 pe-2 lg:block">
          <Sidebar route={route} />
        </aside>
        <main className="min-w-0 flex-1 py-8">
          {/* Narrow screens: the sidebar collapses into a menu */}
          <details
            key={`menu:${routeKey}`}
            className="mb-6 rounded-2xl bg-surface p-3 shadow-surface lg:hidden"
          >
            <summary className="cursor-pointer text-sm font-medium">Komponenten</summary>
            <div className="mt-4">
              <Sidebar route={route} />
            </div>
          </details>
          {content}
        </main>
      </div>
    </div>
  );
};
