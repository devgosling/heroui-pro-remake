# Social Auth Button — clean-room implementation spec

Slug: `social-auth-button` · Origin: **HeroUI Pro Native** (React Native) · Docs:
https://heroui.pro/docs/native/components/social-auth-button · Category: Buttons
Native import: `import {SocialAuthButton} from "heroui-native-pro";` → web: `import {SocialAuthButton} from "@heroui/pro";`
Storybook: `Pro/Buttons/SocialAuthButton`.

Sources used: the public Native docs page (usage sections, example, API tables) and the public demo videos
`social-auth-button-docs-light.mp4` / `social-auth-button-docs-dark.mp4`. I extracted frames every 0.5 s and measured
them with pixel probes. I did not open or try to get around paywalled code, bundles or prompts.

---

## 1. Purpose

A specialised `Button` for social login. It renders the provider's logo next to a label. Several of them stacked (or
side by side) form the "Continue with …" block of a sign-in screen.

---

## 2. Anatomy

```tsx
<SocialAuthButton provider="google" />            // logo + default label ("Google")

<SocialAuthButton provider="google">              // custom children replace logo + label
  <SocialAuthButton.Icon />                        // provider logo (provider from the button)
  <SocialAuthButton.Label>Google SSO</SocialAuthButton.Label>
</SocialAuthButton>
```

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `SocialAuthButton` (root) | HeroUI `Button` → RAC `<button>` | `social-auth-button` | `button button--outline … social-auth-button` | `data-provider="{provider}"`. All Button state attributes (`data-pressed`, `data-hovered`, `data-focus-visible`, `data-disabled`). |
| `SocialAuthButton.Icon` | `<svg aria-hidden focusable="false">` | `social-auth-button-icon` | `social-auth-button__icon` | Bundled inline SVG paths. `data-provider`. Also works on its own outside a button with an explicit `provider`. |
| `SocialAuthButton.Label` | `<span>` | `social-auth-button-label` | `social-auth-button__label` | Truncates with an ellipsis (`min-w-0 truncate`) when the button is narrower than the text. |

Native's custom-children example composes `Button.Label` from `heroui-native`. The web `Button` has no label part, so
`SocialAuthButton.Label` (and `.Icon`) are exported for the same composition.

---

## 3. API

### `SocialAuthButton` (root)

Extends every HeroUI `Button` prop (`variant`, `size`, `fullWidth`, `isIconOnly`, `isDisabled`, `onPress`, …).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `provider` | `SocialAuthButtonProvider` | – (required) | Picks the logo and the default label |
| `label` | `string` | provider name | Overrides the label text |
| `iconProps` | `Omit<SocialAuthButtonIconProps, "provider">` | – | Forwarded to the logo |
| `children` | `ReactNode \| (renderProps) => ReactNode` | – | Replaces the logo and label entirely |
| `variant` | Button variants | `"outline"` | As in Native ("Defaults to `variant="outline"`") |
| `isIconOnly` | `boolean` | `false` | Web addition for the docs' "compact icon-only buttons": only the logo is shown, and the label becomes the `aria-label` unless one is passed |

### `SocialAuthButton.Icon`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `provider` | `SocialAuthButtonProvider` | from the surrounding button | Required when used standalone |
| `size` | `number` | `18` | px, same default as Native. Applied inline so the Button's own `svg` rule (16/20 px) cannot override it. |
| `color` | `string` | – | Fill colour. Single-colour logos use it directly; brand-coloured logos switch to their one-colour silhouette (see §5). |
| `colorClassName` | `string` | – | Native takes a Uniwind `accent-*` class (default `accent-foreground` = the text colour). On the web it is any class, normally a `text-*` utility. Single-colour logos follow it through `currentColor`. |
| …`svg` props | | | `className`, `style`, `ref`, … |

### `SocialAuthButtonProvider`

`"google" | "apple" | "github" | "facebook" | "x" | "microsoft" | "discord" | "linkedin" | "slack" | "notion" | "linear"`
(`SOCIAL_AUTH_BUTTON_PROVIDERS` lists them in docs order; `SOCIAL_AUTH_PROVIDERS` holds label, viewBox and paths).

**Default labels are the provider names** ("Google", "Apple", "GitHub", "Facebook", "X", "Microsoft", "Discord",
"LinkedIn", "Slack", "Notion", "Linear"). The docs never print them, but every stacked example passes an explicit
`label="Continue with …"`, and the side-by-side example puts two default-label buttons at `flex-1` on a phone. That
only fits with short labels.

---

## 4. Styling (measured)

Light video: phone screen 416 px = 393 pt (1.0585 px/pt) in the 1920 px frame.

| Element | Measured | Web |
|---|---|---|
| Button shape | full pill, 1 px hairline border, transparent fill | HeroUI `Button` `outline` (`rounded-3xl`, `border-border`, transparent) |
| Button height | ~46 pt (matches the primary "Continue" button) | Button `md`: 40 px mobile / 36 px desktop. The web size scale is kept so it lines up with web inputs and buttons. |
| Stack gap | ~13 pt (`gap-3` in the docs) | stories use `gap-3` |
| Logo | 18 pt | `size` 18 |
| Logo → label gap | ~8 pt | Button `gap-2` (8 px). The Button's `-mx-0.5` icon nudge is reset on the logo so the full 8 px stays. |
| Label | medium weight, foreground | Button `text-sm font-medium`, `--default-foreground` |
| Pressed | fill turns light grey | Button outline pressed: `--default` fill + `scale(0.97)` |
| Facebook blue | #1877F2 (probe: #1878F3 / #1177F4) | `#1877F2` |

Dark video: same layout, black screen. The Apple logo turns white (it follows the text colour), while the Google "G"
and the Facebook circle (with a white "f") keep their brand colours.

---

## 5. Logos

All paths are bundled in `social-auth-button-providers.ts`; nothing loads at runtime (no Iconify, no CDN). The path
data is copied verbatim from two CC0 sets, and a script compared all 21 paths with the published data.

| Provider | Source | Rendering |
|---|---|---|
| Google | svg-logos `google-icon` | 4 brand colours |
| Apple | Simple Icons `apple` | `currentColor` |
| GitHub | Simple Icons `github` | `currentColor` |
| Facebook | svg-logos `facebook` | #1877F2 circle + white "f" |
| X | Simple Icons `x` | `currentColor` |
| Microsoft | svg-logos `microsoft-icon` | 4 brand colours |
| Discord | svg-logos `discord-icon` | #5865F2 |
| LinkedIn | svg-logos `linkedin-icon` | #0A66C2 square + white backing for the "in" |
| Slack | svg-logos `slack-icon` | 4 brand colours |
| Notion | Simple Icons `notion` | `currentColor` |
| Linear | Simple Icons `linear` | `currentColor` |

Only Google, Apple and Facebook appear in the videos. Using single colour for GitHub, X, Notion and Linear (the
logos without a brand colour of their own) and brand colours for the rest is an assumption.

Silhouette (`color` set): every logo is drawn in one colour. Facebook and LinkedIn use their outer shape with the
"f" / "in" knocked out, instead of filling the white layer too.

The logos are trademarks of their owners; check each provider's brand guidelines (e.g. Google's sign-in branding)
before shipping.

---

## 6. Accessibility

- A native `<button>` (RAC `Button`); the accessible name is the label text.
- Icon-only: `aria-label` defaults to the label (`"Apple"`, or the custom `label`).
- Logos are `aria-hidden` and `focusable="false"`.
- Keyboard, focus ring, press and disabled states all come from the HeroUI `Button`.

---

## 7. Deviations from Native

| Native | Web | Why |
|---|---|---|
| Button height 48 pt (Native `md`) | Web Button `md` (40/36 px), `size` prop available | Matches the rest of the web form controls |
| `colorClassName` is a Uniwind `accent-*` class | any class (normally `text-*`), affects single-colour logos | Uniwind's `accent-*` color props don't exist on the web |
| `Button.Label` from `heroui-native` | `SocialAuthButton.Label` / `.Icon` | The web Button has no label part |
| No `isIconOnly` documented (the "compact icon-only" side-by-side text shows labelled buttons) | `isIconOnly` hides the label and moves it to `aria-label` | Covers the documented wording without breaking the example |
| Stacked buttons stretch (RN `alignItems: stretch`) | pass `fullWidth` (web Button is `w-fit`) | Web Button semantics |
