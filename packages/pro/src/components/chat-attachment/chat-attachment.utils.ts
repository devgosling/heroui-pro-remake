/* -------------------------------------------------------------------------------------------------
 * Chat Attachment helpers (pure, framework-free)
 * -----------------------------------------------------------------------------------------------*/

/** Coarse media type of an attachment (exposed as `data-media-type`). */
export type ChatAttachmentMediaType = "audio" | "document" | "image" | "unknown" | "video";

/** Fine-grained file kind. Decides which file-type icon `ChatAttachment.Icon` renders. */
export type ChatAttachmentFileKind =
  "archive" | "audio" | "code" | "document" | "file" | "image" | "pdf" | "spreadsheet" | "video";

/** Visual variant (exposed as `data-variant`): `media` thumbnail tile or horizontal `file` card. */
export type ChatAttachmentVariant = "file" | "media";

const IMAGE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "ico",
  "jfif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
]);
const VIDEO_EXTENSIONS = new Set([
  "3gp",
  "avi",
  "flv",
  "m4v",
  "mkv",
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "ogv",
  "webm",
  "wmv",
]);
const AUDIO_EXTENSIONS = new Set([
  "aac",
  "aif",
  "aiff",
  "flac",
  "m4a",
  "mid",
  "midi",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  "weba",
  "wma",
]);
const ARCHIVE_EXTENSIONS = new Set([
  "7z",
  "bz2",
  "dmg",
  "epub",
  "gz",
  "iso",
  "jar",
  "rar",
  "tar",
  "tgz",
  "xz",
  "zip",
  "zst",
]);
const SPREADSHEET_EXTENSIONS = new Set(["csv", "numbers", "ods", "tsv", "xls", "xlsm", "xlsx"]);
const CODE_EXTENSIONS = new Set([
  "astro",
  "bash",
  "c",
  "cc",
  "cjs",
  "cpp",
  "cs",
  "css",
  "dart",
  "go",
  "graphql",
  "h",
  "hpp",
  "html",
  "java",
  "js",
  "json",
  "jsx",
  "kt",
  "less",
  "lua",
  "mjs",
  "php",
  "pl",
  "py",
  "r",
  "rb",
  "rs",
  "sass",
  "scala",
  "scss",
  "sh",
  "sql",
  "svelte",
  "swift",
  "toml",
  "ts",
  "tsx",
  "vue",
  "xml",
  "yaml",
  "yml",
  "zsh",
]);
const DOCUMENT_EXTENSIONS = new Set([
  "doc",
  "docx",
  "key",
  "md",
  "mdx",
  "odp",
  "odt",
  "pages",
  "ppt",
  "pptx",
  "rtf",
  "txt",
]);

const ARCHIVE_MIME = /zip|compressed|x-tar|gzip|x-bzip|x-xz|x-7z|x-rar|vnd\.rar|zstd/;
const SPREADSHEET_MIME = /spreadsheet|ms-excel|text\/csv|tab-separated-values/;
const CODE_MIME =
  /json|javascript|ecmascript|typescript|^text\/html|^text\/css|^(text|application)\/xml$|\+xml$|x-sh$|x-shellscript|x-python|x-java|x-csrc|x-c$|x-c\+\+|x-ruby|x-rust|x-go$|yaml|toml|x-sql|graphql/;
const DOCUMENT_MIME =
  /msword|wordprocessing|presentation|powerpoint|opendocument\.text|rtf|^text\//;

function normalizeMime(mimeType?: string): string {
  return (mimeType ?? "").split(";")[0]!.trim().toLowerCase();
}

function getExtension(name?: string): string {
  if (!name) return "";

  const clean = name.split(/[?#]/)[0] ?? "";
  const dot = clean.lastIndexOf(".");

  if (dot < 0 || dot === clean.length - 1) return "";

  return clean.slice(dot + 1).toLowerCase();
}

/**
 * Resolves the file kind used to pick the file-type icon. Each kind is checked in order
 * (pdf, image, video, audio, archive, spreadsheet, code, document) against the MIME type and
 * the file extension of `name`; falls back to `"file"` (generic icon).
 */
export function inferChatAttachmentFileKind(
  mimeType?: string,
  name?: string,
): ChatAttachmentFileKind {
  const mime = normalizeMime(mimeType);
  const ext = getExtension(name);

  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)) return "image";
  if (mime.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) return "video";
  if (mime.startsWith("audio/") || AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (ARCHIVE_MIME.test(mime) || ARCHIVE_EXTENSIONS.has(ext)) return "archive";
  if (SPREADSHEET_MIME.test(mime) || SPREADSHEET_EXTENSIONS.has(ext)) return "spreadsheet";
  if (CODE_MIME.test(mime) || CODE_EXTENSIONS.has(ext)) return "code";
  if (DOCUMENT_MIME.test(mime) || DOCUMENT_EXTENSIONS.has(ext)) return "document";

  return "file";
}

/**
 * Resolves the coarse media type. A MIME type decides on its own (`image/*`, `video/*`,
 * `audio/*`, anything else is a `document`); without one only image, video and audio file
 * extensions are recognised, everything else is `unknown`.
 */
export function inferChatAttachmentMediaType(
  mimeType?: string,
  name?: string,
): ChatAttachmentMediaType {
  const mime = normalizeMime(mimeType);

  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";

    return "document";
  }

  const ext = getExtension(name);

  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";

  return "unknown";
}

/**
 * Formats a byte count for display (base 1024): bytes and kilobytes are rounded to whole numbers,
 * megabytes and gigabytes keep one decimal (`"512 B"`, `"805 KB"`, `"1.0 MB"`, `"2.3 GB"`).
 * Returns `undefined` when the size is missing or invalid.
 */
export function formatChatAttachmentSize(bytes?: number): string | undefined {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return undefined;

  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;

  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
