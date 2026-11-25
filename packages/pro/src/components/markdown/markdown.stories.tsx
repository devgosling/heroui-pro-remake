import type {Meta, StoryObj} from "@storybook/react";

import React, {useEffect, useState} from "react";
import {Streamdown} from "streamdown";

import {Markdown, StreamMarkdown, StreamMarkdownCode} from "./index";

// The "With Streamdown" recipe uses Streamdown directly, which needs its own stylesheet.
import "streamdown/styles.css";

const meta = {
  argTypes: {
    children: {control: "text"},
    id: {control: "text"},
  },
  component: Markdown,
  parameters: {layout: "centered"},
  title: "Pro/AI/Markdown",
} satisfies Meta<typeof Markdown>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
const assistantReply = `# Trip Planner Summary

Here is the plan we put together, rendered with **GitHub-flavored markdown** and memoized block by block.

## Itinerary

- Morning ferry to the island and bike rental
- Lunch near the \`harbor\` market stalls
- Sunset hike back to the lighthouse viewpoint

\`\`\`tsx
<Thread>
  <Thread.Message role="assistant">
    <Thread.Avatar name="Guide" />
    <Thread.Content>
      <Markdown>{plan}</Markdown>
    </Thread.Content>
  </Thread.Message>
</Thread>
\`\`\`

> Weather can change quickly on the coast, so pack a light jacket.`;

const streamingReply = `# Recipe Steps

Only the block that is still receiving tokens renders again on every update.

1. Whisk the eggs
2. Fold in the flour
3. Bake for twenty minutes

\`\`\`js
const timer = setTimeout(done, 20 * 60 * 1000);
\`\`\``;

const kitchenSink = `# Heading one
## Heading two
### Heading three
#### Heading four

A paragraph with **bold**, *italic*, ~~strikethrough~~, \`inline code\` and a [link to the docs](https://example.com).

- Unordered item
- Another item with \`code\`
  - Nested item

1. Ordered item
2. Second ordered item

> A quoted note that spans a single line.

---

| Region | Orders | Growth |
| --- | --- | --- |
| North | 1,204 | +12% |
| South | 986 | +4% |

\`\`\`
plain fence without a language
\`\`\``;

const streamdownReply = `# Release Recap

Streamdown closes unfinished bold text, links and code fences on the fly, so a half-written answer never shows raw markdown.

- Words fade in as new tokens arrive
- A caret follows the end of the reply
- Incomplete fences render as code right away

\`\`\`tsx
<StreamMarkdown animated isAnimating={isGenerating}>
  {answer}
</StreamMarkdown>
\`\`\``;

/* -------------------------------------------------------------------------------------------------
 * Streaming helper: reveals `text` in fixed-size chunks (8 characters every 120ms).
 * -----------------------------------------------------------------------------------------------*/
const CHUNK_SIZE = 8;
const CHUNK_INTERVAL = 120;

function useSimulatedStream(text: string) {
  const [length, setLength] = useState(0);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    // Restart from the beginning when the source text changes (adjust state while rendering).
    setPrevText(text);
    setLength(0);
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLength((value) => {
        const next = Math.min(text.length, value + CHUNK_SIZE);

        if (next >= text.length) window.clearInterval(interval);

        return next;
      });
    }, CHUNK_INTERVAL);

    return () => window.clearInterval(interval);
  }, [text]);

  return {isStreaming: length < text.length, text: text.slice(0, length)};
}

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {children: assistantReply},
  render: (args) => (
    <div className="w-[640px]">
      <Markdown {...args} />
    </div>
  ),
};

export const Streaming: Story = {
  render: () => {
    const {text} = useSimulatedStream(streamingReply);

    return (
      <div className="w-[640px]">
        <Markdown id="recipe-reply">{text}</Markdown>
      </div>
    );
  },
};

export const WithStreamdown: Story = {
  render: () => {
    const {isStreaming, text} = useSimulatedStream(streamdownReply);

    // Plain Streamdown inherits the page colour (the demo page body uses `text-foreground`).
    return (
      <div className="w-[640px] text-foreground">
        <Streamdown
          animated
          caret="block"
          components={{code: StreamMarkdownCode}}
          isAnimating={isStreaming}
        >
          {text}
        </Streamdown>
      </div>
    );
  },
};

export const StreamMarkdownTypography: Story = {
  render: () => {
    const {isStreaming, text} = useSimulatedStream(streamdownReply);

    return (
      <div className="w-[640px]">
        <StreamMarkdown animated caret="block" isAnimating={isStreaming}>
          {text}
        </StreamMarkdown>
      </div>
    );
  },
};

export const AllElements: Story = {
  args: {children: kitchenSink},
  render: (args) => (
    <div className="w-[640px]">
      <Markdown {...args} />
    </div>
  ),
};
