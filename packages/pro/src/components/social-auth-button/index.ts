import type {ComponentProps} from "react";

import {
  SocialAuthButtonIcon,
  SocialAuthButtonLabel,
  SocialAuthButtonRoot,
} from "./social-auth-button";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SocialAuthButton = Object.assign(SocialAuthButtonRoot, {
  Icon: SocialAuthButtonIcon,
  Label: SocialAuthButtonLabel,
  Root: SocialAuthButtonRoot,
});

export type SocialAuthButton = {
  Props: ComponentProps<typeof SocialAuthButtonRoot>;
  RootProps: ComponentProps<typeof SocialAuthButtonRoot>;
  IconProps: ComponentProps<typeof SocialAuthButtonIcon>;
  LabelProps: ComponentProps<typeof SocialAuthButtonLabel>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SocialAuthButtonRoot,
  SocialAuthButtonIcon,
  SocialAuthButtonLabel,
} from "./social-auth-button";

export type {
  SocialAuthButtonRootProps,
  SocialAuthButtonRootProps as SocialAuthButtonProps,
  SocialAuthButtonIconProps,
  SocialAuthButtonLabelProps,
} from "./social-auth-button";

/* -------------------------------------------------------------------------------------------------
 * Providers
 * -----------------------------------------------------------------------------------------------*/
export {SOCIAL_AUTH_BUTTON_PROVIDERS, SOCIAL_AUTH_PROVIDERS} from "./social-auth-button-providers";

export type {
  SocialAuthButtonProvider,
  SocialAuthProviderDefinition,
  SocialAuthProviderLogoLayer,
} from "./social-auth-button-providers";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {socialAuthButtonVariants, type SocialAuthButtonVariants} from "./social-auth-button.styles";
