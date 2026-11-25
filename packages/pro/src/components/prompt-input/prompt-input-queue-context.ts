"use client";

import type {promptInputQueueVariants} from "./prompt-input.styles";

import {createContext} from "react";

type QueueSlots = ReturnType<typeof promptInputQueueVariants>;

const PromptInputQueueContext = createContext<{slots: QueueSlots} | null>(null);

export {PromptInputQueueContext};

export type {QueueSlots};
