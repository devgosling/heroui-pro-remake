import type {Meta, StoryObj} from "@storybook/react";

import {Button, TextArea, Tooltip} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useCallback, useEffect, useRef, useState} from "react";

import {ChatMessage} from "../chat-message";

import {ChatAttachment, ChatAttachmentGroup, ChatAttachmentInput} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Story assets (self-contained SVG artwork, no network)
 * -----------------------------------------------------------------------------------------------*/
const artwork = (from: string, to: string, sun: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="128" height="128" fill="url(#g)"/><circle cx="88" cy="46" r="18" fill="${sun}"/><path d="M0 98 34 66l26 22 20-14 48 34v20H0z" fill="#1f2937" opacity=".55"/><path d="M0 110 40 84l30 20 22-10 36 22v12H0z" fill="#111827" opacity=".7"/></svg>`,
  )}`;

const DUSK_ART = artwork("#f9a8d4", "#7c3aed", "#fde68a");
const LAGOON_ART = artwork("#67e8f9", "#0f766e", "#fef9c3");

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    mediaType: {
      control: {type: "select"},
      options: [undefined, "image", "video", "audio", "document", "unknown"],
    },
    mimeType: {control: "text"},
    name: {control: "text"},
    size: {control: {type: "number"}},
    src: {control: "text"},
  },
  component: ChatAttachment,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChatAttachment",
} satisfies Meta<typeof ChatAttachment>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mirrors the demo canvas: centred content with a 24px gutter (40px from `sm`). */
const Canvas = ({children}: {children: React.ReactNode}) => (
  <div className="flex min-h-dvh w-full items-center justify-center p-6 sm:p-10">{children}</div>
);

/* -------------------------------------------------------------------------------------------------
 * Default: an attachment inside a user chat message
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    mimeType: "image/svg+xml",
    name: "trail-map.svg",
    size: 318_464,
    src: DUSK_ART,
  },
  render: (args) => (
    <Canvas>
      <ChatMessage.User>
        <ChatAttachmentGroup className="mb-2">
          <ChatAttachment {...args} />
        </ChatAttachmentGroup>
        <ChatMessage.Bubble>
          <ChatMessage.Content>Can you tell where this trail starts?</ChatMessage.Content>
        </ChatMessage.Bubble>
      </ChatMessage.User>
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Composer: file picker + drag-and-drop on a prompt composer shell
 * -----------------------------------------------------------------------------------------------*/
type ComposerFile = {
  id: string;
  mimeType: string;
  name: string;
  size: number;
  src?: string;
};

let fileId = 0;

const ComposerDemo = () => {
  const [files, setFiles] = useState<ComposerFile[]>([]);
  const [message, setMessage] = useState("");
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Revoke every local preview URL when the composer unmounts.
  useEffect(
    () => () => {
      filesRef.current.forEach((file) => file.src && URL.revokeObjectURL(file.src));
    },
    [],
  );

  const addFiles = useCallback((selected: File[]) => {
    const added = selected.map((file) => ({
      id: `file-${++fileId}`,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      src: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((current) => [...current, ...added]);
  }, []);

  const removeFile = (id: string) => {
    const target = files.find((file) => file.id === id);

    if (target?.src) URL.revokeObjectURL(target.src);
    setFiles((current) => current.filter((file) => file.id !== id));
  };

  const send = () => {
    files.forEach((file) => file.src && URL.revokeObjectURL(file.src));
    setFiles([]);
    setMessage("");
  };

  const canSend = message.trim().length > 0;

  /*
   * Story-local stand-in for the Pro Prompt Input (stacked layout, primary variant): field-coloured
   * shell, attachments row, borderless textarea and a toolbar pinned to the bottom of the shell.
   * The drag highlight belongs to the prompt input shell, not to Chat Attachment.
   */
  return (
    <div className="group/composer relative w-full max-w-xl">
      <ChatAttachmentInput onFilesSelected={addFiles}>
        <ChatAttachmentInput.Dropzone
          render={(props) => (
            <div
              {...props}
              className="relative flex w-full cursor-text flex-col overflow-hidden rounded-[calc(var(--radius)*2)] [border-width:var(--border-width-field)] border-solid border-field-border bg-field transition-[background-color,border-color,box-shadow] duration-150 group-focus-within/composer:border-field-border-focus group-focus-within/composer:bg-field-focus data-[dragging=true]:border-dotted data-[dragging=true]:border-accent data-[dragging=true]:bg-accent-soft data-[dragging=true]:shadow-[0_0_0_1px_var(--accent)] motion-reduce:transition-none"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                {files.length > 0 ? (
                  <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1">
                    <ChatAttachmentGroup>
                      {files.map((file) => (
                        <ChatAttachment
                          key={file.id}
                          mimeType={file.mimeType}
                          name={file.name}
                          size={file.size}
                          src={file.src}
                        >
                          <ChatAttachment.Preview />
                          <ChatAttachment.Info />
                          <ChatAttachment.Remove onPress={() => removeFile(file.id)} />
                        </ChatAttachment>
                      ))}
                    </ChatAttachmentGroup>
                  </div>
                ) : null}
                <TextArea
                  fullWidth
                  aria-label="Message"
                  className={`mb-14 min-h-14 resize-none border-transparent bg-transparent px-3 [box-shadow:none] outline-none ${files.length > 0 ? "pt-1" : "pt-3"}`}
                  placeholder="Drop files here or describe what you need..."
                  rows={1}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
              <div className="absolute inset-x-3 bottom-3 flex cursor-default items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ChatAttachmentInput.Trigger
                    render={(triggerProps) => (
                      <Tooltip delay={300}>
                        <Button
                          {...triggerProps}
                          isIconOnly
                          aria-label="Add files"
                          variant="tertiary"
                        >
                          <Icon className="size-4" icon="gravity-ui:paperclip" />
                        </Button>
                        <Tooltip.Content>
                          <p>Add files</p>
                        </Tooltip.Content>
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="ms-auto flex items-center gap-2">
                  <Button
                    isIconOnly
                    aria-label="Send message"
                    className="shrink-0"
                    isDisabled={!canSend}
                    variant="primary"
                    onPress={send}
                  >
                    <Icon className="size-4" icon="gravity-ui:arrow-up" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        />
      </ChatAttachmentInput>
    </div>
  );
};

export const Composer: Story = {
  render: () => (
    <Canvas>
      <ComposerDemo />
    </Canvas>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Grouped: file cards and media thumbnails in one wrapping group
 * -----------------------------------------------------------------------------------------------*/
const groupedFiles: Array<{mimeType?: string; name: string; size: number; src?: string}> = [
  {mimeType: "application/pdf", name: "launch-checklist.pdf", size: 612_400},
  {mimeType: "application/zip", name: "brand-kit.zip", size: 22_334_000},
  {name: "revenue-forecast.xlsx", size: 90_112},
  {name: "meeting-notes.docx", size: 37_888},
  {name: "router.ts", size: 3_276},
  {
    mimeType: "application/pdf",
    name: "q3-board-review-presentation-final-approved-version.pdf",
    size: 3_250_585,
  },
  {mimeType: "image/png", name: "storyboard.png", size: 401_408, src: LAGOON_ART},
  {mimeType: "image/jpeg", name: "cover-photo.jpg", size: 268_288, src: DUSK_ART},
];

export const Grouped: Story = {
  render: () => (
    <Canvas>
      <ChatAttachmentGroup>
        {groupedFiles.map((file) => (
          <ChatAttachment key={file.name} {...file} />
        ))}
      </ChatAttachmentGroup>
    </Canvas>
  ),
};
