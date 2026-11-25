import type {RichTextEditorSuggestionItem} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {JSONContent} from "@tiptap/react";

import {Button, Surface} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {RichTextEditor, filterRichTextEditorSuggestionItems} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    maxLength: {control: {type: "number"}},
    placeholder: {control: "text"},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: RichTextEditor,
  parameters: {layout: "centered"},
  title: "Pro/Forms/RichTextEditor",
} satisfies Meta<typeof RichTextEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared content and parts (story helpers, not exported)
 * -----------------------------------------------------------------------------------------------*/
const text = (value: string, marks?: JSONContent["marks"]): JSONContent =>
  marks ? {marks, text: value, type: "text"} : {text: value, type: "text"};

const paragraph = (...content: JSONContent[]): JSONContent => ({content, type: "paragraph"});

const heading = (level: 1 | 2 | 3, value: string): JSONContent => ({
  attrs: {level},
  content: [text(value)],
  type: "heading",
});

const listItem = (...content: JSONContent[]): JSONContent => ({
  content: [paragraph(...content)],
  type: "listItem",
});

const releaseNotes: JSONContent = {
  content: [
    heading(2, "Release notes"),
    {
      content: [
        paragraph(
          text(
            "Draft product updates with headings, lists, links and code, then hand the JSON to your API.",
            [{type: "italic"}],
          ),
          text(" Markdown shortcuts such as "),
          text("##", [{type: "code"}]),
          text(" work while you type."),
        ),
      ],
      type: "blockquote",
    },
    paragraph(
      text("Highlight "),
      text("any sentence in this paragraph", [{type: "bold"}]),
      text(
        " to open the floating format bar and toggle bold, italic, underline, strikethrough or a link in place.",
      ),
    ),
    heading(3, "Things to explore"),
    {
      content: [
        listItem(text("Switch block types from the toolbar: headings, quotes, lists and code.")),
        listItem(
          text("Link a word to "),
          text("heroui.com", [{attrs: {href: "https://heroui.com"}, type: "link"}]),
          text(" or strip styles with the clear buttons."),
        ),
        listItem(
          text("The "),
          text("onValueChange", [{type: "code"}]),
          text(" callback hands over JSON, HTML and plain text together."),
        ),
      ],
      type: "bulletList",
    },
    {
      attrs: {language: null},
      content: [text('editor.chain().focus().setNode("heading", {level: 3}).run()')],
      type: "codeBlock",
    },
  ],
  type: "doc",
};

const LinkControl = ({tooltip}: {tooltip?: React.ReactNode}) => (
  <RichTextEditor.LinkPopover>
    <RichTextEditor.LinkPopover.Trigger tooltip={tooltip} />
    <RichTextEditor.LinkPopover.Content>
      <RichTextEditor.LinkPopover.Input />
      <RichTextEditor.LinkPopover.Actions>
        <RichTextEditor.LinkPopover.UnsetButton />
        <RichTextEditor.LinkPopover.ApplyButton />
      </RichTextEditor.LinkPopover.Actions>
    </RichTextEditor.LinkPopover.Content>
  </RichTextEditor.LinkPopover>
);

/** The full formatting toolbar used by most demos. */
const FullToolbar = () => (
  <RichTextEditor.Toolbar>
    <RichTextEditor.ToolbarGroup aria-label="History">
      <RichTextEditor.ActionButton action="undo" tooltip="Undo" />
      <RichTextEditor.ActionButton action="redo" tooltip="Redo" />
    </RichTextEditor.ToolbarGroup>
    <RichTextEditor.ToolbarGroup aria-label="Text style">
      <RichTextEditor.ToggleButton command="bold" tooltip="Bold" />
      <RichTextEditor.ToggleButton command="italic" tooltip="Italic" />
      <RichTextEditor.ToggleButton command="underline" tooltip="Underline" />
      <RichTextEditor.ToggleButton command="strike" tooltip="Strikethrough" />
      <RichTextEditor.ToggleButton command="code" tooltip="Inline code" />
    </RichTextEditor.ToolbarGroup>
    <RichTextEditor.ToolbarGroup aria-label="Blocks">
      <RichTextEditor.ToggleButton command="heading-1" tooltip="Heading 1" />
      <RichTextEditor.ToggleButton command="heading-2" tooltip="Heading 2" />
      <RichTextEditor.ToggleButton command="heading-3" tooltip="Heading 3" />
      <RichTextEditor.ToggleButton command="blockquote" tooltip="Blockquote" />
      <RichTextEditor.ToggleButton command="codeBlock" tooltip="Code block" />
    </RichTextEditor.ToolbarGroup>
    <RichTextEditor.ToolbarGroup aria-label="Lists and links">
      <RichTextEditor.ToggleButton command="bulletList" tooltip="Bulleted list" />
      <RichTextEditor.ToggleButton command="orderedList" tooltip="Numbered list" />
      <LinkControl tooltip="Link" />
    </RichTextEditor.ToolbarGroup>
    <RichTextEditor.ToolbarGroup aria-label="Clear">
      <RichTextEditor.ActionButton action="clearFormatting" tooltip="Clear formatting" />
      <RichTextEditor.ActionButton action="clearContent" tooltip="Clear content" />
    </RichTextEditor.ToolbarGroup>
  </RichTextEditor.Toolbar>
);

const SelectionMenu = () => (
  <RichTextEditor.BubbleMenu>
    <RichTextEditor.ToggleButton command="bold" tooltip="Bold" />
    <RichTextEditor.ToggleButton command="italic" tooltip="Italic" />
    <RichTextEditor.ToggleButton command="underline" tooltip="Underline" />
    <RichTextEditor.ToggleButton command="strike" tooltip="Strikethrough" />
    <LinkControl tooltip="Link" />
  </RichTextEditor.BubbleMenu>
);

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {defaultValue: releaseNotes},
  render: (args) => (
    <RichTextEditor {...args} className="w-[760px]">
      <RichTextEditor.Shell>
        <FullToolbar />
        <RichTextEditor.Content />
        <SelectionMenu />
        <RichTextEditor.Footer>
          <span>Saved as Tiptap JSON</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Secondary (inside a Surface)
 * -----------------------------------------------------------------------------------------------*/
export const Secondary: Story = {
  args: {defaultValue: releaseNotes, variant: "secondary"},
  render: (args) => (
    <Surface className="w-[760px] rounded-3xl p-4">
      <RichTextEditor {...args} className="w-full">
        <RichTextEditor.Shell>
          <FullToolbar />
          <RichTextEditor.Content />
          <SelectionMenu />
          <RichTextEditor.Footer>
            <span>Secondary fill on a surface</span>
            <RichTextEditor.CharacterCount showWords />
          </RichTextEditor.Footer>
        </RichTextEditor.Shell>
      </RichTextEditor>
    </Surface>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Placeholder
 * -----------------------------------------------------------------------------------------------*/
export const Placeholder: Story = {
  args: {
    placeholder:
      "Outline your meeting agenda: add a heading, type *italic* or **bold**, then select words to format them...",
  },
  render: (args) => (
    <RichTextEditor {...args} className="w-[680px]">
      <RichTextEditor.Shell>
        <FullToolbar />
        <RichTextEditor.Content />
        <SelectionMenu />
        <RichTextEditor.Footer>
          <span>Nothing written yet</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Character count
 * -----------------------------------------------------------------------------------------------*/
const limitedDocument: JSONContent = {
  content: [
    heading(2, "Status update"),
    paragraph(
      text(
        "Updates are capped at 240 characters. Write past the cap and the editor stops accepting text, while the counter below tracks every keystroke.",
      ),
    ),
    {content: [listItem(text("Short and focused wins."))], type: "bulletList"},
  ],
  type: "doc",
};

export const CharacterCount: Story = {
  args: {defaultValue: limitedDocument, maxLength: 240},
  render: (args) => (
    <RichTextEditor {...args} className="w-[680px]">
      <RichTextEditor.Shell>
        <FullToolbar />
        <RichTextEditor.Content />
        <SelectionMenu />
        <RichTextEditor.Footer>
          <span>Limited to 240 characters</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom composition (compact toolbar in the footer)
 * -----------------------------------------------------------------------------------------------*/
const compactDocument: JSONContent = {
  content: [
    heading(2, "Compact layout"),
    paragraph(
      text(
        "Here the toolbar lives in the footer next to the counter. Every part reads the same editor instance, so the layout is entirely yours.",
      ),
    ),
    {
      content: [
        listItem(text("The footer only offers bold, italic, bullets and links.")),
        listItem(text("Content keeps working exactly like the full editor.")),
      ],
      type: "bulletList",
    },
    {
      content: [paragraph(text("Pick the controls your product needs and leave out the rest."))],
      type: "blockquote",
    },
  ],
  type: "doc",
};

export const CustomComposition: Story = {
  args: {defaultValue: compactDocument},
  render: (args) => (
    <RichTextEditor {...args} className="w-[600px]">
      <RichTextEditor.Shell>
        <RichTextEditor.Content />
        <RichTextEditor.Footer>
          <RichTextEditor.Toolbar
            aria-label="Compact editor toolbar"
            className="min-h-0 border-0 p-0"
          >
            <RichTextEditor.ToolbarGroup>
              <RichTextEditor.ToggleButton command="bold" tooltip="Bold" />
              <RichTextEditor.ToggleButton command="italic" tooltip="Italic" />
              <RichTextEditor.ToggleButton command="bulletList" tooltip="Bulleted list" />
              <LinkControl />
            </RichTextEditor.ToolbarGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.CharacterCount />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Disabled and read only
 * -----------------------------------------------------------------------------------------------*/
const disabledDocument: JSONContent = {
  content: [
    heading(3, "Editing locked"),
    paragraph(
      text(
        "A disabled editor dims the whole field and blocks every control, for example while a submission is being processed.",
      ),
    ),
    {content: [listItem(text("Use it while saving or without edit rights."))], type: "bulletList"},
  ],
  type: "doc",
};

const readOnlyDocument: JSONContent = {
  content: [
    heading(3, "Review mode"),
    paragraph(
      text(
        "A read-only editor keeps the regular look so the text stays easy to read, but the content cannot be changed.",
      ),
    ),
    {content: [listItem(text("Use it for approvals, previews and history."))], type: "bulletList"},
  ],
  type: "doc",
};

export const Disabled: Story = {
  render: () => (
    <div className="grid w-full max-w-[860px] grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))] gap-4">
      <RichTextEditor isDisabled defaultValue={disabledDocument}>
        <RichTextEditor.Shell>
          <FullToolbar />
          <RichTextEditor.Content />
          <RichTextEditor.Footer>
            <span>Disabled</span>
            <RichTextEditor.CharacterCount />
          </RichTextEditor.Footer>
        </RichTextEditor.Shell>
      </RichTextEditor>
      <RichTextEditor isReadOnly defaultValue={readOnlyDocument}>
        <RichTextEditor.Shell>
          <FullToolbar />
          <RichTextEditor.Content />
          <RichTextEditor.Footer>
            <span>Read only</span>
            <RichTextEditor.CharacterCount />
          </RichTextEditor.Footer>
        </RichTextEditor.Shell>
      </RichTextEditor>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
const briefDocument: JSONContent = {
  content: [
    heading(2, "Controlled document"),
    paragraph(
      text("The JSON document lives in React state and flows back in through the "),
      text("value", [{type: "code"}]),
      text(" prop; the preview below re-renders on every keystroke."),
    ),
    {
      content: [
        listItem(text("Type anywhere and the JSON tree updates instantly.")),
        listItem(
          text("Counts above come from the "),
          text("details", [{type: "bold"}]),
          text(" argument, "),
          text("not", [{type: "italic"}]),
          text(" a second parser."),
        ),
      ],
      type: "bulletList",
    },
    {
      content: [
        paragraph(
          text(
            "Swapping documents keeps the toolbar, footer and history buttons exactly where they are.",
          ),
        ),
      ],
      type: "blockquote",
    },
  ],
  type: "doc",
};

const changelogDocument: JSONContent = {
  content: [
    heading(2, "Imported changelog"),
    paragraph(
      text("This document replaced the previous one through the same "),
      text("JSONContent", [{type: "code"}]),
      text(" value, without remounting the editor."),
    ),
    {
      content: [
        listItem(text("Load the first document again.")),
        listItem(text("Edit a line.")),
        listItem(text("Watch the preview follow along.")),
      ],
      type: "orderedList",
    },
  ],
  type: "doc",
};

const ControlledDemo = () => {
  const [value, setValue] = React.useState<JSONContent>(briefDocument);
  const [stats, setStats] = React.useState({characters: 0, words: 0});

  return (
    <div className="flex w-full max-w-[760px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onPress={() => setValue(briefDocument)}>
          Load Brief
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setValue(changelogDocument)}>
          Load Changelog
        </Button>
        <span className="text-xs text-muted sm:ml-auto">
          {stats.characters} chars, {stats.words} words
        </span>
      </div>
      <RichTextEditor
        value={value}
        onValueChange={(next, details) => {
          setValue(next);
          setStats({characters: details.characters, words: details.words});
        }}
      >
        <RichTextEditor.Shell>
          <FullToolbar />
          <RichTextEditor.Content />
          <SelectionMenu />
          <RichTextEditor.Footer>
            <span>Value held in React state</span>
            <RichTextEditor.CharacterCount showWords />
          </RichTextEditor.Footer>
        </RichTextEditor.Shell>
      </RichTextEditor>
      <pre className="max-h-[220px] overflow-auto rounded-2xl bg-default p-3 text-xs break-words whitespace-pre-wrap text-muted">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Extensible commands
 * -----------------------------------------------------------------------------------------------*/
const formatToday = () =>
  new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "long", year: "numeric"}).format(
    new Date(),
  );

const slashItems: RichTextEditorSuggestionItem[] = [
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).setNode("heading", {level: 1}).run(),
    description: "Top-level page title",
    icon: <Icon icon="gravity-ui:heading-1" />,
    keywords: ["title", "h1"],
    title: "Heading 1",
  },
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).setNode("heading", {level: 2}).run(),
    description: "Section heading",
    icon: <Icon icon="gravity-ui:heading-2" />,
    keywords: ["subtitle", "h2"],
    title: "Heading 2",
  },
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).setNode("heading", {level: 3}).run(),
    description: "Sub-section heading",
    icon: <Icon icon="gravity-ui:heading-3" />,
    keywords: ["h3"],
    title: "Heading 3",
  },
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    description: "Unordered list of points",
    icon: <Icon icon="gravity-ui:list-ul" />,
    keywords: ["unordered", "bullets"],
    title: "Bulleted list",
  },
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    description: "Ordered steps",
    icon: <Icon icon="gravity-ui:list-ol" />,
    keywords: ["ordered", "numbers"],
    title: "Numbered list",
  },
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    description: "Highlight a quote or note",
    icon: <Icon icon="gravity-ui:quote-open" />,
    keywords: ["quote", "citation"],
    title: "Blockquote",
  },
  {
    command: ({editor, range}) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    description: "Monospaced snippet",
    icon: <Icon icon="gravity-ui:curly-brackets" />,
    keywords: ["code", "snippet"],
    title: "Code block",
  },
  {
    command: ({editor, range}) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    description: "Horizontal rule between parts",
    icon: <Icon icon="gravity-ui:minus" />,
    keywords: ["rule", "separator", "hr"],
    title: "Divider",
  },
  {
    command: ({editor, range}) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          content: [paragraph(text("Follow-up: "))],
          type: "blockquote",
        })
        .run(),
    description: "Your own snippet inserted by a custom command",
    icon: <Icon icon="gravity-ui:flag" />,
    keywords: ["action", "todo", "follow"],
    title: "Follow-up note",
  },
];

const extensibleDocument: JSONContent = {
  content: [
    heading(2, "Custom commands"),
    paragraph(
      text(
        "This editor wires its own toolbar buttons, an empty-line insert menu and a slash menu. Type ",
      ),
      text("/", [{type: "code"}]),
      text(" to list the commands, then narrow them with "),
      text("h", [{type: "code"}]),
      text(", "),
      text("list", [{type: "code"}]),
      text(", "),
      text("code", [{type: "code"}]),
      text(", or "),
      text("follow", [{type: "code"}]),
      text("."),
    ),
    {
      content: [
        paragraph(
          text(
            "Every entry calls a plain Tiptap command; the component just supplies an accessible menu.",
          ),
        ),
      ],
      type: "blockquote",
    },
    heading(3, "Give it a go"),
    {
      content: [
        listItem(text("Use the calendar button to insert the current date.")),
        listItem(text("Use the sparkle button to add a ready-made checklist.")),
        listItem(text("Place the caret on the empty line below to show the insert menu.")),
      ],
      type: "bulletList",
    },
    paragraph(),
  ],
  type: "doc",
};

export const Extensible: Story = {
  args: {defaultValue: extensibleDocument, placeholder: "Keep writing..."},
  render: (args) => (
    <RichTextEditor {...args} className="w-[720px]">
      <RichTextEditor.Shell>
        <RichTextEditor.Toolbar>
          <RichTextEditor.ToolbarGroup aria-label="Custom commands">
            <RichTextEditor.CommandButton
              aria-label="Insert today's date"
              tooltip="Insert date"
              onCommand={(editor) => editor.chain().focus().insertContent(formatToday()).run()}
            >
              <Icon icon="gravity-ui:calendar" />
            </RichTextEditor.CommandButton>
            <RichTextEditor.CommandButton
              aria-label="Insert release checklist"
              tooltip="Insert checklist"
              onCommand={(editor) =>
                editor
                  .chain()
                  .focus()
                  .insertContent([
                    heading(3, "Checklist"),
                    {
                      content: [
                        listItem(text("Draft the announcement")),
                        listItem(text("Review with the team")),
                        listItem(text("Schedule the post")),
                      ],
                      type: "orderedList",
                    },
                  ])
                  .run()
              }
            >
              <Icon icon="gravity-ui:sparkles" />
            </RichTextEditor.CommandButton>
          </RichTextEditor.ToolbarGroup>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
        <RichTextEditor.FloatingMenu>
          <RichTextEditor.CommandButton
            aria-label="Add heading"
            tooltip="Add heading"
            onCommand={(editor) => editor.chain().focus().toggleHeading({level: 2}).run()}
          >
            <Icon icon="gravity-ui:circle-plus" />
          </RichTextEditor.CommandButton>
        </RichTextEditor.FloatingMenu>
        <RichTextEditor.SuggestionMenu
          char="/"
          items={({query}) => filterRichTextEditorSuggestionItems(slashItems, query)}
        />
        <RichTextEditor.Footer>
          <span>Custom command surface</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  ),
};
