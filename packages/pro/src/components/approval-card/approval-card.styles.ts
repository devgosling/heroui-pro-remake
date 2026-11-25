import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const approvalCardVariants = tv({
  slots: {
    actions: "approval-card__actions",
    base: "approval-card",
    content: "approval-card__content",
    continue: "approval-card__continue",
    continueLabel: "approval-card__continue-label",
    customInput: "approval-card__custom-input",
    dismiss: "approval-card__dismiss",
    footer: "approval-card__footer",
    header: "approval-card__header",
    option: "approval-card__option",
    optionContent: "approval-card__option-content",
    optionControl: "approval-card__option-control",
    optionDescription: "approval-card__option-description",
    optionLabel: "approval-card__option-label",
    optionList: "approval-card__option-list",
    options: "approval-card__options",
    skip: "approval-card__skip",
    skippedCount: "approval-card__skipped-count",
    step: "approval-card__step",
    stepCount: "approval-card__step-count",
    stepCountCurrent: "approval-card__step-count-current",
    steps: "approval-card__steps",
    title: "approval-card__title",
  },
});

export type ApprovalCardVariants = VariantProps<typeof approvalCardVariants>;
