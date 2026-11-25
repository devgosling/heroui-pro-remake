import {RAW_EMOJI_CATEGORIES} from "./emoji-picker.data";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/** The built-in skin tone ids. Custom tone lists may use any string id. */
export type EmojiSkinTone =
  "default" | "light" | "medium-light" | "medium" | "medium-dark" | "dark";

export interface EmojiSkinToneItem {
  /** Skin tone identifier, e.g. `"default"`, `"light"` or `"dark"`. */
  id: string;
  /** The emoji shown for this tone (the swatch and the trigger glyph). */
  emoji: string;
  /** Accessible label of the swatch. */
  label: string;
  /** The Fitzpatrick modifier applied to emoji for this tone (`""` for the default yellow). */
  modifier: string;
}

export interface EmojiItem {
  /** The emoji character (fully-qualified, without a skin tone). */
  emoji: string;
  /** The CLDR short name, e.g. `"grinning face"`. */
  name: string;
  /** CLDR search keywords that are not already part of the name. */
  keywords: string[];
  /** Id of the category the emoji belongs to. */
  category: string;
  /** Whether the emoji supports the five skin tone modifiers. */
  skinTones: boolean;
}

export interface EmojiCategory {
  /** Category identifier, e.g. `"smileys"`. */
  id: string;
  /** Human readable category label, e.g. `"Smileys & Emotion"`. */
  label: string;
  /** A representative emoji for the category navigation. */
  icon: string;
  /** The emoji of the category, in Unicode order. */
  emojis: EmojiItem[];
}

/* -------------------------------------------------------------------------------------------------
 * Skin tones
 * -----------------------------------------------------------------------------------------------*/
export const EMOJI_SKIN_TONES: EmojiSkinToneItem[] = [
  {emoji: "✋", id: "default", label: "Default", modifier: ""},
  {emoji: "✋\u{1F3FB}", id: "light", label: "Light", modifier: "\u{1F3FB}"},
  {emoji: "✋\u{1F3FC}", id: "medium-light", label: "Medium-Light", modifier: "\u{1F3FC}"},
  {emoji: "✋\u{1F3FD}", id: "medium", label: "Medium", modifier: "\u{1F3FD}"},
  {emoji: "✋\u{1F3FE}", id: "medium-dark", label: "Medium-Dark", modifier: "\u{1F3FE}"},
  {emoji: "✋\u{1F3FF}", id: "dark", label: "Dark", modifier: "\u{1F3FF}"},
];

const MODIFIER_BASE = /\p{Emoji_Modifier_Base}/u;
const HANDSHAKE = "\u{1F91D}";
const VARIATION_SELECTOR = "️";
const SKIN_TONE_MODIFIERS = /[\u{1F3FB}-\u{1F3FF}]/gu;

/**
 * Returns the emoji with the given skin tone applied. The modifier follows every modifier base
 * (dropping a trailing VS16), except the handshake inside a multi-person sequence, which matches
 * the RGI "uniform skin tone" sequences of Unicode emoji-test.txt.
 */
export function applySkinTone(
  emoji: EmojiItem | string,
  tone: string | undefined,
  tones: EmojiSkinToneItem[] = EMOJI_SKIN_TONES,
): string {
  const item = typeof emoji === "string" ? undefined : emoji;
  const value = typeof emoji === "string" ? emoji : emoji.emoji;

  if (item && !item.skinTones) return value;

  const modifier = tones.find((entry) => entry.id === tone)?.modifier;

  if (!modifier) return value;

  const codePoints = Array.from(value);
  const isSequence = codePoints.length > 1;
  let result = "";

  for (let index = 0; index < codePoints.length; index++) {
    const char = codePoints[index]!;

    result += char;

    if (MODIFIER_BASE.test(char) && !(char === HANDSHAKE && isSequence)) {
      result += modifier;
      if (codePoints[index + 1] === VARIATION_SELECTOR) index++;
    }
  }

  return result;
}

/** Removes every skin tone modifier from an emoji. */
export function stripSkinTone(emoji: string): string {
  return emoji.replace(SKIN_TONE_MODIFIERS, "");
}

/* -------------------------------------------------------------------------------------------------
 * Dataset
 * -----------------------------------------------------------------------------------------------*/
function parseEntry(entry: string, category: string): EmojiItem {
  const skinTones = entry.startsWith("~");
  const raw = skinTones ? entry.slice(1) : entry;
  const space = raw.indexOf(" ");
  const separator = raw.indexOf(";", space);
  const keywords = raw.slice(separator + 1);

  return {
    category,
    emoji: raw.slice(0, space),
    keywords: keywords ? keywords.split(" ") : [],
    name: raw.slice(space + 1, separator),
    skinTones,
  };
}

/** The built-in Unicode categories (without "Frequently Used"), in Unicode order. */
export const EMOJI_CATEGORIES: EmojiCategory[] = RAW_EMOJI_CATEGORIES.map(
  ([id, label, icon, entries]) => ({
    emojis: entries.split("|").map((entry) => parseEntry(entry, id)),
    icon,
    id,
    label,
  }),
);

/** Every built-in emoji, flattened in category order. */
export const EMOJIS: EmojiItem[] = EMOJI_CATEGORIES.flatMap((category) => category.emojis);

const EMOJI_LOOKUP = new Map<string, EmojiItem>(EMOJIS.map((item) => [item.emoji, item]));

/** Finds the dataset entry of an emoji (skin tone modifiers are ignored). */
export function getEmoji(emoji: string): EmojiItem | undefined {
  return EMOJI_LOOKUP.get(emoji) ?? EMOJI_LOOKUP.get(stripSkinTone(emoji));
}

/** The text the search filter matches against: the CLDR name followed by its keywords. */
export function getEmojiTextValue(item: EmojiItem): string {
  return item.keywords.length ? `${item.name} ${item.keywords.join(" ")}` : item.name;
}

/* -------------------------------------------------------------------------------------------------
 * Recent emoji
 * -----------------------------------------------------------------------------------------------*/
/** The "Frequently Used" category a `showRecent` grid renders first once emoji were picked. */
export const EMOJI_RECENT_CATEGORY = {icon: "\u{1F550}", id: "frequent", label: "Frequently Used"};

/** How many recent emoji the picker remembers. */
export const EMOJI_RECENT_LIMIT = 18;

const RECENT_KEY_PREFIX = "frequent:";

/** Grid key of a recent emoji (recent items repeat emoji of the categories, so keys differ). */
export function getRecentEmojiKey(emoji: string): string {
  return `${RECENT_KEY_PREFIX}${emoji}`;
}

/** Whether a grid key belongs to the "Frequently Used" row. */
export function isRecentEmojiKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(RECENT_KEY_PREFIX);
}

/** Resolves a grid key to the emoji it stands for (recent keys lose their prefix). */
export function getEmojiFromKey<K>(key: K): K | string {
  return isRecentEmojiKey(key) ? key.slice(RECENT_KEY_PREFIX.length) : key;
}

/** Moves `emoji` to the front of a recent list, keeping at most `limit` entries. */
export function pushRecentEmoji(
  recent: readonly string[],
  emoji: string,
  limit = EMOJI_RECENT_LIMIT,
): string[] {
  return [emoji, ...recent.filter((entry) => entry !== emoji)].slice(0, limit);
}
