"use client";

import type {LayoutBox} from "./drop-zone.animations";
import type {DOMRenderProps} from "@heroui/react";
import type {ComponentPropsWithRef, Key, ReactElement, ReactNode, RefObject} from "react";

import {ProgressBar, dom} from "@heroui/react";
import {
  Children,
  Component,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {DropZone as DropZonePrimitive} from "react-aria-components/DropZone";
import {Text as TextPrimitive} from "react-aria-components/Text";

import {composeTwRenderProps, useMergedRef, useResolvedClassName} from "../../utils";

import {
  DropZoneTrashIcon,
  DropZoneUploadIcon,
  FILE_FOLD_PATH,
  FILE_SHEET_PATH,
} from "./drop-zone-icons";
import {animateEnter, animateExit, animateLayoutChange, getVisualBox} from "./drop-zone.animations";
import {dropZoneVariants} from "./drop-zone.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type DropZoneContext = {
  /** Ref of the hidden `DropZone.Input` (set once it is rendered). */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Opens the native file picker of `DropZone.Input`. */
  openFilePicker: () => void;
  slots: ReturnType<typeof dropZoneVariants>;
};

const DropZoneContext = createContext<DropZoneContext>({
  inputRef: {current: null},
  openFilePicker: () => {},
  slots: dropZoneVariants(),
});

/** Disabled state of the enclosing `DropZone.Area`, forwarded to `DropZone.Trigger`. */
const DropZoneAreaContext = createContext<{isDisabled?: boolean}>({});

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneRootProps
  extends Omit<ComponentPropsWithRef<"div">, "children">, DOMRenderProps<"div", undefined> {
  /** Area, FileList, and other sub-components. */
  children?: ReactNode;
}

const DropZoneRoot = ({children, className, ...rest}: DropZoneRootProps) => {
  const slots = useMemo(() => dropZoneVariants(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = useCallback(() => {
    const input = inputRef.current;

    if (!input) return;
    // Reset so picking the same file again still fires `change`.
    input.value = "";
    input.click();
  }, []);

  const contextValue = useMemo<DropZoneContext>(
    () => ({inputRef, openFilePicker, slots}),
    [openFilePicker, slots],
  );

  return (
    <DropZoneContext value={contextValue}>
      <dom.div {...rest} className={slots.base({className})} data-slot="drop-zone">
        {children}
      </dom.div>
    </DropZoneContext>
  );
};

DropZoneRoot.displayName = "HeroUI.DropZone";

/* -------------------------------------------------------------------------------------------------
 * Area
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneAreaProps extends ComponentPropsWithRef<typeof DropZonePrimitive> {}

const DropZoneArea = ({className, isDisabled, ...rest}: DropZoneAreaProps) => {
  const {slots} = use(DropZoneContext);
  const areaContext = useMemo(() => ({isDisabled}), [isDisabled]);

  return (
    <DropZoneAreaContext value={areaContext}>
      <DropZonePrimitive
        data-slot="drop-zone-area"
        {...rest}
        className={useResolvedClassName(className, slots.area())}
        isDisabled={isDisabled}
      />
    </DropZoneAreaContext>
  );
};

DropZoneArea.displayName = "HeroUI.DropZone.Area";

/* -------------------------------------------------------------------------------------------------
 * Icon
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneIconProps extends ComponentPropsWithRef<"span"> {}

const DropZoneIcon = ({children, className, ...rest}: DropZoneIconProps) => {
  const {slots} = use(DropZoneContext);

  return (
    <span className={slots.icon({className})} data-slot="drop-zone-icon" {...rest}>
      {children ?? <DropZoneUploadIcon />}
    </span>
  );
};

DropZoneIcon.displayName = "HeroUI.DropZone.Icon";

/* -------------------------------------------------------------------------------------------------
 * Label (RAC Text with slot="label": labels the drop target button of the area)
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneLabelProps extends ComponentPropsWithRef<typeof TextPrimitive> {}

const DropZoneLabel = ({className, ...rest}: DropZoneLabelProps) => {
  const {slots} = use(DropZoneContext);

  return (
    <TextPrimitive
      className={slots.label({className})}
      data-slot="drop-zone-label"
      slot="label"
      {...rest}
    />
  );
};

DropZoneLabel.displayName = "HeroUI.DropZone.Label";

/* -------------------------------------------------------------------------------------------------
 * Description
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneDescriptionProps extends ComponentPropsWithRef<"span"> {}

const DropZoneDescription = ({className, ...rest}: DropZoneDescriptionProps) => {
  const {slots} = use(DropZoneContext);

  return (
    <span className={slots.description({className})} data-slot="drop-zone-description" {...rest} />
  );
};

DropZoneDescription.displayName = "HeroUI.DropZone.Description";

/* -------------------------------------------------------------------------------------------------
 * Input (hidden native file input)
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneInputProps extends Omit<
  ComponentPropsWithRef<"input">,
  "type" | "onSelect" | "children"
> {
  /** Accepted file types (e.g. `"image/*,.pdf"`). */
  accept?: string;
  /** Whether multiple files can be selected. */
  multiple?: boolean;
  /** Called when files are selected via the file picker. */
  onSelect?: (files: FileList) => void;
}

const DropZoneInput = ({className, onChange, onSelect, ref, ...rest}: DropZoneInputProps) => {
  const {inputRef, slots} = use(DropZoneContext);
  const mergedRef = useMergedRef(ref, inputRef);

  return (
    <input
      className={slots.input({className})}
      data-slot="drop-zone-input"
      tabIndex={-1}
      {...rest}
      ref={mergedRef}
      type="file"
      onChange={(event) => {
        onChange?.(event);
        if (event.currentTarget.files) onSelect?.(event.currentTarget.files);
      }}
    />
  );
};

DropZoneInput.displayName = "HeroUI.DropZone.Input";

/* -------------------------------------------------------------------------------------------------
 * Trigger (browse button)
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const DropZoneTrigger = ({
  children,
  className,
  isDisabled,
  onPress,
  ...rest
}: DropZoneTriggerProps) => {
  const {openFilePicker, slots} = use(DropZoneContext);
  const area = use(DropZoneAreaContext);

  return (
    <ButtonPrimitive
      data-slot="drop-zone-trigger"
      {...rest}
      className={useResolvedClassName(className, slots.trigger())}
      isDisabled={isDisabled ?? area.isDisabled}
      onPress={(event) => {
        onPress?.(event);
        openFilePicker();
      }}
    >
      {children ?? "Select files"}
    </ButtonPrimitive>
  );
};

DropZoneTrigger.displayName = "HeroUI.DropZone.Trigger";

/* -------------------------------------------------------------------------------------------------
 * File list presence (keeps removed items mounted while they fade out)
 * -----------------------------------------------------------------------------------------------*/
type FilePresence = {
  /** Play the enter animation on mount (false for items rendered with the list). */
  animateOnMount: boolean;
  isPresent: boolean;
  onExitComplete: () => void;
};

const DropZoneFilePresenceContext = createContext<FilePresence | null>(null);

type PresenceEntry = {
  element: ReactElement;
  isInitial: boolean;
  isPresent: boolean;
  key: Key;
};

function toEntries(children: ReactNode, isInitial: boolean): PresenceEntry[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((element) => ({element, isInitial, isPresent: true, key: element.key ?? ""}));
}

function mergeEntries(previous: PresenceEntry[], children: ReactNode): PresenceEntry[] {
  const previousByKey = new Map(previous.map((entry) => [entry.key, entry]));
  const next = toEntries(children, false).map((entry) => ({
    ...entry,
    // Items that were already shown keep their "initial" flag so they never replay the enter.
    isInitial: previousByKey.get(entry.key)?.isInitial ?? false,
  }));
  const nextKeys = new Set(next.map((entry) => entry.key));

  previous.forEach((entry, index) => {
    if (nextKeys.has(entry.key)) return;
    next.splice(Math.min(index, next.length), 0, {...entry, isPresent: false});
  });

  return next;
}

const PresenceChild = ({
  entry,
  onExitComplete,
}: {
  entry: PresenceEntry;
  onExitComplete: (key: Key) => void;
}) => {
  const {element, isInitial, isPresent, key} = entry;
  const handleExitComplete = useCallback(() => onExitComplete(key), [key, onExitComplete]);
  const value = useMemo<FilePresence>(
    () => ({animateOnMount: !isInitial, isPresent, onExitComplete: handleExitComplete}),
    [handleExitComplete, isInitial, isPresent],
  );

  return <DropZoneFilePresenceContext value={value}>{element}</DropZoneFilePresenceContext>;
};

type ItemBoxes = {
  /** Layout box (independent of transforms on the item). */
  layout: LayoutBox;
  /** Where the item is drawn: the layout box with a running layout animation applied. */
  visual: LayoutBox;
};

/** Boxes (page coordinates) of the list children. */
function measureListItems(list: HTMLElement) {
  const boxes = new Map<HTMLElement, ItemBoxes>();
  const listRect = list.getBoundingClientRect();
  const originLeft = listRect.left + window.scrollX;
  const originTop = listRect.top + window.scrollY;

  for (const child of Array.from(list.children)) {
    if (!(child instanceof HTMLElement)) continue;

    // A static list shares its offset parent with its children; a positioned list is the parent.
    const sharesOffsetParent = child.offsetParent !== list;
    const left = sharesOffsetParent ? child.offsetLeft - list.offsetLeft : child.offsetLeft;
    const top = sharesOffsetParent ? child.offsetTop - list.offsetTop : child.offsetTop;
    const layout: LayoutBox = {
      centerX: originLeft + left + child.offsetWidth / 2,
      centerY: originTop + top + child.offsetHeight / 2,
      height: child.offsetHeight,
      width: child.offsetWidth,
    };

    boxes.set(child, {layout, visual: getVisualBox(child, layout)});
  }

  return boxes;
}

function isSameBox(a: LayoutBox, b: LayoutBox) {
  return (
    Math.abs(a.centerX - b.centerX) < 0.5 &&
    Math.abs(a.centerY - b.centerY) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

type FileListLayoutProps = {
  children: ReactNode;
  listRef: RefObject<HTMLDivElement | null>;
};

/**
 * FLIP layout animation: measures every item right before a commit and, once the DOM is updated,
 * lets each item whose layout box changed glide from where it was drawn into its new box. Items
 * whose layout did not change keep their running animation (a re-render does not restart it).
 */
class FileListLayout extends Component<FileListLayoutProps> {
  override getSnapshotBeforeUpdate() {
    const list = this.props.listRef.current;

    return list ? measureListItems(list) : null;
  }

  override componentDidUpdate(
    _props: FileListLayoutProps,
    _state: unknown,
    snapshot: Map<HTMLElement, ItemBoxes> | null,
  ) {
    const list = this.props.listRef.current;

    if (!list || !snapshot) return;

    measureListItems(list).forEach(({layout}, child) => {
      const previous = snapshot.get(child);

      if (previous && !isSameBox(previous.layout, layout)) {
        animateLayoutChange(child, previous.visual, layout);
      }
    });
  }

  override render() {
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------------------------------
 * File List
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneFileListProps extends ComponentPropsWithRef<"div"> {}

const DropZoneFileList = ({children, className, ref, ...rest}: DropZoneFileListProps) => {
  const {slots} = use(DropZoneContext);
  const listRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, listRef);

  const [state, setState] = useState(() => ({children, entries: toEntries(children, true)}));
  let entries = state.entries;

  // Derive the rendered entries from the latest children (removed ones stay until they faded out).
  if (state.children !== children) {
    entries = mergeEntries(state.entries, children);
    setState({children, entries});
  }

  const handleExitComplete = useCallback((key: Key) => {
    setState((previous) => ({
      ...previous,
      entries: previous.entries.filter((entry) => entry.key !== key || entry.isPresent),
    }));
  }, []);

  return (
    <div
      className={slots.fileList({className})}
      data-slot="drop-zone-file-list"
      {...rest}
      ref={mergedRef}
    >
      <FileListLayout listRef={listRef}>
        {entries.map((entry) => (
          <PresenceChild key={entry.key} entry={entry} onExitComplete={handleExitComplete} />
        ))}
      </FileListLayout>
    </div>
  );
};

DropZoneFileList.displayName = "HeroUI.DropZone.FileList";

/* -------------------------------------------------------------------------------------------------
 * File Item
 * -----------------------------------------------------------------------------------------------*/
type DropZoneFileStatus = "uploading" | "complete" | "failed";

interface DropZoneFileItemProps extends ComponentPropsWithRef<"div"> {
  /** Upload status of this file item. */
  status?: DropZoneFileStatus;
}

const DropZoneFileItem = ({className, ref, status, ...rest}: DropZoneFileItemProps) => {
  const {slots} = use(DropZoneContext);
  const presence = use(DropZoneFilePresenceContext);
  const itemRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, itemRef);

  const animateOnMount = presence?.animateOnMount ?? false;
  const isPresent = presence?.isPresent ?? true;
  const onExitComplete = presence?.onExitComplete;

  useLayoutEffect(() => {
    const element = itemRef.current;

    if (!element || !animateOnMount) return;

    const animation = animateEnter(element);

    return () => animation?.cancel();
  }, [animateOnMount]);

  useEffect(() => {
    const element = itemRef.current;

    if (isPresent || !element) return;

    const animation = animateExit(element, () => onExitComplete?.());

    return () => animation?.cancel();
  }, [isPresent, onExitComplete]);

  return (
    <div
      className={slots.fileItem({className})}
      data-slot="drop-zone-file-item"
      data-status={status}
      {...rest}
      ref={mergedRef}
    />
  );
};

DropZoneFileItem.displayName = "HeroUI.DropZone.FileItem";

/* -------------------------------------------------------------------------------------------------
 * File Format Icon (sheet outline + coloured format badge)
 * -----------------------------------------------------------------------------------------------*/
type DropZoneFileFormatColor =
  "red" | "green" | "blue" | "orange" | "purple" | "gray" | (string & {});

interface DropZoneFileFormatIconProps extends Omit<ComponentPropsWithRef<"svg">, "color"> {
  /** File format label (e.g. "PDF", "JPG"). */
  format?: string;
  /** Badge color. */
  color?: DropZoneFileFormatColor;
}

const DropZoneFileFormatIcon = ({
  children,
  className,
  color = "gray",
  format,
  ...rest
}: DropZoneFileFormatIconProps) => {
  const {slots} = use(DropZoneContext);

  return (
    <svg
      aria-hidden="true"
      className={slots.fileFormatIcon({className})}
      data-slot="drop-zone-file-format-icon"
      fill="none"
      height="40"
      viewBox="0 0 32 40"
      width="32"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d={FILE_SHEET_PATH}
        fill="var(--color-surface)"
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />
      <path d={FILE_FOLD_PATH} fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      {format ? (
        <foreignObject height="40" width="32" x="0" y="0">
          <div
            className={slots.fileFormatIconBadge()}
            data-color={color}
            data-slot="drop-zone-file-format-icon-badge"
          >
            {format}
          </div>
        </foreignObject>
      ) : null}
      {children}
    </svg>
  );
};

DropZoneFileFormatIcon.displayName = "HeroUI.DropZone.FileFormatIcon";

/* -------------------------------------------------------------------------------------------------
 * File Info / Name / Meta
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneFileInfoProps extends ComponentPropsWithRef<"div"> {}

const DropZoneFileInfo = ({className, ...rest}: DropZoneFileInfoProps) => {
  const {slots} = use(DropZoneContext);

  return <div className={slots.fileInfo({className})} data-slot="drop-zone-file-info" {...rest} />;
};

DropZoneFileInfo.displayName = "HeroUI.DropZone.FileInfo";

interface DropZoneFileNameProps extends ComponentPropsWithRef<"span"> {}

const DropZoneFileName = ({className, ...rest}: DropZoneFileNameProps) => {
  const {slots} = use(DropZoneContext);

  return <span className={slots.fileName({className})} data-slot="drop-zone-file-name" {...rest} />;
};

DropZoneFileName.displayName = "HeroUI.DropZone.FileName";

interface DropZoneFileMetaProps extends ComponentPropsWithRef<"span"> {}

const DropZoneFileMeta = ({className, ...rest}: DropZoneFileMetaProps) => {
  const {slots} = use(DropZoneContext);

  return <span className={slots.fileMeta({className})} data-slot="drop-zone-file-meta" {...rest} />;
};

DropZoneFileMeta.displayName = "HeroUI.DropZone.FileMeta";

/* -------------------------------------------------------------------------------------------------
 * File Progress (HeroUI ProgressBar)
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneFileProgressProps extends ComponentPropsWithRef<typeof ProgressBar> {}

const DropZoneFileProgress = ({
  "aria-label": ariaLabel,
  children,
  className,
  size = "sm",
  ...rest
}: DropZoneFileProgressProps) => {
  const {slots} = use(DropZoneContext);
  const hasLabel = ariaLabel != null || rest["aria-labelledby"] != null;

  return (
    <ProgressBar
      aria-label={hasLabel ? ariaLabel : "Upload progress"}
      {...rest}
      className={composeTwRenderProps(className, slots.fileProgress())}
      data-slot="drop-zone-file-progress"
      size={size}
    >
      {children ?? (
        <DropZoneFileProgressTrack>
          <DropZoneFileProgressFill />
        </DropZoneFileProgressTrack>
      )}
    </ProgressBar>
  );
};

DropZoneFileProgress.displayName = "HeroUI.DropZone.FileProgress";

interface DropZoneFileProgressTrackProps extends ComponentPropsWithRef<"div"> {}

const DropZoneFileProgressTrack = (props: DropZoneFileProgressTrackProps) => (
  <ProgressBar.Track data-slot="drop-zone-file-progress-track" {...props} />
);

DropZoneFileProgressTrack.displayName = "HeroUI.DropZone.FileProgressTrack";

interface DropZoneFileProgressFillProps extends ComponentPropsWithRef<"div"> {}

const DropZoneFileProgressFill = (props: DropZoneFileProgressFillProps) => (
  <ProgressBar.Fill data-slot="drop-zone-file-progress-fill" {...props} />
);

DropZoneFileProgressFill.displayName = "HeroUI.DropZone.FileProgressFill";

/* -------------------------------------------------------------------------------------------------
 * File Retry / Remove triggers
 * -----------------------------------------------------------------------------------------------*/
interface DropZoneFileRetryTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const DropZoneFileRetryTrigger = ({
  children,
  className,
  ...rest
}: DropZoneFileRetryTriggerProps) => {
  const {slots} = use(DropZoneContext);

  return (
    <ButtonPrimitive
      data-slot="drop-zone-file-retry-trigger"
      {...rest}
      className={useResolvedClassName(className, slots.fileRetryTrigger())}
    >
      {children ?? "Retry"}
    </ButtonPrimitive>
  );
};

DropZoneFileRetryTrigger.displayName = "HeroUI.DropZone.FileRetryTrigger";

interface DropZoneFileRemoveTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const DropZoneFileRemoveTrigger = ({
  "aria-label": ariaLabel,
  children,
  className,
  ...rest
}: DropZoneFileRemoveTriggerProps) => {
  const {slots} = use(DropZoneContext);
  const hasLabel = ariaLabel != null || rest["aria-labelledby"] != null;

  return (
    <ButtonPrimitive
      aria-label={hasLabel ? ariaLabel : "Remove file"}
      data-slot="drop-zone-file-remove-trigger"
      {...rest}
      className={useResolvedClassName(className, slots.fileRemoveTrigger())}
    >
      {children ?? <DropZoneTrashIcon />}
    </ButtonPrimitive>
  );
};

DropZoneFileRemoveTrigger.displayName = "HeroUI.DropZone.FileRemoveTrigger";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  DropZoneRoot,
  DropZoneArea,
  DropZoneIcon,
  DropZoneLabel,
  DropZoneDescription,
  DropZoneInput,
  DropZoneTrigger,
  DropZoneFileList,
  DropZoneFileItem,
  DropZoneFileFormatIcon,
  DropZoneFileInfo,
  DropZoneFileName,
  DropZoneFileMeta,
  DropZoneFileProgress,
  DropZoneFileProgressTrack,
  DropZoneFileProgressFill,
  DropZoneFileRetryTrigger,
  DropZoneFileRemoveTrigger,
  DropZoneContext,
};

export type {
  DropZoneRootProps,
  DropZoneAreaProps,
  DropZoneIconProps,
  DropZoneLabelProps,
  DropZoneDescriptionProps,
  DropZoneInputProps,
  DropZoneTriggerProps,
  DropZoneFileListProps,
  DropZoneFileItemProps,
  DropZoneFileStatus,
  DropZoneFileFormatIconProps,
  DropZoneFileFormatColor,
  DropZoneFileInfoProps,
  DropZoneFileNameProps,
  DropZoneFileMetaProps,
  DropZoneFileProgressProps,
  DropZoneFileProgressTrackProps,
  DropZoneFileProgressFillProps,
  DropZoneFileRetryTriggerProps,
  DropZoneFileRemoveTriggerProps,
};
