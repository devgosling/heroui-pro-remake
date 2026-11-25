import type {Meta, StoryObj} from "@storybook/react";

import React from "react";

import {CodeBlock} from "./index";

type CodeBlockStoryArgs = {
  code: string;
  darkTheme: string;
  language: string;
  theme: string;
};

const meta = {
  argTypes: {
    code: {control: "text"},
    darkTheme: {
      control: {type: "select"},
      options: ["github-dark", "github-dark-dimmed", "one-dark-pro", "vitesse-dark", "nord"],
    },
    language: {
      control: {type: "select"},
      options: ["typescript", "tsx", "javascript", "json", "bash", "python", "css", "plaintext"],
    },
    theme: {
      control: {type: "select"},
      options: ["github-light", "one-light", "vitesse-light", "min-light", "catppuccin-latte"],
    },
  },
  component: CodeBlock.Code,
  parameters: {layout: "centered"},
  title: "Pro/AI/CodeBlock",
} satisfies Meta<CodeBlockStoryArgs>;

export default meta;

type Story = StoryObj<CodeBlockStoryArgs>;

const priceSnippet = `function formatPrice(cents: number) {
  return \`$\${(cents / 100).toFixed(2)}\`;
}

console.log(formatPrice(4299));`;

export const Default: Story = {
  args: {
    code: priceSnippet,
    darkTheme: "github-dark",
    language: "typescript",
    theme: "github-light",
  },
  render: ({code, darkTheme, language, theme}) => (
    <div className="w-[480px]">
      <CodeBlock>
        <CodeBlock.Header>
          <span className="text-xs text-muted uppercase">{language}</span>
          <CodeBlock.CopyButton code={code} />
        </CodeBlock.Header>
        <CodeBlock.Code code={code} darkTheme={darkTheme} language={language} theme={theme} />
      </CodeBlock>
    </div>
  ),
};

export const WithoutHeader: Story = {
  args: {
    code: `pnpm add @heroui/pro shiki`,
    language: "bash",
  },
  render: ({code, language}) => (
    <div className="w-[480px]">
      <CodeBlock>
        <CodeBlock.Code code={code} language={language} />
      </CodeBlock>
    </div>
  ),
};

const languageSamples = [
  {
    code: `{
  "name": "orbit-dashboard",
  "private": true,
  "scripts": {"dev": "vite", "build": "vite build"}
}`,
    language: "json",
  },
  {
    code: `def moving_average(values, window=3):
    return [sum(values[i:i + window]) / window for i in range(len(values) - window + 1)]`,
    language: "python",
  },
  {
    code: `.badge {
  padding-inline: 0.5rem;
  border-radius: var(--radius);
}`,
    language: "css",
  },
  {
    code: `Build finished in 2.4s, 18 modules transformed.`,
    language: "plaintext",
  },
];

export const Languages: Story = {
  render: () => (
    <div className="flex w-[480px] flex-col">
      {languageSamples.map(({code, language}) => (
        <CodeBlock key={language}>
          <CodeBlock.Header>
            <span className="text-xs text-muted uppercase">{language}</span>
            <CodeBlock.CopyButton code={code} />
          </CodeBlock.Header>
          <CodeBlock.Code code={code} language={language} />
        </CodeBlock>
      ))}
    </div>
  ),
};

const streamedSnippet = `import {useEffect, useState} from "react";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}`;

const StreamingDemo = () => {
  const [length, setLength] = React.useState(0);

  React.useEffect(() => {
    if (length >= streamedSnippet.length) return;

    const timeout = setTimeout(() => setLength((value) => value + 6), 40);

    return () => clearTimeout(timeout);
  }, [length]);

  const code = streamedSnippet.slice(0, length);

  return (
    <div className="flex w-[480px] flex-col gap-2">
      <CodeBlock>
        <CodeBlock.Header>
          <span className="text-xs text-muted uppercase">tsx</span>
          <CodeBlock.CopyButton code={code} />
        </CodeBlock.Header>
        <CodeBlock.Code code={code} language="tsx" />
      </CodeBlock>
      <button className="self-start text-xs text-muted underline" onClick={() => setLength(0)}>
        Replay
      </button>
    </div>
  );
};

export const Streaming: Story = {
  render: () => <StreamingDemo />,
};
