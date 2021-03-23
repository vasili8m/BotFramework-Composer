// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FluentTheme } from '@uifabric/fluent-theme';
import formatMessage from 'format-message';
import { CommandBarButton as DefaultCommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { Link } from 'office-ui-fabric-react/lib/Link';
import {
  ContextualMenuItemType,
  IContextualMenuItem,
  IContextualMenuProps,
  IContextualMenuItemProps,
  IContextualMenuItemRenderFunctions,
} from 'office-ui-fabric-react/lib/ContextualMenu';
import * as React from 'react';

import { ItemWithTooltip } from '../components/ItemWithTooltip';
import { useNoSearchResultMenuItem } from '../hooks/useNoSearchResultMenuItem';
import { useSearchableMenuListCallback } from '../hooks/useSearchableMenuListCallback';
import { withTooltip } from '../utils/withTooltip';

import { jsLuToolbarMenuClassName, prebuiltEntities } from './constants';
import { getLuToolbarItemTextAndIcon, getLuTypeDisplayText } from './utils';
import { ToolbarLuEntityType, toolbarSupportedLuEntityTypes } from './types';

const entityDefinitionLinkId = 'define-entity-menu-header-link';
const entityDefinitionHelpUrl =
  'https://docs.microsoft.com/en-us/azure/bot-service/file-format/bot-builder-lu-file-format?view=azure-bot-service-4.0#entity';

const fontSizeStyle = {
  fontSize: FluentTheme.fonts.small.fontSize,
};
const buttonStyles = {
  root: {
    height: 32,
    '&:hover .ms-Button-flexContainer i, &:active .ms-Button-flexContainer i, &.is-expanded .ms-Button-flexContainer i': {
      color: FluentTheme.palette.black,
    },
  },
  menuIcon: { fontSize: 8, color: FluentTheme.palette.black },
  label: { ...fontSizeStyle },
  icon: { color: FluentTheme.palette.black, fontSize: 12 },
};

const CommandBarButton = React.memo(
  withTooltip({ content: formatMessage('Define new entity') }, DefaultCommandBarButton)
);

type Props = {
  onDefineEntity: (entityType: ToolbarLuEntityType, entityName?: string) => void;
};

export const DefineEntityButton = React.memo((props: Props) => {
  const { onDefineEntity } = props;

  const { iconName, text } = React.useMemo(() => getLuToolbarItemTextAndIcon('defineEntity'), []);
  const { onRenderMenuList, query, setQuery } = useSearchableMenuListCallback(
    formatMessage('Search prebuilt entities')
  );
  const noSearchResultsMenuItem = useNoSearchResultMenuItem(formatMessage('no prebuilt entities found'));

  const filteredPrebuiltEntities = React.useMemo(() => {
    const filteredItems = query
      ? prebuiltEntities.filter((e) => e.toLowerCase().indexOf(query.toLowerCase()) !== -1)
      : prebuiltEntities;

    if (!filteredItems.length) {
      return [noSearchResultsMenuItem];
    }

    return filteredItems.map<IContextualMenuItem>((prebuiltEntity) => ({
      key: prebuiltEntity,
      text: prebuiltEntity,
      style: fontSizeStyle,
      onClick: () => onDefineEntity('prebuilt', prebuiltEntity),
    }));
  }, [onDefineEntity, noSearchResultsMenuItem, query]);

  const onDismiss = React.useCallback(() => {
    setQuery('');
  }, []);

  const prebuiltSubMenuProps = React.useMemo<IContextualMenuProps>(
    () => ({
      calloutProps: { calloutMaxHeight: 216 },
      items: filteredPrebuiltEntities,
      onRenderMenuList,
      onDismiss,
    }),
    [filteredPrebuiltEntities, onDismiss, onRenderMenuList]
  );

  const renderMenuItemHeader = React.useCallback(
    (itemProps: IContextualMenuItemProps, defaultRenders: IContextualMenuItemRenderFunctions) => (
      <ItemWithTooltip
        itemText={defaultRenders.renderItemName(itemProps)}
        tooltipId="define-entity-menu-header"
        tooltipProps={{
          calloutProps: {
            preventDismissOnLostFocus: true,
          },
          tooltipProps: {
            calloutProps: {
              preventDismissOnLostFocus: true,
            },
          },
        }}
        tooltipText={formatMessage.rich('Visit <a>this page</a> to learn more about entity definition.', {
          a: ({ children }) => (
            <Link key={entityDefinitionLinkId} id={entityDefinitionLinkId}>
              {children}
            </Link>
          ),
        })}
      />
    ),
    []
  );

  const menuItems = React.useMemo(() => {
    return [
      {
        key: 'defineEntity_header',
        itemType: ContextualMenuItemType.Header,
        text: formatMessage('Define new entity'),
        onRenderContent: renderMenuItemHeader,
      },
      ...toolbarSupportedLuEntityTypes.map((t) => ({
        key: `${t}Entity`,
        text: getLuTypeDisplayText(t),
        style: fontSizeStyle,
        subMenuProps: t === 'prebuilt' ? prebuiltSubMenuProps : undefined,
        onClick: t !== 'prebuilt' ? () => onDefineEntity(t) : undefined,
      })),
    ];
  }, [onDefineEntity, renderMenuItemHeader, prebuiltSubMenuProps]);

  const menuProps = React.useMemo(() => {
    return {
      items: menuItems,
      calloutProps: {
        preventDismissOnEvent: (
          e: Event | React.FocusEvent<Element> | React.KeyboardEvent<Element> | React.MouseEvent<Element, MouseEvent>
        ) => {
          if ((e.target as HTMLElement).id === entityDefinitionLinkId) {
            window?.open(entityDefinitionHelpUrl, '_blank');
            return true;
          }
          return false;
        },
      },
    };
  }, [menuItems]);

  return (
    <CommandBarButton
      className={jsLuToolbarMenuClassName}
      iconProps={{ iconName }}
      menuProps={menuProps}
      styles={buttonStyles}
    >
      {text}
    </CommandBarButton>
  );
});
