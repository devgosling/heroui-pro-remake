"use client";

import type {BundledLanguage, BundledTheme, HighlighterGeneric, ShikiTransformer} from "shiki";

import {useEffect, useState} from "react";

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

export const DEFAULT_LIGHT_THEME = "github-light";
export const DEFAULT_DARK_THEME = "github-dark";

/* -------------------------------------------------------------------------------------------------
 * Shared, lazily created shiki highlighter.
 * `shiki` is only imported the first time a code block highlights something, so apps that never
 * render a CodeBlock never load it. Languages and themes are loaded on demand and cached.
 * -----------------------------------------------------------------------------------------------*/
let highlighterPromise: Promise<Highlighter> | null = null;

const PLAIN_LANGUAGES = new Set(["", "plain", "plaintext", "text", "txt"]);

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    const promise = import("shiki").then(({createHighlighter}) =>
      createHighlighter({langs: [], themes: []}),
    );

    // Allow a later retry when the dynamic import fails (offline, blocked chunk ...).
    promise.catch(() => {
      if (highlighterPromise === promise) highlighterPromise = null;
    });
    highlighterPromise = promise;
  }

  return highlighterPromise;
}

async function resolveLanguage(highlighter: Highlighter, language: string): Promise<string> {
  const lang = language.trim().toLowerCase();

  if (PLAIN_LANGUAGES.has(lang)) return "plaintext";
  if (highlighter.getLoadedLanguages().includes(lang)) return lang;

  try {
    await highlighter.loadLanguage(lang as BundledLanguage);

    return lang;
  } catch {
    // Unknown language id: render it as plain text instead of throwing.
    return "plaintext";
  }
}

async function resolveTheme(
  highlighter: Highlighter,
  theme: string,
  fallback: string,
): Promise<string> {
  if (highlighter.getLoadedThemes().includes(theme)) return theme;

  try {
    await highlighter.loadTheme(theme as BundledTheme);

    return theme;
  } catch {
    // Unknown theme id: use the default theme of the same colour scheme.
    if (!highlighter.getLoadedThemes().includes(fallback)) {
      await highlighter.loadTheme(fallback as BundledTheme);
    }

    return fallback;
  }
}

/**
 * Moves each line break into the preceding `.line` span instead of leaving bare "\n" text nodes
 * between the lines, so the markup matches HeroUI Pro's code blocks (and CSS written against it).
 */
const lineBreakTransformer: ShikiTransformer = {
  code(node) {
    const lines = node.children.filter((child): child is typeof node => child.type === "element");

    lines.forEach((line, index) => {
      if (index < lines.length - 1) line.children.push({type: "text", value: "\n"});
    });
    node.children = lines;
  },
  name: "heroui-pro:code-block-line-breaks",
};

const MAX_CACHE_ENTRIES = 200;
const htmlCache = new Map<string, string>();

const getCacheKey = (code: string, language: string, theme: string, darkTheme: string) =>
  [theme, darkTheme, language, code].join("\u0000");

/**
 * Highlights `code` with shiki and resolves with the generated `<pre class="shiki">` markup.
 * Uses shiki's dual-theme output without a default colour: every token carries `--shiki-light` and
 * `--shiki-dark` custom properties and the stylesheet picks one per colour scheme.
 */
export async function highlightCode(
  code: string,
  language = "plaintext",
  theme = DEFAULT_LIGHT_THEME,
  darkTheme = DEFAULT_DARK_THEME,
): Promise<string> {
  const cacheKey = getCacheKey(code, language, theme, darkTheme);
  const cached = htmlCache.get(cacheKey);

  if (cached !== undefined) return cached;

  const highlighter = await getHighlighter();
  const [lang, light, dark] = await Promise.all([
    resolveLanguage(highlighter, language),
    resolveTheme(highlighter, theme, DEFAULT_LIGHT_THEME),
    resolveTheme(highlighter, darkTheme, DEFAULT_DARK_THEME),
  ]);
  const html = highlighter.codeToHtml(code, {
    defaultColor: false,
    lang,
    // Whitespace stays in its own token spans (Pro's token layout) instead of merging into the next token.
    mergeWhitespaces: false,
    themes: {dark, light},
    transformers: [lineBreakTransformer],
  });

  // Keep the cache bounded: streamed AI output produces many intermediate versions.
  if (htmlCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = htmlCache.keys().next().value;

    if (oldest !== undefined) htmlCache.delete(oldest);
  }
  htmlCache.set(cacheKey, html);

  return html;
}

type HighlightState = {html: string; key: string};

/**
 * Returns the highlighted markup for `code`, or `undefined` until shiki has produced it.
 * While a newer version (e.g. streamed code) is highlighted, the previous markup is kept so the
 * block doesn't flash back to plain text.
 */
export function useHighlightedCode(
  code: string,
  language: string,
  theme: string,
  darkTheme: string,
): string | undefined {
  const key = getCacheKey(code, language, theme, darkTheme);
  const [state, setState] = useState<HighlightState | undefined>(() => {
    const html = htmlCache.get(key);

    return html === undefined ? undefined : {html, key};
  });

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, language, theme, darkTheme).then(
      (html) => {
        if (!cancelled) setState((prev) => (prev?.key === key ? prev : {html, key}));
      },
      () => {
        // Highlighting failed (e.g. shiki could not be loaded): keep the plain-text fallback.
      },
    );

    return () => {
      cancelled = true;
    };
  }, [code, darkTheme, key, language, theme]);

  // Synchronous cache hit (same code highlighted elsewhere already): no plain-text frame.
  if (state?.key !== key) {
    const cached = htmlCache.get(key);

    if (cached !== undefined) return cached;
  }

  return state?.html;
}
