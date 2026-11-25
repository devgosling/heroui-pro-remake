import {Lexer} from "marked";

/**
 * Splits a markdown string into top-level blocks (one per `marked` lexer token).
 *
 * Every token is kept, including whitespace-only `space` tokens, so block indexes stay stable while
 * a response streams in: appending text only ever changes the last block(s), and every block before
 * them keeps the same index (and therefore the same React key and memoized output).
 */
export function parseMarkdownIntoBlocks(markdown: string): string[] {
  if (!markdown) return [];

  return Lexer.lex(markdown, {gfm: true}).map((token) => token.raw);
}
