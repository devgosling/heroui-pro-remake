import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, InputGroup, Link, Separator, TextField} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {SOCIAL_AUTH_BUTTON_PROVIDERS, SocialAuthButton} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Helpers (Native demos are phone screens)
 * -----------------------------------------------------------------------------------------------*/
const PhoneScreen = ({children}: {children: ReactNode}) => (
  <div className="relative flex min-h-[560px] w-[390px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[2.75rem] border border-separator bg-background px-5 py-10">
    <div className="flex w-full max-w-sm flex-col items-stretch gap-3">{children}</div>
  </div>
);

const StatusText = ({children}: {children: ReactNode}) => (
  <p className="min-h-5 text-center text-sm text-muted" role="status">
    {children}
  </p>
);

const meta = {
  argTypes: {
    fullWidth: {control: "boolean"},
    isDisabled: {control: "boolean"},
    isIconOnly: {control: "boolean"},
    label: {control: "text"},
    provider: {control: {type: "select"}, options: SOCIAL_AUTH_BUTTON_PROVIDERS},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
    variant: {
      control: {type: "select"},
      options: ["outline", "primary", "secondary", "tertiary", "ghost"],
    },
  },
  component: SocialAuthButton,
  parameters: {
    layout: "centered",
  },
  title: "Pro/Buttons/SocialAuthButton",
} satisfies Meta<typeof SocialAuthButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Basic usage
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    fullWidth: false,
    isDisabled: false,
    isIconOnly: false,
    provider: "google",
    size: "md",
    variant: "outline",
  },
  render: (args) => {
    const [pressed, setPressed] = React.useState<string | null>(null);

    return (
      <div className="flex flex-col items-center gap-3">
        <SocialAuthButton {...args} onPress={() => setPressed(args.provider)} />
        <StatusText>{pressed ? `Continue with ${pressed}…` : " "}</StatusText>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Custom label
 * -----------------------------------------------------------------------------------------------*/
export const CustomLabel: Story = {
  args: {provider: "apple"},
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <SocialAuthButton label="Sign in with Apple" provider="apple" />
      <SocialAuthButton label="Login via GitHub" provider="github" />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Multiple providers (stacked login form)
 * -----------------------------------------------------------------------------------------------*/
export const MultipleProviders: Story = {
  args: {provider: "google"},
  render: () => (
    <PhoneScreen>
      <SocialAuthButton fullWidth label="Continue with Facebook" provider="facebook" />
      <SocialAuthButton fullWidth label="Continue with Apple" provider="apple" />
      <SocialAuthButton fullWidth label="Continue with Google" provider="google" />
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Side-by-side layout
 * -----------------------------------------------------------------------------------------------*/
export const SideBySide: Story = {
  args: {provider: "google"},
  render: () => (
    <PhoneScreen>
      <div className="flex gap-3">
        <SocialAuthButton className="flex-1" provider="apple" />
        <SocialAuthButton className="flex-1" provider="google" />
      </div>
      <div className="flex gap-3">
        <SocialAuthButton isIconOnly className="flex-1" provider="apple" />
        <SocialAuthButton isIconOnly className="flex-1" provider="google" />
        <SocialAuthButton isIconOnly className="flex-1" provider="github" />
        <SocialAuthButton isIconOnly className="flex-1" provider="x" />
      </div>
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom icon props
 * -----------------------------------------------------------------------------------------------*/
export const CustomIconProps: Story = {
  args: {provider: "discord"},
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <SocialAuthButton iconProps={{size: 24}} provider="discord" />
      {/* An explicit colour draws brand-coloured logos as a one-colour silhouette */}
      <SocialAuthButton iconProps={{color: "currentColor"}} provider="slack" />
      {/* Single-colour logos follow the text colour, so a text utility recolours them */}
      <SocialAuthButton iconProps={{colorClassName: "text-accent"}} provider="github" />
      <SocialAuthButton provider="microsoft" variant="primary">
        <SocialAuthButton.Icon color="currentColor" />
        <SocialAuthButton.Label>Microsoft</SocialAuthButton.Label>
      </SocialAuthButton>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom children
 * -----------------------------------------------------------------------------------------------*/
export const CustomChildren: Story = {
  args: {provider: "google"},
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <SocialAuthButton provider="google">
        <Icon className="size-[18px]" icon="gravity-ui:shield-check" />
        <SocialAuthButton.Label>Google SSO</SocialAuthButton.Label>
      </SocialAuthButton>
      <SocialAuthButton provider="linear">
        <SocialAuthButton.Icon />
        <SocialAuthButton.Label>Linear</SocialAuthButton.Label>
        <Icon className="size-4 text-muted" icon="gravity-ui:arrow-right" />
      </SocialAuthButton>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * All providers
 * -----------------------------------------------------------------------------------------------*/
export const AllProviders: Story = {
  args: {provider: "google"},
  render: () => (
    <div className="grid w-[420px] max-w-full grid-cols-2 gap-3">
      {SOCIAL_AUTH_BUTTON_PROVIDERS.map((provider) => (
        <SocialAuthButton key={provider} fullWidth provider={provider} />
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example: sign-in screen
 * -----------------------------------------------------------------------------------------------*/
export const SignInExample: Story = {
  args: {provider: "google"},
  render: () => {
    const [provider, setProvider] = React.useState<string | null>(null);

    return (
      <PhoneScreen>
        <div className="mb-3 flex flex-col items-center gap-1 text-center">
          <h2 className="text-xl font-semibold text-foreground">Sign in to Acme Co</h2>
          <p className="text-sm text-muted">Welcome back! Please sign in to continue</p>
        </div>
        <TextField aria-label="Email address" name="email" type="email">
          <InputGroup fullWidth>
            <InputGroup.Prefix>
              <Icon className="size-4 text-muted" icon="gravity-ui:envelope" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Enter your email address" />
          </InputGroup>
        </TextField>
        <Button fullWidth>Continue</Button>
        <div className="my-1 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-sm text-muted">or</span>
          <Separator className="flex-1" />
        </div>
        <SocialAuthButton
          fullWidth
          label="Continue with Facebook"
          provider="facebook"
          onPress={() => setProvider("Facebook")}
        />
        <SocialAuthButton
          fullWidth
          label="Continue with Apple"
          provider="apple"
          onPress={() => setProvider("Apple")}
        />
        <SocialAuthButton
          fullWidth
          label="Continue with Google"
          provider="google"
          onPress={() => setProvider("Google")}
        />
        <p className="mt-3 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-foreground" href="#">
            Sign up
          </Link>
        </p>
        <StatusText>{provider ? `Redirecting to ${provider}…` : " "}</StatusText>
      </PhoneScreen>
    );
  },
};
