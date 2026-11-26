"use client";

import type {SocialAuthButtonProvider} from "./social-auth-button-providers";
import type {ButtonProps} from "@heroui/react";
import type {ComponentPropsWithRef} from "react";

import {Button} from "@heroui/react";
import {createContext, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {useResolvedClassName} from "../../utils";

import {SOCIAL_AUTH_PROVIDERS} from "./social-auth-button-providers";
import {socialAuthButtonVariants} from "./social-auth-button.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type SocialAuthButtonContext = {
  provider?: SocialAuthButtonProvider;
  slots?: ReturnType<typeof socialAuthButtonVariants>;
};

const SocialAuthButtonContext = createContext<SocialAuthButtonContext>({});

/* -------------------------------------------------------------------------------------------------
 * Icon (provider logo)
 * -----------------------------------------------------------------------------------------------*/
interface SocialAuthButtonIconProps extends Omit<
  ComponentPropsWithRef<"svg">,
  "children" | "color" | "viewBox"
> {
  /** Provider whose logo is drawn. Defaults to the surrounding `SocialAuthButton`'s provider. */
  provider?: SocialAuthButtonProvider;
  /** Width and height of the icon in pixels. @default 18 */
  size?: number;
  /**
   * Fill colour of the icon. Single-colour logos (Apple, GitHub, X, Notion, Linear) follow the
   * button text colour by default; setting `color` also draws brand-coloured logos as a
   * one-colour silhouette (e.g. `color="currentColor"` on a filled button).
   */
  color?: string;
  /**
   * Class for the icon colour. HeroUI Native takes a Uniwind `accent-*` class here; on the web it
   * is a text colour utility (e.g. `"text-accent"`) that single-colour logos pick up through
   * `currentColor`.
   */
  colorClassName?: string;
}

const SocialAuthButtonIcon = ({
  className,
  color,
  colorClassName,
  provider: providerProp,
  size = 18,
  style,
  ...props
}: SocialAuthButtonIconProps) => {
  const {provider: contextProvider, slots} = use(SocialAuthButtonContext);
  const provider = providerProp ?? contextProvider;
  const iconClassName = slots?.icon() ?? socialAuthButtonVariants().icon();

  if (!provider) return null;

  const definition = SOCIAL_AUTH_PROVIDERS[provider];
  const paths =
    color == null
      ? definition.layers.map((layer) => ({d: layer.d, fill: layer.fill ?? "currentColor"}))
      : (definition.silhouette ?? definition.layers.map((layer) => layer.d)).map((d) => ({
          d,
          fill: color,
        }));

  return (
    <svg
      aria-hidden="true"
      className={cx(iconClassName, colorClassName, className)}
      data-provider={provider}
      data-slot="social-auth-button-icon"
      focusable="false"
      height={size}
      // Inline so the Button's own `svg` sizing (16/20px) cannot override `size`.
      style={{height: size, width: size, ...style}}
      viewBox={definition.viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {paths.map((path, index) => (
        <path key={index} d={path.d} fill={path.fill} />
      ))}
    </svg>
  );
};

SocialAuthButtonIcon.displayName = "HeroUI.SocialAuthButton.Icon";

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/
interface SocialAuthButtonLabelProps extends ComponentPropsWithRef<"span"> {}

const SocialAuthButtonLabel = ({children, className, ...props}: SocialAuthButtonLabelProps) => {
  const {slots} = use(SocialAuthButtonContext);

  return (
    <span
      className={cx(slots?.label() ?? socialAuthButtonVariants().label(), className)}
      data-slot="social-auth-button-label"
      {...props}
    >
      {children}
    </span>
  );
};

SocialAuthButtonLabel.displayName = "HeroUI.SocialAuthButton.Label";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface SocialAuthButtonRootProps extends ButtonProps {
  /** OAuth / social-login provider that decides the logo and the default label. */
  provider: SocialAuthButtonProvider;
  /** Label text. Defaults to the provider name ("Google", "Apple", …). */
  label?: string;
  /** Props forwarded to the provider logo (`size`, `color`, `colorClassName`, …). */
  iconProps?: Omit<SocialAuthButtonIconProps, "provider">;
}

const SocialAuthButtonRoot = ({
  "aria-label": ariaLabel,
  children,
  className,
  iconProps,
  isIconOnly,
  label,
  provider,
  variant = "outline",
  ...props
}: SocialAuthButtonRootProps) => {
  const slots = useMemo(() => socialAuthButtonVariants(), []);
  const contextValue = useMemo(() => ({provider, slots}), [provider, slots]);
  const resolvedLabel = label ?? SOCIAL_AUTH_PROVIDERS[provider].label;
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <SocialAuthButtonContext value={contextValue}>
      <Button
        aria-label={ariaLabel ?? (isIconOnly && children == null ? resolvedLabel : undefined)}
        className={resolvedClassName}
        data-provider={provider}
        data-slot="social-auth-button"
        isIconOnly={isIconOnly}
        variant={variant}
        {...props}
      >
        {children ?? (
          <>
            <SocialAuthButtonIcon {...iconProps} />
            {isIconOnly ? null : <SocialAuthButtonLabel>{resolvedLabel}</SocialAuthButtonLabel>}
          </>
        )}
      </Button>
    </SocialAuthButtonContext>
  );
};

SocialAuthButtonRoot.displayName = "HeroUI.SocialAuthButton";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SocialAuthButtonRoot, SocialAuthButtonIcon, SocialAuthButtonLabel};

export type {SocialAuthButtonRootProps, SocialAuthButtonIconProps, SocialAuthButtonLabelProps};
