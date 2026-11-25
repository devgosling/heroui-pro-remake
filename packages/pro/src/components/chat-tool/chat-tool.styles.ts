import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const chatToolVariants = tv({
  slots: {
    approval: "chat-tool__approval",
    approvalActions: "chat-tool__approval-actions",
    args: "chat-tool__args",
    argsLabel: "chat-tool__args-label",
    base: "chat-tool",
    content: "chat-tool__content",
    contentBody: "chat-tool__content-body",
    error: "chat-tool__error",
    errorLabel: "chat-tool__error-label",
    indicator: "chat-tool__indicator",
    meta: "chat-tool__meta",
    result: "chat-tool__result",
    resultLabel: "chat-tool__result-label",
    status: "chat-tool__status",
    statusIcon: "chat-tool__status-icon",
    trigger: "chat-tool__trigger",
    triggerLabel: "chat-tool__trigger-label",
    triggerName: "chat-tool__trigger-name",
  },
  variants: {
    state: {
      "input-available": {base: "chat-tool--running"},
      "input-streaming": {base: "chat-tool--streaming"},
      "output-available": {
        base: "chat-tool--complete",
        statusIcon: "chat-tool__status-icon--complete",
      },
      "output-error": {
        base: "chat-tool--error",
        statusIcon: "chat-tool__status-icon--error",
      },
      "requires-action": {
        base: "chat-tool--requires-action",
        statusIcon: "chat-tool__status-icon--requires-action",
      },
    },
  },
});

export const chatToolGroupVariants = tv({
  slots: {
    base: "chat-tool-group",
    content: "chat-tool-group__content",
    contentBody: "chat-tool-group__content-body",
    indicator: "chat-tool-group__indicator",
    trigger: "chat-tool-group__trigger",
    triggerLabel: "chat-tool-group__trigger-label",
  },
});

export type ChatToolVariants = VariantProps<typeof chatToolVariants>;
export type ChatToolGroupVariants = VariantProps<typeof chatToolGroupVariants>;
