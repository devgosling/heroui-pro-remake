import type {TimelineStatus} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Avatar, Button, Card, Chip, CloseButton, Input, Link} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {Timeline} from "./index";

const meta = {
  argTypes: {
    axis: {control: {type: "select"}, options: ["start", "center"]},
    density: {control: {type: "select"}, options: ["compact", "comfortable"]},
    itemAlign: {control: {type: "select"}, options: ["start", "center"]},
    placement: {control: {type: "select"}, options: ["start", "end", "alternate"]},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: Timeline,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/Timeline",
} satisfies Meta<typeof Timeline>;

export default meta;

type Story = StoryObj<typeof meta>;

type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

/** Public HeroUI demo avatars (the same assets the OSS stories use). */
const AVATAR_BASE_URL = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars";

const avatarColorByInitials: Record<string, string> = {
  AO: "purple",
  DL: "red",
  EB: "green",
  I: "purple",
  JP: "orange",
  O: "blue",
  R: "green",
  RK: "blue",
};

const PersonAvatar = ({
  className,
  initials,
  size,
}: {
  className?: string;
  initials: string;
  size: "sm" | "md" | "lg";
}) => (
  <Avatar className={className} size={size}>
    <Avatar.Image
      alt=""
      src={`${AVATAR_BASE_URL}/${avatarColorByInitials[initials] ?? "blue"}.jpg`}
    />
    <Avatar.Fallback>{initials}</Avatar.Fallback>
  </Avatar>
);

/* -------------------------------------------------------------------------------------------------
 * Default - rollout audit with icon markers, status chips and right-aligned times
 * -----------------------------------------------------------------------------------------------*/
const rolloutEvents: Array<{
  chip: string;
  chipColor: ChipColor;
  description: React.ReactNode;
  icon: string;
  status: TimelineStatus;
  time: string;
  title: string;
}> = [
  {
    chip: "Owner set",
    chipColor: "default",
    description: (
      <>
        Opened <span className="font-medium text-foreground">search-reindex</span> for the catalog
        team.
      </>
    ),
    icon: "gravity-ui:flag",
    status: "default",
    time: "08:05",
    title: "Migration ticket filed",
  },
  {
    chip: "Shadow",
    chipColor: "accent",
    description: (
      <>
        Mirroring <span className="font-medium text-foreground">10% of queries</span> to the new
        index with diffing enabled.
      </>
    ),
    icon: "gravity-ui:rocket",
    status: "current",
    time: "08:41",
    title: "Shadow traffic enabled",
  },
  {
    chip: "Held",
    chipColor: "warning",
    description: (
      <>
        Ranking drift exceeded the budget in{" "}
        <span className="font-medium text-foreground">ap-south-1</span>; the switch waits for a
        re-score.
      </>
    ),
    icon: "gravity-ui:triangle-exclamation",
    status: "warning",
    time: "09:02",
    title: "Relevance check flagged",
  },
  {
    chip: "Notes",
    chipColor: "default",
    description: (
      <>
        Internal FAQ and status copy are drafted in{" "}
        <Link className="text-xs" href="#">
          Cutover brief
        </Link>
        .
      </>
    ),
    icon: "gravity-ui:file-text",
    status: "default",
    time: "09:20",
    title: "Support notes drafted",
  },
  {
    chip: "Pending",
    chipColor: "default",
    description: "The final switch runs after tonight's traffic dip.",
    icon: "gravity-ui:clock",
    status: "muted",
    time: "09:45",
    title: "Cutover slot booked",
  },
  {
    chip: "Done",
    chipColor: "success",
    description: "Fallback alias and alert routing are logged in the migration record.",
    icon: "gravity-ui:circle-check-fill",
    status: "success",
    time: "10:12",
    title: "Rollback plan signed off",
  },
];

export const Default: Story = {
  args: {density: "compact", itemAlign: "center", size: "sm"},
  render: (args) => (
    <div className="w-full max-w-[560px] min-w-0">
      <div className="mb-4">
        <p className="m-0 text-xs font-medium text-muted">Migration log</p>
        <h3 className="m-0 text-base font-semibold text-foreground">Search index cutover</h3>
      </div>
      <Timeline {...args}>
        {rolloutEvents.map((event) => (
          <Timeline.Item key={event.title} status={event.status}>
            <Timeline.Rail>
              <Timeline.Marker>
                <Icon icon={event.icon} />
              </Timeline.Marker>
              <Timeline.Connector />
            </Timeline.Rail>
            <Timeline.Content>
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="m-0 text-xs leading-5 font-medium text-foreground">
                      {event.title}
                    </h3>
                    <Chip color={event.chipColor} size="sm" variant="soft">
                      {event.chip}
                    </Chip>
                  </div>
                  <p className="m-0 mt-1 text-xs leading-5 text-muted">{event.description}</p>
                </div>
                <time className="shrink-0 text-xs leading-5 text-muted">{event.time}</time>
              </div>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Incident Response - composer row, a highlighted update card and a feed of short log lines
 * -----------------------------------------------------------------------------------------------*/
const InlinePerson = ({initials, name}: {initials: string; name: string}) => (
  <span className="inline-flex align-middle whitespace-nowrap">
    <span className="inline-flex items-center gap-1.5">
      <PersonAvatar className="size-4" initials={initials} size="sm" />
      <span className="font-medium text-foreground">{name}</span>
    </span>
  </span>
);

const incidentLog: Array<{
  icon: string;
  status: TimelineStatus;
  text: React.ReactNode;
  time: string;
}> = [
  {
    icon: "gravity-ui:thunderbolt-fill",
    status: "warning",
    text: (
      <>
        Page acknowledged by <InlinePerson initials="DL" name="Dana Lowe" />
      </>
    ),
    time: "4:07 PM",
  },
  {
    icon: "gravity-ui:person",
    status: "default",
    text: (
      <>
        War room joined by <InlinePerson initials="AO" name="Ari Okafor" />
      </>
    ),
    time: "4:05 PM",
  },
  {
    icon: "gravity-ui:envelope",
    status: "default",
    text: (
      <>
        Status note sent to{" "}
        <Link className="truncate text-xs" href="#">
          merchant-success
        </Link>
      </>
    ),
    time: "4:03 PM",
  },
  {
    icon: "gravity-ui:circle-check-fill",
    status: "success",
    text: (
      <>
        Hotfix rolled out to <span className="font-medium text-foreground">ingest-node-7</span>
      </>
    ),
    time: "4:01 PM",
  },
  {
    icon: "gravity-ui:clock",
    status: "muted",
    text: (
      <>
        <span className="font-medium text-foreground">Retro invite</span> queued
      </>
    ),
    time: "3:58 PM",
  },
];

export const IncidentResponse: Story = {
  render: () => (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-[720px] min-w-0 sm:w-full">
      <div className="mb-5">
        <p className="m-0 text-xs font-medium text-muted">Incident timeline</p>
        <h3 className="m-0 text-base font-semibold text-foreground">Webhook delivery backlog</h3>
      </div>
      <Timeline density="compact" itemAlign="center" size="sm">
        <Timeline.Item>
          <Timeline.Rail className="items-center">
            <Timeline.Marker className="size-7 overflow-hidden border-0 p-0 shadow-none">
              <PersonAvatar className="size-full" initials="DL" size="lg" />
            </Timeline.Marker>
            <Timeline.Connector className="top-[calc(50%+var(--spacing)*3.5)]" />
          </Timeline.Rail>
          <Timeline.Content>
            <div className="flex items-center gap-2 sm:gap-3">
              <Input
                aria-label="Write an incident update"
                className="min-w-0 flex-1"
                defaultValue="Retry queue is draining since the consumer restart."
                variant="secondary"
              />
              <Button className="shrink-0" size="sm" variant="primary">
                Share
              </Button>
            </div>
          </Timeline.Content>
        </Timeline.Item>
        <Timeline.Item align="start" status="current">
          <Timeline.Rail>
            <Timeline.Marker>
              <Icon icon="gravity-ui:comment" />
            </Timeline.Marker>
            <Timeline.Connector />
          </Timeline.Rail>
          <Timeline.Content className="gap-2.5">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-xs leading-5 text-muted">Posted by</span>
                <PersonAvatar className="size-4" initials="DL" size="sm" />
                <h3 className="m-0 text-xs leading-5 font-medium text-foreground">Dana Lowe</h3>
                <Chip size="sm" variant="soft">
                  Incident lead
                </Chip>
              </div>
              <time className="shrink-0 text-xs leading-5 text-muted">4:11 PM</time>
            </div>
            <Card className="w-full !border !border-solid !border-border p-3" variant="transparent">
              <p className="m-0 text-sm leading-relaxed text-foreground">
                The backlog only affects outbound webhooks. Checkout, refunds, and the merchant
                dashboard are unaffected while retries catch up.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="secondary">
                  <Icon height={16} icon="gravity-ui:file-text" width={12} />
                  <Chip.Label>consumer-lag.csv - 18 KB</Chip.Label>
                </Chip>
                <Link className="text-xs" href="#">
                  View playbook
                  <Link.Icon />
                </Link>
              </div>
            </Card>
          </Timeline.Content>
        </Timeline.Item>
        {incidentLog.map((entry) => (
          <Timeline.Item key={entry.time} status={entry.status}>
            <Timeline.Rail>
              <Timeline.Marker>
                <Icon icon={entry.icon} />
              </Timeline.Marker>
              <Timeline.Connector />
            </Timeline.Rail>
            <Timeline.Content>
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="m-0 min-w-0 text-xs leading-5 text-muted">{entry.text}</p>
                <time className="shrink-0 text-xs leading-5 text-muted">{entry.time}</time>
              </div>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Repository Activity - monthly contribution feed with repository rows and a pull request card
 * -----------------------------------------------------------------------------------------------*/
const RepoRows = ({rows}: {rows: Array<[string, string]>}) => (
  <div className="grid gap-1">
    {rows.map(([repo, meta]) => (
      <div
        key={repo}
        className="grid min-w-0 grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,200px)_auto] sm:items-center sm:gap-3"
      >
        <Link className="truncate text-xs" href="#">
          {repo}
        </Link>
        <span className="text-xs text-muted">{meta}</span>
      </div>
    ))}
  </div>
);

const ActivityHeader = ({author, time, title}: {author: string; time?: string; title: string}) => (
  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <div className="min-w-0">
      <h3 className="m-0 text-sm leading-5 font-medium text-foreground">{title}</h3>
      <p className="m-0 text-xs leading-5 text-muted">{author}</p>
    </div>
    {time ? <time className="shrink-0 text-xs leading-5 text-muted">{time}</time> : null}
  </div>
);

export const RepositoryActivity: Story = {
  render: () => (
    <div className="w-full max-w-[620px] min-w-0">
      <div className="mb-4 flex items-center gap-4">
        <h3 className="m-0 shrink-0 text-sm font-semibold text-foreground">April 2026</h3>
        <div className="h-px flex-1 bg-separator" />
      </div>
      <Timeline size="sm">
        <Timeline.Item status="success">
          <Timeline.Rail>
            <Timeline.Marker>
              <Icon icon="gravity-ui:code-commit" />
            </Timeline.Marker>
            <Timeline.Connector />
          </Timeline.Rail>
          <Timeline.Content className="gap-2.5">
            <ActivityHeader author="Jonas Ekberg" title="Pushed commits to 4 repositories" />
            <RepoRows
              rows={[
                ["northwind/design-tokens", "94 commits"],
                ["northwind/storefront", "41 commits"],
                ["harbor-labs/sdk", "15 commits"],
                ["harbor-labs/notifier", "6 commits"],
              ]}
            />
          </Timeline.Content>
        </Timeline.Item>
        <Timeline.Item status="current">
          <Timeline.Rail>
            <Timeline.Marker>
              <Icon icon="gravity-ui:code-merge" />
            </Timeline.Marker>
            <Timeline.Connector />
          </Timeline.Rail>
          <Timeline.Content className="gap-2.5">
            <ActivityHeader
              author="Lea Fontaine"
              time="Apr 14"
              title="Merged a pull request in northwind/storefront"
            />
            <Card className="w-full min-w-0 p-3">
              <Card.Header className="gap-2.5 p-0">
                <Icon className="size-4 shrink-0 text-accent" icon="gravity-ui:code-pull-request" />
                <div className="min-w-0">
                  <Card.Title className="text-sm leading-5">
                    Lazy-load product media in the cart drawer
                  </Card.Title>
                  <Card.Description className="mt-1 text-xs leading-5">
                    Deferred gallery images, added skeleton states, and trimmed the initial bundle
                    for checkout.
                  </Card.Description>
                </div>
              </Card.Header>
              <Card.Footer className="mt-3 flex flex-wrap items-center gap-2 p-0">
                <Chip color="success" size="sm" variant="soft">
                  +27
                </Chip>
                <Chip color="danger" size="sm" variant="soft">
                  -9
                </Chip>
                <div aria-hidden="true" className="flex items-center gap-0.5">
                  <span className="size-2 bg-success" />
                  <span className="size-2 bg-success" />
                  <span className="size-2 bg-success" />
                  <span className="size-2 bg-danger" />
                  <span className="size-2 bg-separator" />
                </div>
                <span className="text-xs text-muted">- 5 comments</span>
              </Card.Footer>
            </Card>
          </Timeline.Content>
        </Timeline.Item>
        <Timeline.Item status="warning">
          <Timeline.Rail>
            <Timeline.Marker>
              <Icon icon="gravity-ui:circle-exclamation" />
            </Timeline.Marker>
            <Timeline.Connector />
          </Timeline.Rail>
          <Timeline.Content className="gap-2.5">
            <ActivityHeader author="Priya Natarajan" title="Filed 22 issues in 3 repositories" />
            <RepoRows
              rows={[
                ["northwind/storefront", "11 triaged"],
                ["harbor-labs/sdk", "7 closed"],
                ["harbor-labs/notifier", "4 open"],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Chip color="success" size="sm" variant="soft">
                11 triaged
              </Chip>
              <Chip color="accent" size="sm" variant="soft">
                7 assigned
              </Chip>
              <Chip color="danger" size="sm" variant="soft">
                4 open
              </Chip>
            </div>
          </Timeline.Content>
        </Timeline.Item>
        <Timeline.Item>
          <Timeline.Rail>
            <Timeline.Marker>
              <Icon icon="gravity-ui:eye" />
            </Timeline.Marker>
            <Timeline.Connector />
          </Timeline.Rail>
          <Timeline.Content className="gap-2.5">
            <ActivityHeader
              author="Tomasz Wilk"
              time="Apr 27"
              title="Reviewed 38 pull requests in 4 repositories"
            />
            <RepoRows
              rows={[
                ["northwind/design-tokens", "17 reviews"],
                ["northwind/storefront", "10 reviews"],
                ["harbor-labs/sdk", "8 reviews"],
                ["harbor-labs/notifier", "3 reviews"],
              ]}
            />
          </Timeline.Content>
        </Timeline.Item>
      </Timeline>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Centered Milestones - alternating roadmap on wide screens, start rail on phones
 * -----------------------------------------------------------------------------------------------*/
const milestones: Array<{
  chip: string;
  chipColor: ChipColor;
  date: string;
  description: React.ReactNode;
  icon: string;
  metric: string;
  title: string;
}> = [
  {
    chip: "Discovery",
    chipColor: "default",
    date: "Feb 2026",
    description: "Ran interviews with clinic managers to map scheduling, intake, and billing gaps.",
    icon: "gravity-ui:magnifier",
    metric: "31 interviews",
    title: "Pilot program",
  },
  {
    chip: "Payments",
    chipColor: "accent",
    date: "Apr 2026",
    description: "Card-on-file checkout launched for pilot clinics once refund flows passed audit.",
    icon: "gravity-ui:credit-card",
    metric: "4 methods",
    title: "In-app payments",
  },
  {
    chip: "Growth",
    chipColor: "success",
    date: "Jun 2026",
    description: (
      <>
        Expanded to two new provinces with bilingual onboarding and a{" "}
        <Link className="text-xs" href="#">
          rollout memo
        </Link>
        .
      </>
    ),
    icon: "gravity-ui:globe",
    metric: "2 provinces",
    title: "Regional expansion",
  },
  {
    chip: "Ecosystem",
    chipColor: "warning",
    date: "Sep 2026",
    description: "Lab and pharmacy integrations shipped with shared review checklists.",
    icon: "gravity-ui:layers",
    metric: "6 integrations",
    title: "Partner APIs",
  },
  {
    chip: "Compliance",
    chipColor: "default",
    date: "Nov 2026",
    description: "Consent logs, role scopes, and data exports landed in the admin console.",
    icon: "gravity-ui:shield-check",
    metric: "4 controls",
    title: "Admin safeguards",
  },
  {
    chip: "Retention",
    chipColor: "accent",
    date: "Jan 2027",
    description: "Onboarding tours, nudges, and changelog posts now share one content calendar.",
    icon: "gravity-ui:bell",
    metric: "9 campaigns",
    title: "Engagement loop",
  },
];

const MilestoneBody = ({
  milestone,
  reversed = false,
}: {
  milestone: (typeof milestones)[number];
  reversed?: boolean;
}) => {
  const date = <time className="text-xs leading-5 text-muted">{milestone.date}</time>;
  const chip = (
    <Chip color={milestone.chipColor} size="sm" variant="soft">
      {milestone.chip}
    </Chip>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {reversed ? chip : date}
        {reversed ? date : chip}
      </div>
      <h3 className="m-0 text-sm leading-5 font-medium text-foreground">{milestone.title}</h3>
      <p className="m-0 text-xs leading-5 text-muted">{milestone.description}</p>
      <span className="text-xs leading-5 text-muted">{milestone.metric}</span>
    </>
  );
};

export const CenteredMilestones: Story = {
  render: () => (
    <div className="w-full max-w-[700px] min-w-0 py-4">
      <div className="mb-5 flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-separator" />
        <Chip color="accent" size="sm" variant="soft">
          Clinic roadmap
        </Chip>
        <div className="h-px flex-1 bg-separator" />
      </div>
      <div className="sm:hidden">
        <Timeline density="compact" size="sm">
          {milestones.map((milestone) => (
            <Timeline.Item key={milestone.title}>
              <Timeline.Rail>
                <Timeline.Marker>
                  <Icon icon={milestone.icon} />
                </Timeline.Marker>
                <Timeline.Connector />
              </Timeline.Rail>
              <Timeline.Content className="gap-1.5">
                <MilestoneBody milestone={milestone} />
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
      <div className="hidden sm:block">
        <Timeline axis="center" itemAlign="center" placement="alternate" size="sm">
          {milestones.map((milestone, index) => (
            <Timeline.Item key={milestone.title}>
              <Timeline.Rail>
                <Timeline.Marker>
                  <Icon icon={milestone.icon} />
                </Timeline.Marker>
                <Timeline.Connector />
              </Timeline.Rail>
              <Timeline.Content className="max-w-[260px] gap-1.5">
                <MilestoneBody milestone={milestone} reversed={index % 2 === 1} />
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Split Content - metadata on the start side, details on the end side of a centered rail
 * -----------------------------------------------------------------------------------------------*/
const reviewSteps: Array<{
  body: React.ReactNode;
  chip: string;
  chipColor: ChipColor;
  icon: string;
  owner: string;
  stats: Array<[string, string]>;
  status: TimelineStatus;
  time: string;
  title: string;
}> = [
  {
    body: (
      <>
        Plan names, trial banners, and downgrade prompts cleared the{" "}
        <Link className="text-xs" href="#">
          copy review
        </Link>
        .
      </>
    ),
    chip: "Content",
    chipColor: "default",
    icon: "gravity-ui:pencil",
    owner: "Hana Ito",
    stats: [
      ["Strings", "64"],
      ["Comments", "3"],
    ],
    status: "default",
    time: "08:30",
    title: "Pricing copy signed off",
  },
  {
    body: "Risk added a manual review step for annual upgrades above the spend threshold.",
    chip: "Risk",
    chipColor: "warning",
    icon: "gravity-ui:triangle-exclamation",
    owner: "Felix Brandt",
    stats: [
      ["Limit", "$1,200"],
      ["Response", "6 h"],
    ],
    status: "warning",
    time: "09:55",
    title: "Upgrade review rule added",
  },
  {
    body: "Plan change events now stream into the launch dashboard with region breakdowns.",
    chip: "Analytics",
    chipColor: "accent",
    icon: "gravity-ui:chart-line",
    owner: "Sofia Reyes",
    stats: [
      ["Streams", "9"],
      ["Delay", "30 s"],
    ],
    status: "default",
    time: "11:20",
    title: "Launch dashboard wired up",
  },
  {
    body: "Proration math matched finance exports for every sampled workspace.",
    chip: "Finance",
    chipColor: "success",
    icon: "gravity-ui:receipt",
    owner: "Malik Adeyemi",
    stats: [
      ["Samples", "250"],
      ["Mismatches", "0"],
    ],
    status: "success",
    time: "13:40",
    title: "Proration verified",
  },
  {
    body: "The public rollout opens once support confirms the macro library is live.",
    chip: "Queued",
    chipColor: "default",
    icon: "gravity-ui:clock",
    owner: "Hana Ito",
    stats: [
      ["Teams", "5"],
      ["Window", "2 days"],
    ],
    status: "muted",
    time: "15:10",
    title: "General release scheduled",
  },
];

export const SplitContent: Story = {
  render: () => (
    <div className="w-full max-w-[680px] min-w-0 py-4">
      <div className="mx-auto mb-5 max-w-[360px] text-center">
        <p className="m-0 text-xs font-medium text-muted">Release review</p>
        <h3 className="m-0 text-base font-semibold text-foreground">Plan switching</h3>
      </div>
      <Timeline axis="center" size="sm">
        {reviewSteps.map((step) => (
          <Timeline.Item key={step.title} status={step.status}>
            <Timeline.Rail>
              <Timeline.Marker>
                <Icon icon={step.icon} />
              </Timeline.Marker>
              <Timeline.Connector />
            </Timeline.Rail>
            <Timeline.Content className="max-w-[180px] gap-1.5" side="start">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <time className="text-xs leading-5 font-medium text-foreground">{step.time}</time>
                <Chip color={step.chipColor} size="sm" variant="soft">
                  {step.chip}
                </Chip>
              </div>
              <span className="text-xs leading-5 text-muted">{step.owner}</span>
            </Timeline.Content>
            <Timeline.Content className="max-w-[320px] gap-2" side="end">
              <h3 className="m-0 text-sm leading-5 font-medium text-foreground">{step.title}</h3>
              <Card
                className="w-full !border !border-solid !border-border p-3"
                variant="transparent"
              >
                <p className="m-0 text-xs leading-5 text-muted">{step.body}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {step.stats.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <span className="block text-[11px] leading-4 text-muted">{label}</span>
                      <span className="block truncate text-xs leading-5 font-medium text-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Compact Log - dense payment event log
 * -----------------------------------------------------------------------------------------------*/
const paymentEvents: Array<{
  description?: string;
  icon: string;
  status: TimelineStatus;
  time: string;
  title: string;
}> = [
  {
    description:
      "The bank flagged the annual renewal as unrecognized, and evidence is due within ten days.",
    icon: "gravity-ui:circle-exclamation",
    status: "warning",
    time: "Jun 3, 2:48 PM",
    title: "Dispute received",
  },
  {
    icon: "gravity-ui:circle-check",
    status: "success",
    time: "Jun 3, 2:31 PM",
    title: "Charge settled",
  },
  {
    icon: "gravity-ui:credit-card",
    status: "default",
    time: "Jun 3, 2:31 PM",
    title: "Card verified",
  },
  {
    icon: "gravity-ui:receipt",
    status: "muted",
    time: "Jun 3, 2:30 PM",
    title: "Receipt issued",
  },
];

export const CompactLog: Story = {
  render: () => (
    <div className="box-border w-full max-w-[520px] min-w-0 px-2 sm:px-0">
      <Timeline density="compact" itemAlign="center" size="sm">
        {paymentEvents.map((event) => (
          <Timeline.Item
            key={event.title}
            align={event.description ? "start" : undefined}
            status={event.status}
          >
            <Timeline.Rail>
              <Timeline.Marker>
                <Icon icon={event.icon} />
              </Timeline.Marker>
              <Timeline.Connector />
            </Timeline.Rail>
            <Timeline.Content className="gap-1">
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <h3 className="m-0 text-xs leading-tight font-medium text-foreground">
                  {event.title}
                </h3>
                <time className="shrink-0 text-xs leading-tight text-muted">{event.time}</time>
              </div>
              {event.description ? (
                <p className="m-0 text-xs leading-snug text-muted">{event.description}</p>
              ) : null}
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Studio Review - avatar markers with an asset preview card
 * -----------------------------------------------------------------------------------------------*/
const studioComments: Array<{
  author: string;
  initials: string;
  note: string;
  status: TimelineStatus;
  time: string;
  title: string;
}> = [
  {
    author: "Ravi Kumar",
    initials: "RK",
    note: "Reflections on the hood read well at banner size. Pull the horizon down slightly so the roofline breathes.",
    status: "warning",
    time: "2:24 PM",
    title: "Color grade checked",
  },
  {
    author: "Elin Berg",
    initials: "EB",
    note: "Swapped the headline lockup and matched the spec badge to the approved campaign wording.",
    status: "default",
    time: "2:39 PM",
    title: "Headline note closed",
  },
  {
    author: "Juno Park",
    initials: "JP",
    note: "Delivered the wide banner, gallery crop, and social square for final sign-off.",
    status: "success",
    time: "3:02 PM",
    title: "Asset bundle exported",
  },
];

const StudioHeader = ({author, time, title}: {author: string; time: string; title: string}) => (
  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <h3 className="m-0 text-xs leading-5 font-medium text-foreground">{title}</h3>
    </div>
    <div className="flex shrink-0 items-center gap-2 text-xs leading-5 text-muted">
      <span>{author}</span>
      <time>{time}</time>
    </div>
  </div>
);

const AvatarMarker = ({initials}: {initials: string}) => (
  <Timeline.Marker className="size-6 overflow-hidden border-0 p-0 shadow-none">
    <PersonAvatar className="size-full" initials={initials} size="sm" />
  </Timeline.Marker>
);

export const StudioReview: Story = {
  render: () => (
    <div className="w-full max-w-[620px] min-w-0">
      <div className="mb-4">
        <p className="m-0 text-xs font-medium text-muted">Creative review</p>
        <h3 className="m-0 text-base font-semibold text-foreground">Coupe campaign visuals</h3>
      </div>
      <Timeline density="compact" itemAlign="center" size="sm">
        <Timeline.Item status="current">
          <Timeline.Rail>
            <AvatarMarker initials="JP" />
            <Timeline.Connector />
          </Timeline.Rail>
          <Timeline.Content className="gap-2">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="m-0 text-xs leading-5 font-medium text-foreground">
                  Hero render uploaded
                </h3>
                <Chip color="accent" size="sm" variant="soft">
                  In review
                </Chip>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs leading-5 text-muted">
                <span>Juno Park</span>
                <time>2:11 PM</time>
              </div>
            </div>
            <Card
              className="w-full overflow-hidden !border !border-solid !border-border p-0"
              variant="transparent"
            >
              <div className="grid min-w-0 gap-0 sm:grid-cols-[140px_minmax(0,1fr)]">
                <img
                  alt="Silver coupe parked at dusk, used as the campaign hero render"
                  className="aspect-[4/3] w-full object-cover select-none sm:aspect-auto sm:h-full"
                  draggable={false}
                  src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/backgrounds/cards/car1.jpg"
                />
                <div className="flex min-w-0 flex-col gap-3 p-3">
                  <p className="m-0 text-xs leading-5 text-muted">
                    The wide hero render is ready for grading notes, with the gallery crop and the
                    dealer banner queued behind it.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="secondary">
                      Homepage hero
                    </Chip>
                    <Chip size="sm" variant="secondary">
                      3 crops
                    </Chip>
                    <Link className="text-xs" href="#">
                      Open review
                      <Link.Icon />
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </Timeline.Content>
        </Timeline.Item>
        {studioComments.map((comment) => (
          <Timeline.Item key={comment.title} status={comment.status}>
            <Timeline.Rail>
              <AvatarMarker initials={comment.initials} />
              <Timeline.Connector />
            </Timeline.Rail>
            <Timeline.Content className="gap-2">
              <StudioHeader author={comment.author} time={comment.time} title={comment.title} />
              <p className="m-0 text-xs leading-5 text-muted">{comment.note}</p>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Version History - dot markers (default rail) inside a card panel
 * -----------------------------------------------------------------------------------------------*/
const revisions: Array<{
  author: string;
  chip?: {color: ChipColor; label: string};
  initial: string;
  status: TimelineStatus;
  summary: string;
  time: string;
  version: string;
}> = [
  {
    author: "Ines Duarte",
    chip: {color: "accent", label: "Editing"},
    initial: "I",
    status: "current",
    summary: "Reworded the onboarding emails, refreshed screenshots, and added the FAQ block.",
    time: "Now",
    version: "r12",
  },
  {
    author: "Oskar Lind",
    chip: {color: "success", label: "Published"},
    initial: "O",
    status: "success",
    summary: "Shipped the new welcome sequence after legal approved the consent wording.",
    time: "Apr 9, 2026, 3:42 PM",
    version: "r11",
  },
  {
    author: "Rhea Kapoor",
    initial: "R",
    status: "default",
    summary: "Localized subject lines and fixed broken links in the reminder template.",
    time: "Apr 8, 2026, 10:15 AM",
    version: "r10",
  },
  {
    author: "Ines Duarte",
    initial: "I",
    status: "muted",
    summary: "Tightened the dark mode palette for buttons and footer links.",
    time: "Apr 6, 2026, 05:27 PM",
    version: "r9",
  },
  {
    author: "Oskar Lind",
    initial: "O",
    status: "muted",
    summary: "Merged the partner variant and removed the retired promo banner.",
    time: "Apr 3, 2026, 01:08 PM",
    version: "r8",
  },
  {
    author: "Rhea Kapoor",
    initial: "R",
    status: "muted",
    summary: "Imported the first outline from the lifecycle planning doc.",
    time: "Apr 1, 2026, 09:50 AM",
    version: "r7",
  },
];

export const VersionHistory: Story = {
  render: () => (
    <Card className="w-full max-w-[420px] gap-0 overflow-hidden p-0">
      <Card.Header className="flex-row items-center justify-between border-b border-border px-5 py-4">
        <h3 className="m-0 text-base font-semibold text-foreground">Revision history</h3>
        <CloseButton aria-label="Close revision history" />
      </Card.Header>
      <Card.Content className="px-5 py-4">
        <Timeline density="compact" size="sm">
          {revisions.map((revision) => (
            // No Rail: the item renders the default rail (empty dot marker + connector)
            <Timeline.Item key={revision.version} status={revision.status}>
              <Timeline.Content className="gap-1.5">
                <div className="flex min-h-5 min-w-0 items-center gap-2">
                  <h4 className="m-0 text-xs leading-tight font-medium text-foreground">
                    {revision.version}
                  </h4>
                  {revision.chip ? (
                    <Chip color={revision.chip.color} size="sm" variant="soft">
                      {revision.chip.label}
                    </Chip>
                  ) : null}
                </div>
                <p className="m-0 text-xs leading-5 text-muted">{revision.summary}</p>
                <div className="flex items-center gap-2">
                  <PersonAvatar className="size-4" initials={revision.initial} size="sm" />
                  <span className="text-xs leading-5 text-muted">{revision.author}</span>
                  <span className="text-xs leading-5 text-muted">-</span>
                  <time className="text-xs leading-5 text-muted">{revision.time}</time>
                </div>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Sizes - every size and marker status side by side (numbered markers, default comfortable density)
 * -----------------------------------------------------------------------------------------------*/
const statusSteps: Array<{day: string; status: TimelineStatus; title: string}> = [
  {day: "Mon", status: "success", title: "Brief approved"},
  {day: "Tue", status: "current", title: "Design review"},
  {day: "Wed", status: "warning", title: "Budget check"},
  {day: "Thu", status: "danger", title: "Vendor blocked"},
  {day: "Fri", status: "default", title: "Handoff"},
  {day: "Mon", status: "muted", title: "Retro"},
];

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-10">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex w-[200px] flex-col gap-3">
          <p className="m-0 text-xs font-medium text-muted">size=&quot;{size}&quot;</p>
          <Timeline size={size}>
            {statusSteps.map((step, index) => (
              <Timeline.Item key={step.title} status={step.status}>
                <Timeline.Rail>
                  <Timeline.Marker>{index + 1}</Timeline.Marker>
                  <Timeline.Connector />
                </Timeline.Rail>
                <Timeline.Content>
                  <h3 className="m-0 text-sm leading-5 font-medium text-foreground">
                    {step.title}
                  </h3>
                  <time className="text-xs leading-5 text-muted">{step.day}</time>
                </Timeline.Content>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      ))}
    </div>
  ),
};
