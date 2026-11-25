import type {DropZoneFileFormatColor, DropZoneFileStatus} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {DropZoneProps} from "react-aria-components/DropZone";

import {Button, Link} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useEffect, useRef, useState} from "react";
import {isFileDropItem} from "react-aria-components/useDrop";

import {DropZone} from "./index";

type PlaygroundArgs = {
  /** Disables the area (and its trigger). */
  isDisabled: boolean;
  /** Lets the file picker select several files. */
  multiple: boolean;
  /** `accept` of the hidden input. */
  accept: string;
  /** Overrides `--drop-zone-border-style` on the root. */
  borderStyle: "dashed" | "solid" | "dotted";
};

const meta = {
  argTypes: {
    accept: {control: "text"},
    borderStyle: {control: {type: "select"}, options: ["dashed", "solid", "dotted"]},
    isDisabled: {control: "boolean"},
    multiple: {control: "boolean"},
  },
  args: {accept: "", borderStyle: "dashed", isDisabled: false, multiple: false},
  parameters: {layout: "centered"},
  title: "Pro/Forms/DropZone",
} satisfies Meta<PlaygroundArgs>;

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/* -------------------------------------------------------------------------------------------------
 * Story helpers (demo data only)
 * -----------------------------------------------------------------------------------------------*/
type DemoFile = {
  id: string;
  name: string;
  size: number;
  status?: DropZoneFileStatus;
  progress?: number;
};

const KB = 1024;
const MB = 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / KB)} KB`;

  return `${(bytes / MB).toFixed(1)} MB`;
}

const FORMAT_COLORS: Record<string, DropZoneFileFormatColor> = {
  csv: "green",
  doc: "blue",
  docx: "blue",
  gif: "green",
  jpeg: "blue",
  jpg: "blue",
  key: "orange",
  m4a: "purple",
  mov: "purple",
  mp3: "purple",
  mp4: "purple",
  pdf: "red",
  png: "green",
  ppt: "orange",
  pptx: "orange",
  svg: "green",
  webp: "green",
  xls: "green",
  xlsx: "green",
  zip: "orange",
};

function getFormat(name: string) {
  const extension = name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "";

  return {color: FORMAT_COLORS[extension] ?? "gray", format: extension.toUpperCase() || "FILE"};
}

let fileCounter = 0;

function toDemoFile(file: File, status?: DropZoneFileStatus): DemoFile {
  fileCounter += 1;

  return {
    id: `${file.name}-${fileCounter}`,
    name: file.name,
    progress: status === "uploading" ? 0 : undefined,
    size: file.size,
    status,
  };
}

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

async function readDroppedFiles(items: DropEvent["items"]) {
  return Promise.all(items.filter(isFileDropItem).map((item) => item.getFile()));
}

/** Simulates uploads: every tick, uploading files gain a random amount of progress. */
function useSimulatedUploads(
  files: DemoFile[],
  setFiles: React.Dispatch<React.SetStateAction<DemoFile[]>>,
) {
  const hasUploads = files.some((file) => file.status === "uploading");

  useEffect(() => {
    if (!hasUploads) return;

    const timer = window.setInterval(() => {
      setFiles((current) =>
        current.map((file) => {
          if (file.status !== "uploading") return file;

          const progress = Math.min(100, (file.progress ?? 0) + 4 + Math.round(Math.random() * 12));

          return progress >= 100
            ? {...file, progress: 100, status: "complete"}
            : {...file, progress};
        }),
      );
    }, 400);

    return () => window.clearInterval(timer);
  }, [hasUploads, setFiles]);
}

const FileFormat = ({name}: {name: string}) => {
  const {color, format} = getFormat(name);

  return <DropZone.FileFormatIcon color={color} format={format} />;
};

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/

/* Docs "Usage": area with icon, label, description and the default browse trigger */
export const Default: Story = {
  render: ({accept, borderStyle, isDisabled, multiple}) => (
    <DropZone
      className="w-[420px]"
      style={
        borderStyle === "dashed"
          ? undefined
          : ({"--drop-zone-border-style": borderStyle} as React.CSSProperties)
      }
    >
      <DropZone.Area isDisabled={isDisabled}>
        <DropZone.Icon />
        <DropZone.Label>Drop files here or browse your device</DropZone.Label>
        <DropZone.Description>Accepts PNG, JPG, PDF, and ZIP up to 25 MB.</DropZone.Description>
        <DropZone.Trigger>Browse Files</DropZone.Trigger>
      </DropZone.Area>
      <DropZone.Input accept={accept || undefined} multiple={multiple} />
    </DropZone>
  ),
};

const initialFileList: DemoFile[] = [
  {id: "summary", name: "Quarterly summary.pdf", progress: 100, size: 1.8 * MB, status: "complete"},
  {id: "hero", name: "Landing hero.png", progress: 42, size: 640 * KB, status: "uploading"},
  {id: "tour", name: "Product tour.mp4", size: 9.1 * MB, status: "failed"},
];

/* Area + list of complete / uploading / failed files with progress bars */
export const WithFileList: Story = {
  render: () => {
    const [files, setFiles] = useState<DemoFile[]>(initialFileList);

    useSimulatedUploads(files, setFiles);

    const addFiles = (list: File[]) =>
      setFiles((current) => [...current, ...list.map((file) => toDemoFile(file, "uploading"))]);
    const retry = (id: string) =>
      setFiles((current) =>
        current.map((file) =>
          file.id === id ? {...file, progress: 0, status: "uploading"} : file,
        ),
      );
    const remove = (id: string) => setFiles((current) => current.filter((file) => file.id !== id));

    return (
      <DropZone className="w-[480px]">
        <DropZone.Area onDrop={async (event) => addFiles(await readDroppedFiles(event.items))}>
          <DropZone.Icon />
          <DropZone.Label>Upload design files</DropZone.Label>
          <DropZone.Description>Images, documents, or clips up to 10 MB each.</DropZone.Description>
          <DropZone.Trigger>Add Files</DropZone.Trigger>
        </DropZone.Area>
        <DropZone.Input multiple onSelect={(list) => addFiles(Array.from(list))} />
        <DropZone.FileList>
          {files.map((file) => (
            <DropZone.FileItem key={file.id} status={file.status}>
              <FileFormat name={file.name} />
              <DropZone.FileInfo>
                <DropZone.FileName>{file.name}</DropZone.FileName>
                <DropZone.FileMeta>
                  {formatBytes(file.size)}
                  {file.status === "complete" ? (
                    <div className="flex items-center gap-1">
                      {" "}
                      |{" "}
                      <Icon
                        className="inline size-3 text-success"
                        icon="gravity-ui:circle-check-fill"
                      />{" "}
                      Complete
                    </div>
                  ) : null}
                  {file.status === "uploading" ? " | Uploading..." : null}
                  {file.status === "failed" ? (
                    <div className="flex items-center gap-1">
                      {" "}
                      |{" "}
                      <Icon
                        className="inline size-3 text-danger"
                        icon="gravity-ui:circle-xmark-fill"
                      />{" "}
                      <span className="text-danger">Failed</span>
                    </div>
                  ) : null}
                </DropZone.FileMeta>
                {file.status === "failed" ? (
                  <Button
                    className="mt-2 -ml-1"
                    size="sm"
                    variant="danger-soft"
                    onPress={() => retry(file.id)}
                  >
                    Try again
                  </Button>
                ) : (
                  <DropZone.FileProgress value={file.progress ?? 0}>
                    <DropZone.FileProgressTrack>
                      <DropZone.FileProgressFill />
                    </DropZone.FileProgressTrack>
                  </DropZone.FileProgress>
                )}
              </DropZone.FileInfo>
              <DropZone.FileRemoveTrigger
                aria-label={`Remove ${file.name}`}
                onPress={() => remove(file.id)}
              />
            </DropZone.FileItem>
          ))}
        </DropZone.FileList>
      </DropZone>
    );
  },
};

const initialCompactFiles: DemoFile[] = [
  {id: "mark", name: "Brand mark.svg", size: 18 * KB, status: "complete"},
  {id: "retro", name: "Sprint retro.docx", progress: 57, size: 210 * KB, status: "uploading"},
  {id: "walkthrough", name: "Walkthrough.mp4", size: 4.2 * MB, status: "failed"},
];

/* File list only: inline status icon + percentage instead of a progress bar */
export const CompactFileList: Story = {
  render: () => {
    const [files, setFiles] = useState<DemoFile[]>(initialCompactFiles);
    const remove = (id: string) => setFiles((current) => current.filter((file) => file.id !== id));

    return (
      <DropZone className="w-[480px]">
        <DropZone.FileList>
          {files.map((file) => (
            <DropZone.FileItem key={file.id} status={file.status}>
              <FileFormat name={file.name} />
              <DropZone.FileInfo>
                <DropZone.FileName>{file.name}</DropZone.FileName>
                {file.status === "failed" ? (
                  <>
                    <DropZone.FileMeta>{formatBytes(file.size)}</DropZone.FileMeta>
                    <DropZone.FileMeta>Upload interrupted, please try again</DropZone.FileMeta>
                    <Button className="mt-2 -ml-1" size="sm" variant="danger-soft">
                      Try again
                    </Button>
                  </>
                ) : (
                  <DropZone.FileMeta>
                    {formatBytes(file.size)} |{" "}
                    {file.status === "complete" ? (
                      <Icon
                        className="inline size-3 align-[-1px] text-success"
                        icon="gravity-ui:circle-check-fill"
                      />
                    ) : (
                      <Icon
                        className="inline size-3 align-[-1px]"
                        icon="gravity-ui:cloud-arrow-up-in"
                      />
                    )}{" "}
                    {file.status === "complete" ? 100 : file.progress}%
                  </DropZone.FileMeta>
                )}
              </DropZone.FileInfo>
              <DropZone.FileRemoveTrigger
                aria-label={`Remove ${file.name}`}
                onPress={() => remove(file.id)}
              />
            </DropZone.FileItem>
          ))}
        </DropZone.FileList>
      </DropZone>
    );
  },
};

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

/* Only images are accepted: the picker filters by `accept`, the area rejects other drags */
export const ImageOnly: Story = {
  render: () => (
    <DropZone className="w-[420px]">
      <DropZone.Area
        getDropOperation={(types) =>
          IMAGE_TYPES.some((type) => types.has(type)) ? "copy" : "cancel"
        }
      >
        <DropZone.Icon>
          <Icon icon="gravity-ui:picture" />
        </DropZone.Icon>
        <DropZone.Label>Drop images here</DropZone.Label>
        <DropZone.Description>PNG, JPG, GIF, WebP, or SVG files.</DropZone.Description>
        <DropZone.Trigger>Choose Images</DropZone.Trigger>
      </DropZone.Area>
      <DropZone.Input accept="image/*" />
    </DropZone>
  ),
};

const MAX_SIZE = 5 * MB;

/* Files over the limit are skipped and listed in an error message */
export const MaxSizeLimit: Story = {
  render: () => {
    const [files, setFiles] = useState<DemoFile[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);

    const addFiles = (list: File[]) => {
      const accepted = list.filter((file) => file.size <= MAX_SIZE);

      setRejected(list.filter((file) => file.size > MAX_SIZE).map((file) => file.name));
      setFiles((current) => [...current, ...accepted.map((file) => toDemoFile(file, "complete"))]);
    };
    const remove = (id: string) => setFiles((current) => current.filter((file) => file.id !== id));

    return (
      <DropZone className="w-[420px]">
        <DropZone.Area onDrop={async (event) => addFiles(await readDroppedFiles(event.items))}>
          <DropZone.Icon />
          <DropZone.Label>Attach files (5 MB max each)</DropZone.Label>
          <DropZone.Description>Any file type. Larger files are skipped.</DropZone.Description>
          <DropZone.Trigger>Select Files</DropZone.Trigger>
        </DropZone.Area>
        <DropZone.Input multiple onSelect={(list) => addFiles(Array.from(list))} />
        {rejected.length > 0 ? (
          <p className="m-0 text-[13px] text-danger">Skipped (over 5 MB): {rejected.join(", ")}</p>
        ) : null}
        {files.length > 0 ? (
          <DropZone.FileList>
            {files.map((file) => (
              <DropZone.FileItem key={file.id} status={file.status}>
                <FileFormat name={file.name} />
                <DropZone.FileInfo>
                  <DropZone.FileName>{file.name}</DropZone.FileName>
                  <DropZone.FileMeta>{formatBytes(file.size)}</DropZone.FileMeta>
                </DropZone.FileInfo>
                <DropZone.FileRemoveTrigger
                  aria-label={`Remove ${file.name}`}
                  onPress={() => remove(file.id)}
                />
              </DropZone.FileItem>
            ))}
          </DropZone.FileList>
        ) : null}
      </DropZone>
    );
  },
};

/* Several files at once: newest first, each uploads with a progress bar */
export const MultipleFiles: Story = {
  render: () => {
    const [files, setFiles] = useState<DemoFile[]>([]);

    useSimulatedUploads(files, setFiles);

    const addFiles = (list: File[]) =>
      setFiles((current) => [
        ...list.map((file) => toDemoFile(file, "uploading")).reverse(),
        ...current,
      ]);
    const remove = (id: string) => setFiles((current) => current.filter((file) => file.id !== id));

    return (
      <DropZone className="w-[480px]">
        <DropZone.Area onDrop={async (event) => addFiles(await readDroppedFiles(event.items))}>
          <DropZone.Icon />
          <DropZone.Label>Add several attachments</DropZone.Label>
          <DropZone.Description>Every format works, 50 MB max per file.</DropZone.Description>
          <DropZone.Trigger>Choose Files</DropZone.Trigger>
        </DropZone.Area>
        <DropZone.Input multiple onSelect={(list) => addFiles(Array.from(list))} />
        {files.length > 0 ? (
          <DropZone.FileList>
            {files.map((file) => (
              <DropZone.FileItem key={file.id} status={file.status}>
                <FileFormat name={file.name} />
                <DropZone.FileInfo>
                  <DropZone.FileName>{file.name}</DropZone.FileName>
                  <DropZone.FileMeta>
                    {formatBytes(file.size)} | {file.status === "complete" ? 100 : file.progress}%
                  </DropZone.FileMeta>
                  {file.status === "uploading" ? (
                    <DropZone.FileProgress value={file.progress ?? 0}>
                      <DropZone.FileProgressTrack>
                        <DropZone.FileProgressFill />
                      </DropZone.FileProgressTrack>
                    </DropZone.FileProgress>
                  ) : null}
                </DropZone.FileInfo>
                <DropZone.FileRemoveTrigger
                  aria-label={`Remove ${file.name}`}
                  onPress={() => remove(file.id)}
                />
              </DropZone.FileItem>
            ))}
          </DropZone.FileList>
        ) : null}
      </DropZone>
    );
  },
};

/* Disabled area: dimmed, no drops, trigger disabled */
export const Disabled: Story = {
  render: () => (
    <DropZone className="w-[420px]">
      <DropZone.Area isDisabled>
        <DropZone.Icon />
        <DropZone.Label>Uploads are paused</DropZone.Label>
        <DropZone.Description>
          File uploads are unavailable during maintenance.
        </DropZone.Description>
        <DropZone.Trigger>Select File</DropZone.Trigger>
      </DropZone.Area>
      <DropZone.Input />
    </DropZone>
  ),
};

/* Any glyph can replace the default upload icon */
export const CustomIcon: Story = {
  render: () => (
    <DropZone className="w-[420px]">
      <DropZone.Area>
        <DropZone.Icon>
          <Icon icon="gravity-ui:camera" />
        </DropZone.Icon>
        <DropZone.Label>Upload a team avatar</DropZone.Label>
        <DropZone.Description>Square PNG or JPG, at least 256 x 256 px.</DropZone.Description>
        <DropZone.Trigger>Choose Image</DropZone.Trigger>
      </DropZone.Area>
      <DropZone.Input accept="image/png,image/jpeg" />
    </DropZone>
  ),
};

/* Any HeroUI button or link can open the picker through the input ref */
export const CustomTriggers: Story = {
  render: () => {
    const primaryInput = useRef<HTMLInputElement>(null);
    const linkInput = useRef<HTMLInputElement>(null);
    const sheetInput = useRef<HTMLInputElement>(null);

    return (
      <div className="flex w-[480px] flex-col gap-8">
        <DropZone>
          <DropZone.Area>
            <DropZone.Icon />
            <DropZone.Label>Drop documents to begin</DropZone.Label>
            <DropZone.Description>PDF, DOCX, or TXT, 25 MB max.</DropZone.Description>
            <Button className="mt-2" onPress={() => primaryInput.current?.click()}>
              <Icon icon="gravity-ui:arrow-up-from-line" /> Upload Documents
            </Button>
          </DropZone.Area>
          <DropZone.Input ref={primaryInput} multiple />
        </DropZone>
        <DropZone>
          <DropZone.Area>
            <DropZone.Icon>
              <Icon icon="gravity-ui:paperclip" />
            </DropZone.Icon>
            <DropZone.Label>Attach reference material</DropZone.Label>
            <DropZone.Description>Any format, 10 MB limit.</DropZone.Description>
            <Link
              className="mt-1 cursor-pointer text-sm"
              onPress={() => linkInput.current?.click()}
            >
              Pick from your computer
            </Link>
          </DropZone.Area>
          <DropZone.Input ref={linkInput} />
        </DropZone>
        <DropZone>
          <DropZone.Area>
            <DropZone.Icon />
            <DropZone.Label>Import a contact list</DropZone.Label>
            <DropZone.Description>CSV or XLSX files only.</DropZone.Description>
            <Button
              className="mt-2"
              size="sm"
              variant="secondary"
              onPress={() => sheetInput.current?.click()}
            >
              Choose Sheet
            </Button>
          </DropZone.Area>
          <DropZone.Input ref={sheetInput} accept=".csv,.xlsx" />
        </DropZone>
      </div>
    );
  },
};
