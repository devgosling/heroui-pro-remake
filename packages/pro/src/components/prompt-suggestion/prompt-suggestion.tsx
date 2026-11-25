"use client";

import type {PromptSuggestionVariants} from "./prompt-suggestion.styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {IconChevronRight, SurfaceContext, cardVariants} from "@heroui/react";
import {createContext, use, useLayoutEffect, useMemo, useState} from "react";
import {useId} from "react-aria/useId";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {Link as LinkPrimitive} from "react-aria-components/Link";
import {cx} from "tailwind-variants";

import {useResolvedClassName} from "../../utils";

import {promptSuggestionVariants} from "./prompt-suggestion.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type PromptSuggestionVariant = NonNullable<PromptSuggestionVariants["variant"]>;

type PromptSuggestionContext = {
  slots: ReturnType<typeof promptSuggestionVariants>;
  variant: PromptSuggestionVariant;
};

// Parts also work standalone (outside a root) with the default pill styling.
const PromptSuggestionContext = createContext<PromptSuggestionContext>({
  slots: promptSuggestionVariants(),
  variant: "pill",
});

// Card items are styled with the open-source Card BEM classes (`card card--default`, `card__*`).
const cardSlots = cardVariants({variant: "default"});

// Surface context handed to card items so nested on-surface components pick the right colours,
// exactly like the OSS Card does.
const cardSurfaceContext = {variant: "default" as const};

/* -------------------------------------------------------------------------------------------------
 * Item Context - wires ItemTitle / ItemDescription to the item's aria-labelledby / describedby
 * -----------------------------------------------------------------------------------------------*/
type PromptSuggestionItemContext = {
  descriptionId: string;
  setDescriptionId: (id: string | undefined) => void;
  setTitleId: (id: string | undefined) => void;
  titleId: string;
};

const PromptSuggestionItemContext = createContext<PromptSuggestionItemContext | null>(null);

/** Registers a mounted title/description element so the item can reference it. */
const useRegisterSlotId = (
  id: string,
  register: ((id: string | undefined) => void) | undefined,
) => {
  useLayoutEffect(() => {
    if (!register) return;
    register(id);

    return () => register(undefined);
  }, [id, register]);
};

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface PromptSuggestionRootProps extends ComponentPropsWithRef<"div">, PromptSuggestionVariants {
  /** Pill buttons or cards. @default "pill" */
  variant?: PromptSuggestionVariant;
}

const PromptSuggestionRoot = ({
  children,
  className,
  variant = "pill",
  ...rest
}: PromptSuggestionRootProps) => {
  const slots = useMemo(() => promptSuggestionVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots, variant}), [slots, variant]);

  return (
    <PromptSuggestionContext value={contextValue}>
      <div className={slots.base({className})} data-slot="prompt-suggestion" {...rest}>
        {children}
      </div>
    </PromptSuggestionContext>
  );
};

PromptSuggestionRoot.displayName = "HeroUI.PromptSuggestion";

/* -------------------------------------------------------------------------------------------------
 * Header / Title / Description
 * -----------------------------------------------------------------------------------------------*/
interface PromptSuggestionHeaderProps extends ComponentPropsWithRef<"div"> {}

const PromptSuggestionHeader = ({className, ...rest}: PromptSuggestionHeaderProps) => {
  const {slots} = use(PromptSuggestionContext);

  return (
    <div className={slots.header({className})} data-slot="prompt-suggestion-header" {...rest} />
  );
};

PromptSuggestionHeader.displayName = "HeroUI.PromptSuggestion.Header";

interface PromptSuggestionTitleProps extends ComponentPropsWithRef<"h2"> {}

const PromptSuggestionTitle = ({children, className, ...rest}: PromptSuggestionTitleProps) => {
  const {slots} = use(PromptSuggestionContext);

  return (
    <h2 className={slots.title({className})} data-slot="prompt-suggestion-title" {...rest}>
      {children}
    </h2>
  );
};

PromptSuggestionTitle.displayName = "HeroUI.PromptSuggestion.Title";

interface PromptSuggestionDescriptionProps extends ComponentPropsWithRef<"p"> {}

const PromptSuggestionDescription = ({className, ...rest}: PromptSuggestionDescriptionProps) => {
  const {slots} = use(PromptSuggestionContext);

  return (
    <p
      className={slots.description({className})}
      data-slot="prompt-suggestion-description"
      {...rest}
    />
  );
};

PromptSuggestionDescription.displayName = "HeroUI.PromptSuggestion.Description";

/* -------------------------------------------------------------------------------------------------
 * Group - labelled section of items
 * -----------------------------------------------------------------------------------------------*/
interface PromptSuggestionGroupProps extends ComponentPropsWithRef<"section"> {
  /** Group heading, rendered as an `h3`. */
  label?: ReactNode;
  /** Text under the heading. */
  description?: ReactNode;
}

const PromptSuggestionGroup = ({
  children,
  className,
  description,
  label,
  ...rest
}: PromptSuggestionGroupProps) => {
  const {slots} = use(PromptSuggestionContext);
  const hasHeader = label != null || description != null;

  return (
    <section className={slots.group({className})} data-slot="prompt-suggestion-group" {...rest}>
      {hasHeader ? (
        <div className={slots.groupHeader()} data-slot="prompt-suggestion-group-header">
          {label != null ? (
            <h3 className={slots.groupLabel()} data-slot="prompt-suggestion-group-label">
              {label}
            </h3>
          ) : null}
          {description != null ? (
            <p className={slots.groupDescription()} data-slot="prompt-suggestion-group-description">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
};

PromptSuggestionGroup.displayName = "HeroUI.PromptSuggestion.Group";

/* -------------------------------------------------------------------------------------------------
 * Items - responsive grid
 * -----------------------------------------------------------------------------------------------*/
interface PromptSuggestionItemsProps extends ComponentPropsWithRef<"div"> {}

const PromptSuggestionItems = ({className, ...rest}: PromptSuggestionItemsProps) => {
  const {slots} = use(PromptSuggestionContext);

  return <div className={slots.items({className})} data-slot="prompt-suggestion-items" {...rest} />;
};

PromptSuggestionItems.displayName = "HeroUI.PromptSuggestion.Items";

/* -------------------------------------------------------------------------------------------------
 * Item - React Aria Button, or Link when `href` is set
 * -----------------------------------------------------------------------------------------------*/
interface PromptSuggestionItemOwnProps {
  /** Shows the hover arrow on pill items. @default true */
  showEndIcon?: boolean;
}

interface PromptSuggestionItemButtonProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive>, PromptSuggestionItemOwnProps {
  href?: never;
}

interface PromptSuggestionItemLinkProps
  extends ComponentPropsWithRef<typeof LinkPrimitive>, PromptSuggestionItemOwnProps {
  /** Renders the item as a link to this URL. */
  href: string;
}

type PromptSuggestionItemProps = PromptSuggestionItemButtonProps | PromptSuggestionItemLinkProps;

type ItemRenderChildren = (values: object) => ReactNode;

const PromptSuggestionItem = (props: PromptSuggestionItemProps) => {
  const {children, className, showEndIcon = true, ...rest} = props;
  const {slots, variant} = use(PromptSuggestionContext);
  const isCard = variant === "card";

  // Ids for ItemTitle / ItemDescription; only referenced once those parts are mounted.
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const [mountedTitleId, setTitleId] = useState<string>();
  const [mountedDescriptionId, setDescriptionId] = useState<string>();

  const itemContext = useMemo<PromptSuggestionItemContext>(
    () => ({
      descriptionId: generatedDescriptionId,
      setDescriptionId,
      setTitleId,
      titleId: generatedTitleId,
    }),
    [generatedDescriptionId, generatedTitleId],
  );

  const baseClassName = isCard ? cx(cardSlots.base(), slots.item()) : slots.item();
  const resolvedClassName = useResolvedClassName(
    className as string | ((values: object) => string) | undefined,
    baseClassName,
  );

  const content = composeRenderProps(
    children as ReactNode | ItemRenderChildren,
    (resolvedChildren: ReactNode) =>
      isCard ? (
        resolvedChildren
      ) : (
        <>
          <span className={slots.itemLabel()} data-slot="prompt-suggestion-item-label">
            {resolvedChildren}
          </span>
          {showEndIcon ? (
            <IconChevronRight
              className={slots.itemEndIcon()}
              data-slot="prompt-suggestion-item-end-icon"
            />
          ) : null}
        </>
      ),
  );

  const hasOwnLabel = rest["aria-label"] != null || rest["aria-labelledby"] != null;
  const ariaProps = {
    "aria-describedby": rest["aria-describedby"] ?? mountedDescriptionId,
    "aria-labelledby": hasOwnLabel ? rest["aria-labelledby"] : mountedTitleId,
  };

  const element =
    props.href !== undefined ? (
      <LinkPrimitive
        {...(rest as Omit<PromptSuggestionItemLinkProps, "children" | "className">)}
        {...ariaProps}
        className={resolvedClassName}
        data-slot="prompt-suggestion-item"
      >
        {content}
      </LinkPrimitive>
    ) : (
      <ButtonPrimitive
        {...(rest as Omit<PromptSuggestionItemButtonProps, "children" | "className">)}
        {...ariaProps}
        className={resolvedClassName}
        data-slot="prompt-suggestion-item"
      >
        {content}
      </ButtonPrimitive>
    );

  return (
    <PromptSuggestionItemContext value={itemContext}>
      {isCard ? <SurfaceContext value={cardSurfaceContext}>{element}</SurfaceContext> : element}
    </PromptSuggestionItemContext>
  );
};

PromptSuggestionItem.displayName = "HeroUI.PromptSuggestion.Item";

/* -------------------------------------------------------------------------------------------------
 * Item parts (all spans: card items are buttons/links, so only phrasing content is allowed)
 * -----------------------------------------------------------------------------------------------*/
interface PromptSuggestionItemHeaderProps extends ComponentPropsWithRef<"span"> {}

const PromptSuggestionItemHeader = ({className, ...rest}: PromptSuggestionItemHeaderProps) => (
  <span
    className={cx(cardSlots.header(), className)}
    data-slot="prompt-suggestion-item-header"
    {...rest}
  />
);

PromptSuggestionItemHeader.displayName = "HeroUI.PromptSuggestion.ItemHeader";

interface PromptSuggestionItemTitleProps extends ComponentPropsWithRef<"span"> {}

const PromptSuggestionItemTitle = ({className, id, ...rest}: PromptSuggestionItemTitleProps) => {
  const item = use(PromptSuggestionItemContext);
  const resolvedId = id ?? item?.titleId;

  useRegisterSlotId(resolvedId ?? "", resolvedId ? item?.setTitleId : undefined);

  return (
    <span
      className={cx(cardSlots.title(), className)}
      data-slot="prompt-suggestion-item-title"
      id={resolvedId}
      {...rest}
    />
  );
};

PromptSuggestionItemTitle.displayName = "HeroUI.PromptSuggestion.ItemTitle";

interface PromptSuggestionItemDescriptionProps extends ComponentPropsWithRef<"span"> {}

const PromptSuggestionItemDescription = ({
  className,
  id,
  ...rest
}: PromptSuggestionItemDescriptionProps) => {
  const {slots} = use(PromptSuggestionContext);
  const item = use(PromptSuggestionItemContext);
  const resolvedId = id ?? item?.descriptionId;

  useRegisterSlotId(resolvedId ?? "", resolvedId ? item?.setDescriptionId : undefined);

  return (
    <span
      className={cx(cardSlots.description(), slots.itemDescription(), className)}
      // Same slot name as the OSS Card description Pro renders here.
      data-slot="card-description"
      id={resolvedId}
      {...rest}
    />
  );
};

PromptSuggestionItemDescription.displayName = "HeroUI.PromptSuggestion.ItemDescription";

interface PromptSuggestionItemMetaProps extends ComponentPropsWithRef<"span"> {}

const PromptSuggestionItemMeta = ({className, ...rest}: PromptSuggestionItemMetaProps) => {
  const {slots} = use(PromptSuggestionContext);

  return (
    <span
      className={slots.itemMeta({className})}
      data-slot="prompt-suggestion-item-meta"
      {...rest}
    />
  );
};

PromptSuggestionItemMeta.displayName = "HeroUI.PromptSuggestion.ItemMeta";

interface PromptSuggestionItemTagsProps extends ComponentPropsWithRef<"span"> {}

const PromptSuggestionItemTags = ({className, ...rest}: PromptSuggestionItemTagsProps) => {
  const {slots} = use(PromptSuggestionContext);

  return (
    <span
      className={slots.itemTags({className})}
      data-slot="prompt-suggestion-item-tags"
      {...rest}
    />
  );
};

PromptSuggestionItemTags.displayName = "HeroUI.PromptSuggestion.ItemTags";

interface PromptSuggestionItemFooterProps extends ComponentPropsWithRef<"span"> {}

const PromptSuggestionItemFooter = ({className, ...rest}: PromptSuggestionItemFooterProps) => {
  const {slots} = use(PromptSuggestionContext);

  return (
    <span
      className={cx(cardSlots.footer(), slots.itemFooter(), className)}
      data-slot="prompt-suggestion-item-footer"
      {...rest}
    />
  );
};

PromptSuggestionItemFooter.displayName = "HeroUI.PromptSuggestion.ItemFooter";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PromptSuggestionRoot,
  PromptSuggestionHeader,
  PromptSuggestionTitle,
  PromptSuggestionDescription,
  PromptSuggestionGroup,
  PromptSuggestionItems,
  PromptSuggestionItem,
  PromptSuggestionItemHeader,
  PromptSuggestionItemTitle,
  PromptSuggestionItemDescription,
  PromptSuggestionItemMeta,
  PromptSuggestionItemTags,
  PromptSuggestionItemFooter,
  PromptSuggestionContext,
};

export type {
  PromptSuggestionRootProps,
  PromptSuggestionHeaderProps,
  PromptSuggestionTitleProps,
  PromptSuggestionDescriptionProps,
  PromptSuggestionGroupProps,
  PromptSuggestionItemsProps,
  PromptSuggestionItemProps,
  PromptSuggestionItemButtonProps,
  PromptSuggestionItemLinkProps,
  PromptSuggestionItemHeaderProps,
  PromptSuggestionItemTitleProps,
  PromptSuggestionItemDescriptionProps,
  PromptSuggestionItemMetaProps,
  PromptSuggestionItemTagsProps,
  PromptSuggestionItemFooterProps,
};
