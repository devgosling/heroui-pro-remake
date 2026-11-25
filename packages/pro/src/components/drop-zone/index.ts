import type {ComponentProps} from "react";

import {
  DropZoneArea,
  DropZoneDescription,
  DropZoneFileFormatIcon,
  DropZoneFileInfo,
  DropZoneFileItem,
  DropZoneFileList,
  DropZoneFileMeta,
  DropZoneFileName,
  DropZoneFileProgress,
  DropZoneFileProgressFill,
  DropZoneFileProgressTrack,
  DropZoneFileRemoveTrigger,
  DropZoneFileRetryTrigger,
  DropZoneIcon,
  DropZoneInput,
  DropZoneLabel,
  DropZoneRoot,
  DropZoneTrigger,
} from "./drop-zone";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DropZone = Object.assign(DropZoneRoot, {
  Area: DropZoneArea,
  Description: DropZoneDescription,
  FileFormatIcon: DropZoneFileFormatIcon,
  FileInfo: DropZoneFileInfo,
  FileItem: DropZoneFileItem,
  FileList: DropZoneFileList,
  FileMeta: DropZoneFileMeta,
  FileName: DropZoneFileName,
  FileProgress: DropZoneFileProgress,
  FileProgressFill: DropZoneFileProgressFill,
  FileProgressTrack: DropZoneFileProgressTrack,
  FileRemoveTrigger: DropZoneFileRemoveTrigger,
  FileRetryTrigger: DropZoneFileRetryTrigger,
  Icon: DropZoneIcon,
  Input: DropZoneInput,
  Label: DropZoneLabel,
  Root: DropZoneRoot,
  Trigger: DropZoneTrigger,
});

export type DropZone = {
  Props: ComponentProps<typeof DropZoneRoot>;
  RootProps: ComponentProps<typeof DropZoneRoot>;
  AreaProps: ComponentProps<typeof DropZoneArea>;
  IconProps: ComponentProps<typeof DropZoneIcon>;
  LabelProps: ComponentProps<typeof DropZoneLabel>;
  DescriptionProps: ComponentProps<typeof DropZoneDescription>;
  InputProps: ComponentProps<typeof DropZoneInput>;
  TriggerProps: ComponentProps<typeof DropZoneTrigger>;
  FileListProps: ComponentProps<typeof DropZoneFileList>;
  FileItemProps: ComponentProps<typeof DropZoneFileItem>;
  FileFormatIconProps: ComponentProps<typeof DropZoneFileFormatIcon>;
  FileInfoProps: ComponentProps<typeof DropZoneFileInfo>;
  FileNameProps: ComponentProps<typeof DropZoneFileName>;
  FileMetaProps: ComponentProps<typeof DropZoneFileMeta>;
  FileProgressProps: ComponentProps<typeof DropZoneFileProgress>;
  FileProgressTrackProps: ComponentProps<typeof DropZoneFileProgressTrack>;
  FileProgressFillProps: ComponentProps<typeof DropZoneFileProgressFill>;
  FileRetryTriggerProps: ComponentProps<typeof DropZoneFileRetryTrigger>;
  FileRemoveTriggerProps: ComponentProps<typeof DropZoneFileRemoveTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./drop-zone";

export type {
  DropZoneRootProps,
  DropZoneRootProps as DropZoneProps,
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
} from "./drop-zone";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dropZoneVariants, type DropZoneVariants} from "./drop-zone.styles";
